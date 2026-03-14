"""
Database connection and session management for PostgreSQL with PostGIS and pgvector.
"""
import logging
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


logger = logging.getLogger(__name__)


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
    async with engine.connect() as conn:
        statements = [
            ("postgis", "CREATE EXTENSION IF NOT EXISTS postgis"),
            ("vector", "CREATE EXTENSION IF NOT EXISTS vector"),
            ("uuid-ossp", 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'),
        ]

        for extension_name, sql in statements:
            try:
                await conn.execute(text(sql))
                await conn.commit()
            except Exception as exc:
                await conn.rollback()
                logger.warning(
                    "Extension initialization skipped for %s: %s",
                    extension_name,
                    exc,
                )


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
