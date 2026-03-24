import httpx
import asyncio

async def login():
    async with httpx.AsyncClient() as client:
        res = await client.post('http://localhost:8001/api/v1/auth/login', data={'username':'admin@floodresilience.lk', 'password':'change-me-in-env'})
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")

if __name__ == "__main__":
    asyncio.run(login())
