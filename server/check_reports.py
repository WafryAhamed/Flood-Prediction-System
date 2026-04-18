import asyncio
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.reports import CitizenReport

async def check_reports():
    async with async_session_factory() as db:
        result = await db.execute(select(CitizenReport))
        reports = result.scalars().all()
        print(f"Total reports in DB: {len(reports)}")
        if reports:
            print(f"First report: {reports[0].public_id} - {reports[0].description}")
            print(f"Report status: {reports[0].status}")

asyncio.run(check_reports())
