# ⚡ QUICK ACTION GUIDE - FIX AUTH & COMPLETE TESTING
**Status**: 66.7% Tests Passing → Target: 100% ✅  
**Time Estimate**: 20-30 minutes  
**Created**: March 23, 2026

---

## THE PROBLEM
Test Suite shows 500 error on login endpoint:
```
❌ FAIL: Admin Login - Status 500
   Error: {"detail":"Internal server error"}
```

**Solution**: Verify/create admin user in database

---

## STEP 1: CHECK IF ADMIN USER EXISTS (2 minutes)

### Method A: Using pgAdmin4 (Recommended)
1. Open browser → http://localhost:5050
2. Login (if prompted): pgAdmin4 credentials
3. Expand **Servers** → **PostgreSQL** → **flood_resilience** → **Schemas** → **public** → **Tables**
4. Find **users** table → Right-click → **View/Edit Data** → **All Rows**
5. Search for email: `admin@floodresilience.lk`

**Expected User Row**:
```
id    | email                       | username | is_active | created_at
───── | ───────────────────────────── | ──────── | ───────── | ─────────
UUID  | admin@floodresilience.lk  | admin    | true      | 2026-03-...
```

If found → Jump to TESTING (Step 3)  
If NOT found → STEP 2: Create Admin User

### Method B: Using pgAdmin4 Query Tool
1. pgAdmin4 home → **Tools** → **Query Tool**
2. Paste this query:
   ```sql
   SELECT id, email, username, is_active, created_at
   FROM users
   WHERE email = 'admin@floodresilience.lk';
   ```
3. Click **Execute** (or press F5)

**If empty result** → User doesn't exist → STEP 2

---

## STEP 2: CREATE ADMIN USER (5 minutes)

### Method A: Using Python Script (Simplest)
```bash
cd e:\floodweb\server

# Check if create_admin.py exists
ls create_admin.py

# Run it
python create_admin.py
```

**Expected output**:
```
✅ Admin user created successfully
Email: admin@floodresilience.lk
Username: admin
Password: admin123
```

If script not found, try these alternatives:
```bash
python scripts/init_db.py
# OR
python app/scripts/create_admin.py
# OR
python init_db_simple.py
```

### Method B: SQL Query (If no script available)
1. pgAdmin4 → **Query Tool**
2. Run this script to create user AND assign admin role:
   ```sql
   -- Step 1: Create admin user (if not exists)
   INSERT INTO users (
       id, email, username, password_hash, 
       is_active, email_verified, created_at, updated_at
   )
   VALUES (
       gen_random_uuid(),
       'admin@floodresilience.lk',
       'admin',
       '$2b$12$abcdefghijklmnopqrstuvwxyz...',  -- bcrypt hash of "admin123"
       true,
       true,
       NOW(),
       NOW()
   )
   ON CONFLICT (email) DO NOTHING;
   
   -- Step 2: Get admin role ID
   -- INSERT role if not exists
   INSERT INTO roles (id, name, description, created_at)
   VALUES (gen_random_uuid(), 'admin', 'Administrator', NOW())
   ON CONFLICT (name) DO NOTHING;
   
   -- Step 3: Link user to role
   INSERT INTO user_roles (user_id, role_id, assigned_at)
   SELECT u.id, r.id, NOW()
   FROM users u, roles r
   WHERE u.email = 'admin@floodresilience.lk'
     AND r.name = 'admin'
   ON CONFLICT DO NOTHING;
   ```

**NOTE**: The bcrypt hash above is a placeholder. For security, use the create_admin.py script instead.

### Method C: Via Backend Python
```python
import asyncio
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.auth import User
from app.core.security import get_password_hash

async def create_admin():
    async with async_session_factory() as session:
        admin = User(
            email="admin@floodresilience.lk",
            username="admin",
            password_hash=get_password_hash("admin123"),
            is_active=True,
            email_verified=True
        )
        session.add(admin)
        await session.commit()
        print(f"✅ Admin user created: {admin.email}")

# Run this
asyncio.run(create_admin())
```

---

## STEP 3: VERIFY ADMIN USER WAS CREATED (2 minutes)

### Test Login with Credentials
```bash
cd e:\floodweb

# Create test_login_verify.py
cat > test_login_verify.py << 'EOF'
import httpx
import asyncio
import json

async def test_login():
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "admin@floodresilience.lk",
                "password": "admin123"
            }
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("\n✅ LOGIN SUCCESSFUL!")
            token = response.json().get("access_token")
            print(f"Token (first 30 chars): {token[:30]}...")
        else:
            print(f"\n❌ LOGIN FAILED!")

asyncio.run(test_login())
EOF

python test_login_verify.py
```

**Expected output if successful**:
```
Status: 200
Response: {
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": "...",
    "email": "admin@floodresilience.lk",
    "username": "admin",
    "is_active": true
  }
}

✅ LOGIN SUCCESSFUL!
Token (first 30 chars): eyJ0eXAiOiJKV1QiLCJhbGc...
```

If still getting 500 error:
- Check backend server terminal for detailed error trace
- Verify database connectivity: run `python server/test_db.py`
- Check environment variables are loaded

---

## STEP 4: RUN COMPLETE TEST SUITE (5 minutes)

Once login is working, run the full test suite:

```bash
cd e:\floodweb
python test_complete_system.py
```

**Expected output** (all tests passing):
```
================================================================================
COMPREHENSIVE SYSTEM TEST SUITE
================================================================================

Test Group 1: Connectivity & Authentication
✅ PASS: Health Check
✅ PASS: Database Connectivity  
✅ PASS: Admin Login ← NOW WORKING!

Test Group 2: Data Fetching & Integration
✅ PASS: Bootstrap Data
✅ PASS: List Reports
✅ PASS: List Broadcasts
✅ PASS: Get Districts
✅ PASS: Get Shelters

Test Group 3: API Operations
✅ PASS: Create Report
✅ PASS: Chat Endpoint

================================================================================
TEST RESULTS SUMMARY
================================================================================
Total Tests: 10
Passed: 10
Failed: 0
Success Rate: 100% ✅
Duration: 6.24s
================================================================================
```

---

## STEP 5: VERIFY REAL-TIME EVENTS (3 minutes)

### Test SSE Streaming
1. Open browser DevTools → **Network** tab
2. Filter for `EventSource` or `fetch`
3. In browser console, run:
   ```javascript
   // Open EventSource connection
   const eventSource = new EventSource('http://localhost:8000/api/v1/integration/events');
   eventSource.onmessage = (event) => {
       console.log('📡 SSE Event:', event.data);
   };
   ```
4. You should see events flowing in console every 5-30 seconds

**Expected events**:
```
📡 SSE Event: {"adminControl": {"broadcastFeed": [...]}}
📡 SSE Event: {"maintenance": {"emergencyContacts": [...]}}
📡 SSE Event: {"reports": [...]}
```

### Test WebSocket (Optional)
Install wscat:
```bash
npm install -g wscat
```

Connect to WebSocket:
```bash
wscat -c ws://localhost:8000/api/v1/ws/alerts
```

Should stay connected and receive alert messages.

---

## STEP 6: DATABASE INTEGRITY CHECK (3 minutes)

Run these SQL queries in pgAdmin4 Query Tool:

### Query 1: Count records in critical tables
```sql
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'broadcasts', COUNT(*) FROM broadcasts
UNION ALL
SELECT 'ci_reports', COUNT(*) FROM ci_reports
UNION ALL
SELECT 'emergency_contacts', COUNT(*) FROM emergency_contacts;
```

**Expected**: All count > 0 (at least 1 user, others can be 0)

### Query 2: Verify admin has admin role
```sql
SELECT 
    u.email,
    string_agg(r.name, ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@floodresilience.lk'
GROUP BY u.email;
```

**Expected**:
```
email                      | roles
─────────────────────────── | ──────
admin@floodresilience.lk  | admin
```

### Query 3: Check for data consistency
```sql
-- Check for orphaned records
SELECT COUNT(*) FROM ci_reports WHERE reporter_id IS NOT NULL
  AND reporter_id NOT IN (SELECT id FROM users);
```

**Expected**: Count = 0 (no orphaned records)

---

## TROUBLESHOOTING

### If Login Still Fails After Creating User

**Check 1**: Verify password hash algorithm
```bash
# In server/app/core/security.py, check:
# - ALGORITHM = "HS256"  (for JWT)
# - Uses get_password_hash() and verify_password()
# - Both should use bcrypt
```

**Check 2**: Check for typos in credentials
```bash
# Make sure EXACT match:
# Email: admin@floodresilience.lk (lowercase)
# Password: admin123 (no extra spaces)
```

**Check 3**: Check backend logs
```bash
# In the terminal where uvicorn is running, look for:
# - "ERROR" 
# - "Traceback"
# - "Exception"

# Copy the error message and search the code:
# server/app/api/v1/auth.py
# server/app/services/auth_service.py
```

**Check 4**: Test database directly
```bash
cd e:\floodweb\server
python test_db.py  # If available
python  # Launch Python REPL
```

```python
import asyncio
from sqlalchemy import select
from app.db.session import async_session_factory
from app.models.auth import User

async def check():
    async with async_session_factory() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        print(f"Total users: {len(users)}")
        for user in users:
            print(f"  - {user.email}")

asyncio.run(check())
```

---

## CHECKLIST - MARK OFF AS YOU COMPLETE

### Phase 1: Admin User Setup
- [ ] Checked if admin user exists (STEP 1)
- [ ] Created admin user if needed (STEP 2)
- [ ] Verified login works (STEP 3)

### Phase 2: Full Testing
- [ ] Ran complete test suite (STEP 4)
- [ ] All 10 tests passing
- [ ] No failed tests remaining

### Phase 3: Real-time Verification
- [ ] Tested SSE streaming (STEP 5)
- [ ] Verified WebSocket alerts (optional)
- [ ] Events flowing correctly

### Phase 4: Database Validation
- [ ] Ran integrity queries (STEP 6)
- [ ] No orphaned records
- [ ] Admin role assigned correctly

### Final Status
- [ ] **READY FOR PRODUCTION** ✅
- [ ] All systems operational
- [ ] All tests passing
- [ ] No critical issues

---

## SUPPORT RESOURCES

### If Something Goes Wrong

1. **Check Backend Logs** → Terminal where uvicorn started
2. **Check Browser Console** → Press F12 in browser
3. **Check Database** → pgAdmin4 query tool
4. **Check Files**:
   - [PRODUCTION_READY_FINAL_REPORT.md](PRODUCTION_READY_FINAL_REPORT.md) - Full system report
   - [COMPREHENSIVE_TESTING_DEBUG_REPORT.md](COMPREHENSIVE_TESTING_DEBUG_REPORT.md) - Detailed debugging guide
   - [PGADMIN4_DEBUGGING_QUERIES.sql](PGADMIN4_DEBUGGING_QUERIES.sql) - 50+ SQL queries for database debugging

5. **Contact Resources**:
   - Backend code: [server/app/api/v1/auth.py](server/app/api/v1/auth.py)
   - Database models: [server/app/models/auth.py](server/app/models/auth.py)
   - Configuration: [server/app/core/config.py](server/app/core/config.py)

---

## ESTIMATED TIMELINE

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Check admin user | 2 min | ⏳ TODO |
| 2 | Create admin if needed | 3 min | ⏳ TODO |
| 3 | Verify login | 2 min | ⏳ TODO |
| 4 | Run full test suite | 5 min | ⏳ TODO |
| 5 | Verify real-time | 3 min | ⏳ TODO |
| 6 | Database check | 3 min | ⏳ TODO |
| . | **TOTAL** | **20 min** | . |

**Target Completion**: 20-30 minutes  
**Deadline**: Before deployment to production

---

**Next Steps**: Follow STEP 1 → STEP 6 in order  
**Goal**: All 10 tests passing, system production-ready ✅

Good luck! 🚀
