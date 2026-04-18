"""
Enhanced demo data seeding for Situation Room with broadcasts.

This script adds:
- More demo broadcasts with proper channels
- Additional reports in various districts  
- Proper status and severity mapping

Usage:
    cd server
    python seed_broadcasts.py
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import json

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.db.session import async_session_factory
from app.models.alerts import Broadcast, BroadcastType, BroadcastPriority, BroadcastStatus
from app.models.gis import District
from app.models.audit import SystemSetting
from app.services.integration_state import integration_state_service
from app.services.integration_state import integration_state_service

DEMO_BROADCASTS = [
    {
        "title": "🚨 NATIONAL DISASTER ALERT - SEVERE WEATHER WARNING",
        "message": "Heavy rainfall and flooding expected across western provinces. Residents advised to evacuate low-lying areas immediately.",
        "priority": "CRITICAL",
        "districts": ["CMB", "GAM", "KLT"],
        "channels": ["push", "sms", "in_app"],
    },
    {
        "title": "⚠️  FLOOD WARNING - CENTRAL PROVINCE",
        "message": "Rivers in Kandy and Matale districts showing dangerous water levels. Emergency services deployed.",
        "priority": "CRITICAL",
        "districts": ["KND", "MTL"],
        "channels": ["push", "sms"],
    },
    {
        "title": "📢 EVACUATION ORDER - LOW-LYING AREAS",
        "message": "Mandatory evacuation from coastal low-lying areas in Southern Province. Move to designated shelters.",
        "priority": "HIGH",
        "districts": ["GAL", "MTR", "HMB"],
        "channels": ["push", "in_app"],
    },
    {
        "title": "🏥 EMERGENCY MEDICAL SUPPORT AVAILABLE",
        "message": "Mobile medical teams deployed to affected areas. Call emergency hotline for assistance.",
        "priority": "HIGH",
        "districts": ["JAF", "KIL", "MNR"],
        "channels": ["in_app"],
    },
    {
        "title": "🛣️  ROAD CLOSURE - A1 HIGHWAY SECTION",
        "message": "Main highway sections closed due to flooding. Use alternative routes.",
        "priority": "MEDIUM",
        "districts": ["GAM", "KND"],
        "channels": ["push", "in_app"],
    },
    {
        "title": "💧 WATER SUPPLY DISRUPTION",
        "message": "Water supply interrupted in some areas. Store drinking water. Updates every 2 hours.",
        "priority": "MEDIUM",
        "districts": ["MTL", "NWE"],
        "channels": ["in_app"],
    },
    {
        "title": "🏠 EMERGENCY SHELTERS OPENED",
        "message": "Temporary shelters at schools and community centers. Contact district office for details.",
        "priority": "MEDIUM",
        "districts": ["VAV", "MLP"],
        "channels": ["push"],
    },
    {
        "title": "⚡ POWER RESTORATION IN PROGRESS",
        "message": "Electrical infrastructure repairs underway. Power expected to restore within 24 hours.",
        "priority": "LOW",
        "districts": ["BTK", "AMP", "TRN"],
        "channels": ["in_app"],
    },
    {
        "title": "✅ STATUS UPDATE - NORTHERN PROVINCE",
        "message": "Situation stabilizing. Emergency teams continuing recovery operations.",
        "priority": "LOW",
        "districts": ["VAV"],
        "channels": ["in_app"],
    },
    {
        "title": "📞 EMERGENCY HELPLINE ACTIVE",
        "message": "Call 117 for emergency assistance 24/7. SMS hotline available for regions without connectivity.",
        "priority": "MEDIUM",
        "districts": ["CMB", "GAM", "KND", "KIL"],
        "channels": ["push", "sms"],
    },
]

async def seed_broadcasts():
    """Seed enhanced broadcast demo data."""
    
    async with async_session_factory() as db:
        print("📢 Seeding Enhanced Broadcast Data...\n")
        
        # Get districts
        districts_result = await db.execute(select(District))
        districts_map = {d.code: d for d in districts_result.scalars().all()}
        
        if not districts_map:
            print("❌ No districts found. Run seed_db.py first!")
            return
        
        print(f"✓ Found {len(districts_map)} districts\n")
        
        # Seed broadcasts
        now = datetime.now(timezone.utc)
        
        for i, bc_data in enumerate(DEMO_BROADCASTS):
            # Stagger broadcast creation times
            created_time = now - timedelta(hours=len(DEMO_BROADCASTS) - i)
            
            # Map district codes
            target_districts = [d for d in bc_data["districts"] if d in districts_map]
            
            broadcast = Broadcast(
                title=bc_data["title"],
                message=bc_data["message"],
                broadcast_type=BroadcastType.ALERT,
                priority=BroadcastPriority(bc_data["priority"].lower()),
                status=BroadcastStatus.ACTIVE,
                active_from=created_time,
                active_to=now + timedelta(hours=48),
                target_districts=target_districts,
                channels=bc_data["channels"],
                created_at=created_time,
                updated_at=now,
            )
            
            db.add(broadcast)
            
            if (i + 1) % 3 == 0:
                await db.commit()
                print(f"  ✓ Seeded {i + 1} broadcasts")
        
        await db.commit()
        print(f"  ✅ All {len(DEMO_BROADCASTS)} broadcasts created!\n")
        
        # Update adminControl with broadcast feed data
        print("📊 Updating admin control with broadcast feed...")
        
        broadcasts_result = await db.execute(
            select(Broadcast).order_by(Broadcast.created_at.desc()).limit(10)
        )
        broadcasts = broadcasts_result.scalars().all()
        
        broadcast_feed = [
            {
                "id": str(b.id),
                "active": b.status == BroadcastStatus.ACTIVE,
                "type": "critical" if b.priority == BroadcastPriority.CRITICAL else "warning" if b.priority == BroadcastPriority.HIGH else "info",
                "time": "LIVE",
                "text": b.title,
            }
            for b in broadcasts
        ]
        
        # Get or create adminControl setting
        admin_control_result = await db.execute(
            select(SystemSetting).where(
                SystemSetting.category == "integration",
                SystemSetting.key == "adminControl"
            )
        )
        admin_control_setting = admin_control_result.scalar_one_or_none()
        
        if admin_control_setting:
            admin_control_data = json.loads(admin_control_setting.value)
            admin_control_data["broadcastFeed"] = broadcast_feed
            admin_control_setting.value = json.dumps(admin_control_data, ensure_ascii=False)
            admin_control_setting.last_modified_at = now
        else:
            admin_control_data = {
                "systemStatus": "online",
                "alertLevel": "RED",
                "maintenanceMode": False,
                "broadcastsEnabled": True,
                "reportsEnabled": True,
                "broadcastFeed": broadcast_feed,
            }
            admin_control_setting = SystemSetting(
                key="adminControl",
                category="integration",
                value=json.dumps(admin_control_data, ensure_ascii=False),
                value_type="json",
                last_modified_at=now,
            )
            db.add(admin_control_setting)
        
        await db.commit()
        
        print(f"  ✅ Admin control updated with {len(broadcast_feed)} broadcasts!\n")
        
        # Reset the integration state cache so frontend gets fresh data
        print("🔄 Refreshing integration state cache...")
        await integration_state_service.reset_cache()
        print("✅ Cache reset successful!\n")
        
        print("✨ Enhanced broadcast demo data seeded successfully!")
        print(f"\n📊 Summary:")
        print(f"  • Broadcasts: {len(DEMO_BROADCASTS)}")
        print(f"  • Broadcast Feed Items: {len(broadcast_feed)}")
        print(f"  • Active Status: YES")
        print(f"\n🔗 Visit: http://localhost:5173/admin/situation-room")
        print(f"   • Check BROADCAST FEED section for live broadcasts")
        print(f"   • All broadcasts are now ACTIVE and marked for all channels")


if __name__ == "__main__":
    asyncio.run(seed_broadcasts())
