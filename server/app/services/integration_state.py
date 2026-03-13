"""
Integration state service for frontend orchestration endpoints.

Provides:
- Shared in-memory + DB-persisted snapshot state (admin control, maintenance, reports)
- Report lifecycle updates backed by citizen_reports table
- Realtime event fan-out for SSE clients
- Weather snapshot proxy
- Chat proxy with provider + fallback handling
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Any, Literal, cast
from uuid import uuid4

import httpx
from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.core.config import settings
from app.db.session import async_session_factory

JsonDict = dict[str, Any]

REPORT_STATUS_BY_ACTION: dict[str, str] = {
    "verify": "verified",
    "reject": "rejected",
    "dispatch": "response_dispatched",
    "resolve": "resolved",
}

SYSTEM_PROMPT = (
    "You are the Flood Safety Assistant for Sri Lanka. "
    "Answer only flood safety, rainfall, evacuation, shelters, and emergency response topics. "
    "Maximum 3 concise sentences. If unrelated, reply exactly: "
    '"I can only assist with flood safety and emergency information in Sri Lanka."'
)

DEFAULT_FALLBACK_REPLY = (
    "Move to higher ground if water is rising, avoid flooded roads, and follow local authority advisories. "
    "For urgent help call 112 or the Disaster Management Centre at 117."
)


class IntegrationStateService:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._loaded = False
        self._state: JsonDict = self._default_state()
        self._subscribers: set[asyncio.Queue[JsonDict]] = set()

    @staticmethod
    def _default_state() -> JsonDict:
        return {
            "adminControl": {},
            "maintenance": {},
            "reports": [],
        }

    @staticmethod
    def _now_ms() -> int:
        return int(datetime.now(timezone.utc).timestamp() * 1000)

    @staticmethod
    def _deepcopy_json(value: Any) -> Any:
        return json.loads(json.dumps(value))

    @staticmethod
    def _as_dict(value: Any) -> JsonDict:
        if isinstance(value, dict):
            return cast(JsonDict, value)
        return {}

    @classmethod
    def _as_list_of_dict(cls, value: Any) -> list[JsonDict]:
        if not isinstance(value, list):
            return []

        result: list[JsonDict] = []
        for item in cast(list[Any], value):
            if isinstance(item, dict):
                result.append(cast(JsonDict, item))
        return result

    async def _ensure_loaded(self) -> None:
        if self._loaded:
            return

        async with self._lock:
            if self._loaded:
                return
            try:
                from app.models.audit import SystemSetting  # lazy import avoids circular
                from app.models.reports import CitizenReport, ReportStatus, UrgencyLevel

                async with async_session_factory() as session:
                    # Load adminControl and maintenance from system_settings
                    result = await session.execute(
                        select(SystemSetting).where(
                            SystemSetting.category == "integration",
                            SystemSetting.key.in_(["adminControl", "maintenance"]),
                        )
                    )
                    for row in result.scalars():
                        try:
                            self._state[row.key] = json.loads(row.value)
                        except Exception:
                            pass

                    # Load recent reports from citizen_reports
                    rpt_result = await session.execute(
                        select(CitizenReport)
                        .order_by(CitizenReport.submitted_at.desc())
                        .limit(300)
                    )
                    self._state["reports"] = [
                        self._db_report_to_integration(r)
                        for r in rpt_result.scalars().all()
                    ]
            except Exception:
                # DB not ready or first boot — start with empty state
                self._state = self._default_state()

            self._loaded = True

    async def _persist_setting(self, key: str, value: JsonDict) -> None:
        """Upsert a setting row in system_settings."""
        try:
            from app.models.audit import SystemSetting  # lazy import

            async with async_session_factory() as session:
                stmt = pg_insert(SystemSetting.__table__).values(
                    key=key,
                    value=json.dumps(value, ensure_ascii=False),
                    value_type="json",
                    category="integration",
                    last_modified_at=datetime.now(timezone.utc),
                ).on_conflict_do_update(
                    index_elements=["key"],
                    set_={
                        "value": json.dumps(value, ensure_ascii=False),
                        "last_modified_at": datetime.now(timezone.utc),
                    },
                )
                await session.execute(stmt)
                await session.commit()
        except Exception:
            pass  # non-fatal — in-memory state still updated

    async def _publish(self, event_name: str, payload: Any) -> None:
        envelope: JsonDict = {
            "event": event_name,
            "payload": payload,
            "timestamp": self._now_ms(),
        }

        async with self._lock:
            subscribers = list(self._subscribers)

        stale: list[asyncio.Queue[JsonDict]] = []
        for queue in subscribers:
            if queue.full():
                try:
                    queue.get_nowait()
                except Exception:
                    pass
            try:
                queue.put_nowait(envelope)
            except Exception:
                stale.append(queue)

        if stale:
            async with self._lock:
                for queue in stale:
                    self._subscribers.discard(queue)

    @staticmethod
    def _db_report_to_integration(r: Any) -> JsonDict:
        """Convert a CitizenReport ORM object to the integration layer dict format."""
        from app.models.reports import ReportStatus
        status_map = {
            ReportStatus.PENDING: "pending",
            ReportStatus.VERIFIED: "verified",
            ReportStatus.REJECTED: "rejected",
            ReportStatus.DISPATCHED: "response_dispatched",
            ReportStatus.RESOLVED: "resolved",
        }
        admin_verification: JsonDict | None = None
        if r.verified_at:
            admin_verification = {
                "verified_by": str(r.moderator_id or "SYSTEM_ADMIN"),
                "verified_time": int(r.verified_at.timestamp() * 1000),
                "response_team_status": "on_site" if r.dispatched_at else "none",
            }
        ts = r.submitted_at
        timestamp_ms = int(ts.timestamp() * 1000) if ts else IntegrationStateService._now_ms()
        return {
            "report_id": r.public_id,
            "user_id": str(r.reporter_id or "#anon"),
            "trust_score": int(r.ai_verification_score * 100) if r.ai_verification_score else 75,
            "severity_level": (r.urgency.value if hasattr(r.urgency, "value") else str(r.urgency)).upper(),
            "description": r.description or "",
            "location_name": r.location_description or "",
            "latitude": float(r.latitude or 7.0),
            "longitude": float(r.longitude or 80.0),
            "timestamp": timestamp_ms,
            "media_url": None,
            "status": status_map.get(r.status, str(r.status)),
            "admin_verification": admin_verification,
            "emergency_response_status": r.dispatch_notes or "",
        }

    async def subscribe(self) -> asyncio.Queue[JsonDict]:
        await self._ensure_loaded()
        queue: asyncio.Queue[JsonDict] = asyncio.Queue(maxsize=32)
        async with self._lock:
            self._subscribers.add(queue)
        queue.put_nowait({
            "event": "connected",
            "payload": {"ok": True},
            "timestamp": self._now_ms(),
        })
        return queue

    async def unsubscribe(self, queue: asyncio.Queue[JsonDict]) -> None:
        async with self._lock:
            self._subscribers.discard(queue)

    async def get_bootstrap(self) -> JsonDict:
        await self._ensure_loaded()
        async with self._lock:
            return self._deepcopy_json(self._state)

    async def set_admin_control(self, payload: JsonDict) -> JsonDict:
        await self._ensure_loaded()
        async with self._lock:
            self._state["adminControl"] = payload

        await self._persist_setting("adminControl", payload)
        await self._publish("adminControl.updated", payload)
        return payload

    async def set_maintenance(self, payload: JsonDict) -> JsonDict:
        await self._ensure_loaded()
        async with self._lock:
            self._state["maintenance"] = payload

        await self._persist_setting("maintenance", payload)
        await self._publish("maintenance.updated", payload)
        return payload

    def _normalize_report_payload(self, payload: JsonDict) -> JsonDict:
        severity = str(payload.get("severity_level", "MEDIUM")).upper()
        if severity not in {"CRITICAL", "HIGH", "MEDIUM", "LOW"}:
            severity = "MEDIUM"

        return {
            "report_id": f"RPT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid4().hex[:6].upper()}",
            "user_id": str(payload.get("user_id") or f"#{str(uuid4().int)[-4:]}"),
            "trust_score": int(payload.get("trust_score") or 75),
            "severity_level": severity,
            "description": str(payload.get("description") or ""),
            "location_name": str(payload.get("location_name") or "Unknown"),
            "latitude": float(payload.get("latitude") or settings.default_latitude),
            "longitude": float(payload.get("longitude") or settings.default_longitude),
            "timestamp": int(payload.get("timestamp") or self._now_ms()),
            "media_url": payload.get("media_url"),
            "status": "pending",
            "admin_verification": None,
            "emergency_response_status": "",
        }

    async def create_report(self, payload: JsonDict) -> JsonDict:
        await self._ensure_loaded()
        report = self._normalize_report_payload(payload)

        # Persist to citizen_reports table
        try:
            from app.models.reports import CitizenReport, ReportType, ReportStatus, UrgencyLevel

            severity = str(report.get("severity_level", "MEDIUM")).upper()
            urgency_map = {"CRITICAL": UrgencyLevel.CRITICAL, "HIGH": UrgencyLevel.HIGH, "MEDIUM": UrgencyLevel.MEDIUM, "LOW": UrgencyLevel.LOW}
            urgency = urgency_map.get(severity, UrgencyLevel.MEDIUM)

            async with async_session_factory() as session:
                db_report = CitizenReport(
                    public_id=str(report["report_id"]),
                    report_type=ReportType.FLOOD,
                    status=ReportStatus.PENDING,
                    urgency=urgency,
                    urgency_score=int(report.get("trust_score") or 50),
                    title=str(report.get("description") or "Flood report")[:499] or "Flood report",
                    description=str(report.get("description") or ""),
                    latitude=float(report.get("latitude") or 7.0),
                    longitude=float(report.get("longitude") or 80.0),
                    location_description=str(report.get("location_name") or ""),
                    is_anonymous=True,
                    submitted_at=datetime.fromtimestamp(
                        int(report.get("timestamp") or self._now_ms()) / 1000, tz=timezone.utc
                    ),
                )
                session.add(db_report)
                await session.commit()
        except Exception:
            pass  # fall through to in-memory update

        async with self._lock:
            reports = self._as_list_of_dict(self._state.get("reports"))
            reports.insert(0, report)
            self._state["reports"] = reports[:300]

        await self._publish("report.created", report)
        return report

    async def apply_report_action(self, report_id: str, action: Literal["verify", "reject", "dispatch", "resolve"]) -> JsonDict | None:
        await self._ensure_loaded()
        status = REPORT_STATUS_BY_ACTION.get(action)
        if not status:
            return None

        updated: JsonDict | None = None

        async with self._lock:
            reports = self._as_list_of_dict(self._state.get("reports"))
            for idx, report in enumerate(reports):
                report_data = self._as_dict(report)
                if str(report_data.get("report_id")) != report_id:
                    continue

                next_report: JsonDict = {**report_data, "status": status}
                if action == "verify":
                    next_report["admin_verification"] = {
                        "verified_by": "SYSTEM_ADMIN",
                        "verified_time": self._now_ms(),
                        "response_team_status": "none",
                    }
                elif action == "dispatch":
                    admin_verification = self._as_dict(report_data.get("admin_verification"))
                    next_report["admin_verification"] = {
                        "verified_by": "SYSTEM_ADMIN",
                        "verified_time": int(admin_verification.get("verified_time") or self._now_ms()),
                        "response_team_status": "on_site",
                    }
                    next_report["emergency_response_status"] = "Emergency response team dispatched."
                elif action == "resolve":
                    next_report["emergency_response_status"] = "Incident resolved."

                reports[idx] = next_report
                updated = next_report
                break

            if updated is not None:
                self._state["reports"] = reports

        # Persist status change to DB
        if updated is not None:
            try:
                from app.models.reports import CitizenReport, ReportStatus, UrgencyLevel

                db_status_map = {
                    "verified": ReportStatus.VERIFIED,
                    "rejected": ReportStatus.REJECTED,
                    "response_dispatched": ReportStatus.DISPATCHED,
                    "resolved": ReportStatus.RESOLVED,
                }
                db_status = db_status_map.get(status)
                if db_status:
                    now = datetime.now(timezone.utc)
                    extra: dict[str, Any] = {}
                    if action == "verify":
                        extra["verified_at"] = now
                    elif action == "dispatch":
                        extra["dispatched_at"] = now
                        extra["dispatch_notes"] = "Emergency response team dispatched."
                    elif action == "resolve":
                        extra["resolved_at"] = now
                        extra["dispatch_notes"] = "Incident resolved."

                    async with async_session_factory() as session:
                        await session.execute(
                            update(CitizenReport)
                            .where(CitizenReport.public_id == report_id)
                            .values(status=db_status, **extra)
                        )
                        await session.commit()
            except Exception:
                pass  # in-memory already updated

            await self._publish("report.updated", updated)

        return updated

    async def get_weather_snapshot(self, lat: float, lon: float) -> JsonDict:
        temperature = 29.0
        wind_speed = 8.0
        rainfall = 0.0
        weather_code = 0
        weather_time = datetime.now(timezone.utc).isoformat()
        radar_tile_url: str | None = None

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                weather_resp = await client.get(
                    f"{settings.open_meteo_api_url.rstrip('/')}/v1/forecast",
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "current": "temperature_2m,wind_speed_10m,precipitation,weather_code",
                        "timezone": "auto",
                    },
                )
                weather_resp.raise_for_status()
                weather_payload = self._as_dict(weather_resp.json())
                current = self._as_dict(weather_payload.get("current"))

                temperature = float(current.get("temperature_2m") or 0.0)
                wind_speed = float(current.get("wind_speed_10m") or 0.0)
                rainfall = float(current.get("precipitation") or 0.0)
                weather_code = int(current.get("weather_code") or 0)
                weather_time = str(current.get("time") or datetime.now(timezone.utc).isoformat())

                radar_resp = await client.get(
                    f"{settings.rainviewer_api_url.rstrip('/')}/public/weather-maps.json"
                )
                if radar_resp.is_success:
                    radar_payload = self._as_dict(radar_resp.json())
                    radar = self._as_dict(radar_payload.get("radar"))
                    frames = radar.get("past")
                    if isinstance(frames, list) and frames:
                        latest = self._as_dict(frames[-1])
                        path = latest.get("path")
                        if isinstance(path, str) and path:
                            radar_tile_url = f"https://tilecache.rainviewer.com{path}/256/{{z}}/{{x}}/{{y}}/2/1_1.png"
        except Exception:
            # Keep defaults when upstream weather services fail
            pass

        if rainfall >= 25 or weather_code >= 80:
            risk_level = "CRITICAL"
        elif rainfall >= 12:
            risk_level = "HIGH"
        elif rainfall >= 4:
            risk_level = "MODERATE"
        else:
            risk_level = "LOW"

        weather: JsonDict = {
            "temperature": temperature,
            "windSpeed": wind_speed,
            "rainfall": rainfall,
            "weatherCode": weather_code,
            "time": weather_time,
        }

        return {
            "weather": weather,
            "radarTileUrl": radar_tile_url,
            "riskLevel": risk_level,
        }

    @staticmethod
    def _fallback_chat_reply(message: str, knowledge: list[JsonDict] | None) -> str:
        normalized = message.lower()
        if knowledge:
            for entry in knowledge:
                keywords = [str(k).lower() for k in entry.get("keywords", []) if isinstance(k, str)]
                if any(k and k in normalized for k in keywords):
                    response = str(entry.get("response") or "").strip()
                    if response:
                        return response

        if any(token in normalized for token in ["evac", "safe place", "shelter"]):
            return (
                "Follow local evacuation notices and move to the nearest designated shelter on higher ground. "
                "Carry water, medicine, documents, and keep emergency numbers ready (112, 117)."
            )

        if any(token in normalized for token in ["number", "hotline", "call", "emergency"]):
            return "Emergency Hotline: 112 | Police: 119 | Ambulance/Fire: 110 | DMC: 117."

        return DEFAULT_FALLBACK_REPLY

    async def chat(
        self,
        message: str,
        history: list[JsonDict] | None,
        knowledge: list[JsonDict] | None,
    ) -> JsonDict:
        clean_message = message.strip()
        if not clean_message:
            return {
                "reply": DEFAULT_FALLBACK_REPLY,
                "source": "fallback",
                "model": "local-keyword-fallback",
            }

        api_key = settings.openrouter_api_key
        if api_key:
            provider_messages: list[JsonDict] = [{"role": "system", "content": SYSTEM_PROMPT}]

            if knowledge:
                active_knowledge: list[str] = []
                for entry in knowledge:
                    response = str(entry.get("response") or "").strip()
                    if not response:
                        continue
                    category = str(entry.get("category") or "General")
                    active_knowledge.append(f"{category}: {response}")
                if active_knowledge:
                    provider_messages.append(
                        {
                            "role": "system",
                            "content": "Additional admin knowledge:\n" + "\n".join(active_knowledge),
                        }
                    )

            if history:
                for item in history[-10:]:
                    role = str(item.get("role") or "")
                    if role not in {"user", "assistant"}:
                        continue
                    provider_messages.append(
                        {
                            "role": cast(Literal["user", "assistant"], role),
                            "content": str(item.get("content") or ""),
                        }
                    )

            provider_messages.append({"role": "user", "content": clean_message})

            models = [settings.llm_model, *settings.llm_fallback_models]

            async with httpx.AsyncClient(timeout=20.0) as client:
                for model in models:
                    try:
                        response = await client.post(
                            f"{settings.openrouter_api_url.rstrip('/')}/chat/completions",
                            headers={
                                "Authorization": f"Bearer {api_key}",
                                "Content-Type": "application/json",
                            },
                            json={
                                "model": model,
                                "messages": provider_messages,
                                "max_tokens": 300,
                                "temperature": 0.4,
                            },
                        )

                        if response.status_code == 401:
                            break
                        if not response.is_success:
                            continue

                        payload = response.json()
                        raw_reply = (
                            payload.get("choices", [{}])[0]
                            .get("message", {})
                            .get("content", "")
                        )
                        reply = str(raw_reply or "").replace("<think>", "").replace("</think>", "").strip()
                        if reply:
                            return {
                                "reply": reply,
                                "source": "ai",
                                "model": model,
                            }
                    except Exception:
                        continue

        fallback = self._fallback_chat_reply(clean_message, knowledge)
        return {
            "reply": fallback,
            "source": "fallback",
            "model": "local-keyword-fallback",
        }


integration_state_service = IntegrationStateService()
