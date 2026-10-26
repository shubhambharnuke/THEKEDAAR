"""Authentication & Authorization Test Suite"""

import pytest
import httpx
from jose import jwt

from backend.app.main import app
from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.database.models import User, UserRole


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.asyncio
async def test_health_check():
    """Verify system health check endpoint."""
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "THEKEDAR"


@pytest.mark.asyncio
async def test_auth_me_unauthorized():
    """Verify endpoint rejects requests with no credentials."""
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/auth/me")
        assert response.status_code == 401
        assert "Authorization token required" in response.json()["detail"]


@pytest.mark.asyncio
async def test_auth_me_with_mocked_user():
    """Verify authenticated user profile retrieval with valid token."""
    mock_user = User(
        id=1,
        email="test.user@college.edu",
        full_name="Test Student Organizer",
        role=UserRole.STUDENT_CLUB,
        is_active=True,
    )

    payload = {"sub": mock_user.email, "email": mock_user.email}
    token = jwt.encode(payload, settings.BETTER_AUTH_SECRET, algorithm="HS256")

    class MockSession:
        def scalar(self, stmt):
            return mock_user

    app.dependency_overrides[get_db] = lambda: MockSession()

    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get(
                "/api/v1/auth/me",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == mock_user.email
            assert data["role"] == "STUDENT_CLUB"
            assert data["full_name"] == mock_user.full_name
    finally:
        app.dependency_overrides.clear()
