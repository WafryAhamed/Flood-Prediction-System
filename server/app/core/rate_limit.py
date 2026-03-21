"""
Rate limiting configuration for API endpoints.
Lightweight in-memory rate limiter as alternative to slowapi.
"""
from datetime import datetime, timedelta
from functools import wraps
from typing import Callable, Dict
from fastapi import HTTPException, status, Request
import asyncio

from app.core.config import settings

# In-memory store for rate limits: {key: [(timestamp, count)]}
_rate_limit_store: Dict[str, list] = {}


def get_remote_address(request: Request) -> str:
    """Extract client IP address from request."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return request.client.host if request.client else "unknown"


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, enabled: bool = True):
        self.enabled = enabled
    
    def limit(self, rate: str) -> Callable:
        """
        Decorator to rate limit a function.
        Rate format: "N/minute" or "N/second"
        
        Example:
            @limiter.limit("5/minute")
            async def my_endpoint():
                ...
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def async_wrapper(*args, **kwargs):
                # If rate limiting is disabled, just call the function
                if not self.enabled:
                    return await func(*args, **kwargs)
                
                # Extract limit parameters
                parts = rate.split("/")
                limit_count = int(parts[0])
                limit_period = parts[1] if len(parts) > 1 else "minute"
                
                # Get request object from kwargs (it should be there for FastAPI endpoints)
                request = None
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
                if not request:
                    request = kwargs.get("request")
                
                if not request:
                    # If no request found, just call the function
                    return await func(*args, **kwargs)
                
                # Get client identifier
                client_id = get_remote_address(request)
                key = f"{func.__module__}.{func.__name__}:{client_id}"
                
                # Check rate limit
                now = datetime.utcnow()
                
                # Convert period to seconds
                if limit_period == "second":
                    window_seconds = 1
                elif limit_period == "minute":
                    window_seconds = 60
                elif limit_period == "hour":
                    window_seconds = 3600
                else:
                    window_seconds = 60
                
                # Clean up old entries and count requests in current window
                if key in _rate_limit_store:
                    cutoff = now - timedelta(seconds=window_seconds)
                    _rate_limit_store[key] = [
                        (ts, count) for ts, count in _rate_limit_store[key]
                        if ts > cutoff
                    ]
                    
                    # Sum up all requests in the window
                    current_count = sum(count for _, count in _rate_limit_store[key])
                    
                    if current_count >= limit_count:
                        raise HTTPException(
                            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            detail=f"Rate limit exceeded: {limit_count}/{limit_period}",
                            headers={"Retry-After": str(window_seconds)},
                        )
                    
                    # Increment the count for the current second
                    _rate_limit_store[key].append((now, 1))
                else:
                    # First request in the window
                    _rate_limit_store[key] = [(now, 1)]
                
                # Call the original function
                return await func(*args, **kwargs)
            
            # Also create sync wrapper in case it's not async
            @wraps(func)
            def sync_wrapper(*args, **kwargs):
                if not self.enabled:
                    return func(*args, **kwargs)
                
                # Similar logic for sync function
                parts = rate.split("/")
                limit_count = int(parts[0])
                limit_period = parts[1] if len(parts) > 1 else "minute"
                
                request = None
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
                if not request:
                    request = kwargs.get("request")
                
                if not request:
                    return func(*args, **kwargs)
                
                client_id = get_remote_address(request)
                key = f"{func.__module__}.{func.__name__}:{client_id}"
                now = datetime.utcnow()
                
                if limit_period == "second":
                    window_seconds = 1
                elif limit_period == "minute":
                    window_seconds = 60
                elif limit_period == "hour":
                    window_seconds = 3600
                else:
                    window_seconds = 60
                
                if key in _rate_limit_store:
                    cutoff = now - timedelta(seconds=window_seconds)
                    _rate_limit_store[key] = [
                        (ts, count) for ts, count in _rate_limit_store[key]
                        if ts > cutoff
                    ]
                    current_count = sum(count for _, count in _rate_limit_store[key])
                    
                    if current_count >= limit_count:
                        raise HTTPException(
                            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                            detail=f"Rate limit exceeded: {limit_count}/{limit_period}",
                            headers={"Retry-After": str(window_seconds)},
                        )
                    
                    _rate_limit_store[key].append((now, 1))
                else:
                    _rate_limit_store[key] = [(now, 1)]
                
                return func(*args, **kwargs)
            
            # Return async wrapper if function is async, else sync
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            else:
                return sync_wrapper
        
        return decorator


# Global limiter instance
limiter = RateLimiter(enabled=settings.rate_limit_enabled)
