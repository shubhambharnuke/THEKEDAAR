"""API Endpoints for Departments, Resources, and Real-time Availability"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.database.models import (
    Department,
    Resource,
    ResourceType,
    ResourceBooking,
    BookingStatus,
    DepartmentRequest,
    Event,
)
from backend.app.resources.schemas import (
    DepartmentRead,
    ResourceRead,
    ResourceAvailabilityResponse,
    BookingCollision,
)

router = APIRouter(tags=["Resources"])


@router.get("/departments", response_model=List[DepartmentRead])
def list_departments(db: Session = Depends(get_db)):
    """List all academic and administrative departments."""
    stmt = select(Department).order_by(Department.name.asc())
    return db.scalars(stmt).all()


@router.get("/resources", response_model=List[ResourceRead])
def list_resources(
    department_id: Optional[int] = Query(None, description="Filter by department"),
    resource_type: Optional[ResourceType] = Query(None, description="Filter by resource category"),
    min_capacity: Optional[int] = Query(None, description="Minimum seating capacity"),
    db: Session = Depends(get_db),
):
    """List resources with optional filtering by department, type, or capacity."""
    stmt = select(Resource).where(Resource.is_active == True)

    if department_id is not None:
        stmt = stmt.where(Resource.department_id == department_id)
    if resource_type is not None:
        stmt = stmt.where(Resource.resource_type == resource_type)
    if min_capacity is not None:
        stmt = stmt.where(Resource.capacity >= min_capacity)

    stmt = stmt.order_by(Resource.name.asc())
    return db.scalars(stmt).all()


@router.get("/resources/{resource_id}", response_model=ResourceRead)
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    """Retrieve full details of a specific resource."""
    resource = db.scalar(select(Resource).where(Resource.id == resource_id))
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {resource_id} not found",
        )
    return resource


@router.get("/resources/{resource_id}/availability", response_model=ResourceAvailabilityResponse)
def check_resource_availability(
    resource_id: int,
    start_time: datetime = Query(..., description="Desired start time (ISO 8601 with timezone)"),
    end_time: datetime = Query(..., description="Desired end time (ISO 8601 with timezone)"),
    db: Session = Depends(get_db),
):
    """
    Check if a resource is available for a specified time window.
    Detects any overlapping confirmed bookings:
    Two intervals [A, B] and [C, D] collide if A < D and B > C.
    """
    if start_time >= end_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_time must be strictly earlier than end_time",
        )

    # Verify resource exists
    resource = db.scalar(select(Resource).where(Resource.id == resource_id))
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {resource_id} not found",
        )

    # Collision query on confirmed bookings
    stmt = (
        select(ResourceBooking, Event.title)
        .join(DepartmentRequest, ResourceBooking.department_request_id == DepartmentRequest.id)
        .join(Event, DepartmentRequest.event_id == Event.id)
        .where(
            ResourceBooking.resource_id == resource_id,
            ResourceBooking.status == BookingStatus.CONFIRMED,
            # Overlap condition: existing.start < new.end AND existing.end > new.start
            ResourceBooking.start_time < end_time,
            ResourceBooking.end_time > start_time,
        )
    )

    results = db.execute(stmt).all()
    conflicts = [
        BookingCollision(
            booking_id=booking.id,
            start_time=booking.start_time,
            end_time=booking.end_time,
            event_title=title,
        )
        for booking, title in results
    ]

    return ResourceAvailabilityResponse(
        resource_id=resource_id,
        start_time=start_time,
        end_time=end_time,
        is_available=(len(conflicts) == 0),
        conflicts=conflicts,
    )
