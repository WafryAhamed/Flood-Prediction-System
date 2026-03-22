"""
Authentication API routes.
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import (
    get_current_user,
    get_client_ip,
    get_user_agent,
    CurrentUser,
    AdminUser,
)
from app.services.auth_service import AuthService
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    TokenResponse,
    TokenRefreshRequest,
    UserRegisterRequest,
    UserResponse,
    UserUpdateRequest,
    ChangePasswordRequest,
)
from app.schemas.base import MessageResponse
from app.core.config import settings
from app.core.rate_limit import limiter


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(f"{settings.rate_limit_auth_requests_per_minute}/minute")
async def register(
    request: Request,
    data: UserRegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new user account."""
    auth_service = AuthService(db)
    
    # Check if email already exists
    existing_user = await auth_service.get_user_by_email(data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    
    user = await auth_service.create_user(data)
    return user


@router.post("/login", response_model=LoginResponse)
@limiter.limit(f"{settings.rate_limit_auth_requests_per_minute}/minute")
async def login(
    data: LoginRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Authenticate and get access tokens."""
    auth_service = AuthService(db)
    
    user = await auth_service.authenticate_user(data.email, data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    
    # Create tokens
    tokens = await auth_service.create_tokens(user)
    
    # Create admin session for admin users
    admin_roles = {"super_admin", "admin", "moderator", "operator", "analyst"}
    user_role_names = {role.name for role in user.roles}
    if user_role_names & admin_roles:  # Check if any user role intersects with admin_roles
        ip_address = await get_client_ip(request)
        user_agent = await get_user_agent(request)
        await auth_service.create_admin_session(user, ip_address, user_agent)
    
    return LoginResponse(user=UserResponse.model_validate(user), tokens=tokens)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
async def refresh_token(
    request: Request,
    data: TokenRefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Refresh access token using refresh token."""
    auth_service = AuthService(db)
    
    tokens = await auth_service.refresh_tokens(data.refresh_token)
    if tokens is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    return tokens


@router.post("/logout", response_model=MessageResponse)
@limiter.limit("30/minute")
async def logout(
    request: Request,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Logout and revoke all refresh tokens."""
    auth_service = AuthService(db)
    
    revoked_count = await auth_service.revoke_all_user_tokens(current_user.id)
    
    return MessageResponse(
        message=f"Logged out successfully. {revoked_count} token(s) revoked.",
        success=True,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: CurrentUser):
    """Get the current user's profile."""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user_profile(
    data: UserUpdateRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update the current user's profile."""
    auth_service = AuthService(db)
    
    updated_user = await auth_service.update_user(current_user, data)
    return updated_user


@router.post("/me/change-password", response_model=MessageResponse)
@limiter.limit(f"{settings.rate_limit_auth_requests_per_minute}/minute")
async def change_password(
    request: Request,
    data: ChangePasswordRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Change the current user's password."""
    auth_service = AuthService(db)
    
    success = await auth_service.change_password(
        current_user,
        data.current_password,
        data.new_password,
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    
    # Revoke all existing tokens to force re-login
    await auth_service.revoke_all_user_tokens(current_user.id)
    
    return MessageResponse(
        message="Password changed successfully. Please login again.",
        success=True,
    )
