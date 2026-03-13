"""
FastAPI dependencies for authentication, authorization, and database.
"""
from typing import Optional, List, Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import validate_access_token
from app.models.auth import User, UserRole, UserStatus
from app.services.auth_service import AuthService
from app.schemas.auth import TokenPayload


# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)


async def get_current_user_optional(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Optional[User]:
    """Get the current user if authenticated, otherwise None."""
    if credentials is None:
        return None
    
    token_payload = validate_access_token(credentials.credentials)
    if token_payload is None:
        return None
    
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(UUID(token_payload.sub))
    
    if user is None or user.status != UserStatus.ACTIVE:
        return None
    
    return user


async def get_current_user(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Get the current authenticated user. Raises 401 if not authenticated."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token_payload = validate_access_token(credentials.credentials)
    if token_payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(UUID(token_payload.sub))
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not active",
        )
    
    return user


async def get_current_verified_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Get the current authenticated and verified user."""
    if not current_user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required",
        )
    return current_user


def require_roles(*roles: UserRole):
    """
    Dependency factory that requires the user to have one of the specified roles.
    
    Usage:
        @router.get("/admin")
        async def admin_endpoint(
            user: User = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))
        ):
            ...
    """
    async def role_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        user_role_names = {r.name for r in current_user.roles}
        required_role_values = {r.value for r in roles}
        if not (user_role_names & required_role_values):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {[r.value for r in roles]}",
            )
        return current_user
    
    return role_checker


# Pre-defined role dependencies
RequireAdmin = Depends(require_roles(UserRole.ADMIN, UserRole.SUPER_ADMIN))
RequireSuperAdmin = Depends(require_roles(UserRole.SUPER_ADMIN))
RequireModerator = Depends(require_roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN))
RequireOperator = Depends(require_roles(UserRole.OPERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN))
RequireAnalyst = Depends(require_roles(UserRole.ANALYST, UserRole.ADMIN, UserRole.SUPER_ADMIN))


async def get_client_ip(request: Request) -> Optional[str]:
    """Extract client IP address from request."""
    # Check for X-Forwarded-For header (proxy/load balancer)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    # Check for X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fall back to direct client IP
    if request.client:
        return request.client.host
    
    return None


async def get_user_agent(request: Request) -> Optional[str]:
    """Extract user agent from request."""
    return request.headers.get("User-Agent")


# Type aliases for cleaner code
CurrentUser = Annotated[User, Depends(get_current_user)]
CurrentUserOptional = Annotated[Optional[User], Depends(get_current_user_optional)]
CurrentVerifiedUser = Annotated[User, Depends(get_current_verified_user)]
AdminUser = Annotated[User, RequireAdmin]
SuperAdminUser = Annotated[User, RequireSuperAdmin]
ModeratorUser = Annotated[User, RequireModerator]
OperatorUser = Annotated[User, RequireOperator]
