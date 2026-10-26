"""FastAPI Main Application Entrypoint for THEKEDAR"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import settings
from backend.app.core.rate_limit import SecurityAndRateLimitMiddleware
from backend.app.api.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="College Resource Booking & Permission Management System API",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# 1. Security Headers & Rate Limiting Middleware
app.add_middleware(SecurityAndRateLimitMiddleware)

# 2. Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS if isinstance(settings.CORS_ALLOWED_ORIGINS, list) else [settings.CORS_ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Content-Type-Options", "X-Frame-Options", "Retry-After"],
)

# Health check route
@app.get("/health", tags=["System"])
def health_check():
    """Health status probe for hosting platforms and uptime monitors."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }

# Mount master v1 API router
app.include_router(api_router)
