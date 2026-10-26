"""Role-Based Access Control (RBAC) and Department Authorization Dependencies"""

from typing import Callable, List
from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.auth.jwt import get_current_user
from backend.app.database.session import get_db
from backend.app.database.models import User, UserRole, DepartmentRequest, Event


def require_role(*allowed_roles: UserRole) -> Callable[[User], User]:
    """Dependency factory restricting route access to specified user roles."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {[r.value for r in allowed_roles]}, user has: {current_user.role.value}",
            )
        return current_user

    return role_checker


def check_department_authority(
    department_id: int,
    current_user: User,
) -> bool:
    """Helper verifying if user has authority rights over a given department."""
    if current_user.role == UserRole.ADMIN:
        return True
    if current_user.role == UserRole.AUTHORITY and current_user.department_id == department_id:
        return True
    return False


def require_department_authority(
    department_id: int,
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency verifying that user is an authority for the target department."""
    if not check_department_authority(department_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. You do not hold authority for department ID {department_id}.",
        )
    return current_user
