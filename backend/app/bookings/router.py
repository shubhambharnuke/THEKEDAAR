"""API Endpoints for Event Submissions, Detail Views, and Resubmissions"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from backend.app.auth.jwt import get_current_user
from backend.app.database.session import get_db
from backend.app.database.models import (
    User,
    UserRole,
    Event,
    DepartmentRequest,
    Department,
    RequestVersion,
)
from backend.app.bookings.schemas import (
    EventCreateRequest,
    EventDetailResponse,
    EventSummaryResponse,
    DepartmentRequestRead,
    RequestResubmitPayload,
)
from backend.app.bookings.service import (
    create_event_with_department_requests,
    resubmit_department_request,
    cancel_event,
)

router = APIRouter(tags=["Events & Bookings"])


def _serialize_department_request(req: DepartmentRequest, db: Session) -> DepartmentRequestRead:
    """Helper to attach department metadata and latest version payload."""
    latest_ver = db.scalar(
        select(RequestVersion)
        .where(
            RequestVersion.department_request_id == req.id,
            RequestVersion.version_number == req.current_version,
        )
    )
    items = []
    if latest_ver and latest_ver.requested_payload_json:
        try:
            items = json.loads(latest_ver.requested_payload_json)
        except Exception:
            items = []

    dept_name = req.department.name if req.department else None
    dept_code = req.department.code if req.department else None

    return DepartmentRequestRead(
        id=req.id,
        event_id=req.event_id,
        department_id=req.department_id,
        department_name=dept_name,
        department_code=dept_code,
        current_version=req.current_version,
        status=req.status,
        remarks=req.remarks,
        requested_items=items,
        created_at=req.created_at,
        updated_at=req.updated_at,
    )


@router.post("/events", response_model=EventDetailResponse, status_code=status.HTTP_201_CREATED)
def submit_event(
    payload: EventCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Submit a new event request with requested resources across departments.
    Decomposes into department-specific requests and creates initial version snapshots.
    """
    event = create_event_with_department_requests(db, current_user, payload)
    
    # Reload with relationships
    return get_event_detail(event.id, current_user, db)


@router.get("/events", response_model=List[EventSummaryResponse])
def list_events(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List events. Club users see their own events; Authorities and Admins see all events.
    """
    stmt = select(Event).options(joinedload(Event.department_requests))
    if current_user.role == UserRole.STUDENT_CLUB:
        stmt = stmt.where(Event.organizer_user_id == current_user.id)

    stmt = stmt.order_by(Event.created_at.desc())
    events = db.scalars(stmt).unique().all()

    summaries = []
    for ev in events:
        total = len(ev.department_requests)
        approved = sum(1 for r in ev.department_requests if r.status.value == "APPROVED")
        summaries.append(
            EventSummaryResponse(
                id=ev.id,
                title=ev.title,
                status=ev.status,
                expected_attendance=ev.expected_attendance,
                total_departments=total,
                approved_departments=approved,
                created_at=ev.created_at,
            )
        )
    return summaries


@router.get("/events/{event_id}", response_model=EventDetailResponse)
def get_event_detail(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get full event breakdown including department-wise status, requested items, and latest notes.
    """
    event = db.scalar(
        select(Event)
        .options(
            joinedload(Event.organizer),
            joinedload(Event.department_requests).joinedload(DepartmentRequest.department),
        )
        .where(Event.id == event_id)
    )
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Access control: clubs can only view their own events
    if current_user.role == UserRole.STUDENT_CLUB and event.organizer_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    dept_reads = [
        _serialize_department_request(req, db)
        for req in event.department_requests
    ]

    return EventDetailResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        organizer_user_id=event.organizer_user_id,
        organizer_email=event.organizer.email if event.organizer else None,
        organizer_name=event.organizer.full_name if event.organizer else None,
        status=event.status,
        expected_attendance=event.expected_attendance,
        created_at=event.created_at,
        updated_at=event.updated_at,
        department_requests=dept_reads,
    )


@router.post("/events/{event_id}/cancel", response_model=EventDetailResponse)
def cancel_event_route(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cancel an event and release all associated confirmed bookings."""
    event = cancel_event(db, event_id, current_user)
    return get_event_detail(event.id, current_user, db)


@router.post("/department-requests/{request_id}/resubmit", response_model=DepartmentRequestRead)
def resubmit_request_route(
    request_id: int,
    payload: RequestResubmitPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Resubmit corrected resources/timings for a department request needing correction."""
    updated_req = resubmit_department_request(db, request_id, current_user, payload)
    return _serialize_department_request(updated_req, db)
