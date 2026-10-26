"""Administrator Management Endpoints for Users, Roles, Departments, and Resources"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from backend.app.auth.rbac import require_role
from backend.app.database.session import get_db
from backend.app.database.models import User, UserRole, Department, Resource, ResourceType
from backend.app.resources.schemas import DepartmentRead, ResourceRead

router = APIRouter(prefix="/admin", tags=["Administrator Management"])


class AdminUserRead(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class AdminUserUpdateRequest(BaseModel):
    role: Optional[UserRole] = None
    department_id: Optional[int] = None
    is_active: Optional[bool] = None


class DepartmentCreateRequest(BaseModel):
    name: str
    code: str
    contact_email: str


class ResourceCreateRequest(BaseModel):
    department_id: int
    name: str
    code: str
    resource_type: ResourceType
    location: str
    capacity: int
    equipment_spec: Optional[str] = None


class ResourceUpdateRequest(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    location: Optional[str] = None
    equipment_spec: Optional[str] = None
    is_active: Optional[bool] = None


@router.get("/users", response_model=List[AdminUserRead])
def list_users(
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """List all registered users with their roles and department affiliations."""
    stmt = select(User).options(joinedload(User.department)).order_by(User.id.asc())
    if role:
        stmt = stmt.where(User.role == role)

    users = db.scalars(stmt).all()
    results = []
    for u in users:
        dept_name = u.department.name if u.department else None
        results.append(
            AdminUserRead(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                role=u.role,
                department_id=u.department_id,
                department_name=dept_name,
                is_active=u.is_active,
            )
        )
    return results


@router.patch("/users/{user_id}", response_model=AdminUserRead)
def update_user_role_or_department(
    user_id: int,
    payload: AdminUserUpdateRequest,
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Update role, department affiliation, or active status of a user."""
    user = db.scalar(select(User).options(joinedload(User.department)).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if payload.role is not None:
        user.role = payload.role
    if payload.department_id is not None:
        if payload.department_id > 0:
            dept = db.scalar(select(Department).where(Department.id == payload.department_id))
            if not dept:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Department does not exist")
            user.department_id = payload.department_id
        else:
            user.department_id = None
    if payload.is_active is not None:
        user.is_active = payload.is_active

    db.commit()
    db.refresh(user)

    dept_name = user.department.name if user.department else None
    return AdminUserRead(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        department_id=user.department_id,
        department_name=dept_name,
        is_active=user.is_active,
    )


@router.post("/departments", response_model=DepartmentRead, status_code=status.HTTP_201_CREATED)
def create_department(
    payload: DepartmentCreateRequest,
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Create a new academic or administrative department."""
    existing = db.scalar(
        select(Department).where(
            (Department.name == payload.name) | (Department.code == payload.code)
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name or code already exists",
        )

    dept = Department(
        name=payload.name,
        code=payload.code.upper(),
        contact_email=payload.contact_email,
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.post("/resources", response_model=ResourceRead, status_code=status.HTTP_201_CREATED)
def create_resource(
    payload: ResourceCreateRequest,
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Create a new bookable institutional resource under a department."""
    dept = db.scalar(select(Department).where(Department.id == payload.department_id))
    if not dept:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department does not exist",
        )

    existing = db.scalar(select(Resource).where(Resource.code == payload.code))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Resource code '{payload.code}' is already in use",
        )

    resource = Resource(
        department_id=payload.department_id,
        name=payload.name,
        code=payload.code.upper(),
        resource_type=payload.resource_type,
        location=payload.location,
        capacity=payload.capacity,
        equipment_spec=payload.equipment_spec,
        is_active=True,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.patch("/resources/{resource_id}", response_model=ResourceRead)
def update_resource(
    resource_id: int,
    payload: ResourceUpdateRequest,
    current_admin: User = Depends(require_role(UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    """Update specifications or activate/deactivate an institutional resource."""
    resource = db.scalar(select(Resource).where(Resource.id == resource_id))
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID {resource_id} not found",
        )

    if payload.name is not None:
        resource.name = payload.name
    if payload.capacity is not None:
        resource.capacity = payload.capacity
    if payload.location is not None:
        resource.location = payload.location
    if payload.equipment_spec is not None:
        resource.equipment_spec = payload.equipment_spec
    if payload.is_active is not None:
        resource.is_active = payload.is_active

    db.commit()
    db.refresh(resource)
    return resource
