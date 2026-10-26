"""Audit Trail Query Endpoints"""

import json
from datetime import datetime
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from backend.app.auth.jwt import get_current_user
from backend.app.auth.rbac import require_role
from backend.app.database.session import get_db
from backend.app.database.models import User, UserRole, AuditLog, Event, DepartmentRequest

router = APIRouter(prefix="/audit", tags=["Audit Trail"])


class AuditLogEntryRead(BaseModel):
    id: int
    actor_id: Optional[int] = None
    actor_role: str
    action: str
    target_entity: str
    target_id: str
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


def _serialize_audit(entry: AuditLog) -> AuditLogEntryRead:
    parsed_details = None
    if entry.details_json:
        try:
            parsed_details = json.loads(entry.details_json)
        except Exception:
            parsed_details = {"raw": entry.details_json}

    return AuditLogEntryRead(
        id=entry.id,
        actor_id=entry.actor_id,
        actor_role=entry.actor_role,
        action=entry.action,
        target_entity=entry.target_entity,
        target_id=entry.target_id,
        details=parsed_details,
        ip_address=entry.ip_address,
        timestamp=entry.timestamp,
    )


@router.get("/events/{event_id}", response_model=List[AuditLogEntryRead])
def get_event_audit_history(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve chronological audit trail for a specific event, its child requests, and approvals.
    """
    # Permission check: club users can only view their own event audit trail
    event = db.scalar(select(Event).where(Event.id == event_id))
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if current_user.role == UserRole.STUDENT_CLUB and event.organizer_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Get child department request IDs
    child_req_ids = [
        str(r.id) for r in db.scalars(
            select(DepartmentRequest).where(DepartmentRequest.event_id == event_id)
        ).all()
    ]

    stmt = select(AuditLog).where(
        or_(
            (AuditLog.target_entity == "event") & (AuditLog.target_id == str(event_id)),
            (AuditLog.target_entity == "department_request") & (AuditLog.target_id.in_(child_req_ids)),
        )
    ).order_by(AuditLog.timestamp.asc())

    entries = db.scalars(stmt).all()
    return [_serialize_audit(e) for e in entries]


@router.get("", response_model=List[AuditLogEntryRead])
def list_system_audit_logs(
    target_entity: Optional[str] = Query(None, description="Filter by entity type"),
    action: Optional[str] = Query(None, description="Filter by action string"),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """
    Administrator endpoint to browse global immutable institutional audit logs.
    """
    stmt = select(AuditLog)
    if target_entity:
        stmt = stmt.where(AuditLog.target_entity == target_entity)
    if action:
        stmt = stmt.where(AuditLog.action == action)

    stmt = stmt.order_by(AuditLog.timestamp.desc()).limit(limit)
    entries = db.scalars(stmt).all()
    return [_serialize_audit(e) for e in entries]
