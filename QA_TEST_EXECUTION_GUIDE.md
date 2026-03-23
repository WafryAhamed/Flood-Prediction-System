# QA Testing Execution Guide

## Overview
Complete QA testing suite for Flood Resilience System. This guide provides step-by-step instructions for running comprehensive validation tests.

## Prerequisites
- Backend server running on `http://localhost:8001`
- Frontend running on `http://localhost:5173`
- Admin user: `admin@floodresilience.lk` / `admin123`
- Database populated with test data
- Python 3.8+ with required packages: `httpx`, `asyncio`

## Test Phases

### Phase 1: Server Connectivity & Baseline ✓
**Duration:** ~30 seconds
**Tests:**
- Backend health check (`/health`)
- Bootstrap endpoint validation
- Server response verification

**Success Criteria:**
- Backend responds to health check
- Bootstrap returns adminControl and maintenance configs
- All servers are accessible

### Phase 2: Authentication & Authorization ✓
**Duration:** ~45 seconds
**Tests:**
- Admin login success
- Invalid credentials rejection
- Token refresh flow
- Unauthorized access blocking
- Role-based access control

**Success Criteria:**
- Admin can login and receive JWT tokens
- Invalid credentials return 401
- Token refresh generates valid new token
- Unauthorized requests are rejected

### Phase 3: Core User Flows ✓
**Duration:** ~1 minute
**Tests:**
- List broadcasts (public endpoint)
- Create broadcast (admin only)
- Get emergency contacts
- Get map markers
- User data access

**Success Criteria:**
- Broadcasts list returns paginated data
- Admin can create broadcasts
- Emergency contacts are retrievable
- Map markers load correctly

### Phase 4: API Validation ✓
**Duration:** ~1 minute
**Tests:**
- GET endpoint responses
- Error handling (404, 401, 400)
- Response format validation
- Data consistency

**Success Criteria:**
- All GET endpoints return HTTP 200
- Invalid requests return appropriate error codes
- Responses include required fields
- Data matches expected schema

### Phase 5: Real-time Features ✓
**Duration:** ~30 seconds
**Tests:**
- SSE (Server-Sent Events) endpoint
- WebSocket availability
- Event stream connectivity

**Success Criteria:**
- SSE endpoint accepts connections
- WebSocket endpoint is accessible
- Real-time data streams are established

### Phase 6: Security & Headers ✓
**Duration:** ~1 minute
**Tests:**
- CORS headers validation
- Rate limiting verification
- Input validation
- Security headers

**Success Criteria:**
- CORS is properly configured
- Rate limiting is active
- Invalid input is rejected
- Security headers are present

### Phase 7: Performance Baseline ✓
**Duration:** ~2 minutes
**Tests:**
- Bootstrap load time (<1000ms)
- API response time (<500ms)
- Database query performance
- Memory usage monitoring

**Success Criteria:**
- Bootstrap loads in <1 second
- API calls complete in <500ms
- No memory leaks detected
- System remains stable under normal load

## Running Tests

### Quick Start
```bash
# Ensure backend is running
cd server
python -m uvicorn app.main:app --reload --port 8001

# In another terminal, run tests
cd ..
python qa_comprehensive_test.py
```

### Individual Phase Testing
```bash
# Test specific phases by modifying the script
# Or use the modular test runner below
```

### Docker Testing
```bash
# Run backend in Docker
docker-compose -f server/docker-compose.yml up -d

# Wait for services to start (30 seconds)
sleep 30

# Run tests
python qa_comprehensive_test.py
```

## Test Results Interpretation

### Green (✅ PASS)
- Test completed successfully
- Assert all passed
- System behaves as expected

### Red (❌ FAIL)
- Test did not meet success criteria
- Assertion failed
- System behavior differs from expectation
- Check error message for details

### Summary Metrics
- **Total Tests:** Count of all individual test assertions
- **Passed:** Number of successful tests
- **Failed:** Number of failed tests
- **Success Rate:** Percentage of passing tests
- **Duration:** Total execution time

## Output Examples

### Successful Run
```
================================================================================
                          PHASE 1: SERVER CONNECTIVITY & BASELINE
================================================================================

✅ PASS | Backend Health Check
     └─ Status: 200

✅ PASS | Bootstrap Endpoint
     └─ Admin Control: dict, Maintenance: dict
```

### Failed Run
```
❌ FAIL | Admin Login
     └─ ERROR: Connection refused - backend not responding

⚠️  TESTING STOPPED - Fix issues before continuing
```

## Troubleshooting

### Backend Not Responding
**Error:** `Connection refused: 127.0.0.1:8001`
**Solution:**
1. Check if backend is running: `ps aux | grep uvicorn`
2. Start backend: `cd server && python -m uvicorn app.main:app --reload --port 8001`
3. Verify database is initialized: `python init_db_simple.py`

### Authentication Failed
**Error:** `Admin Login: Status: 401`
**Solution:**
1. Verify admin user exists: `python create_admin.py`
2. Check credentials in `qa_comprehensive_test.py`
3. Verify database connection

### API Endpoint Not Found
**Error:** `GET Broadcasts: Status: 404`
**Solution:**
1. Check backend is fully started (wait 10 seconds after startup)
2. Verify database migrations: `alembic upgrade head`
3. Check API routes in `server/app/api/`

### Timeout Errors
**Error:** `Read timeout - request took too long`
**Solution:**
1. Check database performance
2. Monitor system resources
3. Reduce concurrent test load if needed

## Performance Benchmarks

### Target Metrics
- Bootstrap endpoint: < 1000ms
- API list endpoints: < 500ms
- Authentication: < 300ms
- Database queries: < 200ms
- Real-time events: < 100ms latency

### Expected Results
- Backend startup: ~5 seconds
- Full test suite: ~6 minutes
- All phases completion: 100%

## Continuous Testing

### Recommended Schedule
- **Daily:** Run full test suite before deployments
- **Hourly:** Run health check during business hours
- **Per-commit:** Run Phase 1-2 locally before push
- **Nightly:** Run extended performance tests

### CI/CD Integration
```bash
# Add to CI/CD pipeline
stage: quality_assurance
script:
  - python qa_comprehensive_test.py
  - if [ $? -eq 0 ]; then echo "QA PASSED"; else echo "QA FAILED"; fi
```

## Debugging Tests

### Enable Verbose Output
```python
# Modify qa_comprehensive_test.py
DEBUG = True  # Add at top
# View detailed request/response
print(f"Request: {request}")
print(f"Response: {response.json()}")
```

### Test Individual Endpoints
```python
import httpx

async def test_single():
    async with httpx.AsyncClient() as client:
        response = await client.get("http://localhost:8001/api/v1/broadcasts")
        print(response.json())

asyncio.run(test_single())
```

### Monitor Test Execution
```bash
# Watch test output in real-time
tail -f qa_test_results.log

# Monitor system during tests
watch -n 1 'ps aux | grep python'
```

## Known Issues & Workarounds

### Issue: SSE Timeout
**Status:** Expected behavior
**Workaround:** Stream endpoints timeout after connection - this is normal
**Resolution:** Tests validate endpoint accessibility, not full stream

### Issue: Rate Limiting Test Inconsistent
**Status:** Depends on system load
**Workaround:** Run test during low-load periods
**Resolution:** Adjust rate limit thresholds if needed

### Issue: Performance Metrics Vary
**Status:** Normal - system load dependent
**Workaround:** Run multiple times and average results
**Resolution:** Profile system during testing

## Success Criteria for Staging

✅ All Phases Completed
✅ Success Rate ≥ 95%
✅ No Critical Errors
✅ Performance Targets Met
✅ Security Tests Passed
✅ Real-time Features Working

## Next Steps After Testing

### If All Tests Pass (✅)
1. Review test summary
2. Check performance metrics
3. Proceed to staging deployment
4. Schedule post-deployment verification

### If Minor Issues (⚠️)
1. Review failed test details
2. Investigate root causes
3. Fix non-critical issues
4. Re-run Phase 1-2 only
5. Proceed to staging with caution

### If Critical Issues (❌)
1. Stop all test execution
2. Analyze error messages
3. Fix critical failures
4. Run Phase 1 only to verify fix
5. Re-run full suite before proceeding

## Support & Escalation

For issues, check:
1. Backend logs: `server/logs/`
2. Database logs: `docker logs flood_db`
3. Error details from test output
4. Application documentation

## Test Report Generation

```bash
# Generate HTML report (optional)
python -m pytest qa_comprehensive_test.py --html=report.html

# Generate JSON report
python qa_comprehensive_test.py > test_results.json
```

---

**Last Updated:** 2024
**Version:** 1.0
**Status:** Production Ready
