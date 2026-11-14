"""Department Authority Decision Engine and Review Queue"""

import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from pydantic import BaseModel, ConfigDict
from backend.app.auth.jwt import get_current_user
from backend.app.auth.rbac import require_role, check_department_authority
from backend.app.database.session import get_db
from backend.app.database.models import (
    User,
    UserRole,
    DepartmentRequest,
    DepartmentRequestStatus,
    RequestVersion,
    DecisionHistory,
    DecisionAction,
    Event,
    ResourceBooking,
    BookingStatus,
    PermissionLetter,
)
from backend.app.bookings.schemas import (
    DepartmentDecisionRequest,
    DepartmentRequestRead,
    DecisionHistoryItemRead,
)
from backend.app.bookings.service import (
    confirm_resource_booking,
    evaluate_event_status,
)
from backend.app.bookings.router import _serialize_department_request

router = APIRouter(prefix="/approvals", tags=["Department Approvals"])


@router.get("/pending", response_model=List[DepartmentRequestRead])
def get_pending_requests(
    current_user: User = Depends(require_role(UserRole.AUTHORITY, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """
    Retrieve queue of pending requests for resources governed by the authority's department.
    """
    stmt = (
        select(DepartmentRequest)
        .options(joinedload(DepartmentRequest.department), joinedload(DepartmentRequest.event))
        .where(
            DepartmentRequest.status.in_([
                DepartmentRequestStatus.PENDING,
                DepartmentRequestStatus.CORRECTION_REQUESTED,
            ])
        )
    )

    # Restrict to authority's department unless Admin
    if current_user.role == UserRole.AUTHORITY:
        if not current_user.department_id:
            return []
        stmt = stmt.where(DepartmentRequest.department_id == current_user.department_id)

    stmt = stmt.order_by(DepartmentRequest.created_at.asc())
    requests = db.scalars(stmt).unique().all()

    return [_serialize_department_request(req, db) for req in requests]


class AuthorityDecisionRecord(BaseModel):
    id: int
    department_request_id: int
    version_number: int
    event_id: int
    event_title: str
    decision: str
    remarks: Optional[str] = None
    decided_by: str
    resource: str
    date: str
    timestamp: datetime
    permission_letter_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


@router.get("/decisions", response_model=List[AuthorityDecisionRecord])
def get_authority_decision_history(
    current_user: User = Depends(require_role(UserRole.AUTHORITY, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """
    Retrieve past institutional decisions made by or within the department authority's purview.
    """
    stmt = (
        select(DecisionHistory)
        .join(DepartmentRequest, DecisionHistory.department_request_id == DepartmentRequest.id)
        .join(Event, DepartmentRequest.event_id == Event.id)
        .options(
            joinedload(DecisionHistory.department_request).joinedload(DepartmentRequest.event),
            joinedload(DecisionHistory.department_request).joinedload(DepartmentRequest.department),
            joinedload(DecisionHistory.reviewer),
        )
    )

    if current_user.role == UserRole.AUTHORITY:
        if not current_user.department_id:
            return []
        stmt = stmt.where(DepartmentRequest.department_id == current_user.department_id)

    stmt = stmt.order_by(DecisionHistory.timestamp.desc())
    decisions = db.scalars(stmt).unique().all()

    results = []
    for d in decisions:
        dept_req = d.department_request
        event = dept_req.event if dept_req else None

        # Look up resource name from RequestVersion or booking
        resource_desc = "Department Facility"
        ver = db.scalar(
            select(RequestVersion).where(
                RequestVersion.department_request_id == dept_req.id,
                RequestVersion.version_number == d.version_number,
            )
        )
        if ver and ver.requested_payload_json:
            try:
                items = json.loads(ver.requested_payload_json)
                if items and isinstance(items, list):
                    names = [it.get("resource_name") for it in items if it.get("resource_name")]
                    if names:
                        resource_desc = ", ".join(names)
            except Exception:
                pass

        # Look up associated permission letter if approved
        letter = db.scalar(
            select(PermissionLetter)
            .where(
                PermissionLetter.department_request_id == dept_req.id,
                PermissionLetter.version_number == d.version_number,
            )
        )
        letter_id = letter.id if letter else None

        results.append(
            AuthorityDecisionRecord(
                id=d.id,
                department_request_id=dept_req.id,
                version_number=d.version_number,
                event_id=event.id if event else 0,
                event_title=event.title if event else f"Event #{dept_req.event_id}",
                decision=d.action.value if hasattr(d.action, "value") else str(d.action),
                remarks=d.remarks,
                decided_by=d.reviewer.full_name if d.reviewer else "Department Authority",
                resource=resource_desc,
                date=d.timestamp.strftime("%Y-%m-%d") if d.timestamp else "",
                timestamp=d.timestamp,
                permission_letter_id=letter_id,
            )
        )

    return results


@router.get("/requests/{request_id}", response_model=DepartmentRequestRead)
def get_department_request_detail(
    request_id: int,
    current_user: User = Depends(require_role(UserRole.AUTHORITY, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Retrieve details of a single department request for review."""
    dept_req = db.scalar(
        select(DepartmentRequest)
        .options(joinedload(DepartmentRequest.department), joinedload(DepartmentRequest.event))
        .where(DepartmentRequest.id == request_id)
    )
    if not dept_req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department request ID {request_id} not found",
        )

    if not check_department_authority(dept_req.department_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have authority over department ID {dept_req.department_id}",
        )

    return _serialize_department_request(dept_req, db)


@router.post("/requests/{request_id}/decision", response_model=DepartmentRequestRead)
def submit_authority_decision(
    request_id: int,
    payload: DepartmentDecisionRequest,
    current_user: User = Depends(require_role(UserRole.AUTHORITY, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """
    Record authority decision on a department request:
    - APPROVE: Acquires pessimistic locks, confirms bookings, marks APPROVED.
    - REJECT: Marks REJECTED with mandatory or optional remarks.
    - REQUEST_CORRECTION: Marks CORRECTION_REQUESTED, returning to club organizer with notes.
    """
    dept_req = db.scalar(
        select(DepartmentRequest)
        .options(joinedload(DepartmentRequest.department), joinedload(DepartmentRequest.event))
        .where(DepartmentRequest.id == request_id)
    )
    if not dept_req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Department request ID {request_id} not found",
        )

    # Check authority permission
    if not check_department_authority(dept_req.department_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have authority over department ID {dept_req.department_id}",
        )

    action_str = payload.action.upper()
    if action_str not in ("APPROVE", "REJECT", "REQUEST_CORRECTION"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="action must be one of: APPROVE, REJECT, REQUEST_CORRECTION",
        )

    # 1. Load requested items from current version
    current_ver = db.scalar(
        select(RequestVersion).where(
            RequestVersion.department_request_id == dept_req.id,
            RequestVersion.version_number == dept_req.current_version,
        )
    )
    if not current_ver:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Request version snapshot is missing",
        )

    items = json.loads(current_ver.requested_payload_json)

    # 2. Process Action
    if action_str == "APPROVE":
        # Atomically confirm each requested booking slot
        for item in items:
            res_id = item["resource_id"]
            start_t = datetime.fromisoformat(item["start_time"])
            end_t = datetime.fromisoformat(item["end_time"])

            confirm_resource_booking(
                db=db,
                department_request_id=dept_req.id,
                resource_id=res_id,
                start_time=start_t,
                end_time=end_t,
            )

        dept_req.status = DepartmentRequestStatus.APPROVED
        decision_action = DecisionAction.APPROVED

        # Generate and digitally sign official permission letter
        from backend.app.documents.service import generate_and_sign_letter_for_request
        generate_and_sign_letter_for_request(db, dept_req.id)

    elif action_str == "REJECT":
        dept_req.status = DepartmentRequestStatus.REJECTED
        decision_action = DecisionAction.REJECTED

    else:  # REQUEST_CORRECTION
        if not payload.remarks or not payload.remarks.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Remarks explaining required corrections are required when requesting corrections",
            )
        dept_req.status = DepartmentRequestStatus.CORRECTION_REQUESTED
        decision_action = DecisionAction.CORRECTION_REQUESTED

    dept_req.remarks = payload.remarks

    # 3. Log into DecisionHistory
    history = DecisionHistory(
        department_request_id=dept_req.id,
        version_number=dept_req.current_version,
        reviewer_user_id=current_user.id,
        action=decision_action,
        remarks=payload.remarks,
    )
    db.add(history)

    # Record Audit Log
    from backend.app.audit.service import record_audit_event
    record_audit_event(
        db=db,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action=f"REQUEST_{action_str}",
        target_entity="department_request",
        target_id=str(dept_req.id),
        details={"version": dept_req.current_version, "remarks": payload.remarks},
    )

    # 4. Recompute parent Event aggregate status
    evaluate_event_status(db, dept_req.event_id)

    db.commit()
    db.refresh(dept_req)
    return _serialize_department_request(dept_req, db)
