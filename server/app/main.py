"""
Main FastAPI application entry point.

Flood Resilience System - Sri Lanka
Backend API for disaster management and citizen safety.
"""
import asyncio
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.core.security_middleware import HTTPSRedirectMiddleware, SecurityAuditMiddleware
from app.api.v1.router import api_router
from app.db.session import check_db_connection, dispose_engine, init_db_extensions


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Application lifespan handler.
    
    Startup: Initialize connections (DB, Redis, etc.)
    Shutdown: Clean up resources
    """
    # Startup
    print(f"Starting {settings.app_name} v{settings.version}")
    print(f"Environment: {settings.app_env}")
    print(f"Debug mode: {settings.debug}")
    
    # Initialize core infra dependencies
    db_ok = False
    for _ in range(10):
        db_ok = await check_db_connection()
        if db_ok:
            break
        await asyncio.sleep(1)

    if not db_ok:
        # In development, log warning but continue; in production, fail
        if settings.is_production:
            raise RuntimeError("Database connection failed during startup")
        else:
            print("WARNING: Database connection failed during startup - continuing in dev mode")

    try:
        await init_db_extensions()
    except Exception as e:
        print(f"Warning: Database extension initialization failed: {e}")
        print("Continuing startup without extensions...")
    
    yield
    
    # Shutdown
    print("Shutting down application...")
    await dispose_engine()


def create_application() -> FastAPI:
    """
    Application factory.
    
    Creates and configures the FastAPI application instance.
    """
    app = FastAPI(
        title=settings.app_name,
        description="""
## Flood Resilience System API

A comprehensive disaster management platform for Sri Lanka, providing:

### Features
- **Real-time Weather Data**: Current conditions, forecasts, radar imagery
- **Flood Predictions**: AI-powered risk assessment and predictions
- **Citizen Reports**: Crowdsourced incident reporting and verification
- **Emergency Alerts**: Multi-channel broadcast system (SMS, Push, Email)
- **Shelter Management**: Evacuation shelter locations and capacity tracking
- **GIS Integration**: District-level risk zones and mapping

### Authentication
Most endpoints support both authenticated and public access.
Protected endpoints require a Bearer token in the Authorization header.

### Rate Limiting
- Auth endpoints: configurable via RATE_LIMIT_AUTH_REQUESTS_PER_MINUTE
- Chat endpoints: configurable via RATE_LIMIT_CHAT_REQUESTS_PER_MINUTE
- Report creation endpoints: configurable via RATE_LIMIT_REPORT_REQUESTS_PER_MINUTE
        """,
        version=settings.version,
        openapi_url=f"{settings.api_v1_prefix}/openapi.json" if settings.debug else None,
        docs_url=f"{settings.api_v1_prefix}/docs" if settings.debug else None,
        redoc_url=f"{settings.api_v1_prefix}/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # Add security middleware
    # HTTPS redirect must be first (outermost)
    if settings.is_production:
        app.add_middleware(HTTPSRedirectMiddleware)
    app.add_middleware(SecurityAuditMiddleware)
    
    # Configure CORS
    # Allow frontend to call backend APIs and subscribe to SSE
    # In development: allows localhost:5173 to call localhost:8000
    # In production: configure CORS_ORIGINS env var with actual frontend domain
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Total-Count", "X-Page", "X-Page-Size"],
        max_age=3600,  # Cache CORS preflight for 1 hour
    )
    
    # Add GZip compression for responses > 1KB
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    @app.middleware("http")
    async def security_headers_middleware(request: Request, call_next):
        """Set secure response headers for all API responses."""
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "0"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "connect-src 'self' http: https: ws: wss:; "
            "font-src 'self' data:; "
            "object-src 'none'; "
            "frame-ancestors 'none'; "
            "base-uri 'self';"
        )
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response
    
    # Custom exception handlers
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """Handle Pydantic validation errors with cleaner output."""
        errors = []
        for error in exc.errors():
            field = ".".join(str(loc) for loc in error["loc"])
            errors.append({
                "field": field,
                "message": error["msg"],
                "type": error["type"],
            })
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Validation error",
                "errors": errors,
            },
        )
    
    @app.exception_handler(Exception)
    async def global_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """Catch-all exception handler for unhandled errors."""
        # In production, log to error monitoring service
        if settings.debug:
            import traceback
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "detail": str(exc),
                    "traceback": traceback.format_exc(),
                },
            )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"},
        )
    
    # Include API router
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    
    # Health check endpoint (outside versioned API)
    @app.get("/health", tags=["Health"])
    async def health_check() -> dict[str, object]:
        """
        Health check endpoint for load balancers and monitoring.
        
        Returns basic application status and version info.
        """
        db_ok = await check_db_connection()
        return {
            "status": "healthy" if db_ok else "degraded",
            "version": settings.version,
            "environment": settings.app_env,
            "database": "connected" if db_ok else "disconnected",
        }
    
    @app.get("/health/live", tags=["Health"])
    async def health_live() -> dict[str, str]:
        """Liveness probe — returns 200 if the process is running."""
        return {"status": "alive"}
    
    @app.get("/health/ready", tags=["Health"])
    async def health_ready() -> dict[str, object]:
        """Readiness probe — checks DB connection for production readiness."""
        db_ok = await check_db_connection()
        if not db_ok:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"status": "not_ready", "database": "disconnected"},
            )
        return {"status": "ready", "database": "connected"}
    
    @app.get("/health/db", tags=["Health"])
    async def health_db() -> dict[str, object]:
        """Database health check with connection details."""
        db_ok = await check_db_connection()
        return {
            "connected": db_ok,
            "pool_size": settings.database_pool_size,
            "max_overflow": settings.database_max_overflow,
        }
    
    @app.get("/", tags=["Root"])
    async def root() -> dict[str, object]:
        """Root endpoint with API information."""
        return {
            "name": settings.app_name,
            "version": settings.version,
            "docs_url": f"{settings.api_v1_prefix}/docs" if settings.debug else None,
            "health_url": "/health",
        }
    
    return app


# Create application instance
app = create_application()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info",
    )
