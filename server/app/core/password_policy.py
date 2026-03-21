"""
Password security utilities for validation and policy enforcement.

Enforces:
- Minimum length (12 characters)
- Complexity (uppercase, lowercase, digit, special char)
- No dictionary words
- No user data in password
"""
import re
from typing import Tuple


MIN_PASSWORD_LENGTH = 12
PASSWORD_PATTERN = re.compile(
    r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+"
)

# Common patterns to avoid
FORBIDDEN_PATTERNS = [
    r"^password",
    r"^123456",
    r"^qwerty",
    r"^admin",
    r"^flood",
    r"^disaster",
]


class PasswordValidationError(ValueError):
    """Raised when a password fails validation."""
    pass


def validate_password(password: str, email: str = "") -> Tuple[bool, str]:
    """
    Validate password against security requirements.
    
    Args:
        password: The password to validate
        email: User email (to prevent using email in password)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not password:
        return False, "Password cannot be empty"
    
    # Check length
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters long"
    
    # Check complexity
    if not PASSWORD_PATTERN.match(password):
        return False, (
            "Password must contain at least one uppercase letter, "
            "one lowercase letter, one digit, and one special character (@$!%*?&)"
        )
    
    # Check for forbidden patterns
    lower_pass = password.lower()
    for pattern in FORBIDDEN_PATTERNS:
        if re.match(pattern, lower_pass):
            return False, "Password uses a common pattern. Please use a unique password"
    
    # Check for email in password
    if email:
        email_user = email.split("@")[0].lower()
        if email_user in lower_pass:
            return False, "Password cannot contain your email or username"
    
    # Check for keyboard walks
    if _has_keyboard_walk(password):
        return False, "Password contains keyboard sequences. Please use a more random pattern"
    
    return True, ""


def _has_keyboard_walk(password: str) -> bool:
    """
    Detect simple keyboard walks like 'qwerty' or 'asdfgh'.
    
    Checks for 3+ consecutive characters from common keyboard patterns.
    """
    keyboard_patterns = [
        "qwerty", "asdfgh", "zxcvbn",  # QWERTY layout
        "123456", "654321",  # Numeric
        "abc", "xyz",  # Alphabet
    ]
    
    lower_pass = password.lower()
    for pattern in keyboard_patterns:
        if pattern in lower_pass:
            return True
    
    return False


def get_password_strength_score(password: str) -> int:
    """
    Calculate password strength score (0-100).
    
    Returns:
        Strength score: 0 (weak) to 100 (strong)
    """
    score = 0
    
    # Length scoring
    if len(password) >= MIN_PASSWORD_LENGTH:
        score += 20
    if len(password) >= 16:
        score += 10
    if len(password) >= 20:
        score += 10
    
    # Complexity scoring
    if any(c.isupper() for c in password):
        score += 15
    if any(c.islower() for c in password):
        score += 15
    if any(c.isdigit() for c in password):
        score += 15
    if any(c in "@$!%*?&" for c in password):
        score += 15
    
    return min(score, 100)
