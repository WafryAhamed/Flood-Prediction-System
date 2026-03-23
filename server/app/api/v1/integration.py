"""
Integration API endpoints consumed by the frontend orchestration layer.
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Literal, cast
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.alerts import EmergencyContact
from app.models.audit import SystemSetting
from app.services.integration_state import integration_state_service
from app.core.config import settings
from app.core.rate_limit import limiter

router = APIRouter(prefix="/integration", tags=["Integration"])


class BootstrapResponse(BaseModel):
    adminControl: dict[str, Any]
    maintenance: dict[str, Any]
    reports: list[dict[str, Any]]


class ReportCreateRequest(BaseModel):
    severity_level: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    description: str = Field(default="", max_length=2000)
    location_name: str = Field(default="Unknown", max_length=255)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    media_url: str | None = None


class ReportActionRequest(BaseModel):
    action: Literal["verify", "reject", "dispatch", "resolve"]


class WeatherPayload(BaseModel):
    temperature: float
    windSpeed: float
    rainfall: float
    weatherCode: int
    time: str


class WeatherResponse(BaseModel):
    weather: WeatherPayload
    radarTileUrl: str | None
    riskLevel: Literal["CRITICAL", "HIGH", "MODERATE", "LOW"]


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatKnowledgeItem(BaseModel):
    category: str
    keywords: list[str] = Field(default_factory=list)
    response: str


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatHistoryItem] = []
    knowledge: list[ChatKnowledgeItem] = []


class ChatResponse(BaseModel):
    reply: str
    source: Literal["ai", "fallback"]
    model: str


class IntegrationEmergencyContact(BaseModel):
    id: str
    label: str
    number: str
    type: Literal["police", "ambulance", "fire", "disaster", "custom"]
    active: bool


class IntegrationEmergencyContactCreateRequest(BaseModel):
    label: str = Field(min_length=1, max_length=255)
    number: str = Field(min_length=1, max_length=50)
    type: Literal["police", "ambulance", "fire", "disaster", "custom"] = "custom"
    active: bool = True


class IntegrationEmergencyContactUpdateRequest(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=255)
    number: str | None = Field(default=None, min_length=1, max_length=50)
    type: Literal["police", "ambulance", "fire", "disaster", "custom"] | None = None
    active: bool | None = None


class IntegrationMapMarker(BaseModel):
    id: str
    label: str
    markerType: Literal["shelter", "hospital", "report", "infrastructure"]
    position: tuple[float, float]
    detail: str
    visible: bool


class IntegrationMapMarkerCreateRequest(BaseModel):
    label: str = Field(min_length=1, max_length=255)
    markerType: Literal["shelter", "hospital", "report", "infrastructure"]
    position: tuple[float, float]
    detail: str = Field(default="", max_length=500)
    visible: bool = True


class IntegrationMapMarkerUpdateRequest(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=255)
    markerType: Literal["shelter", "hospital", "report", "infrastructure"] | None = None
    position: tuple[float, float] | None = None
    detail: str | None = Field(default=None, max_length=500)
    visible: bool | None = None


def _positions_equal(left: list[Any] | tuple[Any, ...], right: list[Any] | tuple[Any, ...]) -> bool:
    if len(left) != 2 or len(right) != 2:
        return False
    try:
        return float(left[0]) == float(right[0]) and float(left[1]) == float(right[1])
    except Exception:
        return False


MAP_MARKERS_SETTING_KEY = "maintenance.mapMarkers"


def _normalize_emergency_contact_type(value: Any) -> Literal["police", "ambulance", "fire", "disaster", "custom"]:
    allowed = {"police", "ambulance", "fire", "disaster", "custom"}
    candidate = str(value or "custom").strip().lower()
    normalized = candidate if candidate in allowed else "custom"
    return normalized  # pyright: ignore[reportReturnType]


def _map_emergency_contact_row(row: EmergencyContact) -> IntegrationEmergencyContact:
    return IntegrationEmergencyContact(
        id=str(row.id),
        label=row.name,
        number=row.phone,
        type=_normalize_emergency_contact_type(row.category),
        active=bool(row.is_active),
    )


async def _fetch_emergency_contacts(db: AsyncSession) -> list[IntegrationEmergencyContact]:
    result = await db.execute(
        select(EmergencyContact).order_by(
            EmergencyContact.display_order.asc(),
            EmergencyContact.created_at.asc(),
        )
    )
    return [_map_emergency_contact_row(row) for row in result.scalars().all()]


async def _get_map_markers(db: AsyncSession) -> list[dict[str, Any]]:
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == MAP_MARKERS_SETTING_KEY)
    )
    setting = result.scalar_one_or_none()
    if setting is None:
        return []

    try:
        markers = json.loads(setting.value)
        if isinstance(markers, list):
            marker_items = cast(list[Any], markers)
            parsed = [cast(dict[str, Any], item) for item in marker_items if isinstance(item, dict)]
            return parsed
    except Exception:
        return []

    return []


async def _save_map_markers(db: AsyncSession, markers: list[dict[str, Any]]) -> None:
    payload = json.dumps(markers, ensure_ascii=False)
    result = await db.execute(
        select(SystemSetting).where(SystemSetting.key == MAP_MARKERS_SETTING_KEY)
    )
    setting = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)
    if setting is None:
        setting = SystemSetting(
            key=MAP_MARKERS_SETTING_KEY,
            value=payload,
            value_type="json",
            category="integration",
            is_sensitive=False,
            last_modified_at=now,
        )
        db.add(setting)
    else:
        setting.value = payload
        setting.value_type = "json"
        setting.category = "integration"
        setting.last_modified_at = now


@router.get("/bootstrap", response_model=BootstrapResponse)
async def get_bootstrap_state() -> BootstrapResponse:
    snapshot = await integration_state_service.get_bootstrap()
    return BootstrapResponse.model_validate(snapshot)


@router.put("/admin-control", response_model=dict)
async def save_admin_control(state: dict[str, Any]) -> dict[str, Any]:
    return await integration_state_service.set_admin_control(state)


@router.put("/maintenance", response_model=dict)
async def save_maintenance(state: dict[str, Any]) -> dict[str, Any]:
    return await integration_state_service.set_maintenance(state)


@router.get("/emergency-contacts", response_model=list[IntegrationEmergencyContact])
async def list_integration_emergency_contacts(
    db: AsyncSession = Depends(get_db),
) -> list[IntegrationEmergencyContact]:
    return await _fetch_emergency_contacts(db)


@router.post(
    "/emergency-contacts",
    response_model=IntegrationEmergencyContact,
    status_code=status.HTTP_201_CREATED,
)
async def create_integration_emergency_contact(
    payload: IntegrationEmergencyContactCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> IntegrationEmergencyContact:
    normalized_type = _normalize_emergency_contact_type(payload.type)
    duplicate_result = await db.execute(
        select(EmergencyContact).where(
            EmergencyContact.name == payload.label,
            EmergencyContact.phone == payload.number,
            EmergencyContact.category == normalized_type,
            EmergencyContact.is_active.is_(True),
        )
    )
    if duplicate_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Emergency contact already exists",
        )

    max_order_result = await db.execute(select(func.max(EmergencyContact.display_order)))
    max_order = max_order_result.scalar_one_or_none()
    next_order = (int(max_order) + 1) if max_order is not None else 0

    contact = EmergencyContact(
        name=payload.label,
        category=normalized_type,
        phone=payload.number,
        is_active=payload.active,
        display_order=next_order,
        is_featured=False,
    )
    db.add(contact)
    await db.commit()
    await db.refresh(contact)

    contacts = await _fetch_emergency_contacts(db)
    await integration_state_service.publish_event(
        "maintenance.updated",
        {"emergencyContacts": [item.model_dump() for item in contacts]},
    )
    return _map_emergency_contact_row(contact)


@router.patch("/emergency-contacts/{contact_id}", response_model=IntegrationEmergencyContact)
async def update_integration_emergency_contact(
    contact_id: UUID,
    payload: IntegrationEmergencyContactUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> IntegrationEmergencyContact:
    result = await db.execute(select(EmergencyContact).where(EmergencyContact.id == contact_id))
    contact = result.scalar_one_or_none()
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency contact not found")

    updates = payload.model_dump(exclude_unset=True)
    if "label" in updates:
        contact.name = str(updates["label"])
    if "number" in updates:
        contact.phone = str(updates["number"])
    if "type" in updates:
        contact.category = _normalize_emergency_contact_type(updates["type"])
    if "active" in updates:
        contact.is_active = bool(updates["active"])

    await db.commit()
    await db.refresh(contact)

    contacts = await _fetch_emergency_contacts(db)
    await integration_state_service.publish_event(
        "maintenance.updated",
        {"emergencyContacts": [item.model_dump() for item in contacts]},
    )
    return _map_emergency_contact_row(contact)


@router.delete("/emergency-contacts/{contact_id}", response_model=dict)
async def delete_integration_emergency_contact(
    contact_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    result = await db.execute(select(EmergencyContact).where(EmergencyContact.id == contact_id))
    contact = result.scalar_one_or_none()
    if contact is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency contact not found")

    await db.delete(contact)
    await db.commit()

    contacts = await _fetch_emergency_contacts(db)
    await integration_state_service.publish_event(
        "maintenance.updated",
        {"emergencyContacts": [item.model_dump() for item in contacts]},
    )
    return {"success": True}


@router.get("/map-markers", response_model=list[IntegrationMapMarker])
async def list_integration_map_markers(
    db: AsyncSession = Depends(get_db),
) -> list[IntegrationMapMarker]:
    markers = await _get_map_markers(db)
    return [IntegrationMapMarker.model_validate(marker) for marker in markers]


@router.post("/map-markers", response_model=IntegrationMapMarker, status_code=status.HTTP_201_CREATED)
async def create_integration_map_marker(
    payload: IntegrationMapMarkerCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> IntegrationMapMarker:
    markers = await _get_map_markers(db)
    if not (-90 <= payload.position[0] <= 90 and -180 <= payload.position[1] <= 180):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid marker coordinates")

    duplicate = next(
        (
            item
            for item in markers
            if str(item.get("label")) == payload.label
            and str(item.get("markerType")) == payload.markerType
            and _positions_equal(cast(list[Any] | tuple[Any, ...], item.get("position", [])), payload.position)
        ),
        None,
    )
    if duplicate is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Map marker already exists")

    payload_data = payload.model_dump()
    marker: dict[str, Any] = {
        "id": f"mm-{uuid4().hex[:8]}",
        **payload_data,
        # CRITICAL FIX #3: Use payload.position directly instead of reconstructing
        # Ensures consistent data type (list in JSON) for all markers
    }
    markers.append(marker)
    await _save_map_markers(db, markers)
    await db.commit()

    await integration_state_service.publish_event("maintenance.updated", {"mapMarkers": markers})
    return IntegrationMapMarker.model_validate(marker)


@router.patch("/map-markers/{marker_id}", response_model=IntegrationMapMarker)
async def update_integration_map_marker(
    marker_id: str,
    payload: IntegrationMapMarkerUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> IntegrationMapMarker:
    markers = await _get_map_markers(db)
    marker_index = next((idx for idx, item in enumerate(markers) if str(item.get("id")) == marker_id), -1)
    if marker_index < 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Map marker not found")

    marker = dict(markers[marker_index])
    updates = payload.model_dump(exclude_unset=True)
    marker.update(updates)
    if payload.position is not None:
        if not (-90 <= payload.position[0] <= 90 and -180 <= payload.position[1] <= 180):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid marker coordinates")
        # CRITICAL FIX #3: Use payload.position directly (list from Pydantic model_dump)
        # Ensures consistent serialization instead of reconstructing
        marker["position"] = payload.position

    markers[marker_index] = marker
    await _save_map_markers(db, markers)
    await db.commit()

    await integration_state_service.publish_event("maintenance.updated", {"mapMarkers": markers})
    return IntegrationMapMarker.model_validate(marker)


@router.delete("/map-markers/{marker_id}", response_model=dict)
async def delete_integration_map_marker(
    marker_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    markers = await _get_map_markers(db)
    updated = [item for item in markers if str(item.get("id")) != marker_id]
    if len(updated) == len(markers):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Map marker not found")

    await _save_map_markers(db, updated)
    await db.commit()
    await integration_state_service.publish_event("maintenance.updated", {"mapMarkers": updated})
    return {"success": True}


@router.post("/reports", response_model=dict, status_code=status.HTTP_201_CREATED)
@limiter.limit(f"{settings.rate_limit_report_requests_per_minute}/minute")
async def create_report(request: Request, payload: ReportCreateRequest) -> dict[str, Any]:
    return await integration_state_service.create_report(payload.model_dump())


@router.post("/reports/{report_id}/action", response_model=dict)
async def apply_report_action(report_id: str, payload: ReportActionRequest) -> dict[str, Any]:
    updated = await integration_state_service.apply_report_action(report_id, payload.action)
    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    return updated


@router.get("/weather/current", response_model=WeatherResponse)
async def get_weather_snapshot(
    lat: float = Query(...),
    lon: float = Query(...),
) -> WeatherResponse:
    weather = await integration_state_service.get_weather_snapshot(lat, lon)
    return WeatherResponse.model_validate(weather)


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(f"{settings.rate_limit_chat_requests_per_minute}/minute")
async def chat(request: Request, payload: ChatRequest) -> ChatResponse:
    result = await integration_state_service.chat(
        message=payload.message,
        history=[item.model_dump() for item in payload.history],
        knowledge=[item.model_dump() for item in payload.knowledge],
    )
    return ChatResponse.model_validate(result)


@router.get("/events")
async def stream_events(request: Request) -> StreamingResponse:
    queue = await integration_state_service.subscribe()

    async def event_stream():
        try:
            while True:
                if await request.is_disconnected():
                    break

                try:
                    envelope = await asyncio.wait_for(queue.get(), timeout=20.0)
                except asyncio.TimeoutError:
                    envelope: dict[str, Any] = {
                        "event": "keepalive",
                        "payload": {},
                        "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000),
                    }

                data = json.dumps(envelope, ensure_ascii=False)
                yield f"data: {data}\n\n"
        finally:
            await integration_state_service.unsubscribe(queue)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
