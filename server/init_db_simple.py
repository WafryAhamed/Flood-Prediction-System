#!/usr/bin/env python3
"""
Simple database initialization script for Flood Resilience System.
Creates database and tables using SQLAlchemy models.
"""
import asyncio
import sys
import os

# Add server directory to path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.config import settings
from app.db.session import Base, engine
from sqlalchemy import text

async def init_db():
    """Initialize database and create all tables."""
    
    print(f"Connecting to PostgreSQL...")
    
    try:
        # Test connection
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        print("✓ PostgreSQL connection successful!")
        
        # Create all tables
        async with engine.begin() as conn:
            # Create PostGIS extension if supported
            try:
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
                print("✓ PostGIS extension created/verified")
            except Exception as e:
                print(f"⚠ PostGIS extension not available: {e}")
            
            # Create tables from models
            await conn.run_sync(Base.metadata.create_all)
            print("✓ Database tables created successfully!")
        
        print("\n✓ Database initialization COMPLETE!")
        print(f"  Database: {settings.database_url.split('/')[-1]}")
        print(f"  Host: {settings.database_url.split('@')[1].split(':')[0]}")
        
    except Exception as e:
        print(f"✗ Database initialization FAILED: {e}")
        sys.exit(1)
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_db())
