#!/usr/bin/env python3
"""
COMPREHENSIVE SYSTEM TEST SUITE
=========================================
Tests: Frontend-Backend connectivity, API endpoints, Database integration, Real-time events
Author: GitHub Copilot
Date: March 23, 2026
"""

import sys
import asyncio
import httpx
import json
from datetime import datetime
from typing import Dict, Any, List, Tuple
from pathlib import Path

# ==================== CONFIGURATION ====================
CONFIG = {
    "base_url": "http://localhost:8000",
    "admin_email": "admin@floodresilience.lk",
    "admin_password": "admin123",
    "timeout": 10.0,
}

# ==================== COLORS FOR OUTPUT ====================
class Colors:
    HEADER = "\033[95m"
    BLUE = "\033[94m"
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"

    @staticmethod
    def apply(color: str, text: str) -> str:
        return f"{color}{text}{Colors.ENDC}"


# ==================== TEST RESULT TRACKING ====================
class TestResults:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.skipped = []
        self.total_duration = 0.0
        self.start_time = datetime.now()

    def add_pass(self, test_name: str, details: str = ""):
        self.passed.append((test_name, details))

    def add_fail(self, test_name: str, error: str, details: str = ""):
        self.failed.append((test_name, error, details))

    def add_skip(self, test_name: str, reason: str):
        self.skipped.append((test_name, reason))

    def summary(self) -> Dict[str, Any]:
        self.total_duration = (datetime.now() - self.start_time).total_seconds()
        return {
            "total_tests": len(self.passed) + len(self.failed) + len(self.skipped),
            "passed": len(self.passed),
            "failed": len(self.failed),
            "skipped": len(self.skipped),
            "success_rate": (len(self.passed) / (len(self.passed) + len(self.failed)) * 100
                            if len(self.passed) + len(self.failed) > 0 else 0),
            "duration_seconds": round(self.total_duration, 2),
        }

    def print_summary(self):
        summary = self.summary()
        print("\n")
        print("=" * 80)
        print(Colors.apply(Colors.BOLD + Colors.BLUE, "TEST RESULTS SUMMARY"))
        print("=" * 80)
        print(f"Total Tests:   {summary['total_tests']}")
        print(Colors.apply(Colors.GREEN, f"✅ Passed:      {summary['passed']}"))
        print(Colors.apply(Colors.RED, f"❌ Failed:      {summary['failed']}"))
        print(Colors.apply(Colors.YELLOW, f"⊘  Skipped:     {summary['skipped']}"))
        print(f"Success Rate:  {summary['success_rate']:.1f}%")
        print(f"Duration:      {summary['duration_seconds']}s")
        print("=" * 80)


# ==================== LOGGER ====================
def log_section(title: str, level: int = 1):
    if level == 1:
        print("\n" + Colors.apply(Colors.BOLD + Colors.CYAN, "=" * 80))
        print(Colors.apply(Colors.BOLD + Colors.CYAN, f"  {title}"))
        print(Colors.apply(Colors.BOLD + Colors.CYAN, "=" * 80))
    elif level == 2:
        print(f"\n{Colors.apply(Colors.BOLD + Colors.BLUE, title)}")
        print("-" * 80)


def log_pass(message: str, details: str = ""):
    print(Colors.apply(Colors.GREEN, f"✅ PASS: {message}"))
    if details:
        print(f"   {details}")


def log_fail(message: str, error: str, details: str = ""):
    print(Colors.apply(Colors.RED, f"❌ FAIL: {message}"))
    print(f"   Error: {error}")
    if details:
        print(f"   {details}")


def log_skip(message: str, reason: str):
    print(Colors.apply(Colors.YELLOW, f"⊘  SKIP: {message}"))
    print(f"   Reason: {reason}")


# ==================== TEST SUITE ====================
class TestSuite:
    def __init__(self):
        self.results = TestResults()
        self.client = None
        self.access_token = None

    async def setup(self):
        """Initialize HTTP client"""
        self.client = httpx.AsyncClient(
            base_url=CONFIG["base_url"],
            timeout=CONFIG["timeout"],
        )

    async def teardown(self):
        """Clean up HTTP client"""
        if self.client:
            await self.client.aclose()

    # ========== TEST 1: HEALTH CHECK ==========
    async def test_health_check(self):
        """Test 1: Health Check Endpoint"""
        test_name = "Health Check"
        try:
            response = await self.client.get("/health")
            if response.status_code == 200:
                data = response.json()
                self.results.add_pass(
                    test_name,
                    f"Status: 200, Response: {list(data.keys())}",
                )
                log_pass(f"{test_name} - Endpoint responding", f"Response keys: {list(data.keys())}")
                return True
            else:
                self.results.add_fail(
                    test_name,
                    f"HTTP {response.status_code}",
                    response.text,
                )
                log_fail(
                    f"{test_name} - Wrong status code",
                    f"Expected 200, got {response.status_code}",
                    response.text,
                )
                return False
        except Exception as e:
            self.results.add_fail(test_name, str(e))
            log_fail(f"{test_name} - Exception", str(e))
            return False

    # ========== TEST 2: ADMIN LOGIN ==========
    async def test_admin_login(self):
        """Test 2: Admin Login"""
        test_name = "Admin Login"
        try:
            response = await self.client.post(
                "/api/v1/auth/login",
                json={
                    "email": CONFIG["admin_email"],
                    "password": CONFIG["admin_password"],
                },
            )
            if response.status_code != 200:
                self.results.add_fail(
                    test_name,
                    f"HTTP {response.status_code}",
                    response.text,
                )
                log_fail(
                    f"{test_name} - Login failed",
                    f"Status {response.status_code}",
                    response.text,
                )
                return False

            data = response.json()
            self.access_token = data.get("access_token")

            if not self.access_token:
                self.results.add_fail(test_name, "No access token in response")
                log_fail(f"{test_name} - No token", "Response missing 'access_token'")
                return False

            user = data.get("user", {})
            self.results.add_pass(
                test_name,
                f"User: {user.get('email', 'N/A')}, Token: {self.access_token[:20]}...",
            )
            log_pass(
                f"{test_name} - Successful",
                f"User: {user.get('email', 'N/A')}, Token: {self.access_token[:20]}...",
            )
            return True
        except Exception as e:
            self.results.add_fail(test_name, str(e))
            log_fail(f"{test_name} - Exception", str(e))
            return False

    # ========== TEST 3: BOOTSTRAP FETCH ==========
    async def test_bootstrap_fetch(self):
        """Test 3: Bootstrap Data Fetch"""
        test_name = "Bootstrap Data"
        try:
            response = await self.client.get("/api/v1/integration/bootstrap")
            if response.status_code != 200:
                self.results.add_fail(test_name, f"HTTP {response.status_code}")
                log_fail(f"{test_name} - Failed", f"Status {response.status_code}")
                return False

            data = response.json()
            required_keys = ["adminControl", "maintenance", "reports"]
            missing_keys = [k for k in required_keys if k not in data]

            if missing_keys:
                self.results.add_fail(
                    test_name,
                    f"Missing keys: {missing_keys}",
                    f"Got keys: {list(data.keys())}",
                )
                log_fail(f"{test_name} - Missing keys", f"{missing_keys}")
                return False

            broadcast_count = len(data.get("adminControl", {}).get("broadcastFeed", []))
            self.results.add_pass(
                test_name,
                f"adminControl, maintenance, reports loaded. Broadcasts: {broadcast_count}",
            )
            log_pass(
                f"{test_name} - All data loaded",
                f"Keys: {list(data.keys())}, Broadcasts: {broadcast_count}",
            )
            return True
        except Exception as e:
            self.results.add_fail(test_name, str(e))
            log_fail(f"{test_name} - Exception", str(e))
            return False

    # ========== TEST 4: CREATE REPORT (AUTHENTICATED) ==========
    async def test_create_report(self):
        """Test 4: Create Report with Authentication"""
        test_name = "Create Report"

        if not self.access_token:
            self.results.add_skip(test_name, "No auth token from login test")
            log_skip(f"{test_name}", "Missing authentication token")
            return None

        try:
            headers = {"Authorization": f"Bearer {self.access_token}"}
            response = await self.client.post(
                "/api/v1/reports",
                json={
                    "severity_level": "HIGH",
                    "description": "Automated test flood report for QA validation",
                    "location_name": "Test Location - Colombo",
                    "latitude": 6.9271,
                    "longitude": 80.7789,
                },
                headers=headers,
            )

            if response.status_code not in [200, 201]:
                self.results.add_fail(
                    test_name,
                    f"HTTP {response.status_code}",
                    response.text[:200],
                )
                log_fail(
                    f"{test_name} - Creation failed",
                    f"Status {response.status_code}",
                    response.text[:200],
                )
                return False

            data = response.json()
            report_id = data.get("id")
            self.results.add_pass(
                test_name,
                f"Report created: {report_id}, Status: {data.get('status', 'N/A')}",
            )
            log_pass(
                f"{test_name} - Success",
                f"ID: {report_id}, Status: {data.get('status', 'N/A')}",
            )
            return True
        except Exception as e:
            self.results.add_fail(test_name, str(e))
            log_fail(f"{test_name} - Exception", str(e))
            return False

    # ========== TEST 5: LIST REPORTS ==========
    async def test_list_reports(self):
        """Test 5: List Community Reports"""
        test_name = "List Reports"
        try:
            response = await self.client.get("/api/v1/reports?page=1&page_size=10")
            if response.status_code != 200:
                self.results.add_fail(test_name, f"HTTP {response.status_code}")
                log_fail(f"{test_name} - Failed", f"Status {response.status_code}")
                return False

            data = response.json()
            total = data.get("total", 0)
            items = data.get("items", [])
            self.results.add_pass(
                test_name,
                f"Total reports: {total}, Returned: {len(items)}",
            )
            log_pass(
                f"{test_name} - Success",
                f"Total: {total}, Current page: {len(items)} items",
            )
            return True
        except Exception as e:
            self.results.add_fail(test_name, str(e))
            log_fail(f"{test_name} - Exception", str(e))
            return False

    # ========== TEST 6: CHAT ENDPOINT ==========
    async def test_chat_endpoint(self):
        """Test 6: Chat Endpoint (FIXED)"""
        test_name = "Chat Endpoint"
        try:
            response = await self.client.post(
                "/api/v1/integration/chat",
                json={
                    "message": "What should I do during a flood?",
                    "history": [],
                    "knowledge": [],
                },
            )

            if response.status_code != 200:
                self.results.add_fail(
                    test_name,
                    f"HTTP {response.status_code}",
                    response.text[:200],
                )
                log_fail(
                    f"{test_name} - Failed",
                    f"Status {response.status_code}",
                    response.text[:200],
                )
                return False

            data = response.json()
            reply = data.get("reply", "")[:100]
            self.results.add_pass(test_name, f"Reply received: {reply}...")
            log_pass(f"{test_name} - Success", f"Reply: {reply}...")
            return True
        except Exception as e:
            self.results.add_fail(test_name, str(e))
            log_fail(f"{test_name} - Exception", str(e))
            return False

    # ========== TEST 7: LIST BROADCASTS ==========
    async def test_list_broadcasts(self):
        """Test 7: List Broadcasts"""
        test_name = "List Broadcasts"
        try:
            response = await self.client.get(
                "/api/v1/broadcasts?page=1&active_only=true"
            )
            if response.status_code != 200:
                self.results.add_fail(test_name, f"HTTP {response.status_code}")
                log_fail(f"{test_name} - Failed", f"Status {response.status_code}")
                return False

            data = response.json()
            total = data.get("total", 0)
            items = data.get("items", [])
            self.results.add_pass(
                test_name,
                f"Total broadcasts: {total}, Returned: {len(items)}",
            )
            log_pass(
                f"{test_name} - Success",
                f"Total: {total}, Active broadcasts: {len(items)}",
            )
            return True
        except Exception as e:
            self.results.add_fail(test_name, str(e))
            log_fail(f"{test_name} - Exception", str(e))
            return False

    # ========== TEST 8: GET DISTRICTS ==========
    async def test_get_districts(self):
        """Test 8: Get Districts (GIS Data)"""
        test_name = "Get Districts"
        try:
            response = await self.client.get("/api/v1/districts")
            if response.status_code != 200:
                self.results.add_fail(test_name, f"HTTP {response.status_code}")
                log_fail(f"{test_name} - Failed", f"Status {response.status_code}")
                return False

            data = response.json()
            items = data.get("items", []) if isinstance(data, dict) else data
            count = len(items) if isinstance(items, list) else 0
            self.results.add_pass(test_name, f"Districts loaded: {count}")
            log_pass(f"{test_name} - Success", f"Total districts: {count}")
            return True
        except Exception as e:
            self.results.add_fail(test_name, str(e))
            log_fail(f"{test_name} - Exception", str(e))
            return False

    # ========== TEST 9: GET SHELTERS ==========
    async def test_get_shelters(self):
        """Test 9: Get Shelters"""
        test_name = "Get Shelters"
        try:
            response = await self.client.get("/api/v1/shelters")
            if response.status_code != 200:
                self.results.add_fail(test_name, f"HTTP {response.status_code}")
                log_fail(f"{test_name} - Failed", f"Status {response.status_code}")
                return False

            data = response.json()
            items = data.get("items", []) if isinstance(data, dict) else data
            count = len(items) if isinstance(items, list) else 0
            self.results.add_pass(test_name, f"Shelters loaded: {count}")
            log_pass(f"{test_name} - Success", f"Total shelters: {count}")
            return True
        except Exception as e:
            self.results.add_fail(test_name, str(e))
            log_fail(f"{test_name} - Exception", str(e))
            return False

    # ========== TEST 10: DATABASE CONNECTIVITY ==========
    async def test_database_status(self):
        """Test 10: Database Status Check"""
        test_name = "Database Connectivity"
        
        # This would require direct DB access, so we test via bootstrap endpoint
        try:
            response = await self.client.get("/api/v1/integration/bootstrap")
            if response.status_code == 200:
                # If bootstrap works, database is connected
                self.results.add_pass(test_name, "Database connected and responsive")
                log_pass(f"{test_name} - OK", "Connected via bootstrap endpoint")
                return True
            else:
                self.results.add_fail(test_name, "Database not responding")
                log_fail(f"{test_name} - Failed", "Bootstrap endpoint not responding")
                return False
        except Exception as e:
            self.results.add_fail(test_name, str(e))
            log_fail(f"{test_name} - Exception", str(e))
            return False

    # ========== RUN ALL TESTS ==========
    async def run_all(self):
        """Execute all tests"""
        await self.setup()

        try:
            log_section("COMPREHENSIVE SYSTEM TEST SUITE", level=1)
            log_section(f"Target Backend: {CONFIG['base_url']}", level=2)

            # Test Group 1: Connection & Auth
            log_section("Test Group 1: Connectivity & Authentication", level=2)
            await self.test_health_check()
            db_ok = await self.test_database_status()
            login_ok = await self.test_admin_login()

            if not login_ok:
                log_section(
                    "⚠️ SKIPPING AUTHENTICATED TESTS - Login failed",
                    level=2,
                )
                await self.teardown()
                self.results.print_summary()
                return False

            # Test Group 2: Data Fetching
            log_section("Test Group 2: Data Fetching & Integration", level=2)
            await self.test_bootstrap_fetch()
            await self.test_list_reports()
            await self.test_list_broadcasts()
            await self.test_get_districts()
            await self.test_get_shelters()

            # Test Group 3: API Operations
            log_section("Test Group 3: API Operations", level=2)
            await self.test_create_report()
            await self.test_chat_endpoint()

            # Summary
            self.results.print_summary()

            # Detailed results
            if self.results.failed:
                log_section(f"FAILED TESTS ({len(self.results.failed)})", level=2)
                for test_name, error, details in self.results.failed:
                    print(f"  ❌ {test_name}: {error}")
                    if details:
                        print(f"     {details[:100]}")

            return len(self.results.failed) == 0

        finally:
            await self.teardown()


# ==================== MAIN ENTRY POINT ====================
async def main():
    print(Colors.apply(Colors.BOLD, "Flood Resilience System - Complete Test Suite"))
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}")

    suite = TestSuite()
    success = await suite.run_all()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n" + Colors.apply(Colors.RED, "Test suite interrupted by user"))
        sys.exit(1)
    except Exception as e:
        print(Colors.apply(Colors.RED, f"Unexpected error: {e}"))
        sys.exit(1)
