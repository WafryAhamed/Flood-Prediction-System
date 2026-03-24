import asyncio
import httpx
import uuid

BASE_URL = "http://localhost:8001/api/v1"
HEALTH_URL = "http://localhost:8001/health"

class QAValidator:
    def __init__(self):
        self.results = []
        self.db_ready = False
        
        # We need a super admin to do these tests
        self.super_admin_email = "admin@floodresilience.lk"
        self.super_admin_pass = "admin123"
        self.admin_token = None
        
        # We also need a standard user to verify things
        self.user_email = f"testuser_{uuid.uuid4().hex[:6]}@example.com"
        self.user_pass = "user123!"
        self.user_token = None
        
        self.client = httpx.AsyncClient(timeout=10.0)

    async def run(self):
        print(f"\n=================================================================")
        print(f"   E2E QA VALIDATION: ADMIN <-> USER INTEGRATION   ")
        print(f"=================================================================\n")
        
        try:
            if not await self._check_health():
                return
                
            if not await self._setup_auth():
                return
                
            await self._run_test_suite()
            
        finally:
            await self.client.aclose()
            self._print_report()

    async def _check_health(self) -> bool:
        print(f"STEP 1: Checking System Health")
        try:
            res = await self.client.get(f"{HEALTH_URL}/ready")
            if res.status_code == 200:
                print(f"  [PASS] Backend and Database are ready.")
                self.db_ready = True
                return True
            else:
                print(f"  [FAIL] Backend not ready: {res.text}")
                self._record("System Health", "Check /health/ready endpoint", False, "Expected 200 OK", f"Got {res.status_code}", "Backend or DB is down")
                return False
        except Exception as e:
            print(f"  [FAIL] Connection refused: {e}")
            self._record("System Health", "Connect to server", False, "Server accepts connections", "Connection error", "Uvicorn server is not running")
            return False

    async def _setup_auth(self) -> bool:
        print(f"\nSTEP 2: Setup Authentication Context")
        
        # Login standard admin
        login_data = {
            "email": self.super_admin_email,
            "password": self.super_admin_pass
        }
        res = await self.client.post(f"{BASE_URL}/auth/login", json=login_data)
        if res.status_code == 200:
            self.admin_token = res.json()["tokens"]["access_token"]
            print(f"  [PASS] Authenticated as Admin ({self.super_admin_email})")
        else:
            print(f"  [FAIL] Admin login failed. Cannot proceed with tests.")
            self._record("Authentication", "Admin Login", False, "200 OK Token returned", f"Got {res.status_code}", "Missing seed admin in DB or server not responding to auth")
            return False
            
        # Create a test user directly via API using admin token
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        user_data = {
            "email": self.user_email,
            "full_name": "QA Test User",
            "password": self.user_pass,
            "role": "citizen"
        }
        res = await self.client.post(f"{BASE_URL}/users", json=user_data, headers=headers)
        if res.status_code in [200, 201]:
            print(f"  [PASS] Created test citizen user ({self.user_email})")
            
            # Login as test user
            res_login = await self.client.post(f"{BASE_URL}/auth/login", json={"email": self.user_email, "password": self.user_pass})
            if res_login.status_code == 200:
                 self.user_token = res_login.json()["tokens"]["access_token"]
                 print(f"  [PASS] Authenticated as Citizen")
            else:
                 print(f"  [FAIL] Citizen login failed.")
                 self._record("Authentication", "Citizen Login", False, "200 OK Token returned", f"Got {res_login.status_code}", "User created but login rejected")
                 return False
        else:
            print(f"  [FAIL] Failed to create test user.")
            self._record("Authentication", "Create Test User", False, "201 Created", f"Got {res.status_code} {res.text}", "Admin /users endpoint failure")
            return False
            
        return True

    async def _run_test_suite(self):
        print(f"\nSTEP 3: Running Integration Tests")
        
        await self._test_unauthorized_admin_actions()
        await self._test_admin_control_sync()
        await self._test_maintenance_sync()
        await self._test_user_management()
        await self._test_audit_logging()

    async def _test_unauthorized_admin_actions(self):
        print("\n  -- Testing Unauthorized Access Prevention --")
        
        # 1. No token
        res = await self.client.put(f"{BASE_URL}/integration/admin-control", json={"features": {}})
        passed = res.status_code == 401
        self._record(
            "Security/Auth", "Anonymous user attempting admin-control PUT", 
            passed, "401 Unauthorized", f"{res.status_code}", "Missing AdminUser dependency on endpoint"
        )
        
        # 2. Citizen token
        headers = {"Authorization": f"Bearer {self.user_token}"}
        res = await self.client.put(f"{BASE_URL}/integration/admin-control", json={"features": {}}, headers=headers)
        passed = res.status_code in [401, 403]
        self._record(
            "Security/Auth", "Citizen user attempting admin-control PUT", 
            passed, "403 Forbidden", f"{res.status_code}", "Role guard 'require_roles' bypass"
        )

    async def _test_admin_control_sync(self):
        print("\n  -- Testing Admin Control Sync (Dashboard Toggles) --")
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # 1. Get current public state
        res_pre = await self.client.get(f"{BASE_URL}/integration/bootstrap")
        initial_pages = res_pre.json().get("adminControl", {}).get("pages", [])
        
        # Pick a page to toggle
        target_page = "evacuation"
        
        # 2. Admin hides the page
        payload = {
            "features": res_pre.json().get("adminControl", {}).get("features", {}),
            "pages": [dict(p) for p in initial_pages]
        }
        
        # find and update evacuation page
        for p in payload["pages"]:
             if p.get("id") == target_page:
                  p["isActive"] = False
                  
        res_admin = await self.client.put(f"{BASE_URL}/integration/admin-control", json=payload, headers=admin_headers)
        passed_admin = res_admin.status_code == 200
        self._record(
            "Admin Control", "Admin hides 'evacuation' page via API", 
            passed_admin, "200 OK Dashboard state saved", f"{res_admin.status_code}", "Admin API failure"
        )
        
        if passed_admin:
            # 3. Verify user side without auth gets new state
            res_post = await self.client.get(f"{BASE_URL}/integration/bootstrap")
            post_pages = res_post.json().get("adminControl", {}).get("pages", [])
            
            # Since post_pages is a list, find the dict with matching id
            evac_page = next((p for p in post_pages if isinstance(p, dict) and p.get("id") == target_page), None)
            
            passed_user = evac_page is not None and evac_page["isActive"] == False
            self._record(
                "Admin Control", "User bootstrap API reflects hidden 'evacuation' page", 
                passed_user, "evacuation isActive=False in list", f"Returned state: {evac_page}", "Backend state not syncing to public endpoints"
            )

    async def _test_maintenance_sync(self):
        print("\n  -- Testing Maintenance Sync (Emergency Contacts & Map) --")
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Create a new emergency contact
        new_contact = {
            "label": f"QA Emergency {uuid.uuid4().hex[:4]}",
            "number": "911-TEST",
            "type": "police",
            "active": True
        }
        res_create = await self.client.post(f"{BASE_URL}/integration/emergency-contacts", json=new_contact, headers=admin_headers)
        passed_create = res_create.status_code == 201
        self._record(
            "Maintenance", "Admin creates new emergency contact",
            passed_create, "201 Created", f"{res_create.status_code}", "Admin endpoint failure"
        )
        
        if passed_create:
            contact_id = res_create.json().get("id")
            
            # Verify user side Public API
            res_public = await self.client.get(f"{BASE_URL}/integration/emergency-contacts")
            contacts = res_public.json()
            found = any(c.get("id") == contact_id for c in contacts)
            
            self._record(
                "Maintenance", "New emergency contact immediately available on public API",
                found, "Contact ID found in public list", "Contact missing", "Public API not reading from DB or state cache out of sync"
            )

    async def _test_user_management(self):
         print("\n  -- Testing User Management Actions --")
         admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
         user_headers = {"Authorization": f"Bearer {self.user_token}"}
         
         # Note: We need the actual user ID from DB, which we got during auth setup, but we'll fetch list
         res_users = await self.client.get(f"{BASE_URL}/users", headers=admin_headers)
         users = res_users.json().get("items", [])
         test_user = next((u for u in users if u["email"] == self.user_email), None)
         
         if not test_user:
             self._record("User Mgmt", "Precondition: Find test user in list", False, "Found", "Not Found", "User list not returning created user")
             return
             
         test_user_id = test_user["id"]
         
         # 1. Suspend User
         res_suspend = await self.client.put(f"{BASE_URL}/users/{test_user_id}/deactivate", headers=admin_headers)
         passed_suspend = res_suspend.status_code == 200
         self._record("User Mgmt", "Admin suspends test user", passed_suspend, "200 OK", f"{res_suspend.status_code}", "Suspend API failure")
         
         # 2. Test suspended user actions
         res_action = await self.client.get(f"{BASE_URL}/users/me", headers=user_headers)
         passed_block = res_action.status_code in [401, 403]  # Token should be invalid or user blocked
         self._record("User Mgmt", "Suspended user API access blocked", passed_block, "401/403 Error", f"{res_action.status_code}", "Backend not enforcing suspended status on active tokens")

    async def _test_audit_logging(self):
        print("\n  -- Testing Audit Logging --")
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        res = await self.client.get(f"{BASE_URL}/admin/audit-logs", headers=admin_headers)
        if res.status_code == 200:
             logs = res.json().get("items", [])
             # Since we did actions recently, there should be logs
             passed = len(logs) > 0
             self._record("Audit Logging", "DB contains audit logs for recent admin actions", passed, "> 0 logs", f"{len(logs)} logs", "Audit service not writing to DB")
        else:
             # Endpoint might not exist in standard form, checking DB directly isn't possible from outside without endpoint
             # I'll mark it as blocked if the endpoint doesn't exist
             self._record("Audit Logging", "Check audit logs via API", False, "200 OK", f"{res.status_code}", "Audit log retrieval API may not exist")

    def _record(self, feature, action, passed, expected, actual, root_cause):
        status = "PASS" if passed else "FAIL"
        print(f"    [{status}] {action}")
        if not passed:
            print(f"           Expected: {expected}")
            print(f"           Actual:   {actual}")
            print(f"           Possible Root Cause: {root_cause}")
            
        self.results.append({
            "feature": feature,
            "action": action,
            "passed": passed,
            "expected": expected,
            "actual": actual,
            "root_cause": root_cause if not passed else None
        })

    def _print_report(self):
        passed_count = sum(1 for r in self.results if r["passed"])
        failed_count = sum(1 for r in self.results if not r["passed"])
        
        print("\n" + "="*80)
        print(f"QA VALIDATION REPORT")
        print("="*80)
        
        # Save to JSON for exact analysis
        import json
        with open("e:/floodweb/qa_results_detailed.json", "w") as f:
             json.dump(self.results, f, indent=2)
        
        print("\n1. Executive Summary")
        print("-" * 30)
        print(f"Total Cases Run: {len(self.results)}")
        print(f"Passed:          {passed_count}")
        print(f"Failed:          {failed_count}")
        
        print(f"\n2. Admin <-> User Validation Matrix")
        print("-" * 80)
        print(f"{'FEATURE':<15} | {'ACTION':<45} | {'STATUS'}")
        print("-" * 80)
        for r in self.results:
            status = "PASS" if r["passed"] else "FAIL"
            print(f"{r['feature']:<15} | {r['action']:<45} | {status}")
            
        if failed_count > 0:
            print("\n3. Defect Report")
            print("-" * 80)
            for idx, r in enumerate([r for r in self.results if not r["passed"]]):
                print(f"Defect #{idx+1}: {r['action']}")
                print(f"  - Severity:    CRITICAL")
                print(f"  - Broken Flow: {r['feature']}")
                print(f"  - Expected:    {r['expected']}")
                print(f"  - Actual:      {r['actual']}")
                print(f"  - Root Cause:  {r['root_cause']}\n")
                
        print("\nDone.")

if __name__ == "__main__":
    asyncio.run(QAValidator().run())
