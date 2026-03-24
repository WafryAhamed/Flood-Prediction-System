import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from passlib.context import CryptContext
from app.core.config import settings
from app.models.auth import User, Role

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
engine = create_async_engine(settings.database_url)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def seed_admin():
    async with AsyncSessionLocal() as db:
        admin_role = Role(name="admin", description="Administrator")
        db.add(admin_role)
        await db.commit()
        await db.refresh(admin_role)
        
        user = User(
            email="admin@example.com",
            hashed_password=pwd_context.hash("admin123"),
            name="Super Admin",
            status="active",
            roles=[admin_role]
        )
        db.add(user)
        try:
            await db.commit()
            print("Successfully seeded admin@example.com (admin123)")
        except Exception as e:
            await db.rollback()
            print(f"Admin might already exist: {e}")

if __name__ == "__main__":
    asyncio.run(seed_admin())
