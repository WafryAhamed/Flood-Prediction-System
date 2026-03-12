"""
Authentication service for user management and JWT operations.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    validate_refresh_token,
    generate_public_id,
)
from app.models.auth import User, Role, RefreshToken, AdminSession, UserRole, UserStatus
from app.schemas.auth import (
    UserRegisterRequest,
    AdminCreateUserRequest,
    UserUpdateRequest,
    AdminUpdateUserRequest,
    TokenResponse,
)


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email address."""
        result = await self.db.execute(
            select(User).where(
                and_(
                    User.email == email.lower(),
                    User.is_deleted == False,
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get a user by ID."""
        result = await self.db.execute(
            select(User).where(
                and_(
                    User.id == user_id,
                    User.is_deleted == False,
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def get_user_by_public_id(self, public_id: str) -> Optional[User]:
        """Get a user by public ID."""
        result = await self.db.execute(
            select(User).where(
                and_(
                    User.public_id == public_id,
                    User.is_deleted == False,
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user by email and password."""
        user = await self.get_user_by_email(email)
        if user is None:
            return None
        
        if not verify_password(password, user.password_hash):
            return None
        
        if user.status != UserStatus.ACTIVE:
            return None
        
        return user
    
    async def create_user(
        self,
        data: UserRegisterRequest,
        role: UserRole = UserRole.CITIZEN,
    ) -> User:
        """Create a new user."""
        user = User(
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            phone=data.phone,
            preferred_language=data.preferred_language,
            public_id=generate_public_id("USR"),
            role=role,
            status=UserStatus.ACTIVE,
            trust_score=0.5,  # Default trust score
        )
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        return user
    
    async def create_admin_user(self, data: AdminCreateUserRequest) -> User:
        """Create a new user with admin privileges."""
        user = User(
            email=data.email.lower(),
            password_hash=hash_password(data.password),
            full_name=data.full_name,
            phone=data.phone,
            public_id=generate_public_id("ADM" if data.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN] else "USR"),
            role=data.role,
            status=UserStatus.ACTIVE,
            is_verified=data.is_verified,
            trust_score=0.8 if data.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN] else 0.5,
        )
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        return user
    
    async def update_user(
        self,
        user: User,
        data: UserUpdateRequest,
    ) -> User:
        """Update a user's profile."""
        update_data = data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        await self.db.commit()
        await self.db.refresh(user)
        
        return user
    
    async def admin_update_user(
        self,
        user: User,
        data: AdminUpdateUserRequest,
    ) -> User:
        """Admin update of a user."""
        update_data = data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        await self.db.commit()
        await self.db.refresh(user)
        
        return user
    
    async def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
    ) -> bool:
        """Change a user's password."""
        if not verify_password(current_password, user.password_hash):
            return False
        
        user.password_hash = hash_password(new_password)
        await self.db.commit()
        
        return True
    
    async def create_tokens(self, user: User) -> TokenResponse:
        """Create access and refresh tokens for a user."""
        # Create access token
        access_token = create_access_token(
            subject=str(user.id),
            email=user.email,
            role=user.role.value,
        )
        
        # Create refresh token
        refresh_token, jti, expires_at = create_refresh_token(
            subject=str(user.id),
        )
        
        # Store refresh token
        token_record = RefreshToken(
            user_id=user.id,
            token_hash=hash_password(refresh_token),  # Hash for security
            jti=jti,
            expires_at=expires_at,
        )
        self.db.add(token_record)
        
        # Update user login stats
        user.last_login_at = datetime.now(timezone.utc)
        user.login_count += 1
        
        await self.db.commit()
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    
    async def refresh_tokens(self, refresh_token: str) -> Optional[TokenResponse]:
        """Refresh access token using a refresh token."""
        # Validate refresh token
        validation_result = validate_refresh_token(refresh_token)
        if validation_result is None:
            return None
        
        user_id, jti = validation_result
        
        # Find the token record
        result = await self.db.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.jti == jti,
                    RefreshToken.is_revoked == False,
                    RefreshToken.expires_at > datetime.now(timezone.utc),
                )
            )
        )
        token_record = result.scalar_one_or_none()
        
        if token_record is None:
            return None
        
        # Get the user
        user = await self.get_user_by_id(UUID(user_id))
        if user is None or user.status != UserStatus.ACTIVE:
            return None
        
        # Revoke the old refresh token
        token_record.is_revoked = True
        
        # Create new tokens
        return await self.create_tokens(user)
    
    async def revoke_refresh_token(self, jti: str) -> bool:
        """Revoke a specific refresh token."""
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.jti == jti)
        )
        token_record = result.scalar_one_or_none()
        
        if token_record is None:
            return False
        
        token_record.is_revoked = True
        await self.db.commit()
        
        return True
    
    async def revoke_all_user_tokens(self, user_id: UUID) -> int:
        """Revoke all refresh tokens for a user."""
        result = await self.db.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.user_id == user_id,
                    RefreshToken.is_revoked == False,
                )
            )
        )
        tokens = result.scalars().all()
        
        for token in tokens:
            token.is_revoked = True
        
        await self.db.commit()
        
        return len(tokens)
    
    async def create_admin_session(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AdminSession:
        """Create an admin session record."""
        session = AdminSession(
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            expires_at=datetime.now(timezone.utc) + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            ),
        )
        
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        
        return session
    
    async def soft_delete_user(self, user: User) -> None:
        """Soft delete a user."""
        user.is_deleted = True
        user.deleted_at = datetime.now(timezone.utc)
        user.status = UserStatus.INACTIVE
        
        # Revoke all tokens
        await self.revoke_all_user_tokens(user.id)
        
        await self.db.commit()


def get_auth_service(db: AsyncSession) -> AuthService:
    """Factory function for AuthService."""
    return AuthService(db)
