import asyncio
from sqlalchemy import select
from app.db.session import async_session_factory as AsyncSessionLocal
from app.models.auth import User
from app.core.security import hash_password

async def reset_password():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == "admin@floodresilience.lk"))
        user = result.scalar_one_or_none()
        
        if user:
            user.hashed_password = hash_password("admin123")
            await db.commit()
            print("Password reset to 'admin123' for admin@floodresilience.lk")
        else:
            print("User not found!")

if __name__ == "__main__":
    asyncio.run(reset_password())
