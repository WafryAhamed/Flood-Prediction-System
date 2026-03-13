"""
Supplementary models for flood history, simulation scenarios, and user safety profiles.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    String, Text, Boolean, Integer, Float, DateTime, ForeignKey,
    Index, Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class FloodHistory(BaseModel):
    """Historical flood event records.

    Sourced from maintenanceStore.ts FloodHistoryEntry type.
    """
    __tablename__ = "flood_history"
    __table_args__ = (
        Index("ix_flood_history_year", "year"),
    )

    year: Mapped[int] = mapped_column(Integer, nullable=False)
    event_name: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    floods_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_rainfall_mm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    casualties: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    affected_population: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    estimated_damage_lkr: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    # Array of district codes, e.g. ["CMB", "GAL"]
    affected_district_codes: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)


class SimulationScenarioStatus(str):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SimulationScenario(BaseModel):
    """What-if simulation scenarios from the WhatIfLab page."""
    __tablename__ = "simulation_scenarios"
    __table_args__ = (
        Index("ix_simulation_scenarios_created_by", "created_by_id"),
        Index("ix_simulation_scenarios_status", "status"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    # Parameters: rainfall_mm, duration_hours, affected_zones, sea_level_rise, etc.
    parameters: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    # Results populated once simulation completes
    results: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
    model_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("model_registry.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_by: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by_id])  # type: ignore[name-defined]


class UserSafetyProfile(BaseModel):
    """Per-user safety profile from the SafetyProfile page."""
    __tablename__ = "user_safety_profiles"
    __table_args__ = (
        Index("ix_user_safety_profiles_user_id", "user_id", unique=True),
        Index("ix_user_safety_profiles_home_district", "home_district"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    household_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    has_pets: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_elderly: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_disabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_infants: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    special_needs: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    home_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    home_district: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    home_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    home_lon: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    transport_mode: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # [{name, phone, relation}]
    emergency_contacts: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    # [{item, checked}]
    emergency_kit_checklist: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    evacuation_plan: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    last_updated: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])  # type: ignore[name-defined]
