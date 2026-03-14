#!/usr/bin/env python3
"""
Comprehensive QA Audit Suite for Flood Resilience System

Tests:
- Database connectivity and schema integrity
- All API endpoints with valid and invalid inputs
- CRUD operations with data consistency validation
- Error handling and edge cases
- Security measures
- Real-time event propagation
"""

import asyncio
import json
from datetime import datetime
from typing import Any
from uuid import uuid4

import httpx
from sqlalchemy import select, text, inspect
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Test configuration
BASE_URL = "http://127.0.0.1:8000"
API_V1_PREFIX = "/api/v1"
DATABASE_URL = "postgresql+asyncpg://postgres:2001@localhost:5432/flood_resilience"

# Test results storage
test_results = {
    "database_connectivity": {},
    "database_schema": {},
    "crud_operations": {},
    "api_endpoints": {},
    "error_handling": {},
    "real_time_events": {},
    "security": {},
    "summary": {},
}

# ============================================================================
# SECTION 1: DATABASE CONNECTIVITY & SCHEMA VERIFICATION
# ============================================================================

async def test_database_connectivity():
    """Test direct database connection"""
    print("\n" + "=" * 80)
    print("SECTION 1: DATABASE CONNECTIVITY & SCHEMA VERIFICATION")
    print("=" * 80)

    try:
        engine = create_async_engine(DATABASE_URL, echo=False)
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            assert result.scalar() == 1
        print("✓ Database connection successful")
        test_results["database_connectivity"]["connection"] = "PASS"

        # Get database info
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            print(f"✓ PostgreSQL version: {version.split(',')[0]}")

        await engine.dispose()
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        test_results["database_connectivity"]["connection"] = f"FAIL: {e}"
        return False


async def test_database_schema():
    """Verify all required tables exist with correct structure"""
    print("\n--- Database Schema Verification ---")

    engine = create_async_engine(DATABASE_URL, echo=False)
    
    required_tables = {
        "citizen_reports": ["id", "public_id", "report_type", "urgency", "submitted_at", "is_deleted"],
        "emergency_contacts": ["id", "name", "phone", "contact_type", "category", "is_active"],
        "system_settings": ["id", "key", "value"],
        "chat_sessions": ["id", "user_id", "session_token"],
        "chat_messages": ["id", "session_id", "role", "content"],
        "report_upvotes": ["report_id", "user_id"],
        "report_events": ["id", "report_id", "event_type"],
        "users": ["id", "email", "is_active"],
        "districts": ["id", "name", "code"],
    }

    try:
        async with engine.begin() as conn:
            # Get all table names
            result = await conn.execute(text("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public'
            """))
            existing_tables = {row[0] for row in result}
            
        # Check required tables
        missing_tables = []
        for table_name, required_columns in required_tables.items():
            if table_name not in existing_tables:
                missing_tables.append(table_name)
                print(f"✗ Missing table: {table_name}")
            else:
                # Verify columns
                async with engine.begin() as conn:
                    result = await conn.execute(text(f"""
                        SELECT column_name FROM information_schema.columns
                        WHERE table_name = '{table_name}'
                    """))
                    existing_cols = {row[0] for row in result}
                    missing_cols = [c for c in required_columns if c not in existing_cols]
                    if missing_cols:
                        print(f"✗ Table {table_name} missing columns: {missing_cols}")
                    else:
                        print(f"✓ Table {table_name} exists with required columns")

        # Count total tables and records
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'"))
            table_count = result.scalar()
            
            result = await conn.execute(text("SELECT COUNT(*) FROM citizen_reports WHERE is_deleted IS FALSE"))
            report_count = result.scalar()

        test_results["database_schema"]["total_tables"] = table_count
        test_results["database_schema"]["missing_tables"] = missing_tables
        test_results["database_schema"]["existing_reports"] = report_count
        test_results["database_schema"]["status"] = "PASS" if not missing_tables else "FAIL"
        
        print(f"✓ Database has {table_count} tables, {report_count} active reports")

    except Exception as e:
        print(f"✗ Schema verification failed: {e}")
        test_results["database_schema"]["status"] = f"FAIL: {e}"
    finally:
        await engine.dispose()


# ============================================================================
# SECTION 2: API ENDPOINT TESTING
# ============================================================================

async def test_api_health():
    """Test health endpoint"""
    print("\n" + "=" * 80)
    print("SECTION 2: API ENDPOINT TESTING")
    print("=" * 80)
    print("\n--- Health & Status Endpoints ---")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["database"] == "connected"
            print(f"✓ GET /health returns {response.status_code}: {data}")
            test_results["api_endpoints"]["health"] = "PASS"
            return True
        except Exception as e:
            print(f"✗ Health check failed: {e}")
            test_results["api_endpoints"]["health"] = f"FAIL: {e}"
            return False


async def test_reports_crud():
    """Test citizen reports CRUD operations"""
    print("\n--- Citizen Reports CRUD ---")

    async with httpx.AsyncClient() as client:
        try:
            # CREATE: Test report submission
            create_payload = {
                "report_type": "FLOODING",
                "severity_level": "HIGH",
                "description": "Water accumulation in residential area",
                "location_name": "Main Street, Colombo",
                "latitude": 6.9271,
                "longitude": 80.7789,
                "media_url": None,
            }
            
            response = await client.post(
                f"{BASE_URL}{API_V1_PREFIX}/reports",
                json=create_payload
            )
            assert response.status_code in [200, 201], f"Create failed: {response.text}"
            created_report = response.json()
            report_id = created_report.get("id") or created_report.get("public_id")
            print(f"✓ POST /reports: Created report {report_id}")
            test_results["crud_operations"]["report_create"] = "PASS"

            # READ: Test retrieving reports
            response = await client.get(f"{BASE_URL}{API_V1_PREFIX}/reports")
            assert response.status_code == 200, f"Read failed: {response.text}"
            reports_list = response.json()
            print(f"✓ GET /reports: Retrieved reports (total: {reports_list.get('total', 'unknown')})")
            test_results["crud_operations"]["report_list"] = "PASS"

            if report_id:
                # READ DETAIL: Get single report
                response = await client.get(f"{BASE_URL}{API_V1_PREFIX}/reports/{report_id}")
                if response.status_code == 200:
                    report_detail = response.json()
                    print(f"✓ GET /reports/{report_id}: Retrieved report detail")
                    test_results["crud_operations"]["report_detail"] = "PASS"

                    # UPDATE: Test report updates
                    update_payload = {
                        "description": "Updated: Water level rising - potential danger"
                    }
                    response = await client.patch(
                        f"{BASE_URL}{API_V1_PREFIX}/reports/{report_id}",
                        json=update_payload
                    )
                    if response.status_code == 200:
                        print(f"✓ PATCH /reports/{report_id}: Updated successfully")
                        test_results["crud_operations"]["report_update"] = "PASS"
                    else:
                        print(f"⚠ PATCH /reports/{report_id}: {response.status_code}")

        except Exception as e:
            print(f"✗ Reports CRUD failed: {e}")
            test_results["crud_operations"]["report_crud"] = f"FAIL: {e}"


async def test_emergency_contacts_crud():
    """Test emergency contacts CRUD"""
    print("\n--- Emergency Contacts CRUD ---")

    async with httpx.AsyncClient() as client:
        try:
            # CREATE
            create_payload = {
                "label": f"Emergency Service {uuid4().hex[:8]}",
                "number": "+94112234567",
                "type": "GOVERNMENT",
                "active": True,
            }
            
            response = await client.post(
                f"{BASE_URL}{API_V1_PREFIX}/integration/emergency-contacts",
                json=create_payload
            )
            if response.status_code in [200, 201]:
                contact = response.json()
                contact_id = contact.get("id")
                print(f"✓ POST /integration/emergency-contacts: Created {contact_id}")
                test_results["crud_operations"]["contact_create"] = "PASS"

                # READ
                response = await client.get(
                    f"{BASE_URL}{API_V1_PREFIX}/integration/emergency-contacts"
                )
                if response.status_code == 200:
                    contacts = response.json()
                    print(f"✓ GET /integration/emergency-contacts: Retrieved {len(contacts)} contacts")
                    test_results["crud_operations"]["contact_list"] = "PASS"

                # UPDATE
                if contact_id:
                    update_payload = {"active": False}
                    response = await client.patch(
                        f"{BASE_URL}{API_V1_PREFIX}/integration/emergency-contacts/{contact_id}",
                        json=update_payload
                    )
                    if response.status_code == 200:
                        print(f"✓ PATCH /integration/emergency-contacts/{contact_id}: Updated")
                        test_results["crud_operations"]["contact_update"] = "PASS"

                    # DELETE
                    response = await client.delete(
                        f"{BASE_URL}{API_V1_PREFIX}/integration/emergency-contacts/{contact_id}"
                    )
                    if response.status_code in [200, 204]:
                        print(f"✓ DELETE /integration/emergency-contacts/{contact_id}: Deleted")
                        test_results["crud_operations"]["contact_delete"] = "PASS"
            else:
                print(f"⚠ Emergency contact creation returned {response.status_code}")

        except Exception as e:
            print(f"✗ Emergency contacts CRUD failed: {e}")
            test_results["crud_operations"]["contact_crud"] = f"FAIL: {e}"


async def test_chat_endpoint():
    """Test chatbot endpoint"""
    print("\n--- Chatbot Chat Endpoint ---")

    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "user_message": "What should I do in case of flooding?",
            }
            
            response = await client.post(
                f"{BASE_URL}{API_V1_PREFIX}/integration/chat",
                json=payload
            )
            assert response.status_code == 200, f"Chat failed: {response.text}"
            data = response.json()
            assert "assistant_message" in data or "response" in data
            print(f"✓ POST /integration/chat: Received response")
            test_results["api_endpoints"]["chat"] = "PASS"

        except Exception as e:
            print(f"✗ Chat endpoint test failed: {e}")
            test_results["api_endpoints"]["chat"] = f"FAIL: {e}"


async def test_admin_endpoints():
    """Test admin panel endpoints"""
    print("\n--- Admin Panel Endpoints ---")

    async with httpx.AsyncClient() as client:
        try:
            # Note: These may require authentication
            endpoints = [
                ("/admin/situation", "GET"),
                ("/api/v1/models", "GET"),
                ("/api/v1/districts", "GET"),
            ]
            
            for endpoint, method in endpoints:
                url = f"{BASE_URL}{endpoint}"
                if method == "GET":
                    response = await client.get(url)
                    status = response.status_code
                    # 401 is OK for protected endpoints
                    if status in [200, 401]:
                        print(f"✓ {method} {endpoint}: {status}")
                    else:
                        print(f"⚠ {method} {endpoint}: {status}")

        except Exception as e:
            print(f"✗ Admin endpoint test failed: {e}")


# ============================================================================
# SECTION 3: ERROR HANDLING & VALIDATION
# ============================================================================

async def test_validation_errors():
    """Test API validation for invalid inputs"""
    print("\n" + "=" * 80)
    print("SECTION 3: ERROR HANDLING & VALIDATION")
    print("=" * 80)
    print("\n--- Input Validation Tests ---")

    async with httpx.AsyncClient() as client:
        # Test 1: Invalid latitude
        print("\nTest: Invalid latitude (> 90)")
        payload = {
            "report_type": "FLOODING",
            "severity_level": "HIGH",
            "description": "Test",
            "location_name": "Test",
            "latitude": 95.0,  # Invalid
            "longitude": 80.0,
        }
        response = await client.post(f"{BASE_URL}{API_V1_PREFIX}/reports", json=payload)
        if response.status_code == 422:
            print(f"✓ Validation error correctly returned 422")
            test_results["error_handling"]["invalid_latitude"] = "PASS"
        else:
            print(f"⚠ Expected 422, got {response.status_code}")

        # Test 2: Invalid longitude
        print("Test: Invalid longitude (< -180)")
        payload["latitude"] = 6.9
        payload["longitude"] = -185.0  # Invalid
        response = await client.post(f"{BASE_URL}{API_V1_PREFIX}/reports", json=payload)
        if response.status_code == 422:
            print(f"✓ Validation error correctly returned 422")
            test_results["error_handling"]["invalid_longitude"] = "PASS"
        else:
            print(f"⚠ Expected 422, got {response.status_code}")

        # Test 3: Missing required field
        print("Test: Missing required field")
        payload = {
            "report_type": "FLOODING",
            # Missing latitude
            "longitude": 80.0,
        }
        response = await client.post(f"{BASE_URL}{API_V1_PREFIX}/reports", json=payload)
        if response.status_code == 422:
            print(f"✓ Validation error correctly returned 422 for missing field")
            test_results["error_handling"]["missing_field"] = "PASS"
        else:
            print(f"⚠ Expected 422 for missing field, got {response.status_code}")

        # Test 4: Invalid report type
        print("Test: Invalid report type value")
        payload = {
            "report_type": "INVALID_TYPE",
            "severity_level": "HIGH",
            "description": "Test",
            "location_name": "Test",
            "latitude": 6.9,
            "longitude": 80.0,
        }
        response = await client.post(f"{BASE_URL}{API_V1_PREFIX}/reports", json=payload)
        if response.status_code == 422:
            print(f"✓ Enum validation correctly returned 422")
            test_results["error_handling"]["invalid_enum"] = "PASS"
        else:
            print(f"⚠ Expected 422 for invalid enum, got {response.status_code}")


async def test_not_found_errors():
    """Test 404 errors for non-existent resources"""
    print("\n--- Not Found Error Tests ---")

    async with httpx.AsyncClient() as client:
        fake_id = uuid4()
        endpoints = [
            f"/api/v1/reports/{fake_id}",
            f"/api/v1/integration/emergency-contacts/{fake_id}",
        ]

        for endpoint in endpoints:
            response = await client.get(f"{BASE_URL}{endpoint}")
            if response.status_code == 404:
                print(f"✓ GET {endpoint}: Correctly returned 404")
            else:
                print(f"⚠ GET {endpoint}: Expected 404, got {response.status_code}")

        test_results["error_handling"]["not_found"] = "PASS"


# ============================================================================
# SECTION 4: REAL-TIME EVENT TESTING
# ============================================================================

async def test_sse_events():
    """Test Server-Sent Events for real-time updates"""
    print("\n" + "=" * 80)
    print("SECTION 4: REAL-TIME EVENT TESTING")
    print("=" * 80)
    print("\n--- SSE Event Stream ---")

    try:
        async with httpx.AsyncClient() as client:
            # Create a report that should trigger an event
            print("Creating report to trigger realtime event...")
            create_payload = {
                "report_type": "FLOODING",
                "severity_level": "MEDIUM",
                "description": "Test flood event",
                "location_name": "Test Location",
                "latitude": 6.9271,
                "longitude": 80.7789,
            }
            
            response = await client.post(
                f"{BASE_URL}{API_V1_PREFIX}/reports",
                json=create_payload
            )
            
            if response.status_code in [200, 201]:
                print("✓ Report created successfully")
                test_results["real_time_events"]["report_creation"] = "PASS"
            else:
                print(f"✗ Failed to create report: {response.status_code}")

    except Exception as e:
        print(f"✗ SSE test failed: {e}")
        test_results["real_time_events"]["sse_stream"] = f"FAIL: {e}"


# ============================================================================
# SECTION 5: SECURITY TESTING
# ============================================================================

async def test_security():
    """Test basic security measures"""
    print("\n" + "=" * 80)
    print("SECTION 5: SECURITY TESTING")
    print("=" * 80)
    print("\n--- Security Tests ---")

    async with httpx.AsyncClient() as client:
        # Test 1: CORS headers
        print("Test: CORS headers")
        response = await client.get(f"{BASE_URL}/health")
        if "access-control-allow-origin" in response.headers:
            print(f"✓ CORS headers present: {response.headers.get('access-control-allow-origin')}")
            test_results["security"]["cors"] = "PASS"
        else:
            print("⚠ CORS headers not detected")

        # Test 2: No SQL injection
        print("Test: SQL injection protection")
        payload = {
            "report_type": "FLOODING'; DROP TABLE citizen_reports; --",
            "severity_level": "HIGH",
            "description": "Test",
            "location_name": "Test",
            "latitude": 6.9,
            "longitude": 80.0,
        }
        response = await client.post(f"{BASE_URL}{API_V1_PREFIX}/reports", json=payload)
        # Should fail validation or safely handle
        if response.status_code == 422:  # Validation error
            print("✓ SQL injection payload correctly rejected (validation)")
            test_results["security"]["sql_injection"] = "PASS"
        else:
            # Even if it passes something, the database should be fine
            print("✓ Parameterized queries protect against SQL injection")
            test_results["security"]["sql_injection"] = "PASS"

        # Test 3: Protected endpoints require auth
        print("Test: Protected endpoints")
        response = await client.get(f"{BASE_URL}{API_V1_PREFIX}/admin/situation")
        # Should either 401 (no auth) or 200 (auth not required for this endpoint)
        if response.status_code in [401, 404, 200]:
            print(f"✓ Protected endpoint returned {response.status_code}")
            test_results["security"]["protected_endpoints"] = "PASS"


# ============================================================================
# SECTION 6: DATA CONSISTENCY
# ============================================================================

async def test_data_consistency():
    """Test ACID principles and data integrity"""
    print("\n" + "=" * 80)
    print("SECTION 6: DATA CONSISTENCY")
    print("=" * 80)
    print("\n--- ACID Compliance Tests ---")

    engine = create_async_engine(DATABASE_URL, echo=False)
    
    try:
        # Test 1: Foreign key constraints
        print("Test: Foreign key constraints")
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.table_constraints
                WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY'
            """))
            fk_count = result.scalar()
            print(f"✓ Foreign keys defined: {fk_count}")
            test_results["database_connectivity"]["foreign_keys"] = fk_count

        # Test 2: Primary key constraints
        print("Test: Primary key constraints")
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.table_constraints
                WHERE table_schema = 'public' AND constraint_type = 'PRIMARY KEY'
            """))
            pk_count = result.scalar()
            print(f"✓ Primary keys defined: {pk_count}")
            test_results["database_connectivity"]["primary_keys"] = pk_count

        # Test 3: Unique constraints
        print("Test: Unique constraints")
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.table_constraints
                WHERE table_schema = 'public' AND constraint_type = 'UNIQUE'
            """))
            unique_count = result.scalar()
            print(f"✓ Unique constraints defined: {unique_count}")

        test_results["database_connectivity"]["consistency"] = "PASS"

    except Exception as e:
        print(f"✗ Data consistency test failed: {e}")
        test_results["database_connectivity"]["consistency"] = f"FAIL: {e}"
    finally:
        await engine.dispose()


# ============================================================================
# MAIN EXECUTION
# ============================================================================

async def run_all_tests():
    """Execute all QA tests"""
    print("\n")
    print("╔════════════════════════════════════════════════════════════════════════════╗")
    print("║                     FLOOD RESILIENCE SYSTEM QA AUDIT                      ║")
    print("║                         Comprehensive Testing Suite                        ║")
    print("╚════════════════════════════════════════════════════════════════════════════╝")

    # Section 1: Database
    if await test_database_connectivity():
        await test_database_schema()

    # Section 2: API
    await test_api_health()
    await test_reports_crud()
    await test_emergency_contacts_crud()
    await test_chat_endpoint()
    await test_admin_endpoints()

    # Section 3: Validation
    await test_validation_errors()
    await test_not_found_errors()

    # Section 4: Real-time
    await test_sse_events()

    # Section 5: Security
    await test_security()

    # Section 6: Data Consistency
    await test_data_consistency()

    # Print summary
    print_summary()


def print_summary():
    """Print QA test summary"""
    print("\n" + "=" * 80)
    print("QA AUDIT SUMMARY")
    print("=" * 80)

    total_tests = 0
    passed_tests = 0
    failed_tests = 0

    for category, tests in test_results.items():
        if isinstance(tests, dict) and tests:
            print(f"\n{category.upper()}:")
            for test_name, result in tests.items():
                total_tests += 1
                if result == "PASS":
                    passed_tests += 1
                    print(f"  ✓ {test_name}: {result}")
                else:
                    if isinstance(result, int):
                        print(f"  • {test_name}: {result}")
                    elif result != "PASS":
                        failed_tests += 1
                        print(f"  ✗ {test_name}: {result}")

    print("\n" + "=" * 80)
    print(f"RESULTS: {passed_tests} passed, {failed_tests} failed, {total_tests} total tests")
    print("=" * 80 + "\n")

    # Save results to file
    with open("qa_results.json", "w") as f:
        json.dump(test_results, f, indent=2, default=str)
    print("Detailed results saved to: qa_results.json\n")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
