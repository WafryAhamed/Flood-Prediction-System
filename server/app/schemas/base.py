"""
Base Pydantic schemas and utilities.
"""
from datetime import datetime
from typing import Optional, Generic, TypeVar, List
from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID


# Generic type for pagination
T = TypeVar("T")


class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        use_enum_values=True,
    )


class TimestampSchema(BaseSchema):
    """Schema with timestamp fields."""
    
    created_at: datetime
    updated_at: datetime


class IDSchema(BaseSchema):
    """Schema with UUID id."""
    
    id: UUID


class PaginatedResponse(BaseSchema, Generic[T]):
    """Generic paginated response schema."""
    
    items: List[T]
    total: int
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total_pages: int
    has_next: bool
    has_prev: bool


class MessageResponse(BaseSchema):
    """Simple message response."""
    
    message: str
    success: bool = True


class ErrorResponse(BaseSchema):
    """Error response schema."""
    
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None


class HealthCheckResponse(BaseSchema):
    """Health check response."""
    
    status: str
    version: str
    timestamp: datetime
    database: bool
    redis: bool
    celery: bool


class GeoPointSchema(BaseSchema):
    """Geographic point schema."""
    
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class DateRangeFilter(BaseSchema):
    """Date range filter schema."""
    
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class SortParams(BaseSchema):
    """Sorting parameters."""
    
    sort_by: Optional[str] = None
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")
