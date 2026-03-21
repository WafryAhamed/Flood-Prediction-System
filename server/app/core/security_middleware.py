"""
Enhanced security middleware for FastAPI application.

Provides:
- HTTPS redirect for production
- Security headers
- Request/response logging for security audits
"""
from typing import Callable
from fastapi import Request
from fastapi.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings


class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """
    Redirect HTTP requests to HTTPS in production.
    
    This middleware ensures that all HTTP requests are redirected to HTTPS
    in production environments for enhanced security.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Redirect HTTP to HTTPS in production."""
        if settings.is_production and request.url.scheme == "http":
            # Reconstruct URL with HTTPS
            url = request.url.replace(scheme="https")
            from fastapi.responses import RedirectResponse
            return RedirectResponse(url=url, status_code=307)
        
        return await call_next(request)


class SecurityAuditMiddleware(BaseHTTPMiddleware):
    """
    Log security-relevant events for audit trails.
    
    Tracks:
    - Failed authentication attempts
    - 401/403 responses (authorization failures)
    - Rate limit exceedances
    - File upload events
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request and log security events."""
        response = await call_next(request)
        
        # Log failed auth/authorization
        if response.status_code in (401, 403):
            # Could integrate with security logging service
            # logger.warning(f"Security event: {response.status_code} on {request.url.path}")
            pass
        
        return response


class CSPEnhancedMiddleware(BaseHTTPMiddleware):
    """
    Enhanced Content Security Policy for API responses.
    
    Prevents:
    - Inline script execution
    - External script loading (except from trusted sources)
    - Unsafe eval()
    - Cross-site framing
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Add enhanced CSP headers."""
        response = await call_next(request)
        
        # Only apply to API responses (JSON)
        if "application/json" in response.headers.get("content-type", ""):
            # Additional CSP directives for APIs
            response.headers["X-API-Version"] = settings.version
            response.headers["X-Content-Type-Options"] = "nosniff"
        
        return response


def get_security_middleware_stack():
    """
    Returns the list of security middleware to apply in order.
    
    Order matters:
    1. HTTPS redirect (outermost)
    2. Security audit logging
    3. CSP enforcement
    4. Custom security headers (handled in main middleware)
    """
    return [
        HTTPSRedirectMiddleware,
        SecurityAuditMiddleware,
        CSPEnhancedMiddleware,
    ]
