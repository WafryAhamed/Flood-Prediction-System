import httpx
import asyncio
import json

async def check_bootstrap():
    async with httpx.AsyncClient() as client:
        res = await client.get('http://localhost:8001/api/v1/integration/bootstrap')
        data = res.json()
        print("Bootstrap AdminControl keys:", data.get("adminControl", {}).keys())
        pages = data.get("adminControl", {}).get("pages", [])
        if pages:
             print("Pages found:", len(pages))
             print("First page id:", pages[0].get("id"))
        else:
             print("Pages list is EMPTY or missing in adminControl")

if __name__ == "__main__":
    asyncio.run(check_bootstrap())
