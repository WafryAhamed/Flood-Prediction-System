import httpx
import asyncio
import json

async def check_bootstrap():
    async with httpx.AsyncClient() as client:
        res = await client.get('http://localhost:8000/api/v1/integration/bootstrap', timeout=10)
        data = res.json()
        print(f"✅ Bootstrap Response Status: {res.status_code}\n")
        print(f"AdminControl keys: {list(data.get('adminControl', {}).keys())}")
        print(f"Maintenance keys: {list(data.get('maintenance', {}).keys())}")
        
        reports = data.get("reports", [])
        print(f"\n📊 Reports count: {len(reports)}")
        if reports:
            print(f"\n🔴 First report:")
            print(json.dumps(reports[0], indent=2)[:300])
            print(f"\n📍 Report IDs: {[r.get('report_id') for r in reports[:5]]}")
        else:
            print("⚠️  No reports in bootstrap!")

if __name__ == "__main__":
    asyncio.run(check_bootstrap())
