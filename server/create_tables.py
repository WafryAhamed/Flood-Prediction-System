"""Create the missing tables manually."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://postgres:2001@127.0.0.1:5432/flood_resilience"

async def main():
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        # Create page_visibility table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS page_visibility (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                page_name VARCHAR(255) UNIQUE NOT NULL,
                is_enabled BOOLEAN NOT NULL DEFAULT true
            )
        """))
        print("[OK] page_visibility table created or already exists")

        # Create system_settings_config table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS system_settings_config (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                dark_mode BOOLEAN NOT NULL DEFAULT true,
                sound_alerts BOOLEAN NOT NULL DEFAULT true,
                push_notifications BOOLEAN NOT NULL DEFAULT true,
                data_collection BOOLEAN NOT NULL DEFAULT false,
                anonymous_reporting BOOLEAN NOT NULL DEFAULT true
            )
        """))
        print("[OK] system_settings_config table created or already exists")

    # Verify
    async with engine.connect() as conn:
        r = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables "
            "WHERE table_schema='public' AND table_name IN "
            "('page_visibility','system_settings_config','emergency_contacts')"
        ))
        tables = [row[0] for row in r.fetchall()]
        print(f"[VERIFY] Tables now present: {tables}")

    await engine.dispose()
    print("[DONE]")

asyncio.run(main())
