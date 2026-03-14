import asyncio
import json
import uuid
from typing import Any, cast

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.core.config import settings


async def run_audit() -> dict[str, Any]:
    results: dict[str, Any] = {}
    engine = create_async_engine(settings.database_url, echo=False)

    async with engine.begin() as conn:
        row = (
            await conn.execute(
                text("SELECT current_database() AS db, current_user AS usr")
            )
        ).mappings().first()
        if row is None:
            raise RuntimeError("Unable to read database identity")
        results["db_connection"] = {
            "ok": True,
            "database": row["db"],
            "user": row["usr"],
        }

        tables = [
            x[0]
            for x in (
                await conn.execute(
                    text(
                        """
                        SELECT table_name
                        FROM information_schema.tables
                        WHERE table_schema='public'
                        ORDER BY table_name
                        """
                    )
                )
            ).fetchall()
        ]
        results["schema"] = {
            "table_count": len(tables),
            "has_citizen_reports": "citizen_reports" in tables,
            "has_system_settings": "system_settings" in tables,
            "has_users": "users" in tables,
            "sample_tables": tables[:20],
        }

        required_feature_tables = [
            "users",
            "user_safety_profiles",
            "citizen_reports",
            "report_verification_scores",
            "report_events",
            "broadcasts",
            "notification_deliveries",
            "risk_zones",
            "shelters",
            "infrastructure_assets",
            "crop_advisories",
            "recovery_programs",
            "district_risk_snapshots",
            "chat_sessions",
            "chat_messages",
            "audit_logs",
            "system_settings",
        ]
        missing_required_tables = [name for name in required_feature_tables if name not in tables]
        results["feature_table_coverage"] = {
            "required_count": len(required_feature_tables),
            "present_count": len(required_feature_tables) - len(missing_required_tables),
            "missing_tables": missing_required_tables,
        }

        c = (
            await conn.execute(
                text(
                    """
                    SELECT
                      COUNT(*) FILTER (WHERE tc.constraint_type='PRIMARY KEY') AS pk_count,
                      COUNT(*) FILTER (WHERE tc.constraint_type='FOREIGN KEY') AS fk_count,
                      (SELECT COUNT(*) FROM pg_indexes WHERE schemaname='public') AS idx_count
                    FROM information_schema.table_constraints tc
                    WHERE tc.table_schema='public'
                    """
                )
            )
        ).mappings().first()
        if c is None:
            raise RuntimeError("Unable to read constraint metadata")
        results["constraints"] = {
            "pk_count": int(c["pk_count"] or 0),
            "fk_count": int(c["fk_count"] or 0),
            "index_count": int(c["idx_count"] or 0),
        }

        acid_key = f"acid_smoke_{uuid.uuid4().hex[:8]}"
        tx_ok = False
        try:
            async with conn.begin_nested():
                await conn.execute(
                    text(
                        """
                        INSERT INTO system_settings (key, value, value_type, category, last_modified_at, is_sensitive)
                        VALUES (:k, :v, 'json', 'integration', now(), false)
                        """
                    ),
                    {"k": acid_key, "v": "{}"},
                )
                await conn.execute(
                    text(
                        """
                        INSERT INTO system_settings (key, value, value_type, category, last_modified_at, is_sensitive)
                        VALUES (:k, :v, 'json', 'integration', now(), false)
                        """
                    ),
                    {"k": acid_key, "v": "{}"},
                )
            tx_ok = True
        except Exception:
            tx_ok = False

        left = (
            await conn.execute(
                text("SELECT COUNT(*) FROM system_settings WHERE key=:k"),
                {"k": acid_key},
            )
        ).scalar_one()

        results["acid_atomicity"] = {
            "duplicate_insert_failed": (not tx_ok),
            "rollback_preserved_consistency": left == 0,
        }

    base = "http://127.0.0.1:8000/api/v1/integration"
    report_id = None
    chat_reply_model: str | None = None

    async def wait_for_realtime_update(timeout_seconds: float = 10.0) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=None) as sse_client:
            async with sse_client.stream("GET", f"{base}/events") as stream:
                async for line in stream.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    try:
                        envelope_raw: Any = json.loads(line[6:])
                    except Exception:
                        continue

                    if not isinstance(envelope_raw, dict):
                        continue
                    envelope = cast(dict[str, Any], envelope_raw)

                    event_name = envelope.get("event")
                    if event_name in {"connected", "keepalive"}:
                        continue
                    return envelope

        return {}

    async with httpx.AsyncClient(timeout=20.0) as client:
        realtime_task = asyncio.create_task(wait_for_realtime_update())

        # Trigger an explicit realtime event for verification.
        smoke_token = f"realtime-{uuid.uuid4().hex[:8]}"
        put_res = await client.put(
            f"{base}/admin-control",
            json={"smokeToken": smoke_token, "source": "integration-audit"},
        )

        realtime_ok = False
        realtime_event: str | None = None
        realtime_payload: Any | None = None
        try:
            envelope = await asyncio.wait_for(realtime_task, timeout=10.0)
            event_candidate = envelope.get("event")
            realtime_event = event_candidate if isinstance(event_candidate, str) else None
            realtime_payload = envelope.get("payload")
            realtime_ok = realtime_event == "adminControl.updated"
        except Exception:
            realtime_task.cancel()

        results["realtime_sse"] = {
            "trigger_status": put_res.status_code,
            "event_received": realtime_ok,
            "event_name": realtime_event,
            "payload_excerpt": str(realtime_payload)[:200] if realtime_payload is not None else None,
        }

        payload: dict[str, Any] = {
            "severity_level": "HIGH",
            "description": f"Smoke test report {uuid.uuid4().hex[:6]}",
            "location_name": "Colombo Smoke Location",
            "latitude": 6.9271,
            "longitude": 79.8612,
            "media_url": None,
        }
        create_res = await client.post(f"{base}/reports", json=payload)
        create_json = (
            create_res.json()
            if create_res.headers.get("content-type", "").startswith("application/json")
            else {"raw": create_res.text[:200]}
        )
        report_id = create_json.get("report_id")

        results["api_create_report"] = {
            "status": create_res.status_code,
            "ok": create_res.status_code in (200, 201),
            "report_id": report_id,
        }

        chat_res = await client.post(
            f"{base}/chat",
            json={"message": "What should I do during a flood emergency?"},
        )
        chat_json_raw: Any = (
            chat_res.json()
            if chat_res.headers.get("content-type", "").startswith("application/json")
            else {}
        )
        if isinstance(chat_json_raw, dict):
            chat_json = cast(dict[str, Any], chat_json_raw)
            model_candidate = chat_json.get("model")
            if isinstance(model_candidate, str):
                chat_reply_model = model_candidate

        results["api_chat"] = {
            "status": chat_res.status_code,
            "ok": chat_res.status_code == 200,
            "model": chat_reply_model,
        }

        actions = ["verify", "dispatch", "resolve"]
        action_results: list[dict[str, Any]] = []
        for action in actions:
            if not report_id:
                action_results.append(
                    {"action": action, "ok": False, "reason": "no report_id"}
                )
                continue
            ar = await client.post(
                f"{base}/reports/{report_id}/action", json={"action": action}
            )
            aj = (
                ar.json()
                if ar.headers.get("content-type", "").startswith("application/json")
                else {"raw": ar.text[:200]}
            )
            action_results.append(
                {
                    "action": action,
                    "status": ar.status_code,
                    "ok": ar.status_code == 200,
                    "status_value": aj.get("status"),
                }
            )

        results["api_report_actions"] = action_results

        bootstrap = await client.get(f"{base}/bootstrap")
        bj: Any = (
            bootstrap.json()
            if bootstrap.headers.get("content-type", "").startswith("application/json")
            else {}
        )
        reports: list[Any] = []
        if isinstance(bj, dict):
            bj_dict = cast(dict[str, Any], bj)
            raw_reports = bj_dict.get("reports")
            if isinstance(raw_reports, list):
                reports = cast(list[Any], raw_reports)

        match: dict[str, Any] | None = None
        if report_id:
            for item in reports:
                if isinstance(item, dict):
                    item_dict = cast(dict[str, Any], item)
                    if item_dict.get("report_id") == report_id:
                        match = item_dict
                        break

        results["bootstrap_contains_report"] = {
            "ok": match is not None,
            "status": bootstrap.status_code,
            "final_status": (match or {}).get("status"),
        }

    async with engine.begin() as conn:
        if report_id:
            row = (
                await conn.execute(
                    text(
                        """
                        SELECT
                            public_id,
                            status::text AS status,
                            verified_at IS NOT NULL AS has_verified,
                            dispatched_at IS NOT NULL AS has_dispatched,
                            resolved_at IS NOT NULL AS has_resolved
                        FROM citizen_reports
                        WHERE public_id = :pid
                        """
                    ),
                    {"pid": report_id},
                )
            ).mappings().first()
            results["db_report_persistence"] = dict(row) if row else {"found": False}
        else:
            results["db_report_persistence"] = {
                "found": False,
                "reason": "missing report_id",
            }

        settings_rows = [
            dict(x)
            for x in (
                await conn.execute(
                    text(
                        """
                        SELECT key, category, value_type
                        FROM system_settings
                        WHERE key IN ('adminControl','maintenance')
                        ORDER BY key
                        """
                    )
                )
            ).mappings().all()
        ]
        results["db_system_settings_integration"] = {
            "count": len(settings_rows),
            "rows": settings_rows,
        }

        recent_chat_log = (
            await conn.execute(
                text(
                    """
                    SELECT COUNT(*)
                    FROM chat_messages cm
                    JOIN chat_sessions cs ON cs.id = cm.session_id
                    WHERE cs.session_token LIKE 'integration-%'
                      AND cm.created_at > now() - interval '30 minutes'
                    """
                )
            )
        ).scalar_one()

        results["db_chat_logging"] = {
            "recent_messages": int(recent_chat_log or 0),
            "ok": int(recent_chat_log or 0) >= 2,
        }

    await engine.dispose()
    return results


if __name__ == "__main__":
    out = asyncio.run(run_audit())
    print(json.dumps(out, indent=2, default=str))
