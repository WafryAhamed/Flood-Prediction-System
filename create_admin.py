#!/usr/bin/env python3
"""
Create admin user script
"""
import asyncio
import sys
import os

# Add server directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "server"))

from app.db.session import async_session_factory
from app.models.auth import User, UserStatus, UserRole, Role
from app.core.security import hash_password, generate_public_id
from sqlalchemy import select

async def create_admin():
    """Create admin user."""
    async with async_session_factory() as session:
        # Check if admin already exists
        result = await session.execute(
            select(User).where(User.email == "admin@floodresilience.lk")
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            print(f"✓ Admin user already exists (ID: {existing.id})")
            # Update password
            existing.password_hash = hash_password("admin123")
            session.add(existing)
            await session.commit()
            print(f"✓ Password updated to 'admin123'")
            return
        
        # Get the super_admin role
        result = await session.execute(
            select(Role).where(Role.name == "super_admin")
        )
        super_admin_role = result.scalar_one_or_none()
        if not super_admin_role:
            print("✗ Super admin role not found. Make sure to run seed_db.py first.")
            return
        
        # Create new admin user
        admin = User(
            email="admin@floodresilience.lk",
            password_hash=hash_password("admin123"),
            full_name="System Administrator",
            phone="",
            public_id=generate_public_id("ADM"),
            status=UserStatus.ACTIVE,
            trust_score=100,
            is_verified=True,
            preferred_language="en",
        )
        
        # Add the role relationship
        admin.roles.append(super_admin_role)
        
        session.add(admin)
        await session.commit()
        await session.refresh(admin)
        
        print(f"✓ Admin user created successfully!")
        print(f"  Email: admin@floodresilience.lk")
        print(f"  Password: admin123")
        print(f"  ID: {admin.id}")

if __name__ == "__main__":
    asyncio.run(create_admin())

