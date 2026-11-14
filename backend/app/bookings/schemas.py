"""Pydantic Schemas for Events and Multi-Department Requests"""

from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field, ConfigDict, model_validator

from backend.app.database.models.event import EventStatus, DepartmentRequestStatus


class ResourceBookingItem(BaseModel):
    resource_id: int = Field(..., description="Target Resource ID")
    start_time: datetime = Field(..., description="Start time with timezone")
    end_time: datetime = Field(..., description="End time with timezone")


class EventCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=255, description="Event Title")
    description: Optional[str] = Field(None, description="Detailed Event Description")
    expected_attendance: int = Field(default=0, ge=0, description="Expected attendee count")
    requested_resources: Optional[List[ResourceBookingItem]] = Field(
        default=None, description="List of required resources and time slots"
    )
    resource_bookings: Optional[List[ResourceBookingItem]] = Field(
        default=None, description="Alias for requested_resources"
    )

    @model_validator(mode="after")
    def populate_resources(self):
        if not self.requested_resources and not self.resource_bookings:
            raise ValueError("At least one resource booking is required.")
        if not self.requested_resources and self.resource_bookings:
            self.requested_resources = self.resource_bookings
        return self



class DecisionHistoryItemRead(BaseModel):
    id: int
    version_number: int
    action: str
    remarks: Optional[str] = None
    reviewer_name: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class DepartmentRequestRead(BaseModel):
    id: int
    event_id: int
    department_id: int
    department_name: Optional[str] = None
    department_code: Optional[str] = None
    event_title: Optional[str] = None
    organizer_name: Optional[str] = None
    organizer_email: Optional[str] = None
    current_version: int
    status: DepartmentRequestStatus
    remarks: Optional[str] = None
    requested_items: List[Dict[str, Any]] = []
    permission_letter_id: Optional[str] = None
    decisions: List[DecisionHistoryItemRead] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EventDetailResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    organizer_user_id: int
    organizer_email: Optional[str] = None
    organizer_name: Optional[str] = None
    status: EventStatus
    expected_attendance: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    department_requests: List[DepartmentRequestRead] = []

    model_config = ConfigDict(from_attributes=True)


class EventSummaryResponse(BaseModel):
    id: int
    title: str
    status: EventStatus
    expected_attendance: int
    total_departments: int
    approved_departments: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DepartmentDecisionRequest(BaseModel):
    action: str = Field(..., description="APPROVE | REJECT | REQUEST_CORRECTION")
    remarks: Optional[str] = Field(None, description="Decision remarks or correction instructions")


class RequestResubmitPayload(BaseModel):
    requested_resources: List[ResourceBookingItem] = Field(
        ..., min_length=1, description="Updated resources and time slots"
    )
    change_summary: Optional[str] = Field(None, description="Explanation of changes made")
