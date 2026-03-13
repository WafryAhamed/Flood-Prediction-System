"""
Main FastAPI application entry point.

Flood Resilience System - Sri Lanka
Backend API for disaster management and citizen safety.
"""
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.core.config import settings
from app.api.v1.router import api_router


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
    
    # In production, you would initialize:
    # - Database connection pool
    # - Redis connection
    # - Celery worker connections
    # - Background task schedulers
    
    yield
    
    # Shutdown
    print("Shutting down application...")
    # Clean up resources here


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
- Public endpoints: 100 requests/minute
- Authenticated endpoints: 500 requests/minute
- Admin endpoints: 1000 requests/minute
        """,
        version=settings.version,
        openapi_url=f"{settings.api_v1_prefix}/openapi.json" if settings.debug else None,
        docs_url=f"{settings.api_v1_prefix}/docs" if settings.debug else None,
        redoc_url=f"{settings.api_v1_prefix}/redoc" if settings.debug else None,
        lifespan=lifespan,
    )
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Total-Count", "X-Page", "X-Page-Size"],
    )
    
    # Add GZip compression for responses > 1KB
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
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
    async def health_check() -> dict:
        """
        Health check endpoint for load balancers and monitoring.
        
        Returns basic application status and version info.
        """
        return {
            "status": "healthy",
            "version": settings.version,
            "environment": settings.app_env,
        }
    
    @app.get("/", tags=["Root"])
    async def root() -> dict:
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
