"""
User management API routes (admin).
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import AdminUser, SuperAdminUser
from app.services.auth_service import AuthService
from app.models.auth import User, UserRole, Role, UserStatus
from app.schemas.auth import (
    UserResponse,
    UserListResponse,
    AdminCreateUserRequest,
    UserUpdateRequest,
    AdminUpdateUserRequest,
)
from app.schemas.base import PaginatedResponse, MessageResponse
from app.services.audit_service import audit_service
from app.models.audit import AuditAction


router = APIRouter(prefix="/users", tags=["User Management"])


@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = Query(None, description="Search by name or email"),
    role: UserRole | None = Query(None, description="Filter by role"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    is_verified: bool | None = Query(None, description="Filter by verified status"),
):
    """List all users with pagination and filtering (admin only)."""
    # Build query - exclude deleted users
    query = select(User).where(User.status != UserStatus.DELETED)
    count_query = select(func.count(User.id)).where(User.status != UserStatus.DELETED)
    
    # Apply filters
    if search:
        search_filter = or_(
            User.full_name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    if role:
        # Filter by role name through the many-to-many relationship
        query = query.join(Role).where(Role.name == role)
        count_query = count_query.join(Role).where(Role.name == role)
    
    if is_active is not None:
        # is_active maps to status: ACTIVE=True, others=False
        if is_active:
            query = query.where(User.status == UserStatus.ACTIVE)
            count_query = count_query.where(User.status == UserStatus.ACTIVE)
        else:
            query = query.where(User.status != UserStatus.ACTIVE)
            count_query = count_query.where(User.status != UserStatus.ACTIVE)
    
    if is_verified is not None:
        query = query.where(User.is_verified == is_verified)
        count_query = count_query.where(User.is_verified == is_verified)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    query = query.order_by(User.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    return PaginatedResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific user by ID (admin only)."""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    return user


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: AdminCreateUserRequest,
    _admin: SuperAdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new user (super admin only)."""
    auth_service = AuthService(db)
    
    # Check if email already exists
    existing_user = await auth_service.get_user_by_email(data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    
    user = await auth_service.create_admin_user(data)
    return user


@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    data: UserUpdateRequest,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a user's profile (admin only)."""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    updated_user = await auth_service.update_user(user, data)
    return updated_user


@router.patch("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    data: AdminUpdateUserRequest,
    _admin: SuperAdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update a user's role (super admin only)."""
    if data.role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role is required",
        )

    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent changing own role
    if user.id == _admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )
    
    # Get the role by name
    role_result = await db.execute(select(Role).where(Role.name == data.role))
    role = role_result.scalar_one_or_none()
    
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{data.role}' not found",
        )
    
    # Clear existing roles and assign new role
    user.roles.clear()
    user.roles.append(role)
    await db.commit()
    await db.refresh(user)
    
    return user


@router.post("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: UUID,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Activate a user account (admin only)."""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    user.status = UserStatus.ACTIVE
    await db.commit()
    await db.refresh(user)
    
    await audit_service.log_admin_action(
        AuditAction.UPDATE, "user", _admin,
        resource_id=str(user_id),
        description=f"Activated user: {user.email}",
        db=db,
    )
    
    return user


@router.post("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: UUID,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Deactivate a user account (admin only)."""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent deactivating own account
    if user.id == _admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )
    
    user.status = UserStatus.SUSPENDED
    await db.commit()
    await db.refresh(user)
    
    await audit_service.log_admin_action(
        AuditAction.UPDATE, "user", _admin,
        resource_id=str(user_id),
        description=f"Suspended user: {user.email}",
        db=db,
    )
    
    return user


@router.post("/{user_id}/verify", response_model=UserResponse)
async def verify_user(
    user_id: UUID,
    _admin: AdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Mark a user as verified (admin only)."""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    user.is_verified = True
    await db.commit()
    await db.refresh(user)
    
    return user


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: UUID,
    _admin: SuperAdminUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Soft delete a user account (super admin only)."""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Prevent deleting own account
    if user.id == _admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )
    
    await auth_service.soft_delete_user(user)
    
    await audit_service.log_admin_action(
        AuditAction.DELETE, "user", _admin,
        resource_id=str(user_id),
        description=f"Deleted user: {user.email}",
        db=db,
    )
    
    return MessageResponse(
        message=f"User {user.email} has been deleted",
        success=True,
    )
