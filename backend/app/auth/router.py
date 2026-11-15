"""Authentication Router: Registration, Login, Profile, and Session Details"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.auth.jwt import get_current_user
from backend.app.auth.security import get_password_hash, verify_password, create_access_token
from backend.app.database.session import get_db
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


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: Optional[UserRole] = UserRole.STUDENT_CLUB
    department_id: Optional[int] = None
    club_name: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse


@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    """Register a new user account with secure password hashing and return an access token."""
    email_clean = payload.email.strip().lower()
    if not email_clean or not payload.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required",
        )

    existing = db.scalar(select(User).where(User.email == email_clean))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists",
        )

    # Only assign requested role if not ADMIN (admin creation is restricted)
    role = payload.role or UserRole.STUDENT_CLUB
    if role == UserRole.ADMIN:
        role = UserRole.STUDENT_CLUB

    dept_id = None
    if role == UserRole.AUTHORITY and payload.department_id:
        dept_id = payload.department_id

    display_name = payload.full_name.strip()
    if role == UserRole.STUDENT_CLUB and payload.club_name:
        display_name = f"{display_name} ({payload.club_name.strip()})"

    hashed_pw = get_password_hash(payload.password)
    user = User(
        email=email_clean,
        full_name=display_name,
        role=role,
        department_id=dept_id,
        password_hash=hashed_pw,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        data={"sub": user.email, "email": user.email, "role": user.role.value, "user_id": user.id}
    )
    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfileResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthTokenResponse)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    """Authenticate with email and password and return a signed JWT access token."""
    email_clean = payload.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email_clean))

    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    token = create_access_token(
        data={"sub": user.email, "email": user.email, "role": user.role.value, "user_id": user.id}
    )
    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserProfileResponse.model_validate(user),
    )


@router.post("/logout")
def logout() -> dict:
    """Acknowledge user logout."""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user)) -> User:
    """Retrieve profile and role information for the currently authenticated user."""
    return current_user
