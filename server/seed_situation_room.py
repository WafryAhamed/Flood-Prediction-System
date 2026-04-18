"""
Seed demo data for Situation Room.

Seeds:
  - 20+ citizen reports with various severity levels, types, and statuses
  - Broadcast alerts
  - Weather data
  - Administrative events

Usage:
    cd server
    python seed_situation_room.py
"""

import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from uuid import uuid4

# Ensure server root is on sys.path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.reports import CitizenReport, ReportType, ReportStatus, UrgencyLevel, ReportEvent
from app.models.gis import District
from app.models.alerts import Broadcast, BroadcastType, BroadcastPriority, BroadcastStatus
from app.core.security import generate_report_id
from app.services.integration_state import integration_state_service

DEMO_REPORTS = [
    # CRITICAL reports
    {"type": "FLOOD", "district": "Colombo", "urgency": "CRITICAL", "status": "VERIFIED", "desc": "Flash flooding in Colombo district - main roads blocked", "lat": 6.9271, "lon": 79.8612},
    {"type": "RESCUE_NEEDED", "district": "Gampaha", "urgency": "CRITICAL", "status": "DISPATCHED", "desc": "Multiple people trapped in flooded area", "lat": 7.0674, "lon": 80.1987},
    {"type": "INFRASTRUCTURE_DAMAGE", "district": "Kalutara", "urgency": "CRITICAL", "status": "DISPATCHED", "desc": "Bridge damaged - emergency repairs needed", "lat": 6.4278, "lon": 80.0700},
    
    # HIGH reports
    {"type": "FLOOD", "district": "Kandy", "urgency": "HIGH", "status": "VERIFIED", "desc": "Moderate flooding in residential areas", "lat": 7.2906, "lon": 80.6337},
    {"type": "ROAD_BLOCKED", "district": "Matale", "urgency": "HIGH", "status": "VERIFIED", "desc": "Multiple roads blocked by debris", "lat": 7.4833, "lon": 80.7833},
    {"type": "LANDSLIDE", "district": "Nuwara Eliya", "urgency": "HIGH", "status": "DISPATCHED", "desc": "Small landslide affecting mountain road", "lat": 6.9497, "lon": 80.7891},
    {"type": "POWER_OUTAGE", "district": "Galle", "urgency": "HIGH", "status": "VERIFIED", "desc": "Power lines down across the district", "lat": 6.0535, "lon": 80.2170},
    
    # MEDIUM reports
    {"type": "WATER_SUPPLY", "district": "Matara", "urgency": "MEDIUM", "status": "VERIFIED", "desc": "Water supply interrupted in some areas", "lat": 5.7489, "lon": 80.5470},
    {"type": "SHELTER_ISSUE", "district": "Hambantota", "urgency": "MEDIUM", "status": "PENDING", "desc": "Shelter accommodations at capacity", "lat": 6.1243, "lon": 81.2120},
    {"type": "DEBRIS", "district": "Jaffna", "urgency": "MEDIUM", "status": "VERIFIED", "desc": "Debris scattered across streets - cleanup in progress", "lat": 9.6615, "lon": 80.0255},
    {"type": "FLOOD", "district": "Kilinochchi", "urgency": "MEDIUM", "status": "VERIFIED", "desc": "Localized flooding in agricultural areas", "lat": 8.8667, "lon": 80.3833},
    
    # LOW reports
    {"type": "CONTAMINATION", "district": "Mannar", "urgency": "LOW", "status": "VERIFIED", "desc": "Minor water contamination detected", "lat": 8.9000, "lon": 79.9500},
    {"type": "OTHER", "district": "Vavuniya", "urgency": "LOW", "status": "PENDING", "desc": "General safety concern reported", "lat": 8.7589, "lon": 80.5167},
    {"type": "ROAD_BLOCKED", "district": "Mullaitivu", "urgency": "LOW", "status": "RESOLVED", "desc": "Minor road obstruction - cleared", "lat": 8.2667, "lon": 81.8333},
    
    # Additional reports across other districts
    {"type": "FLOOD", "district": "Batticaloa", "urgency": "HIGH", "status": "VERIFIED", "desc": "Significant water level rise in lagoon areas", "lat": 7.7064, "lon": 81.6964},
    {"type": "RESCUE_NEEDED", "district": "Ampara", "urgency": "CRITICAL", "status": "DISPATCHED", "desc": "People stuck on rooftops awaiting rescue", "lat": 7.2833, "lon": 81.6667},
    {"type": "INFRASTRUCTURE_DAMAGE", "district": "Trincomalee", "urgency": "HIGH", "status": "VERIFIED", "desc": "Port facilities damaged by storm surge", "lat": 8.5874, "lon": 81.2328},
    {"type": "FLOOD", "district": "Kurunegala", "urgency": "MEDIUM", "status": "VERIFIED", "desc": "Moderate flooding - communities relocated", "lat": 7.4833, "lon": 80.3667},
    {"type": "POWER_OUTAGE", "district": "Puttalam", "urgency": "MEDIUM", "status": "DISPATCHED", "desc": "Electrical infrastructure damaged", "lat": 8.0281, "lon": 79.8333},
    {"type": "LANDSLIDE", "district": "Anuradhapura", "urgency": "LOW", "status": "RESOLVED", "desc": "Small landslide - no significant damage", "lat": 8.3242, "lon": 80.4167},
    {"type": "FLOOD", "district": "Polonnaruwa", "urgency": "MEDIUM", "status": "VERIFIED", "desc": "Flood affecting irrigation systems", "lat": 7.9333, "lon": 81.0000},
    {"type": "RESCUE_NEEDED", "district": "Badulla", "urgency": "HIGH", "status": "DISPATCHED", "desc": "Mountain village isolated - emergency supplies needed", "lat": 6.9900, "lon": 81.2644},
    {"type": "WATER_SUPPLY", "district": "Monaragala", "urgency": "LOW", "status": "PENDING", "desc": "Water shortage in rural areas", "lat": 6.8158, "lon": 81.3500},
    {"type": "DEBRIS", "district": "Ratnapura", "urgency": "LOW", "status": "VERIFIED", "desc": "Tree debris on roads - cleanup ongoing", "lat": 6.6964, "lon": 80.3933},
    {"type": "FLOOD", "district": "Kegalle", "urgency": "MEDIUM", "status": "VERIFIED", "desc": "River overflow threatening homes", "lat": 7.2667, "lon": 80.6333},
]

DEMO_ALERTS = [
    {"title": "National Disaster Alert - Severe Weather Warning", "priority": "CRITICAL", "district": "Colombo"},
    {"title": "Flood Warning - All Western Province", "priority": "CRITICAL", "district": "Gampaha"},
    {"title": "Evacuation Order - Low-lying areas", "priority": "HIGH", "district": "Kalutara"},
    {"title": "Emergency Shelters Opened", "priority": "HIGH", "district": "Kandy"},
    {"title": "Road Closure - A1 Highway", "priority": "MEDIUM", "district": "Matale"},
    {"title": "Water Supply Disruption Notice", "priority": "MEDIUM", "district": "Nuwara Eliya"},
    {"title": "Power Restoration Timeline", "priority": "LOW", "district": "Galle"},
]

async def seed_situation_room():
    """Seed all demo data for Situation Room."""
    
    async with async_session_factory() as db:
        print("🌊 Seeding Situation Room demo data...\n")
        
        # Get districts
        districts_result = await db.execute(select(District))
        districts_map = {d.name: d for d in districts_result.scalars().all()}
        
        if not districts_map:
            print("❌ No districts found. Run seed_db.py first!")
            return
        
        # Seed reports
        print(f"📝 Creating {len(DEMO_REPORTS)} demo reports...")
        for i, report_data in enumerate(DEMO_REPORTS):
            district_name = report_data["district"]
            district = districts_map.get(district_name)
            
            if not district:
                print(f"  ⚠️  District '{district_name}' not found, skipping")
                continue
            
            now = datetime.now(timezone.utc)
            # Vary timestamps - older reports for resolved ones
            if report_data["status"] == "RESOLVED":
                submitted_at = now - timedelta(hours=2 + i)
            elif report_data["status"] == "DISPATCHED":
                submitted_at = now - timedelta(minutes=30 + i*2)
            else:
                submitted_at = now - timedelta(minutes=15 + i)
            
            report = CitizenReport(
                public_id=generate_report_id(),
                report_type=ReportType(report_data["type"].lower()),
                status=ReportStatus(report_data["status"].lower()),
                urgency=UrgencyLevel(report_data["urgency"].lower()),
                title=f"{report_data['type'].replace('_', ' ').title()} Report - {report_data['district']}",
                description=report_data["desc"],
                location_description=f"{report_data['district']}, Sri Lanka",
                latitude=report_data["lat"],
                longitude=report_data["lon"],
                district_id=district.id,
                submitted_at=submitted_at,
                verified_at=submitted_at + timedelta(minutes=5) if report_data["status"] != "PENDING" else None,
                urgency_score={"CRITICAL": 100, "HIGH": 75, "MEDIUM": 50, "LOW": 25}[report_data["urgency"]],
                created_at=submitted_at,
                updated_at=submitted_at,
            )
            
            db.add(report)
            
            if (i + 1) % 5 == 0:
                await db.commit()
                print(f"  ✓ Created {i + 1} reports")
        
        await db.commit()
        print(f"  ✅ All {len(DEMO_REPORTS)} reports created!\n")
        
        # Seed alerts
        print(f"🚨 Creating {len(DEMO_ALERTS)} demo alerts...")
        for i, alert_data in enumerate(DEMO_ALERTS):
            district_name = alert_data["district"]
            district = districts_map.get(district_name)
            
            if not district:
                continue
            
            now = datetime.now(timezone.utc)
            broadcast = Broadcast(
                title=alert_data["title"],
                message=f"Emergency broadcast for {alert_data['district']} district",
                broadcast_type=BroadcastType.ALERT,
                priority=BroadcastPriority(alert_data["priority"].lower()),
                status=BroadcastStatus.ACTIVE,
                active_from=now - timedelta(minutes=i*5),
                active_to=now + timedelta(hours=24),
                target_districts=[district.code],
                channels=["push", "sms", "in_app"],
                created_at=now - timedelta(minutes=i*5),
                updated_at=now,
            )
            
            db.add(broadcast)
        
        await db.commit()
        print(f"  ✅ All {len(DEMO_ALERTS)} alerts created!\n")
        
        # Reset the integration state cache so frontend gets fresh data
        print("🔄 Refreshing integration state cache...")
        await integration_state_service.reset_cache()
        print("✅ Cache reset successful!\n")
        
        print("✨ Situation Room demo data seeded successfully!")
        print(f"\n📊 Summary:")
        print(f"  • Reports: {len(DEMO_REPORTS)}")
        print(f"  • Alerts: {len(DEMO_ALERTS)}")
        print(f"\n🔗 Visit: http://localhost:5173/admin/situation-room")


if __name__ == "__main__":
    asyncio.run(seed_situation_room())
