"""Master API Router for THEKEDAR v1 Endpoints"""

from fastapi import APIRouter
from backend.app.auth.router import router as auth_router
from backend.app.resources.router import router as resources_router
from backend.app.bookings.router import router as bookings_router
from backend.app.approvals.router import router as approvals_router
from backend.app.documents.router import router as documents_router
from backend.app.blockchain.router import router as blockchain_router
from backend.app.audit.router import router as audit_router
from backend.app.admin.router import router as admin_router

api_router = APIRouter(prefix="/api/v1")

# Mount domain routers
api_router.include_router(auth_router)
api_router.include_router(resources_router)
api_router.include_router(bookings_router)
api_router.include_router(approvals_router)
api_router.include_router(documents_router)
api_router.include_router(blockchain_router)
api_router.include_router(audit_router)
api_router.include_router(admin_router)
