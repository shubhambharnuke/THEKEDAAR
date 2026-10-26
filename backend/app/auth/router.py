"""Authentication Router: Profile and Session Details"""

from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict

from backend.app.auth.jwt import get_current_user
from backend.app.database.models import User, UserRole

router = APIRouter(prefix="/auth", tags=["Authentication"])


class UserProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    department_id: Optional[int] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user)) -> User:
    """Retrieve profile and role information for the currently authenticated user."""
    return current_user
