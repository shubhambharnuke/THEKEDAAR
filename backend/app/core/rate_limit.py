"""Sliding Window Rate Limiter for Sensitive Institutional Endpoints"""

import time
from collections import defaultdict
from typing import Dict, List, Tuple
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class SlidingWindowRateLimiter:
    def __init__(self, requests_per_minute: int = 60):
        self.rpm = requests_per_minute
        # Maps client IP -> list of timestamps
        self.history: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_ip: str) -> Tuple[bool, int]:
        now = time.time()
        window_start = now - 60.0

        # Filter out timestamps older than 60 seconds
        valid_timestamps = [t for t in self.history[client_ip] if t > window_start]
        self.history[client_ip] = valid_timestamps

        if len(valid_timestamps) >= self.rpm:
            retry_after = int(60 - (now - valid_timestamps[0])) + 1
            return False, max(1, retry_after)

        self.history[client_ip].append(now)
        return True, 0


# Global limiter instances
verify_rate_limiter = SlidingWindowRateLimiter(requests_per_minute=30)
auth_rate_limiter = SlidingWindowRateLimiter(requests_per_minute=20)


class SecurityAndRateLimitMiddleware:
    """Pure ASGI middleware for sliding window rate-limiting and security headers."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        method = scope.get("method", "GET")
        client = scope.get("client")
        client_ip = client[0] if client else "unknown"

        if "/api/v1/documents/verify" in path:
            allowed, retry_after = verify_rate_limiter.is_allowed(client_ip)
            if not allowed:
                response = JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Rate limit exceeded for document verification. Please retry after some time.",
                        "retry_after_seconds": retry_after,
                    },
                    headers={"Retry-After": str(retry_after)},
                )
                await response(scope, receive, send)
                return
        elif "/api/v1/auth" in path and method == "POST":
            allowed, retry_after = auth_rate_limiter.is_allowed(client_ip)
            if not allowed:
                response = JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Rate limit exceeded for authentication requests.",
                        "retry_after_seconds": retry_after,
                    },
                    headers={"Retry-After": str(retry_after)},
                )
                await response(scope, receive, send)
                return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"x-content-type-options", b"nosniff"))
                headers.append((b"x-frame-options", b"DENY"))
                headers.append((b"x-xss-protection", b"1; mode=block"))
                headers.append((b"referrer-policy", b"strict-origin-when-cross-origin"))
                headers.append((b"permissions-policy", b"camera=(), microphone=(), geolocation=()"))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)
