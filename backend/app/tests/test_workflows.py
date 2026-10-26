"""Multi-Department Event and Approval Workflow Integration Tests"""

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
    BookingStatus,
)
from backend.app.bookings.schemas import (
    EventCreateRequest,
    ResourceBookingItem,
    RequestResubmitPayload,
    DepartmentDecisionRequest,
)
from backend.app.bookings.service import (
    create_event_with_department_requests,
    resubmit_department_request,
    evaluate_event_status,
    cancel_event,
)
from backend.app.approvals.router import submit_authority_decision


@pytest.fixture(scope="module")
def workflow_db_engine():
    """Create in-memory SQLite database for test isolation."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    return engine


@pytest.fixture
def db(workflow_db_engine):
    """Provide isolated transaction per test."""
    connection = workflow_db_engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


def test_full_multi_department_approval_lifecycle(db):
    """
    Test complete lifecycle:
    1. Setup departments, resources, users.
    2. Submit multi-department event.
    3. Verify decomposition into 2 DepartmentRequests (v1).
    4. Dept 1 requests corrections -> v1 CORRECTION_REQUESTED.
    5. Organizer resubmits -> Dept 1 becomes v2 PENDING.
    6. Dept 1 approves -> Event is PARTIALLY_APPROVED.
    7. Dept 2 approves -> Event is APPROVED.
    """
    # 1. Setup Master Data
    dept_acad = Department(name="Academic Affairs", code="ACAD_WF", contact_email="acad@wf.edu")
    dept_sw = Department(name="Student Welfare", code="SW_WF", contact_email="sw@wf.edu")
    db.add_all([dept_acad, dept_sw])
    db.flush()

    res_hall = Resource(
        department_id=dept_acad.id,
        name="Seminar Hall 1",
        code="SEM_WF_1",
        resource_type=ResourceType.SEMINAR_HALL,
        location="Bldg B",
        capacity=100,
    )
    res_audi = Resource(
        department_id=dept_sw.id,
        name="Auditorium WF",
        code="AUDI_WF_1",
        resource_type=ResourceType.AUDITORIUM,
        location="Campus Center",
        capacity=500,
    )
    db.add_all([res_hall, res_audi])
    db.flush()

    organizer = User(
        email="club.lead@wf.edu",
        full_name="Club Lead",
        role=UserRole.STUDENT_CLUB,
    )
    auth_acad = User(
        email="auth.acad@wf.edu",
        full_name="Academic Authority",
        role=UserRole.AUTHORITY,
        department_id=dept_acad.id,
    )
    auth_sw = User(
        email="auth.sw@wf.edu",
        full_name="SW Authority",
        role=UserRole.AUTHORITY,
        department_id=dept_sw.id,
    )
    db.add_all([organizer, auth_acad, auth_sw])
    db.flush()

    now = datetime.now(timezone.utc)
    t_start = now + timedelta(days=2, hours=10)
    t_end = now + timedelta(days=2, hours=13)

    # 2. Submit Multi-Department Event
    create_payload = EventCreateRequest(
        title="Annual Tech Symposium",
        description="Two-track flagship technical conference",
        expected_attendance=400,
        requested_resources=[
            ResourceBookingItem(resource_id=res_hall.id, start_time=t_start, end_time=t_end),
            ResourceBookingItem(resource_id=res_audi.id, start_time=t_start, end_time=t_end),
        ],
    )
    event = create_event_with_department_requests(db, organizer, create_payload)
    assert event.id is not None
    assert event.status == EventStatus.PENDING

    # 3. Verify decomposition
    requests = db.scalars(
        select(DepartmentRequest).where(DepartmentRequest.event_id == event.id)
    ).all()
    assert len(requests) == 2

    req_acad = next(r for r in requests if r.department_id == dept_acad.id)
    req_sw = next(r for r in requests if r.department_id == dept_sw.id)

    assert req_acad.current_version == 1
    assert req_acad.status == DepartmentRequestStatus.PENDING
    assert req_sw.current_version == 1
    assert req_sw.status == DepartmentRequestStatus.PENDING

    # 4. Dept Acad Requests Correction
    corr_payload = DepartmentDecisionRequest(
        action="REQUEST_CORRECTION",
        remarks="Please adjust timing by 30 mins to avoid overlap with departmental seminars",
    )
    submit_authority_decision(
        request_id=req_acad.id,
        payload=corr_payload,
        current_user=auth_acad,
        db=db,
    )
    db.refresh(req_acad)
    assert req_acad.status == DepartmentRequestStatus.CORRECTION_REQUESTED
    assert "adjust timing" in req_acad.remarks

    # 5. Organizer Resubmits Corrected Timing for Dept Acad
    new_t_start = now + timedelta(days=2, hours=10, minutes=30)
    new_t_end = now + timedelta(days=2, hours=13, minutes=30)
    resubmit_payload = RequestResubmitPayload(
        requested_resources=[
            ResourceBookingItem(resource_id=res_hall.id, start_time=new_t_start, end_time=new_t_end),
        ],
        change_summary="Shifted start time by 30 minutes as requested",
    )
    resubmit_department_request(db, req_acad.id, organizer, resubmit_payload)
    db.refresh(req_acad)
    assert req_acad.current_version == 2
    assert req_acad.status == DepartmentRequestStatus.PENDING
    assert req_acad.remarks is None

    # 6. Dept Acad Approves v2
    approve_acad = DepartmentDecisionRequest(action="APPROVE", remarks="Approved adjusted slot")
    submit_authority_decision(
        request_id=req_acad.id,
        payload=approve_acad,
        current_user=auth_acad,
        db=db,
    )
    db.refresh(req_acad)
    db.refresh(event)
    assert req_acad.status == DepartmentRequestStatus.APPROVED
    assert event.status == EventStatus.PARTIALLY_APPROVED

    # 7. Dept SW Approves
    approve_sw = DepartmentDecisionRequest(action="APPROVE", remarks="Auditorium booking approved")
    submit_authority_decision(
        request_id=req_sw.id,
        payload=approve_sw,
        current_user=auth_sw,
        db=db,
    )
    db.refresh(req_sw)
    db.refresh(event)
    assert req_sw.status == DepartmentRequestStatus.APPROVED
    assert event.status == EventStatus.APPROVED


def test_event_cancellation_releases_bookings(db):
    """Verify cancelling an event marks requests cancelled and releases bookings."""
    dept = Department(name="CSE Department", code="CSE_CANCEL", contact_email="cse@cancel.edu")
    db.add(dept)
    db.flush()

    res = Resource(
        department_id=dept.id,
        name="Lab C",
        code="LAB_C",
        resource_type=ResourceType.LAB,
        location="CS Wing",
        capacity=40,
    )
    db.add(res)
    db.flush()

    organizer = User(email="club2@wf.edu", full_name="Organizer 2", role=UserRole.STUDENT_CLUB)
    auth = User(email="auth2@wf.edu", full_name="Auth 2", role=UserRole.AUTHORITY, department_id=dept.id)
    db.add_all([organizer, auth])
    db.flush()

    now = datetime.now(timezone.utc)
    create_payload = EventCreateRequest(
        title="Hackathon Workshop",
        expected_attendance=30,
        requested_resources=[
            ResourceBookingItem(resource_id=res.id, start_time=now + timedelta(days=1), end_time=now + timedelta(days=1, hours=2)),
        ],
    )
    event = create_event_with_department_requests(db, organizer, create_payload)
    dept_req = db.scalar(select(DepartmentRequest).where(DepartmentRequest.event_id == event.id))

    # Approve to generate confirmed booking
    submit_authority_decision(
        request_id=dept_req.id,
        payload=DepartmentDecisionRequest(action="APPROVE"),
        current_user=auth,
        db=db,
    )
    db.refresh(event)
    assert event.status == EventStatus.APPROVED

    # Cancel event
    cancel_event(db, event.id, organizer)
    db.refresh(event)
    db.refresh(dept_req)
    assert event.status == EventStatus.CANCELLED
    assert dept_req.status == DepartmentRequestStatus.CANCELLED

    # Check bookings are released
    bookings = db.scalars(select(Resource).join(Resource.bookings)).all()
