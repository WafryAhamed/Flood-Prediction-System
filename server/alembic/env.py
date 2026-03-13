"""
Alembic initialization and environment configuration.
"""
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine

from alembic import context
from app.core.config import settings
from app.models.base import Base
import app.models  # noqa: F401 – ensure all model classes register on Base.metadata


# this is the Alembic Config object, which provides
# the values of the [alembic] section of the .ini file
# as Python attributes for use in application code
config = context.config

# Interpret the config file for Python logging.
fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well. By skipping the Engine creation we don't even need a
    SQLALCHEMY_DATABASE_URL here.

    By default, this is invoked via the command:

        $ alembic upgrade head

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    # Exclude PostGIS and other extension-managed system tables from autogenerate
    _EXCLUDE_TABLES = {
        "spatial_ref_sys",
        "geography_columns",
        "geometry_columns",
        "raster_columns",
        "raster_overviews",
    }

    def include_object(obj, name, type_, reflected, compare_to):
        if type_ == "table" and name in _EXCLUDE_TABLES:
            return False
        return True

    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations using async engine."""
    
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = str(settings.database_url)
    
    connectable = create_async_engine(
        str(settings.database_url),
        poolclass=pool.NullPool,
    )

    async with connectable.begin() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    import asyncio
    
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
