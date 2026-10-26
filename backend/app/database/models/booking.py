"""Resource Booking Model with Temporal Range Tracking"""

import enum
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, Enum, ForeignKey, func, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database.session import Base

if TYPE_CHECKING:
    from backend.app.database.models.resource import Resource
    from backend.app.database.models.event import DepartmentRequest


class BookingStatus(str, enum.Enum):
    CONFIRMED = "CONFIRMED"
    RELEASED = "RELEASED"


class ResourceBooking(Base):
    __tablename__ = "resource_bookings"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    department_request_id: Mapped[int] = mapped_column(
        ForeignKey("department_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resource_id: Mapped[int] = mapped_column(
        ForeignKey("resources.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, name="booking_status_enum"),
        default=BookingStatus.CONFIRMED,
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    resource: Mapped["Resource"] = relationship("Resource", back_populates="bookings")
    department_request: Mapped["DepartmentRequest"] = relationship(
        "DepartmentRequest", back_populates="bookings"
    )

    __table_args__ = (
        Index(
            "ix_resource_time_status",
            "resource_id",
            "start_time",
            "end_time",
            "status",
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<ResourceBooking id={self.id} resource_id={self.resource_id} "
            f"range=[{self.start_time.isoformat()} - {self.end_time.isoformat()}] "
            f"status='{self.status.value}'>"
        )
