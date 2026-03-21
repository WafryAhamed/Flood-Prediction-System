"""
Input sanitization utilities for preventing XSS and HTML injection attacks.
"""

import bleach
from typing import Optional


# No HTML tags are allowed - all content is plaintext
ALLOWED_TAGS: list[str] = []
ALLOWED_ATTRIBUTES: dict[str, list[str]] = {}


def sanitize_text(value: Optional[str]) -> str:
    """
    Sanitize user input text by stripping HTML tags and attributes.
    
    Uses bleach library to remove potentially dangerous HTML while preserving
    the text content. This prevents stored XSS attacks when user-provided text
    is rendered in admin consoles or public pages.
    
    Args:
        value: Raw text input from user
        
    Returns:
        Cleaned text with all HTML/script tags removed
    """
    if value is None or value == "":
        return ""
    
    # Clean HTML tags and scripts
    cleaned = bleach.clean(
        value,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True,
    )
    
    # Remove excess whitespace
    return cleaned.strip()
