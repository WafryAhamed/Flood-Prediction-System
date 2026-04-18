import asyncio
import sys
from pathlib import Path
import json

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.audit import SystemSetting
from datetime import datetime, timezone
from app.services.integration_state import integration_state_service


async def seed_resources():
    async with async_session_factory() as db:
        print("Seeding dashboard resources...")
        
        now = datetime.now(timezone.utc)
        
        dashboard_resources = [
            {
                "id": "dr-1",
                "name": "Mobile Medical Units",
                "status": "AVAILABLE",
                "statusColor": "bg-green-600",
                "visible": True,
            },
            {
                "id": "dr-2",
                "name": "Temporary Shelters",
                "status": "FULL",
                "statusColor": "bg-yellow-600",
                "visible": True,
            },
            {
                "id": "dr-3",
                "name": "Water Purification Units",
                "status": "AVAILABLE",
                "statusColor": "bg-green-600",
                "visible": True,
            },
            {
                "id": "dr-4",
                "name": "Heavy Machinery",
                "status": "BUSY",
                "statusColor": "bg-orange-600",
                "visible": True,
            },
            {
                "id": "dr-5",
                "name": "Rescue Boats & Equipment",
                "status": "AVAILABLE",
                "statusColor": "bg-green-600",
                "visible": True,
            },
            {
                "id": "dr-6",
                "name": "Relief Food Packages",
                "status": "FULL",
                "statusColor": "bg-yellow-600",
                "visible": True,
            },
            {
                "id": "dr-7",
                "name": "Blankets & Clothing",
                "status": "FULL",
                "statusColor": "bg-yellow-600",
                "visible": True,
            },
            {
                "id": "dr-8",
                "name": "Power Generators",
                "status": "AVAILABLE",
                "statusColor": "bg-green-600",
                "visible": True,
            },
        ]

        admin_control_result = await db.execute(
            select(SystemSetting).where(
                SystemSetting.category == "integration",
                SystemSetting.key == "adminControl"
            )
        )
        admin_control_setting = admin_control_result.scalar_one_or_none()
        
        if admin_control_setting:
            admin_control_data = json.loads(admin_control_setting.value)
            admin_control_data["dashboardResources"] = dashboard_resources
            admin_control_setting.value = json.dumps(admin_control_data, ensure_ascii=False)
            admin_control_setting.last_modified_at = now
            print("Updated existing adminControl setting.")
        else:
            admin_control_data = {
                "dashboardResources": dashboard_resources,
            }
            admin_control_setting = SystemSetting(
                key="adminControl",
                category="integration",
                value=json.dumps(admin_control_data, ensure_ascii=False),
                value_type="json",
                last_modified_at=now,
            )
            db.add(admin_control_setting)
            print("Created new adminControl setting.")
        
        await db.commit()
        
        # Reset cache so frontend gets fresh data real time if connected
        await integration_state_service.reset_cache()
        print("Done seeding dashboard resources!")

if __name__ == "__main__":
    asyncio.run(seed_resources())
