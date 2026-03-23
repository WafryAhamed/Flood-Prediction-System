"""
Authentication and authorization schemas.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from uuid import UUID
import re

from app.schemas.base import BaseSchema, TimestampSchema, IDSchema
from app.models.auth import UserRole, UserStatus
from app.core.password_policy import validate_password as validate_pwd_policy


# ============================================================================
# Token Schemas
# ============================================================================

class TokenResponse(BaseSchema):
    """JWT token response."""
    
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class TokenRefreshRequest(BaseSchema):
    """Token refresh request."""
    
    refresh_token: str


class TokenPayload(BaseSchema):
    """JWT token payload."""
    
    sub: str  # User ID
    email: str
    role: str
    exp: int
    iat: int
    jti: str  # Token ID


# ============================================================================
# Login Schemas
# ============================================================================

class LoginRequest(BaseSchema):
    """User login request."""
    
    email: EmailStr
    password: str = Field(min_length=1)
    remember_me: bool = False


class LoginResponse(BaseSchema):
    """Login response with user info and tokens."""
    
    user: "UserResponse"
    tokens: TokenResponse


# ============================================================================
# Registration Schemas
# ============================================================================

class UserRegisterRequest(BaseSchema):
    """User registration request."""
    
    email: EmailStr
    password: str = Field(min_length=12, max_length=128, description="Strong password required: 12+ chars, 1+ uppercase, 1+ lowercase, 1+ digit, 1+ special char (@$!%*?&)")
    full_name: str = Field(min_length=1, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    preferred_language: str = Field(default="en", pattern="^(en|si|ta)$")
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str, info) -> str:
        """Validate password meets security requirements."""
        email = info.data.get("email", "")
        is_valid, error_msg = validate_pwd_policy(v, email)
        if not is_valid:
            raise ValueError(error_msg)
        return v


class AdminCreateUserRequest(BaseSchema):
    """Admin user creation request."""
    
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    phone: Optional[str] = None
    role: UserRole = UserRole.CITIZEN
    is_verified: bool = False


# ============================================================================
# User Response Schemas
# ============================================================================

class UserBase(BaseSchema):
    """Base user schema."""
    
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    preferred_language: str = "en"


class UserResponse(UserBase, IDSchema):
    """User response schema."""
    
    public_id: str
    role: Optional[UserRole] = None
    status: UserStatus
    is_verified: bool
    trust_score: float
    avatar_url: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime
    
    @model_validator(mode='before')
    @classmethod
    def extract_role_from_orm(cls, data):
        """Extract first role from ORM roles relationship."""
        # If this is an ORM object, convert it to a dict with role extracted from roles
        if not isinstance(data, dict) and hasattr(data, 'roles'):
            roles = getattr(data, 'roles', [])
            first_role_name = roles[0].name if roles else None
            # Convert ORM to dict
            return {
                'id': str(data.id),
                'email': data.email,
                'full_name': data.full_name,
                'phone': data.phone,
                'public_id': data.public_id,
                'role': first_role_name,
                'status': data.status,
                'is_verified': data.is_verified,
                'trust_score': data.trust_score,
                'avatar_url': getattr(data, 'avatar_url', None),
                'last_login_at': data.last_login_at,
                'created_at': data.created_at,
                'preferred_language': getattr(data, 'preferred_language', 'en'),
            }
        return data


class UserDetailResponse(UserResponse):
    """Detailed user response for admin."""
    
    is_mfa_enabled: bool
    last_active_at: Optional[datetime] = None
    updated_at: datetime


class UserListResponse(BaseSchema):
    """List of users response."""
    
    users: List[UserResponse]
    total: int
    page: int
    page_size: int


# ============================================================================
# User Update Schemas
# ============================================================================

class UserUpdateRequest(BaseSchema):
    """User profile update request."""
    
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    preferred_language: Optional[str] = Field(default=None, pattern="^(en|si|ta)$")
    avatar_url: Optional[str] = None


class AdminUpdateUserRequest(BaseSchema):
    """Admin user update request."""
    
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None
    is_verified: Optional[bool] = None
    trust_score: Optional[float] = Field(default=None, ge=0, le=1)


class ChangePasswordRequest(BaseSchema):
    """Password change request."""
    
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
    
    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit")
        return v


class ResetPasswordRequest(BaseSchema):
    """Password reset request."""
    
    email: EmailStr


class ResetPasswordConfirmRequest(BaseSchema):
    """Password reset confirmation."""
    
    token: str
    new_password: str = Field(min_length=8, max_length=128)


# ============================================================================
# Role and Permission Schemas
# ============================================================================

class PermissionResponse(IDSchema):
    """Permission response."""
    
    name: str
    description: Optional[str] = None


class RoleResponse(IDSchema):
    """Role response."""
    
    name: str
    description: Optional[str] = None
    permissions: List[PermissionResponse] = []


class RoleCreateRequest(BaseSchema):
    """Role creation request."""
    
    name: str = Field(min_length=1, max_length=100)
    description: Optional[str] = None
    permission_ids: List[UUID] = []


# ============================================================================
# Session Schemas
# ============================================================================

class SessionResponse(IDSchema):
    """Admin session response."""
    
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    is_active: bool
    last_activity_at: datetime
    created_at: datetime
    expires_at: datetime


# Forward references
LoginResponse.model_rebuild()
