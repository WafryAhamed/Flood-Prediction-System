# Flood Resilience System - QA Testing Suite

## 🚀 Quick Start

### Execute Full QA Test Suite (Recommended)

**Windows (PowerShell):**
```powershell
# Run tests with automatic backend startup
.\run_qa_tests.ps1

# Or with specific options
.\run_qa_tests.ps1 -Phase all -Verbose
```

**Linux/Mac:**
```bash
chmod +x run_qa_tests.sh
./run_qa_tests.sh
```

### Manual Backend Startup (if needed)

```bash
cd server
python -m uvicorn app.main:app --reload --port 8001
```

Then in another terminal:
```bash
python qa_comprehensive_test.py
```

---

## 📋 Test Suite Overview

### 7 Comprehensive Test Phases

| Phase | Name | Duration | Key Tests |
|-------|------|----------|-----------|
| **1** | Server Connectivity | 30s | Health check, Bootstrap config |
| **2** | Authentication | 45s | Login, JWT tokens, Refresh token |
| **3** | Core User Flows | 1m | Broadcasts, Contacts, Map markers |
| **4** | API Validation | 1m | Endpoints, Error handling, Schema |
| **5** | Real-time Features | 30s | SSE, WebSocket connectivity |
| **6** | Security | 1m | CORS, Rate limiting, Input validation |
| **7** | Performance | 2m | Load times, Response times |

**Total Duration:** ~6 minutes for full suite

---

## 🎯 Success Criteria

### For Staging Deployment ✅
- **Success Rate:** ≥ 95%
- **Critical Issues:** 0
- **Performance:** All endpoints < 500ms
- **Security:** All checks passed
- **Real-time:** Events streaming

### Phase Results
```
✅ Phase 1: 100% passed (connectivity ok)
✅ Phase 2: 100% passed (auth working)
✅ Phase 3: 100% passed (features working)
✅ Phase 4: 100% passed (apis valid)
✅ Phase 5: 100% passed (realtime ok)
✅ Phase 6: 100% passed (secure)
✅ Phase 7: 100% passed (performance ok)
```

---

## 📊 Test Results Dashboard

### Example Successful Run

```
================================================================================
                        TEST EXECUTION SUMMARY
================================================================================

Total Tests:    28
Passed:         28 ✅
Failed:         0
Success Rate:   100%
Duration:       304.2s

Phase Results:
  ✓ Phase 1: 2/2 passed
  ✓ Phase 2: 4/4 passed
  ✓ Phase 3: 4/4 passed
  ✓ Phase 4: 5/5 passed
  ✓ Phase 5: 2/2 passed
  ✓ Phase 6: 3/3 passed
  ✓ Phase 7: 2/2 passed

Status:
✅ ALL TESTS PASSED - SYSTEM READY FOR STAGING
```

### Example Partial Failure

```
✅ PASS | Backend Health Check
     └─ Status: 200

✅ PASS | Admin Login
     └─ Email: admin@floodresilience.lk, Role: super_admin

❌ FAIL | API Response Time
     └─ ERROR: Avg: 1250ms (target: <500ms)

⚠️  3 MINOR ISSUES FOUND - REVIEW BEFORE STAGING
```

---

## 🛠️ Prerequisites

### System Requirements
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Windows 10+, MacOS, or Linux
- RAM: 2GB minimum, 4GB recommended
- Disk: 500MB free space

### Required Python Packages
```bash
pip install httpx asyncio
```

### Required for Backend
```bash
cd server
pip install -r requirements.txt
# or
pip install fastapi uvicorn sqlalchemy psycopg2-binary
```

### Required for Frontend
```bash
cd client
npm install
```

---

## 🔧 Configuration

### Backend Configuration (server/app/core/config.py)
```python
DATABASE_URL = "postgresql://user:pass@localhost/flooddb"
ADMIN_EMAIL = "admin@floodresilience.lk"
ADMIN_PASSWORD = "admin123"
API_PORT = 8001
```

### Test Configuration (qa_comprehensive_test.py)
```python
BASE_URL = "http://localhost:8001"
ADMIN_EMAIL = "admin@floodresilience.lk"
ADMIN_PASSWORD = "admin123"
TIMEOUT = 10.0
```

---

## 📝 Running Individual Tests

### Phase 1 Only
```python
python -c "
import asyncio
from qa_comprehensive_test import test_phase_1_setup
asyncio.run(test_phase_1_setup())
"
```

### Quick Health Check
```bash
curl http://localhost:8001/health
# Expected: {"status": "ok"}
```

### Test Specific Endpoint
```bash
curl http://localhost:8001/api/v1/broadcasts
# Expected: {"items": [...], "total": X, "page": 1, "page_size": 10}
```

---

## 🐛 Troubleshooting

### Problem: Backend not responding
**Error:** `Connection refused: 127.0.0.1:8001`
```bash
# Check backend status
netstat -an | findstr 8001

# Start backend
cd server
python -m uvicorn app.main:app --reload --port 8001
```

### Problem: Database connection error
**Error:** `FATAL: password authentication failed`
```bash
# Check PostgreSQL is running
psql -c "SELECT 1"

# Initialize database
python server/init_db_simple.py

# Create admin user
python server/create_admin.py
```

### Problem: Tests timeout
**Error:** `Read timeout - request took too long`
```bash
# Check system load
top  # or Task Manager on Windows

# Check database performance
docker logs flood_db

# Increase timeout in qa_comprehensive_test.py
TIMEOUT = 20.0  # Increase from 10.0
```

### Problem: Authentication fails
**Error:** `Admin Login: Status: 401`
```bash
# Verify admin user exists
python -c "
from server.app.db import get_db
from server.app.models import User
db = next(get_db())
user = db.query(User).filter(User.email == 'admin@floodresilience.lk').first()
print(f'Admin user exists: {user is not None}')
"

# Recreate admin if needed
python server/create_admin.py
```

---

## 📈 Performance Benchmarks

### Target Metrics
| Metric | Target | Typical |
|--------|--------|---------|
| Bootstrap Load | < 1000ms | 200-400ms |
| API Response | < 500ms | 50-150ms |
| Authentication | < 300ms | 100-200ms |
| Database Query | < 200ms | 10-100ms |
| Real-time Latency | < 100ms | 20-50ms |

### How to Improve Performance
1. **Database:** Add indexes on frequently queried columns
2. **Caching:** Enable Redis for session/cache
3. **API:** Use pagination and limit response size
4. **Frontend:** Enable compression and lazy loading
5. **Server:** Increase worker processes, optimize queries

---

## 🔒 Security Validation

### Tests Included
- ✅ CORS headers validation
- ✅ Rate limiting verification
- ✅ Input validation & sanitization
- ✅ Token expiration & refresh
- ✅ Authorization checks
- ✅ SQL injection prevention
- ✅ XSS protection

### Security Checklist
- [ ] All endpoints require authentication (except public)
- [ ] Admin endpoints restrict to admin users
- [ ] JWT tokens have proper expiration
- [ ] CORS allows only necessary origins
- [ ] Rate limiting prevents abuse
- [ ] Input validation on all endpoints
- [ ] Sensitive data is not logged

---

## 📱 Testing User Flows

### Flow 1: Citizens App
```
1. Open app → Load home page
2. View emergency contacts → Display list
3. View flood maps → Display markers
4. Receive broadcast → Get push notification
5. Chat with AI → Process request
```

### Flow 2: Admin Dashboard
```
1. Login → Admin only
2. Create broadcast → Send to users
3. View analytics → Metrics displayed
4. Manage content → CRUD operations
5. Generate reports → Download files
```

### Flow 3: Quick Dial
```
1. Open quick dial
2. Select emergency contact
3. Initiate call/SMS
4. Confirm delivery
```

---

## 📊 Test Reporting

### Generate Test Report
```bash
# Run tests and save results
python qa_comprehensive_test.py > test_results.log 2>&1

# View results
cat test_results.log

# Or for JSON output (modify script to add JSON export)
```

### Analyze Results
```python
import json

with open('test_results.json') as f:
    results = json.load(f)
    
print(f"Total: {results['total']}")
print(f"Passed: {results['passed']}")
print(f"Success Rate: {results['passed']/results['total']*100:.1f}%")
print(f"Duration: {results['duration']:.1f}s")
```

---

## 🚀 Deployment Decision

### Ready for Staging If:
- ✅ All 7 phases completed
- ✅ Success rate ≥ 95%
- ✅ No critical errors
- ✅ Performance targets met
- ✅ Security tests passed
- ✅ Real-time features working

### Not Ready If:
- ❌ Backend unreachable
- ❌ Auth failures
- ❌ API endpoints returning errors
- ❌ Performance too slow
- ❌ Security issues found

### Deployment Commands

```bash
# Tag for release
git tag -a v1.0.0-qa-passed -m "QA testing passed"

# Create deployment branch
git checkout -b deploy/staging

# Push to staging
git push origin deploy/staging

# Trigger CI/CD pipeline
# (handled by GitHub Actions or GitLab CI)
```

---

## 📞 Support

### For Test Issues
1. Check **QA_TEST_EXECUTION_GUIDE.md** for detailed information
2. Review error messages in test output
3. Check backend logs: `server/logs/`
4. Check database logs: `docker logs flood_db`

### For Application Issues
1. Check application logs
2. Review database state
3. Verify network connectivity
4. Check system resources

### Contact
- **Team Lead:** [Contact info]
- **DevOps:** [Contact info]
- **QA Manager:** [Contact info]

---

## 📚 Additional Resources

- [Architecture Diagram](ARCHITECTURE_DIAGRAM.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Production Ready Report](PRODUCTION_READY_REPORT.md)
- [QA Audit Report](QA_AUDIT_REPORT_PHASE3.md)
- [System Verification Report](SYSTEM_VERIFICATION_REPORT.md)

---

## ✅ Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Tech Lead | | | |
| DevOps | | | |
| Project Manager | | | |

---

**Test Suite Version:** 1.0
**Last Updated:** 2024
**Status:** Ready for Production Testing
