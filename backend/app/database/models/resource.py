"""Department and Resource Models"""

import enum
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Boolean, DateTime, Enum, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database.session import Base

if TYPE_CHECKING:
    from backend.app.database.models.user import User
    from backend.app.database.models.booking import ResourceBooking
    from backend.app.database.models.event import DepartmentRequest


class ResourceType(str, enum.Enum):
    AUDITORIUM = "AUDITORIUM"
    LAB = "LAB"
    CLASSROOM = "CLASSROOM"
    SEMINAR_HALL = "SEMINAR_HALL"
    GROUND = "GROUND"
    OTHER = "OTHER"


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    authorities: Mapped[List["User"]] = relationship(
        "User",
        back_populates="department",
        foreign_keys="User.department_id",
    )
    resources: Mapped[List["Resource"]] = relationship(
        "Resource",
        back_populates="department",
        cascade="all, delete-orphan",
    )
    requests: Mapped[List["DepartmentRequest"]] = relationship(
        "DepartmentRequest",
        back_populates="department",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Department code='{self.code}' name='{self.name}'>"


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    department_id: Mapped[int] = mapped_column(
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    resource_type: Mapped[ResourceType] = mapped_column(
        Enum(ResourceType, name="resource_type_enum"),
        default=ResourceType.CLASSROOM,
        nullable=False,
    )
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    capacity: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    equipment_spec: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    department: Mapped["Department"] = relationship("Department", back_populates="resources")
    bookings: Mapped[List["ResourceBooking"]] = relationship(
        "ResourceBooking",
        back_populates="resource",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Resource code='{self.code}' name='{self.name}' capacity={self.capacity}>"
