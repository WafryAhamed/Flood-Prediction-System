"""Add missing TimestampMixin columns to manually created tables."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DB_URL = "postgresql+asyncpg://postgres:2001@127.0.0.1:5432/flood_resilience"

async def main():
    engine = create_async_engine(DB_URL)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("""
                ALTER TABLE page_visibility 
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
            """))
            print("[OK] Alter page_visibility successful")
        except Exception as e:
            print(f"[ERR] page_visibility: {e}")
            
        try:    
            await conn.execute(text("""
                ALTER TABLE system_settings_config 
                ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
                ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
            """))
            print("[OK] Alter system_settings_config successful")
        except Exception as e:
            print(f"[ERR] system_settings: {e}")

    await engine.dispose()
    print("[DONE]")

asyncio.run(main())
