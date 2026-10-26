"""Event and DepartmentRequest Models"""

import enum
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, Enum, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database.session import Base

if TYPE_CHECKING:
    from backend.app.database.models.user import User
    from backend.app.database.models.resource import Department
    from backend.app.database.models.booking import ResourceBooking
    from backend.app.database.models.request_version import RequestVersion, DecisionHistory
    from backend.app.database.models.document import PermissionLetter


class EventStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"
    PARTIALLY_APPROVED = "PARTIALLY_APPROVED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class DepartmentRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    CORRECTION_REQUESTED = "CORRECTION_REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    organizer_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus, name="event_status_enum"),
        default=EventStatus.PENDING,
        nullable=False,
        index=True,
    )
    expected_attendance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True,
    )

    # Relationships
    organizer: Mapped["User"] = relationship("User", back_populates="events")
    department_requests: Mapped[List["DepartmentRequest"]] = relationship(
        "DepartmentRequest",
        back_populates="event",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Event id={self.id} title='{self.title}' status='{self.status.value}'>"


class DepartmentRequest(Base):
    __tablename__ = "department_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    event_id: Mapped[int] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    current_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[DepartmentRequestStatus] = mapped_column(
        Enum(DepartmentRequestStatus, name="dept_request_status_enum"),
        default=DepartmentRequestStatus.PENDING,
        nullable=False,
        index=True,
    )
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        onupdate=func.now(),
        nullable=True,
    )

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="department_requests")
    department: Mapped["Department"] = relationship("Department", back_populates="requests")
    bookings: Mapped[List["ResourceBooking"]] = relationship(
        "ResourceBooking",
        back_populates="department_request",
        cascade="all, delete-orphan",
    )
    versions: Mapped[List["RequestVersion"]] = relationship(
        "RequestVersion",
        back_populates="department_request",
        cascade="all, delete-orphan",
    )
    decisions: Mapped[List["DecisionHistory"]] = relationship(
        "DecisionHistory",
        back_populates="department_request",
        cascade="all, delete-orphan",
    )
    permission_letters: Mapped[List["PermissionLetter"]] = relationship(
        "PermissionLetter",
        back_populates="department_request",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<DepartmentRequest id={self.id} event_id={self.event_id} "
            f"dept_id={self.department_id} v={self.current_version} status='{self.status.value}'>"
        )
