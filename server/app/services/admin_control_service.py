"""
Unified admin control service.

Manages all admin-level configurations:
- Emergency contacts
- Map markers
- Page visibility
- System settings
- Dashboard overrides
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Literal, Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alerts import EmergencyContact
from app.models.audit import SystemSetting


class ResourceNotFoundError(Exception):
    """Resource not found error."""
    pass


class DuplicateResourceError(Exception):
    """Duplicate resource error."""
    pass


class AdminControlService:
    """Service for admin control operations."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    # ═══════════════════════════════════════════════════════════════════
    # EMERGENCY CONTACTS MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════
    
    async def list_emergency_contacts(self) -> list[dict[str, Any]]:
        """List all emergency contacts ordered by display priority."""
        result = await self.db.execute(
            select(EmergencyContact).order_by(
                EmergencyContact.display_order.asc(),
                EmergencyContact.created_at.asc(),
            )
        )
        contacts = result.scalars().all()
        return [self._map_contact_row(contact) for contact in contacts]
    
    async def get_emergency_contact(self, contact_id: UUID) -> dict[str, Any]:
        """Get single emergency contact by ID."""
        result = await self.db.execute(
            select(EmergencyContact).where(EmergencyContact.id == contact_id)
        )
        contact = result.scalar_one_or_none()
        if not contact:
            raise ResourceNotFoundError(f"Emergency contact {contact_id} not found")
        return self._map_contact_row(contact)
    
    async def create_emergency_contact(
        self,
        label: str,
        phone: str,
        contact_type: Literal["police", "ambulance", "fire", "disaster", "custom"] = "custom",
        active: bool = True,
    ) -> dict[str, Any]:
        """Create new emergency contact."""
        result = await self.db.execute(
            select(EmergencyContact).where(
                EmergencyContact.name == label,
                EmergencyContact.phone == phone,
                EmergencyContact.is_active.is_(True),
            )
        )
        if result.scalar_one_or_none():
            raise DuplicateResourceError("Emergency contact already exists")
        
        order_result = await self.db.execute(select(func.max(EmergencyContact.display_order)))
        max_order = order_result.scalar_one_or_none()
        next_order = (int(max_order) + 1) if max_order is not None else 0
        
        contact = EmergencyContact(
            name=label,
            category=contact_type,
            phone=phone,
            is_active=active,
            display_order=next_order,
            is_featured=False,
        )
        self.db.add(contact)
        await self.db.commit()
        await self.db.refresh(contact)
        return self._map_contact_row(contact)
    
    async def update_emergency_contact(
        self,
        contact_id: UUID,
        label: str | None = None,
        phone: str | None = None,
        contact_type: Literal["police", "ambulance", "fire", "disaster", "custom"] | None = None,
        active: bool | None = None,
    ) -> dict[str, Any]:
        """Update emergency contact."""
        result = await self.db.execute(
            select(EmergencyContact).where(EmergencyContact.id == contact_id)
        )
        contact = result.scalar_one_or_none()
        if not contact:
            raise ResourceNotFoundError(f"Emergency contact {contact_id} not found")
        
        if label is not None:
            contact.name = label
        if phone is not None:
            contact.phone = phone
        if contact_type is not None:
            contact.category = contact_type
        if active is not None:
            contact.is_active = active
        
        await self.db.commit()
        await self.db.refresh(contact)
        return self._map_contact_row(contact)
    
    async def delete_emergency_contact(self, contact_id: UUID) -> bool:
        """Delete emergency contact."""
        result = await self.db.execute(
            select(EmergencyContact).where(EmergencyContact.id == contact_id)
        )
        contact = result.scalar_one_or_none()
        if not contact:
            raise ResourceNotFoundError(f"Emergency contact {contact_id} not found")
        
        await self.db.delete(contact)
        await self.db.commit()
        return True
    
    # ═══════════════════════════════════════════════════════════════════
    # MAP MARKERS MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════
    
    async def list_map_markers(self) -> list[dict[str, Any]]:
        """Get all map markers from system settings."""
        markers = await self._get_markers_from_db()
        return [self._validate_marker(m) for m in markers]
    
    async def get_map_marker(self, marker_id: str) -> dict[str, Any]:
        """Get single map marker."""
        markers = await self._get_markers_from_db()
        marker = next((m for m in markers if str(m.get("id")) == marker_id), None)
        if not marker:
            raise ResourceNotFoundError(f"Map marker {marker_id} not found")
        return self._validate_marker(marker)
    
    async def create_map_marker(
        self,
        label: str,
        marker_type: Literal["shelter", "hospital", "report", "infrastructure"],
        position: tuple[float, float],
        detail: str = "",
        visible: bool = True,
    ) -> dict[str, Any]:
        """Create new map marker."""
        if not (-90 <= position[0] <= 90 and -180 <= position[1] <= 180):
            raise ValueError("Invalid marker coordinates")
        
        markers = await self._get_markers_from_db()
        
        duplicate = next(
            (
                m for m in markers
                if str(m.get("label")) == label
                and str(m.get("markerType")) == marker_type
                and self._positions_equal(
                    m.get("position"),
                    [position[0], position[1]]
                )
            ),
            None,
        )
        if duplicate:
            raise DuplicateResourceError("Map marker already exists")
        
        marker = {
            "id": f"mm-{len(markers) + 1:04d}",
            "label": label,
            "markerType": marker_type,
            "position": [position[0], position[1]],
            "detail": detail,
            "visible": visible,
        }
        markers.append(marker)
        await self._save_markers_to_db(markers)
        return self._validate_marker(marker)
    
    async def update_map_marker(
        self,
        marker_id: str,
        label: str | None = None,
        marker_type: Literal["shelter", "hospital", "report", "infrastructure"] | None = None,
        position: tuple[float, float] | None = None,
        detail: str | None = None,
        visible: bool | None = None,
    ) -> dict[str, Any]:
        """Update map marker."""
        markers = await self._get_markers_from_db()
        marker_index = next(
            (idx for idx, m in enumerate(markers) if str(m.get("id")) == marker_id),
            -1,
        )
        if marker_index < 0:
            raise ResourceNotFoundError(f"Map marker {marker_id} not found")
        
        marker = dict(markers[marker_index])
        if label is not None:
            marker["label"] = label
        if marker_type is not None:
            marker["markerType"] = marker_type
        if position is not None:
            if not (-90 <= position[0] <= 90 and -180 <= position[1] <= 180):
                raise ValueError("Invalid marker coordinates")
            marker["position"] = [position[0], position[1]]
        if detail is not None:
            marker["detail"] = detail
        if visible is not None:
            marker["visible"] = visible
        
        markers[marker_index] = marker
        await self._save_markers_to_db(markers)
        return self._validate_marker(marker)
    
    async def delete_map_marker(self, marker_id: str) -> bool:
        """Delete map marker."""
        markers = await self._get_markers_from_db()
        original_len = len(markers)
        markers = [m for m in markers if str(m.get("id")) != marker_id]
        
        if len(markers) == original_len:
            raise ResourceNotFoundError(f"Map marker {marker_id} not found")
        
        await self._save_markers_to_db(markers)
        return True
    
    # ═══════════════════════════════════════════════════════════════════
    # SYSTEM SETTINGS MANAGEMENT
    # ═══════════════════════════════════════════════════════════════════
    
    async def get_system_setting(self, key: str) -> dict[str, Any] | None:
        """Get system setting by key."""
        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == key)
        )
        setting = result.scalar_one_or_none()
        if not setting:
            return None
        
        try:
            value = json.loads(setting.value) if setting.value_type == "json" else setting.value
        except Exception:
            value = setting.value
        
        return {
            "key": setting.key,
            "value": value,
            "type": setting.value_type,
            "category": setting.category,
            "lastModified": setting.last_modified_at.isoformat() if setting.last_modified_at else None,
        }
    
    async def set_system_setting(
        self,
        key: str,
        value: Any,
        value_type: Literal["string", "integer", "boolean", "json"] = "json",
        category: str = "admin",
    ) -> dict[str, Any]:
        """Create or update system setting."""
        if value_type == "json":
            if not isinstance(value, (dict, list)):
                value = {"data": value}
            payload = json.dumps(value, ensure_ascii=False)
        else:
            payload = str(value)
        
        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == key)
        )
        setting = result.scalar_one_or_none()
        
        now = datetime.now(timezone.utc)
        if setting is None:
            setting = SystemSetting(
                key=key,
                value=payload,
                value_type=value_type,
                category=category,
                is_sensitive=False,
                last_modified_at=now,
            )
            self.db.add(setting)
        else:
            setting.value = payload
            setting.value_type = value_type
            setting.category = category
            setting.last_modified_at = now
        
        await self.db.commit()
        await self.db.refresh(setting)
        return await self.get_system_setting(key) or {}
    
    # ═══════════════════════════════════════════════════════════════════
    # PRIVATE HELPERS
    # ═══════════════════════════════════════════════════════════════════
    
    @staticmethod
    def _map_contact_row(contact: EmergencyContact) -> dict[str, Any]:
        """Map database row to API response."""
        return {
            "id": str(contact.id),
            "label": contact.name,
            "number": contact.phone,
            "type": contact.category,
            "active": bool(contact.is_active),
        }
    
    async def _get_markers_from_db(self) -> list[dict[str, Any]]:
        """Load markers from system settings."""
        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == "maintenance.mapMarkers")
        )
        setting = result.scalar_one_or_none()
        if not setting:
            return []
        
        try:
            markers = json.loads(setting.value)
            return markers if isinstance(markers, list) else []
        except Exception:
            return []
    
    async def _save_markers_to_db(self, markers: list[dict[str, Any]]) -> None:
        """Save markers to system settings."""
        payload = json.dumps(markers, ensure_ascii=False)
        result = await self.db.execute(
            select(SystemSetting).where(SystemSetting.key == "maintenance.mapMarkers")
        )
        setting = result.scalar_one_or_none()
        
        now = datetime.now(timezone.utc)
        if setting is None:
            setting = SystemSetting(
                key="maintenance.mapMarkers",
                value=payload,
                value_type="json",
                category="integration",
                is_sensitive=False,
                last_modified_at=now,
            )
            self.db.add(setting)
        else:
            setting.value = payload
            setting.last_modified_at = now
        
        await self.db.commit()
    
    @staticmethod
    def _validate_marker(marker: dict[str, Any]) -> dict[str, Any]:
        """Validate marker structure."""
        return {
            "id": str(marker.get("id", "")),
            "label": str(marker.get("label", "")),
            "markerType": str(marker.get("markerType", "shelter")),
            "position": tuple(marker.get("position", [0, 0])),
            "detail": str(marker.get("detail", "")),
            "visible": bool(marker.get("visible", True)),
        }
    
    @staticmethod
    def _positions_equal(left: Any, right: Any) -> bool:
        """Check if two positions are equal."""
        try:
            if not isinstance(left, (list, tuple)) or not isinstance(right, (list, tuple)):
                return False
            if len(left) != 2 or len(right) != 2:
                return False
            return float(left[0]) == float(right[0]) and float(left[1]) == float(right[1])
        except (ValueError, TypeError):
            return False
