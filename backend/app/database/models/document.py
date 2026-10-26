"""Permission Letter and Blockchain Record Models"""

import enum
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, Enum, ForeignKey, func, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database.session import Base

if TYPE_CHECKING:
    from backend.app.database.models.event import DepartmentRequest


class DocumentStatus(str, enum.Enum):
    VALID = "VALID"
    SUPERSEDED = "SUPERSEDED"
    REVOKED = "REVOKED"


class BlockchainTxStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"


class PermissionLetter(Base):
    __tablename__ = "permission_letters"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)  # UUID or canonical Letter ID
    department_request_id: Mapped[int] = mapped_column(
        ForeignKey("department_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    document_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    digital_signature: Mapped[str] = mapped_column(Text, nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus, name="document_status_enum"),
        default=DocumentStatus.VALID,
        nullable=False,
        index=True,
    )
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    department_request: Mapped["DepartmentRequest"] = relationship(
        "DepartmentRequest", back_populates="permission_letters"
    )
    blockchain_records: Mapped[List["BlockchainRecord"]] = relationship(
        "BlockchainRecord",
        back_populates="permission_letter",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<PermissionLetter id='{self.id}' v={self.version_number} "
            f"hash={self.document_hash[:10]}... status='{self.status.value}'>"
        )


class BlockchainRecord(Base):
    __tablename__ = "blockchain_records"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    permission_letter_id: Mapped[str] = mapped_column(
        ForeignKey("permission_letters.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    tx_hash: Mapped[Optional[str]] = mapped_column(String(66), unique=True, index=True, nullable=True)
    block_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    contract_address: Mapped[Optional[str]] = mapped_column(String(42), nullable=True)
    status: Mapped[BlockchainTxStatus] = mapped_column(
        Enum(BlockchainTxStatus, name="blockchain_tx_status_enum"),
        default=BlockchainTxStatus.PENDING,
        nullable=False,
        index=True,
    )
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    permission_letter: Mapped["PermissionLetter"] = relationship(
        "PermissionLetter", back_populates="blockchain_records"
    )

    def __repr__(self) -> str:
        return (
            f"<BlockchainRecord id={self.id} tx={self.tx_hash} "
            f"status='{self.status.value}' letter_id='{self.permission_letter_id}'>"
        )
