"""
Security utilities for password hashing and JWT handling.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import uuid
import hashlib
import bcrypt
from jose import jwt, JWTError
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.auth import TokenPayload


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def hash_token(token: str) -> str:
    """Hash a token using SHA256 (handles long tokens like refresh tokens)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_token_hash(token: str, stored_hash: str) -> bool:
    """Verify a token against its SHA256 hash."""
    return hash_token(token) == stored_hash


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def create_access_token(
    subject: str,
    email: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "sub": subject,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
        "type": "access",
    }
    
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
) -> tuple[str, str, datetime]:
    """
    Create a JWT refresh token.
    Returns: (token, jti, expires_at)
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    jti = str(uuid.uuid4())
    
    to_encode = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
        "jti": jti,
        "type": "refresh",
    }
    
    token = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    
    return token, jti, expire


def decode_token(token: str) -> Optional[dict[str, Any]]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError:
        return None


def validate_access_token(token: str) -> Optional[TokenPayload]:
    """Validate an access token and return its payload."""
    payload = decode_token(token)
    if payload is None:
        return None
    
    if payload.get("type") != "access":
        return None
    
    try:
        return TokenPayload(
            sub=payload["sub"],
            email=payload["email"],
            role=payload["role"],
            exp=payload["exp"],
            iat=payload["iat"],
            jti=payload["jti"],
        )
    except (KeyError, ValidationError):
        return None


def validate_refresh_token(token: str) -> Optional[tuple[str, str]]:
    """
    Validate a refresh token.
    Returns: (user_id, jti) or None
    """
    payload = decode_token(token)
    if payload is None:
        return None
    
    if payload.get("type") != "refresh":
        return None
    
    try:
        return payload["sub"], payload["jti"]
    except KeyError:
        return None


def generate_public_id(prefix: str = "USR") -> str:
    """Generate a unique public-facing ID."""
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


def generate_report_id() -> str:
    """Generate a unique report ID."""
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"RPT-{timestamp}-{uuid.uuid4().hex[:6].upper()}"
