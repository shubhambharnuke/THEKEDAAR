"""Unit and Integration Tests for Local Authentication and RBAC"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database.session import Base
from backend.app.database.models import User, UserRole
from backend.app.auth.security import get_password_hash, verify_password, create_access_token
from backend.app.auth.jwt import decode_token


@pytest.fixture(scope="module")
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_password_hashing_and_verification():
    """Verify PBKDF2-HMAC-SHA256 hash generation and verification."""
    password = "SuperSecretDevPassword2026!"
    hashed = get_password_hash(password)

    assert hashed.startswith("pbkdf2_sha256$100000$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False
    assert verify_password("", hashed) is False
    assert verify_password(password, None) is False


def test_jwt_issuance_and_decoding():
    """Verify local JWT creation, signature, and decoding."""
    payload = {
        "sub": "club.lead@college.edu",
        "email": "club.lead@college.edu",
        "role": UserRole.STUDENT_CLUB.value,
        "user_id": 42,
    }
    token = create_access_token(payload)
    decoded = decode_token(token)

    assert decoded["sub"] == "club.lead@college.edu"
    assert decoded["email"] == "club.lead@college.edu"
    assert decoded["role"] == "STUDENT_CLUB"
    assert decoded["user_id"] == 42
    assert "exp" in decoded


def test_user_persistence_with_password(db_session):
    """Verify storing and retrieving user with password_hash in SQLite."""
    raw_pass = "SecurePass123!"
    user = User(
        email="new.club@college.edu",
        full_name="New Club Organizer",
        role=UserRole.STUDENT_CLUB,
        password_hash=get_password_hash(raw_pass),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    fetched = db_session.query(User).filter(User.email == "new.club@college.edu").first()
    assert fetched is not None
    assert fetched.id is not None
    assert verify_password(raw_pass, fetched.password_hash) is True
    assert verify_password("WrongPass", fetched.password_hash) is False


def test_auth_router_registration_and_login(db_session):
    """Test full registration and login workflow via router functions."""
    from backend.app.auth.router import register_user, login_user, RegisterRequest, LoginRequest
    from fastapi import HTTPException

    # 1. Register
    reg_req = RegisterRequest(
        full_name="Dance Club Secretary",
        email="dance.club@college.edu",
        password="MySecretDancePass2026!",
        role=UserRole.STUDENT_CLUB,
    )
    reg_res = register_user(reg_req, db=db_session)
    assert reg_res.access_token is not None
    assert reg_res.user.email == "dance.club@college.edu"
    assert reg_res.user.role == UserRole.STUDENT_CLUB

    # 2. Duplicate registration rejected
    with pytest.raises(HTTPException) as exc_info:
        register_user(reg_req, db=db_session)
    assert exc_info.value.status_code == 400

    # 3. Valid Login
    login_req = LoginRequest(
        email="dance.club@college.edu",
        password="MySecretDancePass2026!",
    )
    login_res = login_user(login_req, db=db_session)
    assert login_res.access_token is not None
    assert login_res.user.email == "dance.club@college.edu"

    # 4. Invalid Password Login
    bad_login = LoginRequest(
        email="dance.club@college.edu",
        password="WrongPassword123!",
    )
    with pytest.raises(HTTPException) as exc_info:
        login_user(bad_login, db=db_session)
    assert exc_info.value.status_code == 401
