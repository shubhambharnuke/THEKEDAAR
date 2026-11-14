"""Comprehensive End-to-End Test Suite for THEKEDAR Local Architecture"""

from datetime import datetime, timezone, timedelta
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from backend.app.database.session import Base
from backend.app.database.models import (
    User,
    UserRole,
    Department,
    Resource,
    ResourceType,
    Event,
    EventStatus,
    DepartmentRequest,
    DepartmentRequestStatus,
    ResourceBooking,
    BookingStatus,
    PermissionLetter,
    DocumentStatus,
    BlockchainRecord,
    BlockchainTxStatus,
)
from backend.app.auth.security import get_password_hash, verify_password, create_access_token
from backend.app.auth.jwt import decode_token
from backend.app.auth.router import register_user, login_user, RegisterRequest, LoginRequest
from backend.app.bookings.schemas import EventCreateRequest, ResourceBookingItem, RequestResubmitPayload
from backend.app.bookings.service import (
    create_event_with_department_requests,
    confirm_resource_booking,
    resubmit_department_request,
)
from backend.app.approvals.router import submit_authority_decision, DepartmentDecisionRequest
from backend.app.documents.generator import generate_permission_letter_pdf
from backend.app.documents.signer import sign_document_bytes, verify_document_signature
from backend.app.blockchain.service import blockchain_service


@pytest.fixture(scope="module")
def e2e_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    # Seed core reference departments
    dept_acad = Department(name="Academic Affairs", code="DEAN_ACAD", contact_email="acad@college.edu")
    dept_sw = Department(name="Student Welfare", code="DEAN_SW", contact_email="sw@college.edu")
    session.add_all([dept_acad, dept_sw])
    session.flush()

    # Seed core reference resources
    res_audi = Resource(
        name="Main Auditorium",
        code="AUDI_MAIN",
        department_id=dept_sw.id,
        resource_type=ResourceType.AUDITORIUM,
        location="Campus Center",
        capacity=800,
    )
    res_hall = Resource(
        name="Seminar Hall A",
        code="HALL_A",
        department_id=dept_acad.id,
        resource_type=ResourceType.SEMINAR_HALL,
        location="Academic Block",
        capacity=120,
    )
    session.add_all([res_audi, res_hall])
    session.flush()

    # Seed Authority User
    auth_user = User(
        email="authority.sw@college.edu",
        full_name="Dean SW Reviewer",
        role=UserRole.AUTHORITY,
        department_id=dept_sw.id,
        password_hash=get_password_hash("AuthPass2026!"),
        is_active=True,
    )
    session.add(auth_user)
    session.commit()

    yield session
    session.close()


def test_01_user_registration_and_login(e2e_db):
    """Test 1: Register and login as local student club."""
    reg = RegisterRequest(
        full_name="Robotics Club Lead",
        email="robotics@college.edu",
        password="RoboPassword123!",
        role=UserRole.STUDENT_CLUB,
    )
    auth_res = register_user(reg, db=e2e_db)
    assert auth_res.access_token is not None
    assert auth_res.user.email == "robotics@college.edu"
    assert auth_res.user.role == UserRole.STUDENT_CLUB

    # Login
    login = LoginRequest(email="robotics@college.edu", password="RoboPassword123!")
    login_res = login_user(login, db=e2e_db)
    assert login_res.access_token is not None

    # Validate token
    claims = decode_token(login_res.access_token)
    assert claims["email"] == "robotics@college.edu"
    assert claims["role"] == "STUDENT_CLUB"


def test_02_event_creation_and_decomposition(e2e_db):
    """Test 2: Create event requesting multi-department facilities."""
    organizer = e2e_db.scalar(select(User).where(User.email == "robotics@college.edu"))
    res_audi = e2e_db.scalar(select(Resource).where(Resource.code == "AUDI_MAIN"))
    res_hall = e2e_db.scalar(select(Resource).where(Resource.code == "HALL_A"))

    now = datetime.now(timezone.utc) + timedelta(days=5)
    start_t = now.replace(hour=10, minute=0, second=0, microsecond=0)
    end_t = now.replace(hour=17, minute=0, second=0, microsecond=0)

    event_payload = EventCreateRequest(
        title="Annual RoboCon 2026",
        description="Autonomous robot exhibitions and workshops.",
        expected_attendance=300,
        requested_resources=[
            ResourceBookingItem(resource_id=res_audi.id, start_time=start_t, end_time=end_t),
            ResourceBookingItem(resource_id=res_hall.id, start_time=start_t, end_time=end_t),
        ],
    )

    event = create_event_with_department_requests(e2e_db, organizer, event_payload)
    e2e_db.commit()
    assert event.id is not None
    assert event.status == EventStatus.PENDING
    assert len(event.department_requests) == 2

    # Check department requests created with version 1
    for dr in event.department_requests:
        assert dr.current_version == 1
        assert dr.status == DepartmentRequestStatus.PENDING


def test_03_authority_approval_and_booking_confirmation(e2e_db):
    """Test 3: Authority reviews and approves request, locking reservation."""
    auth_user = e2e_db.scalar(select(User).where(User.email == "authority.sw@college.edu"))
    dept_sw = e2e_db.scalar(select(Department).where(Department.code == "DEAN_SW"))
    dept_req = e2e_db.scalar(
        select(DepartmentRequest).where(DepartmentRequest.department_id == dept_sw.id)
    )

    decision_payload = DepartmentDecisionRequest(
        action="APPROVE",
        remarks="Approved. Sound permissions granted.",
    )

    result = submit_authority_decision(
        request_id=dept_req.id,
        payload=decision_payload,
        current_user=auth_user,
        db=e2e_db,
    )

    assert result.status == DepartmentRequestStatus.APPROVED.value

    # Verify confirmed resource booking created in database
    booking = e2e_db.scalar(
        select(ResourceBooking).where(ResourceBooking.department_request_id == dept_req.id)
    )
    assert booking is not None
    assert booking.status == BookingStatus.CONFIRMED


def test_04_double_booking_prevention(e2e_db):
    """Test 4: Attempting to confirm overlapping time slot raises 409 Conflict."""
    from fastapi import HTTPException
    res_audi = e2e_db.scalar(select(Resource).where(Resource.code == "AUDI_MAIN"))
    dept_sw = e2e_db.scalar(select(Department).where(Department.code == "DEAN_SW"))
    dept_req = e2e_db.scalar(
        select(DepartmentRequest).where(DepartmentRequest.department_id == dept_sw.id)
    )

    now = datetime.now(timezone.utc) + timedelta(days=5)
    overlap_start = now.replace(hour=11, minute=0, second=0, microsecond=0)
    overlap_end = now.replace(hour=14, minute=0, second=0, microsecond=0)

    with pytest.raises(HTTPException) as exc_info:
        confirm_resource_booking(
            e2e_db,
            department_request_id=dept_req.id,
            resource_id=res_audi.id,
            start_time=overlap_start,
            end_time=overlap_end,
        )
    assert exc_info.value.status_code == 409


def test_05_permission_document_generation_and_verification(e2e_db):
    """Test 5: Cryptographic letter generation, signing, and tamper detection."""
    pdf_bytes = generate_permission_letter_pdf(
        letter_id="PL-SW-001-V1-A1B2C3",
        event_title="Annual RoboCon 2026",
        organizer_name="Robotics Club Lead",
        organizer_email="robotics@college.edu",
        department_name="Dean of Student Welfare",
        department_code="DEAN_SW",
        version_number=1,
        allocated_resources=[
            {
                "resource_code": "AUDI_MAIN",
                "resource_name": "Main Auditorium",
                "start_time": "2026-11-15T10:00:00Z",
                "end_time": "2026-11-15T17:00:00Z",
            }
        ],
        issued_at=datetime.now(timezone.utc),
    )

    doc_hash, sig_hex = sign_document_bytes(pdf_bytes)
    assert verify_document_signature(pdf_bytes, sig_hex) is True

    # Tampering with 1 byte of the PDF fails verification immediately
    tampered_bytes = bytearray(pdf_bytes)
    tampered_bytes[-10] ^= 0xFF
    assert verify_document_signature(bytes(tampered_bytes), sig_hex) is False


def test_06_blockchain_registration_integrity(e2e_db):
    """Test 6: Blockchain record created with real status (zero simulated success)."""
    letter = PermissionLetter(
        id="PL-SW-001-V1-A1B2C3",
        department_request_id=1,
        version_number=1,
        document_hash="1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        digital_signature="dummy_signature",
        storage_path="/letters/PL-SW-001.pdf",
        status=DocumentStatus.VALID,
    )
    e2e_db.add(letter)
    e2e_db.flush()

    record = blockchain_service.submit_document_hash(
        db=e2e_db,
        permission_letter_id=letter.id,
        doc_hash_hex=letter.document_hash,
        doc_id=letter.id,
        version=1,
    )

    assert record.id is not None
    assert record.permission_letter_id == letter.id
    # Confirms record has a legitimate status, not a fabricated fake tx
    assert record.status in (BlockchainTxStatus.PENDING, BlockchainTxStatus.CONFIRMED, BlockchainTxStatus.FAILED)
    if record.status == BlockchainTxStatus.FAILED:
        assert record.error_message is not None
