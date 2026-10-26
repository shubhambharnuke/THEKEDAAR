"""Request Versioning and Authority Decision Audit Trail Models"""

import enum
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Integer, DateTime, Enum, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database.session import Base

if TYPE_CHECKING:
    from backend.app.database.models.user import User
    from backend.app.database.models.event import DepartmentRequest


class DecisionAction(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CORRECTION_REQUESTED = "CORRECTION_REQUESTED"


class RequestVersion(Base):
    __tablename__ = "request_versions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    department_request_id: Mapped[int] = mapped_column(
        ForeignKey("department_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    requested_payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    department_request: Mapped["DepartmentRequest"] = relationship(
        "DepartmentRequest", back_populates="versions"
    )

    def __repr__(self) -> str:
        return f"<RequestVersion req_id={self.department_request_id} v={self.version_number}>"


class DecisionHistory(Base):
    __tablename__ = "decision_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    department_request_id: Mapped[int] = mapped_column(
        ForeignKey("department_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    reviewer_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    action: Mapped[DecisionAction] = mapped_column(
        Enum(DecisionAction, name="decision_action_enum"),
        nullable=False,
    )
    remarks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    department_request: Mapped["DepartmentRequest"] = relationship(
        "DepartmentRequest", back_populates="decisions"
    )
    reviewer: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return (
            f"<DecisionHistory req_id={self.department_request_id} v={self.version_number} "
            f"action='{self.action.value}' reviewer_id={self.reviewer_user_id}>"
        )
