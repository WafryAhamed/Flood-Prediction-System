"""
Integration API endpoints consumed by the frontend orchestration layer.
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.services.integration_state import integration_state_service

router = APIRouter(prefix="/integration", tags=["Integration"])


class BootstrapResponse(BaseModel):
    adminControl: dict[str, Any]
    maintenance: dict[str, Any]
    reports: list[dict[str, Any]]


class ReportCreateRequest(BaseModel):
    severity_level: Literal["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    description: str = Field(default="")
    location_name: str = Field(default="Unknown")
    latitude: float
    longitude: float
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
    message: str
    history: list[ChatHistoryItem] = Field(default_factory=list)
    knowledge: list[ChatKnowledgeItem] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    source: Literal["ai", "fallback"]
    model: str


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


@router.post("/reports", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_report(payload: ReportCreateRequest) -> dict[str, Any]:
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
async def chat(payload: ChatRequest) -> ChatResponse:
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
