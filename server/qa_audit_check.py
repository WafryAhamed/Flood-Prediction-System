#!/usr/bin/env python3
"""
QA AUDIT: Check database state for broadcasts and reports.
"""
import asyncio
from sqlalchemy import select, func
from app.db.session import async_session_factory
from app.models.alerts import Broadcast, BroadcastStatus
from app.models.reports import CitizenReport, ReportStatus

async def check_data():
    async with async_session_factory() as session:
        # Check broadcasts
        result = await session.execute(select(Broadcast))
        broadcasts = result.scalars().all()
        
        print("=" * 60)
        print("DATABASE QA AUDIT CHECK")
        print("=" * 60)
        print()
        
        print(f"BROADCASTS: Total count = {len(broadcasts)}")
        if broadcasts:
            for i, b in enumerate(broadcasts[:5], 1):
                print(f"  [{i}] ID={b.id}")
                print(f"      Title={b.title}")
                print(f"      Status={b.status}")
                print(f"      Type={b.broadcast_type}")
                print(f"      Priority={b.priority}")
                print(f"      CreatedAt={b.created_at}")
        else:
            print("  NO BROADCASTS FOUND IN DATABASE")
        print()
        
        # Check reports
        result = await session.execute(select(CitizenReport))
        reports = result.scalars().all()
        
        print(f"CITIZEN REPORTS: Total count = {len(reports)}")
        if reports:
            status_counts = {}
            for r in reports:
                status_counts[r.status.value if hasattr(r.status, 'value') else str(r.status)] = status_counts.get(r.status.value if hasattr(r.status, 'value') else str(r.status), 0) + 1
            print(f"  Status breakdown: {status_counts}")
            
            for i, r in enumerate(reports[:3], 1):
                print(f"  [{i}] ID={r.id}")
                print(f"      Location={r.location_name}")
                print(f"      Severity={r.urgency_level}")
                print(f"      Status={r.status}")
                print(f"      CreatedAt={r.created_at}")
        else:
            print("  NO REPORTS FOUND IN DATABASE")

asyncio.run(check_data())
