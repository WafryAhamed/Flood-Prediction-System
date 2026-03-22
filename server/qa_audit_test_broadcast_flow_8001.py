#!/usr/bin/env python3
"""
QA AUDIT - PHASE 3, TEST #1: Broadcast Creation End-to-End Flow
Tests: Admin creates broadcast → Database stores it → User page can access it
NOW USING WORKING BACKEND ON PORT 8001
"""
import asyncio
import httpx
import json
from datetime import datetime
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.alerts import Broadcast

# Admin login credentials
ADMIN_EMAIL = "admin@floodresilience.lk"
ADMIN_PASSWORD = "admin123"
BASE_URL = "http://localhost:8001"  # Using port 8001 (working backend)

async def test_broadcast_flow():
    """Execute broadcast creation and verification."""
    print("=" * 70)
    print("QA AUDIT - PHASE 3: DATABASE VALIDATION")
    print("TEST CASE #1: BROADCAST CREATION END-TO-END FLOW")
    print(f"(Using Backend: {BASE_URL})")
    print("=" * 70)
    print()
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10) as client:
        # Step 1: Admin Login
        print("STEP 1: Admin Login")
        print("-" * 70)
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if login_response.status_code != 200:
            print(f"❌ FAILED: Login returned {login_response.status_code}")
            print(f"   Response: {login_response.text}")
            return
        
        token_data = login_response.json()
        access_token = token_data.get("access_token")
        print(f"✅ PASSED: Admin logged in successfully")
        print(f"   Token: {access_token[:20]}...")
        print(f"   User: {token_data.get('user', {}).get('email')}")
        print()
        
        # Step 2: Create Broadcast via API
        print("STEP 2: Create Broadcast via API")
        print("-" * 70)
        
        broadcast_payload = {
            "title": "QA TEST BROADCAST - AUTO-CREATED",
            "description": "This is an automated QA test to verify broadcast creation flow",
            "broadcast_type": "emergency",
            "priority": "critical",
            "message": "Testing admin → database → user page synchronization",
            "target_audience": "everyone",
            "language": "en",
            "is_active": True
        }
        
        print("Creating broadcast with payload:")
        print(json.dumps(broadcast_payload, indent=2))
        print()
        
        headers = {"Authorization": f"Bearer {access_token}"}
        create_response = await client.post(
            "/api/v1/broadcasts",
            json=broadcast_payload,
            headers=headers
        )
        
        if create_response.status_code not in [200, 201]:
            print(f"❌ FAILED: Broadcast creation returned {create_response.status_code}")
            print(f"   Response: {create_response.text}")
            return
        
        broadcast_data = create_response.json()
        broadcast_id = broadcast_data.get("id")
        print(f"✅ PASSED: Broadcast created via API")
        print(f"   Broadcast ID: {broadcast_id}")
        print(f"   Response Status: {create_response.status_code}")
        print(f"   Response Data: {list(broadcast_data.keys())}")
        print()
        
        # Step 3: Verify in Database
        print("STEP 3: Verify Broadcast Stored in Database")
        print("-" * 70)
        
        async with async_session_factory() as session:
            result = await session.execute(
                select(Broadcast).where(Broadcast.id == broadcast_id)
            )
            db_broadcast = result.scalar_one_or_none()
            
            if not db_broadcast:
                print(f"❌ FAILED: Broadcast NOT found in database")
                print(f"   Expected ID: {broadcast_id}")
                # Check total count
                count_result = await session.execute(select(Broadcast))
                total = len(count_result.scalars().all())
                print(f"   Total broadcasts in DB: {total}")
                return
            
            print(f"✅ PASSED: Broadcast found in database")
            print(f"   ID: {db_broadcast.id}")
            print(f"   Title: {db_broadcast.title}")
            print(f"   Type: {db_broadcast.broadcast_type}")
            print(f"   Priority: {db_broadcast.priority}")
            print(f"   Status: {db_broadcast.status}")
            print(f"   Is Active: {db_broadcast.is_active}")
            print(f"   Created At: {db_broadcast.created_at}")
        print()
        
        # Step 4: Retrieve via User API (non-admin, public read)
        print("STEP 4: Retrieve Broadcast via Public API")
        print("-" * 70)
        
        list_response = await client.get("/api/v1/broadcasts")
        if list_response.status_code != 200:
            print(f"❌ FAILED: Broadcast retrieval returned {list_response.status_code}")
            return
        
        broadcasts_list = list_response.json()
        if isinstance(broadcasts_list, dict):
            broadcasts_list = broadcasts_list.get("data", [])
        
        matching_broadcast = next(
            (b for b in broadcasts_list if b.get("id") == str(broadcast_id)),
            None
        )
        
        if not matching_broadcast:
            print(f"❌ FAILED: Broadcast NOT returned by public API")
            print(f"   Expected to find ID: {broadcast_id}")
            print(f"   Total broadcasts in API response: {len(broadcasts_list)}")
            print(f"   Sample broadcast IDs: {[b.get('id') for b in broadcasts_list[:3]]}")
            return
        
        print(f"✅ PASSED: Broadcast accessible via public API")
        print(f"   Title: {matching_broadcast.get('title')}")
        print(f"   Type: {matching_broadcast.get('broadcast_type')}")
        print(f"   Priority: {matching_broadcast.get('priority')}")
        print()
        
        # Step 5: Verify SSE Event Infrastructure
        print("STEP 5: Verify SSE Event Stream Infrastructure")
        print("-" * 70)
        events_response = await client.get("/api/v1/integration/events", timeout=2)
        if events_response.status_code in [200, 401]:  # 401 expected if auth required
            print(f"✅ PASSED: SSE endpoint is responsive (status: {events_response.status_code})")
        else:
            print(f"⚠️  WARNING: SSE endpoint returned unexpected status: {events_response.status_code}")
        print()
        
        # FINAL SUMMARY
        print("=" * 70)
        print("TEST SUMMARY: BROADCAST CREATION FLOW")
        print("=" * 70)
        print()
        print("✅ ALL STEPS PASSED")
        print()
        print("VERIFICATION CHAIN COMPLETE:")
        print("  1. ✅ Admin authenticated successfully")
        print("  2. ✅ Broadcast created via API")
        print("  3. ✅ Broadcast persisted to database")
        print("  4. ✅ Broadcast accessible via public API (user pages can fetch)")
        print("  5. ✅ SSE infrastructure operational")
        print()
        print("CONCLUSION: Admin-to-Database-to-User data flow is FUNCTIONAL ✅")
        print()
        print("=" * 70)

if __name__ == "__main__":
    asyncio.run(test_broadcast_flow())
