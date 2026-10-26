"""Tests for API Security Headers, CORS, and Rate Limiting"""

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_security_headers_present():
    """Verify that institutional security headers are injected on all responses."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


def test_cors_headers_on_allowed_origin():
    """Verify that requests with allowed origin receive appropriate CORS headers."""
    response = client.options(
        "/api/v1/departments",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
