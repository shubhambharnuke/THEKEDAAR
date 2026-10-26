"""Event Creation, Multi-Department Decomposition, and Booking Workflows"""

import json
from datetime import datetime
from collections import defaultdict
from typing import List, Dict, Any, Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.database.models import (
    User,
    UserRole,
    Resource,
    ResourceBooking,
    BookingStatus,
    Event,
    EventStatus,
    DepartmentRequest,
    DepartmentRequestStatus,
    RequestVersion,
    DecisionHistory,
    DecisionAction,
)
from backend.app.bookings.schemas import EventCreateRequest, RequestResubmitPayload


def confirm_resource_booking(
    db: Session,
    department_request_id: int,
    resource_id: int,
    start_time: datetime,
    end_time: datetime,
) -> ResourceBooking:
    """
    Safely confirm a resource booking with row-level locking to prevent race conditions.
    """
    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_time must be strictly earlier than end_time",
        )

    # 1. Acquire pessimistic lock on the resource to serialize concurrent booking attempts
    locked_resource = db.scalar(
        select(Resource)
        .where(Resource.id == resource_id)
        .with_for_update()
    )
    if not locked_resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource {resource_id} not found",
        )

    if not locked_resource.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Resource {locked_resource.name} is currently inactive",
        )

    # 2. Check for conflicting confirmed bookings (A < D and B > C)
    conflict_stmt = select(ResourceBooking).where(
        ResourceBooking.resource_id == resource_id,
        ResourceBooking.status == BookingStatus.CONFIRMED,
        ResourceBooking.start_time < end_time,
        ResourceBooking.end_time > start_time,
    )
    existing_conflict = db.scalar(conflict_stmt)

    if existing_conflict:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Booking conflict: '{locked_resource.name}' is already confirmed for an overlapping slot "
                f"[{existing_conflict.start_time.isoformat()} - {existing_conflict.end_time.isoformat()}]."
            ),
        )

    # 3. Create confirmed booking record
    new_booking = ResourceBooking(
        department_request_id=department_request_id,
        resource_id=resource_id,
        start_time=start_time,
        end_time=end_time,
        status=BookingStatus.CONFIRMED,
    )
    db.add(new_booking)
    db.flush()

    return new_booking


def create_event_with_department_requests(
    db: Session,
    organizer: User,
    payload: EventCreateRequest,
) -> Event:
    """
    Creates an Event and automatically decomposes requested resources into department-level requests.
    Initializes version 1 snapshot for each department's requested items.
    """
    # 1. Validate all resources exist and partition by department
    dept_to_items = defaultdict(list)
    for item in payload.requested_resources:
        if item.start_time >= item.end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Resource {item.resource_id} has invalid time window: start must be before end",
            )
        res = db.scalar(select(Resource).where(Resource.id == item.resource_id))
        if not res:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Requested resource ID {item.resource_id} not found",
            )
        if not res.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Requested resource '{res.name}' is currently inactive",
            )
        dept_to_items[res.department_id].append({
            "resource_id": res.id,
            "resource_name": res.name,
            "resource_code": res.code,
            "start_time": item.start_time.isoformat(),
            "end_time": item.end_time.isoformat(),
        })

    # 2. Create Parent Event
    event = Event(
        title=payload.title,
        description=payload.description,
        organizer_user_id=organizer.id,
        status=EventStatus.PENDING,
        expected_attendance=payload.expected_attendance,
    )
    db.add(event)
    db.flush()

    # 3. Create child DepartmentRequests and Version 1 snapshots
    for dept_id, items in dept_to_items.items():
        dept_req = DepartmentRequest(
            event_id=event.id,
            department_id=dept_id,
            current_version=1,
            status=DepartmentRequestStatus.PENDING,
        )
        db.add(dept_req)
        db.flush()

        # Save initial version payload snapshot
        req_ver = RequestVersion(
            department_request_id=dept_req.id,
            version_number=1,
            requested_payload_json=json.dumps(items),
        )
        db.add(req_ver)

    # Record Audit Log
    from backend.app.audit.service import record_audit_event
    record_audit_event(
        db=db,
        actor_id=organizer.id,
        actor_role=organizer.role.value,
        action="EVENT_CREATED",
        target_entity="event",
        target_id=str(event.id),
        details={"title": event.title, "attendance": event.expected_attendance},
    )

    db.commit()
    db.refresh(event)
    return event


def evaluate_event_status(db: Session, event_id: int) -> EventStatus:
    """
    Computes overall event status based on department-level decision states:
    - Any REJECTED -> REJECTED
    - All APPROVED -> APPROVED
    - Some APPROVED (and remainder PENDING/CORRECTION) -> PARTIALLY_APPROVED
    - All PENDING / CORRECTION -> PENDING
    - If all CANCELLED -> CANCELLED
    """
    event = db.scalar(select(Event).where(Event.id == event_id))
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    requests = db.scalars(
        select(DepartmentRequest).where(DepartmentRequest.event_id == event_id)
    ).all()

    if not requests:
        return event.status

    statuses = [r.status for r in requests]

    if all(s == DepartmentRequestStatus.CANCELLED for s in statuses):
        new_status = EventStatus.CANCELLED
    elif any(s == DepartmentRequestStatus.REJECTED for s in statuses):
        new_status = EventStatus.REJECTED
    elif all(s == DepartmentRequestStatus.APPROVED for s in statuses):
        new_status = EventStatus.APPROVED
    elif any(s == DepartmentRequestStatus.APPROVED for s in statuses):
        new_status = EventStatus.PARTIALLY_APPROVED
    else:
        new_status = EventStatus.PENDING

    event.status = new_status
    db.flush()
    return new_status


def resubmit_department_request(
    db: Session,
    request_id: int,
    user: User,
    payload: RequestResubmitPayload,
) -> DepartmentRequest:
    """
    Resubmit corrections for a department request in CORRECTION_REQUESTED status.
    Increments current_version, snapshots new payload, and resets status to PENDING.
    """
    dept_req = db.scalar(
        select(DepartmentRequest).where(DepartmentRequest.id == request_id)
    )
    if not dept_req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department request not found")

    event = db.scalar(select(Event).where(Event.id == dept_req.event_id))
    if event.organizer_user_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the event organizer can resubmit corrections",
        )

    if dept_req.status != DepartmentRequestStatus.CORRECTION_REQUESTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request cannot be resubmitted while in status '{dept_req.status.value}'. Must be CORRECTION_REQUESTED.",
        )

    # Validate items belong to the same department
    items_snapshot = []
    for item in payload.requested_resources:
        if item.start_time >= item.end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Resource {item.resource_id} has invalid time window",
            )
        res = db.scalar(select(Resource).where(Resource.id == item.resource_id))
        if not res or res.department_id != dept_req.department_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Resource ID {item.resource_id} does not belong to target department",
            )
        items_snapshot.append({
            "resource_id": res.id,
            "resource_name": res.name,
            "resource_code": res.code,
            "start_time": item.start_time.isoformat(),
            "end_time": item.end_time.isoformat(),
            "change_summary": payload.change_summary,
        })

    # Increment version and reset status
    dept_req.current_version += 1
    dept_req.status = DepartmentRequestStatus.PENDING
    dept_req.remarks = None
    db.flush()

    new_version = RequestVersion(
        department_request_id=dept_req.id,
        version_number=dept_req.current_version,
        requested_payload_json=json.dumps(items_snapshot),
    )
    db.add(new_version)

    evaluate_event_status(db, dept_req.event_id)
    db.commit()
    db.refresh(dept_req)
    return dept_req


def cancel_event(db: Session, event_id: int, user: User) -> Event:
    """
    Cancels an event, releasing any confirmed resource bookings and marking all child requests cancelled.
    """
    event = db.scalar(select(Event).where(Event.id == event_id))
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if event.organizer_user_id != user.id and user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the event organizer or an admin can cancel this event",
        )

    # Cancel child requests and release confirmed bookings
    requests = db.scalars(
        select(DepartmentRequest).where(DepartmentRequest.event_id == event_id)
    ).all()
    for req in requests:
        req.status = DepartmentRequestStatus.CANCELLED
        # Release bookings
        bookings = db.scalars(
            select(ResourceBooking).where(ResourceBooking.department_request_id == req.id)
        ).all()
        for b in bookings:
            b.status = BookingStatus.RELEASED

    event.status = EventStatus.CANCELLED
    db.commit()
    db.refresh(event)
    return event
