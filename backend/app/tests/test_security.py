"""Tests for API Security Headers, CORS, and Rate Limiting"""

from backend.app.core.rate_limit import SlidingWindowRateLimiter


def test_rate_limiter_allows_under_limit():
    """Verify that requests under the threshold are permitted."""
    limiter = SlidingWindowRateLimiter(requests_per_minute=5)
    ip = "127.0.0.1"
    for _ in range(5):
        allowed, retry_after = limiter.is_allowed(ip)
        assert allowed is True
        assert retry_after == 0


def test_rate_limiter_blocks_over_limit():
    """Verify that exceeding requests per minute triggers rate limiting."""
    limiter = SlidingWindowRateLimiter(requests_per_minute=2)
    ip = "127.0.0.2"
    assert limiter.is_allowed(ip)[0] is True
    assert limiter.is_allowed(ip)[0] is True
    allowed, retry_after = limiter.is_allowed(ip)
    assert allowed is False
    assert retry_after > 0



