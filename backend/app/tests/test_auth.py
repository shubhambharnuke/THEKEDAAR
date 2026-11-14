"""Authentication & Authorization Test Suite"""

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from backend.app.main import health_check
from backend.app.auth.security import create_access_token
from backend.app.auth.jwt import get_current_user
from backend.app.database.models import User, UserRole


def test_health_check():
    """Verify system health check endpoint."""
    data = health_check()
    assert data["status"] == "healthy"
    assert data["service"] == "THEKEDAR"


def test_auth_me_unauthorized():
    """Verify get_current_user rejects requests with no credentials."""
    class MockSession:
        pass

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=None, db=MockSession())
    assert exc_info.value.status_code == 401
    assert "Authorization token required" in str(exc_info.value.detail)


def test_auth_me_with_mocked_user():
    """Verify authenticated user profile retrieval with valid token."""
    mock_user = User(
        id=1,
        email="test.user@college.edu",
        full_name="Test Student Organizer",
        role=UserRole.STUDENT_CLUB,
        is_active=True,
    )

    token = create_access_token(
        data={"sub": mock_user.email, "email": mock_user.email, "role": mock_user.role.value}
    )

    class MockSession:
        def scalar(self, stmt):
            return mock_user

    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
    resolved_user = get_current_user(credentials=creds, db=MockSession())
    assert resolved_user.email == mock_user.email
    assert resolved_user.role == UserRole.STUDENT_CLUB
    assert resolved_user.full_name == mock_user.full_name


