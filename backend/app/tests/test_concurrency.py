"""Concurrency and Collision Detection Test Suite"""

from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor
import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database.session import Base
from backend.app.database.models import (
    Department,
    Resource,
    ResourceType,
    Event,
    EventStatus,
    DepartmentRequest,
    DepartmentRequestStatus,
    User,
    UserRole,
    ResourceBooking,
    BookingStatus,
)
from backend.app.bookings.service import confirm_resource_booking


@pytest.fixture(scope="module")
def test_db_engine():
    """Create in-memory SQLite database for concurrency test isolation."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture
def db_session(test_db_engine):
    """Provide isolated transaction per test."""
    connection = test_db_engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


def test_concurrency_non_overlapping_bookings_succeed(db_session):
    """Verify two sequential non-overlapping bookings succeed."""
    # Setup base records
    dept = Department(name="Academic Office", code="ACAD_TEST", contact_email="test@acad.edu")
    db_session.add(dept)
    db_session.flush()

    res = Resource(
        department_id=dept.id,
        name="Conference Room 1",
        code="CONF_1",
        resource_type=ResourceType.SEMINAR_HALL,
        location="Bldg A",
        capacity=50,
    )
    db_session.add(res)
    db_session.flush()

    now = datetime.now(timezone.utc)
    t1_start = now + timedelta(hours=1)
    t1_end = now + timedelta(hours=2)

    t2_start = now + timedelta(hours=2, minutes=15)
    t2_end = now + timedelta(hours=3)

    # Booking 1
    b1 = confirm_resource_booking(db_session, department_request_id=1, resource_id=res.id, start_time=t1_start, end_time=t1_end)
    assert b1.id is not None
    assert b1.status == BookingStatus.CONFIRMED

    # Booking 2 (non-overlapping)
    b2 = confirm_resource_booking(db_session, department_request_id=1, resource_id=res.id, start_time=t2_start, end_time=t2_end)
    assert b2.id is not None
    assert b2.status == BookingStatus.CONFIRMED


def test_concurrency_overlapping_booking_raises_409(db_session):
    """Verify overlapping booking attempt is rejected with 409 Conflict."""
    dept = Department(name="Student Office", code="SW_TEST", contact_email="sw@test.edu")
    db_session.add(dept)
    db_session.flush()

    res = Resource(
        department_id=dept.id,
        name="Auditorium Test",
        code="AUDI_TEST",
        resource_type=ResourceType.AUDITORIUM,
        location="Campus Center",
        capacity=300,
    )
    db_session.add(res)
    db_session.flush()

    now = datetime.now(timezone.utc)
    t1_start = now + timedelta(hours=4)
    t1_end = now + timedelta(hours=6)

    # First booking confirms
    confirm_resource_booking(db_session, department_request_id=1, resource_id=res.id, start_time=t1_start, end_time=t1_end)

    # Second booking overlaps (starts 30 mins before first booking ends)
    t2_start = now + timedelta(hours=5, minutes=30)
    t2_end = now + timedelta(hours=7)

    with pytest.raises(HTTPException) as exc_info:
        confirm_resource_booking(db_session, department_request_id=2, resource_id=res.id, start_time=t2_start, end_time=t2_end)

    assert exc_info.value.status_code == 409
    assert "Booking conflict" in exc_info.value.detail
