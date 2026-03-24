"""Admin control models for Page Visibility and System Settings."""
import uuid
from sqlalchemy import String, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class PageVisibility(BaseModel):
    """Controls mapping of which pages are visible to end users."""
    __tablename__ = "page_visibility"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    page_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class SystemSettingsConfig(BaseModel):
    """System-wide behavior and user preferences."""
    __tablename__ = "system_settings_config"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    dark_mode: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sound_alerts: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    push_notifications: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    data_collection: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    anonymous_reporting: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
