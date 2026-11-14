"""Blockchain Integration & Web3 Service Test Suite"""

from datetime import datetime, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database.session import Base
from backend.app.database.models import (
    PermissionLetter,
    DocumentStatus,
    BlockchainRecord,
    BlockchainTxStatus,
)
from backend.app.blockchain.service import blockchain_service


@pytest.fixture(scope="module")
def blockchain_db_engine():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture
def db(blockchain_db_engine):
    connection = blockchain_db_engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


def test_blockchain_service_initialization():
    """Verify Web3 service loaded contract metadata and provider."""
    assert blockchain_service.contract_address is not None
    assert blockchain_service.contract_abi is not None
    assert len(blockchain_service.contract_abi) > 0


def test_blockchain_document_hash_submission(db):
    """Verify submitting a document hash creates a valid BlockchainRecord."""
    # Create parent permission letter stub
    letter = PermissionLetter(
        id="PL-TEST-BC-001",
        department_request_id=1,
        version_number=1,
        document_hash="a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef",
        digital_signature="deadbeef0123456789",
        storage_path="/tmp/fake.pdf",
        status=DocumentStatus.VALID,
    )
    db.add(letter)
    db.flush()

    record = blockchain_service.submit_document_hash(
        db=db,
        permission_letter_id=letter.id,
        doc_hash_hex=letter.document_hash,
        doc_id=letter.id,
        version=1,
    )

    assert record.id is not None
    assert record.permission_letter_id == letter.id
    assert record.status in (BlockchainTxStatus.PENDING, BlockchainTxStatus.CONFIRMED, BlockchainTxStatus.FAILED)
    if record.status == BlockchainTxStatus.FAILED:
        assert record.error_message is not None


def test_blockchain_verify_hash_offline_fallback():
    """Verify querying on-chain hash returns structured verification result."""
    fake_hash = "0x" + "a" * 64
    result = blockchain_service.verify_on_chain_hash(fake_hash)

    assert "verified_on_chain" in result
    assert "network" in result
    assert "message" in result
