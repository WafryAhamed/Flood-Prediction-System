import asyncio
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import async_session_factory as AsyncSessionLocal
from app.models.auth import User

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).options(selectinload(User.roles)))
        users = result.scalars().all()
        for u in users:
            roles = [r.name for r in u.roles] if u.roles else []
            print(f"User: {u.email} | Roles: {roles} | Active: {u.status == 'active'}")

if __name__ == "__main__":
    asyncio.run(main())
