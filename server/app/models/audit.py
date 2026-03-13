"""
Audit, governance, and system operation models.
"""
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    String, Text, Boolean, Integer, DateTime, ForeignKey,
    Index, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import Mapped, mapped_column
import enum

from app.models.base import BaseModel


class AuditAction(str, enum.Enum):
    """Audit log action types."""
    CREATE = "create"
    READ = "read"
    UPDATE = "update"
    DELETE = "delete"
    LOGIN = "login"
    LOGOUT = "logout"
    EXPORT = "export"
    IMPORT = "import"
    APPROVE = "approve"
    REJECT = "reject"
    BROADCAST = "broadcast"


class SystemEventType(str, enum.Enum):
    """System event types."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class JobStatus(str, enum.Enum):
    """Background job status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class AuditLog(BaseModel):
    """Comprehensive audit trail."""
    
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_user_id", "user_id"),
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_resource_type", "resource_type"),
        Index("ix_audit_logs_resource_id", "resource_id"),
        Index("ix_audit_logs_performed_at", "performed_at"),
        Index("ix_audit_logs_ip_address", "ip_address"),
    )

    # Actor
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Denormalized for persistence
    
    # Action
    action: Mapped[AuditAction] = mapped_column(
        SQLEnum(AuditAction, name="audit_action"),
        nullable=False,
    )
    
    # Resource
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)  # E.g., "broadcast", "report", "user"
    resource_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Details
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    old_values: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    new_values: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Request context
    ip_address: Mapped[Optional[str]] = mapped_column(INET, nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    request_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    request_method: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    
    # Timing
    performed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    
    # Additional metadata
    metadata_json: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)


class SystemEvent(BaseModel):
    """System-level events and logs."""
    
    __tablename__ = "system_events"
    __table_args__ = (
        Index("ix_system_events_event_type", "event_type"),
        Index("ix_system_events_component", "component"),
        Index("ix_system_events_occurred_at", "occurred_at"),
    )

    event_type: Mapped[SystemEventType] = mapped_column(
        SQLEnum(SystemEventType, name="system_event_type"),
        nullable=False,
    )
    
    component: Mapped[str] = mapped_column(String(100), nullable=False)  # E.g., "weather_ingestion", "celery", "api"
    
    message: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Error details
    error_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    stack_trace: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Context
    context: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Timing
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    
    # Resolution
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class DataUploadJob(BaseModel):
    """Data upload/import job tracking."""
    
    __tablename__ = "data_upload_jobs"
    __table_args__ = (
        Index("ix_data_upload_jobs_status", "status"),
        Index("ix_data_upload_jobs_upload_type", "upload_type"),
        Index("ix_data_upload_jobs_created_at", "created_at"),
    )

    upload_type: Mapped[str] = mapped_column(String(100), nullable=False)  # districts, shelters, weather, etc.
    
    # File info
    file_name: Mapped[str] = mapped_column(String(500), nullable=False)
    file_path: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Status
    status: Mapped[JobStatus] = mapped_column(
        SQLEnum(JobStatus, name="job_status"),
        default=JobStatus.PENDING,
        nullable=False,
    )
    
    # Progress
    total_records: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    processed_records: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    success_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Error handling
    error_messages: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    
    # User
    uploaded_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )


class DataExportJob(BaseModel):
    """Data export job tracking."""
    
    __tablename__ = "data_export_jobs"
    __table_args__ = (
        Index("ix_data_export_jobs_status", "status"),
        Index("ix_data_export_jobs_export_type", "export_type"),
        Index("ix_data_export_jobs_created_at", "created_at"),
    )

    export_type: Mapped[str] = mapped_column(String(100), nullable=False)  # reports, analytics, districts, etc.
    
    # Export format
    format: Mapped[str] = mapped_column(String(20), nullable=False)  # csv, json, xlsx, pdf
    
    # Status
    status: Mapped[JobStatus] = mapped_column(
        SQLEnum(JobStatus, name="job_status"),
        default=JobStatus.PENDING,
        nullable=False,
    )
    
    # Output file
    file_name: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Filters applied
    filters: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Record count
    record_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # User
    requested_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )


class ScheduledTask(BaseModel):
    """Scheduled task definitions."""
    
    __tablename__ = "scheduled_tasks"
    __table_args__ = (
        Index("ix_scheduled_tasks_task_name", "task_name"),
        Index("ix_scheduled_tasks_is_active", "is_active"),
    )

    task_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Schedule (cron expression or interval)
    cron_expression: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    interval_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Task details
    task_function: Mapped[str] = mapped_column(String(255), nullable=False)  # Celery task path
    task_args: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    task_kwargs: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    
    # Execution tracking
    last_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_run_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Statistics
    run_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    success_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failure_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class SystemSetting(BaseModel):
    """Dynamic system settings stored in database."""
    
    __tablename__ = "system_settings"
    __table_args__ = (
        Index("ix_system_settings_key", "key"),
        Index("ix_system_settings_category", "category"),
    )

    key: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    value_type: Mapped[str] = mapped_column(String(50), nullable=False)  # string, int, float, bool, json
    
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # general, security, notifications, etc.
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Change tracking
    last_modified_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    last_modified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False,
    )
    
    # Sensitive flag (mask in logs)
    is_sensitive: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class MaintenanceWindow(BaseModel):
    """Planned maintenance windows."""
    
    __tablename__ = "maintenance_windows"
    __table_args__ = (
        Index("ix_maintenance_windows_start_time", "start_time"),
        Index("ix_maintenance_windows_end_time", "end_time"),
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timing
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    
    # Scope
    affected_services: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)  # List of affected service names
    
    # Notification
    notification_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # User
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
