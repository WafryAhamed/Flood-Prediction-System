"""
Database connection and session management for PostgreSQL with PostGIS and pgvector.
"""
from typing import AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass
from sqlalchemy.pool import NullPool

from app.core.config import settings


# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    pool_size=settings.database_pool_size,
    max_overflow=settings.database_max_overflow,
    pool_pre_ping=True,
)

# Session factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database sessions."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db_extensions() -> None:
    """Initialize PostgreSQL extensions (PostGIS, pgvector)."""
    async with engine.begin() as conn:
        # Enable PostGIS
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        # Enable pgvector
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        # Enable UUID generation
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'))


async def check_db_connection() -> bool:
    """Check if database connection is healthy."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def dispose_engine() -> None:
    """Dispose of the engine connection pool."""
    await engine.dispose()
