# pyright: reportMissingTypeStubs=false
"""Ensure the configured PostgreSQL database exists.

Usage:
    python scripts/ensure_database.py
"""

from __future__ import annotations

import asyncio
import os
from urllib.parse import urlparse

import asyncpg


def _parse_db_url(raw_url: str) -> tuple[str, int, str, str, str]:
    parsed = urlparse(raw_url)
    host = parsed.hostname or "localhost"
    port = int(parsed.port or 5432)
    user = parsed.username or "postgres"
    password = parsed.password or ""
    db_name = (parsed.path or "/postgres").lstrip("/") or "postgres"
    return host, port, user, password, db_name


async def ensure_database_exists() -> None:
    raw_url = (
        os.getenv("DATABASE_URL_SYNC")
        or os.getenv("DATABASE_URL")
        or "postgresql://postgres:2001@localhost:5432/flood_resilience"
    )

    host, port, user, password, target_db = _parse_db_url(raw_url)

    admin_db = "postgres" if target_db.lower() != "postgres" else "template1"

    conn = await asyncpg.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=admin_db,
    )
    try:
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            target_db,
        )
        if exists:
            print(f"Database '{target_db}' already exists.")
            return

        await conn.execute(f'CREATE DATABASE "{target_db}"')
        print(f"Created database '{target_db}'.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(ensure_database_exists())
