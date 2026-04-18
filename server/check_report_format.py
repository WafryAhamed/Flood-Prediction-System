import httpx
import asyncio
import json

async def check_bootstrap_detailed():
    async with httpx.AsyncClient() as client:
        res = await client.get('http://localhost:8000/api/v1/integration/bootstrap', timeout=10)
        data = res.json()
        
        reports = data.get("reports", [])
        print(f"Reports count: {len(reports)}\n")
        
        if reports:
            print("=== FIRST REPORT FULL JSON ===")
            print(json.dumps(reports[0], indent=2))
            print("\n=== REPORT FIELDS CHECK ===")
            first = reports[0]
            print(f"report_id: {first.get('report_id')} (type: {type(first.get('report_id')).__name__})")
            print(f"location_name: {first.get('location_name')} (type: {type(first.get('location_name')).__name__})")
            print(f"latitude: {first.get('latitude')} (type: {type(first.get('latitude')).__name__})")
            print(f"longitude: {first.get('longitude')} (type: {type(first.get('longitude')).__name__})")

asyncio.run(check_bootstrap_detailed())
