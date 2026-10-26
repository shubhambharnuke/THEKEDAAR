"""Pydantic Schemas for Departments and Resources"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from backend.app.database.models.resource import ResourceType


class DepartmentRead(BaseModel):
    id: int
    name: str
    code: str
    contact_email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResourceRead(BaseModel):
    id: int
    department_id: int
    name: str
    code: str
    resource_type: ResourceType
    location: str
    capacity: int
    equipment_spec: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BookingCollision(BaseModel):
    booking_id: int
    start_time: datetime
    end_time: datetime
    event_title: Optional[str] = None


class ResourceAvailabilityResponse(BaseModel):
    resource_id: int
    start_time: datetime
    end_time: datetime
    is_available: bool
    conflicts: List[BookingCollision] = []
