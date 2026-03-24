"""Find admin users in DB."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def main():
    engine = create_async_engine("postgresql+asyncpg://postgres:2001@127.0.0.1:5432/flood_resilience")
    async with engine.connect() as conn:
        r = await conn.execute(text(
            "SELECT u.email, u.full_name, u.status, r.name as role "
            "FROM users u "
            "LEFT JOIN user_roles ur ON u.id = ur.user_id "
            "LEFT JOIN roles r ON ur.role_id = r.id "
            "WHERE r.name IN ('admin','super_admin') LIMIT 5"
        ))
        for row in r.fetchall():
            print(f"Email: {row[0]} | Name: {row[1]} | Status: {row[2]} | Role: {row[3]}")
    await engine.dispose()

asyncio.run(main())
