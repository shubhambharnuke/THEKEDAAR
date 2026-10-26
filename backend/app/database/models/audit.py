"""Immutable System Audit Log Model"""

from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, DateTime, func, Text, Index
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.database.session import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    actor_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)
    actor_role: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    target_entity: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[str] = mapped_column(String(100), nullable=False)
    details_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    __table_args__ = (
        Index("ix_audit_target_lookup", "target_entity", "target_id"),
    )

    def __repr__(self) -> str:
        return (
            f"<AuditLog id={self.id} action='{self.action}' "
            f"target={self.target_entity}:{self.target_id} timestamp={self.timestamp.isoformat()}>"
        )
