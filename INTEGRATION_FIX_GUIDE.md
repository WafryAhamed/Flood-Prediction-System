# Flood Resilience System - Integration Fix Complete

**Last Updated**: March 23, 2026  
**Status**: ✅ All Critical Fixes Implemented

---

## EXECUTIVE SUMMARY

The admin and public pages are now fully integrated through the backend. All admin changes will be persisted to PostgreSQL and broadcast to public users in near-real-time via SSE.

### What Was Fixed

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| API calls fail with ERR_CONNECTION_REFUSED | Frontend used env var for backend URL, didn't handle missing config | Now uses Vite proxy consistently for dev |
| SSE disconnects without reconnect | No error handling in EventSource | Added exponential backoff reconnection logic |
| Console spam from connection errors | Every failed fetch logged as warning | Silent failures for connection refused; logged only on real errors |
| Some components isolated from state updates | Not all pages subscribed to real-time sync | usePlatformRealtimeSync() already in App.tsx and being called |
| Unknown database connectivity | No logging of backend→DB flow | Added connection logging in integration_state.py |

---

## ARCHITECTURE AFTER FIX

```
Admin Page                               Public Pages
    ↓                                        ↓
Zustand Store                          Zustand Store
(adminControlStore)                    (same shared store)
    ↓                                        ↓
API Client                              API Client
(uses /api proxy)                       (uses /api proxy)
    ↓                                        ↓
Vite Proxy (localhost:5173)             Vite Proxy (localhost:5173)
    ↓                                        ↓
FastAPI Backend (localhost:8000)
    ↓
PostgreSQL Database (in Docker)
    ↓
[Persistence]
↓
[Event Publishing via SSE]
    ↓
Broadcast to all connected clients
    ↓
Front-end EventSource
    ↓
Update Zustand
    ↓
Re-render Public Pages
```

---

## DEPLOYMENT INSTRUCTIONS

### Development Environment (localhost:5173 → localhost:8000)

#### Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ installed  
- PostgreSQL running in Docker (flood_postgres container)
- Redis running in Docker (flood_redis container)

#### Step 1: Start Backend Services

```bash
cd e:\floodweb\server

# Start Docker containers
docker-compose up -d postgres redis

# Wait 10 seconds for services to be healthy
sleep 10

# Install Python dependencies if needed
pip install -r requirements.txt

# Run Alembic migrations (handles schema)
alembic upgrade head

# Start FastAPI (reload mode for development)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
✓ Database connected
✓ Extensions initialized
```

#### Step 2: Start Frontend

In a new terminal:

```bash
cd e:\floodweb\client

# Install dependencies (first time only)
npm install

# Start Vite dev server
npm run dev
```

**Expected Output:**
```
  VITE v8.0.1  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

#### Step 3: Verify Health

In another terminal or curl:

```bash
# Check backend is alive
curl http://localhost:8000/health

# Expected: {"status":"healthy","database":"connected",...}

# Check frontend can reach backend through proxy
curl http://localhost:5173/api/v1/integration/bootstrap

# Expected: {"adminControl":{...},"maintenance":{...},"reports":[...]}

# Test SSE
curl -N http://localhost:5173/api/v1/integration/events

# Expected: data: {"event":"connected","payload":{"ok":true},...}
#           data: {"event":"keepalive",...}
```

---

## TESTING THE ADMIN → PUBLIC FLOW

### Test Scenario 1: Broadcast Message Change

#### Setup
1. Open http://localhost:5173/ (public page with emergency dashboard)
2. Open http://localhost:5173/admin (admin page)
3. Open browser DevTools → Network tab on both

#### Steps
1. **Admin**: Go to Broadcast tab (left sidebar)
2. **Admin**: Click "Add Alert" and enter a test message
3. **Watch Network**: Should see POST to `/api/v1/admin-control`
4. **Watch Network**: Should see SSE event with `"event":"adminControl.updated"`
5. **Public**: Emergency Dashboard should update with new alert
6. **Verify**: No full page refresh occurred

#### Troubleshooting
- If no SSE event: Check browser DevTools → Network, look for `/api/v1/integration/events`
- If request fails: Check Network tab for 404 or 502 errors
- If no store update: Check browser Console for errors in usePlatformRealtimeSync

### Test Scenario 2: Emergency Contact Edit

#### Steps
1. **Admin**: Go to Maintenance tab (left sidebar)
2. **Admin**: Find Emergency Contacts section
3. **Admin**: Click to edit one (e.g., change police number)
4. **Watch Network**: POST to `/api/v1/emergency-contacts/{id}` 
5. **Watch Backend Logs**: Should see `[SSE] Publishing event: maintenance.updated`
6. **Public**: Check if emergency contact appears in any public page
7. **Verify**: No manual refresh needed

### Test Scenario 3: SSE Reconnection

#### Steps
1. Open public page with DevTools open
2. Network tab → right-click on `/api/v1/integration/events` → Block request URL
3. Page will try to reconnect
4. Watch console: Should see `[SSE] Reconnecting in 1000ms`
5. After reconnect delay, request unblocked
6. Watch Network: New SSE connection established
7. Unblock in DevTools
8. Within 5 seconds, new connection should succeed
9. Verify: `[SSE] Client connected` appears in backend logs

---

## DATABASE VERIFICATION WITH pgADMIN 4

### Connect to Database
1. Open http://localhost:5050 (pgAdmin)
2. Login (admin@example.com / admin by default, or set in docker-compose)
3. Servers → PostgreSQL → flood_resilience database

### Key Verification Queries

#### 1. Check Integration State was Persisted
```sql
SELECT key, value_type, last_modified_at 
FROM system_setting 
WHERE category = 'integration'
ORDER BY last_modified_at DESC;
```

**Expected Result:**
- 2-3 rows with keys: `adminControl`, `maintenance`
- `value_type`: all `json`
- `last_modified_at`: recent timestamps

#### 2. Verify Admin Control State
```sql
SELECT 
  key, 
  json_agg(json_build_object(
    'text', value #>> '{broadcastFeed,0,text}',
    'time', value #>> '{broadcastFeed,0,time}'
  )) as latest_broadcasts
FROM system_setting
WHERE key = 'adminControl'
GROUP BY key;
```

#### 3. Check Map Markers (if edited)
```sql
SELECT 
  (value -> 'mapMarkers')::jsonb as markers_count,
  last_modified_at
FROM system_setting
WHERE key = 'maintenance'
LIMIT 1;
```

#### 4. Verify Emergency Contacts from Database
```sql
SELECT 
  id, 
  name, 
  phone, 
  category, 
  is_active, 
  created_at,
  updated_at
FROM emergency_contact
ORDER BY created_at DESC
LIMIT 10;
```

#### 5. Check Reports Created Through API
```sql
SELECT 
  public_id,
  status,
  urgency,
  location_description,
  latitude,
  longitude,
  submitted_at,
  updated_at
FROM citizen_report
ORDER BY submitted_at DESC
LIMIT 10;
```

#### 6. Verify PostGIS is Enabled
```sql
SELECT PostGIS_Version();
```

**Expected:** Version string like `3.4.2 built on PostGIS 3.4.2`

#### 7. Check Database Size
```sql
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'flood_resilience';
```

#### 8. List All System Settings
```sql
SELECT 
  key,
  category,
  value_type,
  is_sensitive,
  last_modified_at
FROM system_setting
ORDER BY category, key;
```

---

## TROUBLESHOOTING GUIDE

### Problem: API calls return 502 Bad Gateway

**Possible Causes:**
1. FastAPI not running on port 8000
2. Vite proxy configured incorrectly
3. FastAPI crashed during request

**Solution:**
```bash
# Check if FastAPI is running
curl http://localhost:8000/health

# If not responding, restart it
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Check Vite proxy config
cat client/vite.config.ts | grep -A 10 "proxy:"

# Check for errors in backend terminal
```

### Problem: SSE Not Connecting (Network shows pending)

**Possible Causes:**
1. Backend SSE endpoint not using chunked encoding
2. Vite proxy blocking event-stream content-type
3. CORS not allowing the connection

**Solution:**
```bash
# Direct test bypassing proxy
curl -v http://localhost:8000/api/v1/integration/events

# Should show:
# > Content-Type: text/event-stream
# > Transfer-Encoding: chunked
# data: {"event":"connected",...}

# If fails at 8000 but works at 5173, issue is proxy
# Check proxyRes setup in vite.config.ts
```

### Problem: Store Not Updating After Admin Change

**Possible Causes:**
1. Bootstrap fetch failed silently
2. SSE event lost or malformed
3. Store hydration logic not triggered
4. Wrong event name in store switch statement

**Solution:**
```javascript
// In browser console on public page:
// 1. Check store state
localStorage.debug = '*'; // Enable all debug logs
window.location.reload();

// 2. Watch what events arrive
// In DevTools Network → Events (SSE stream)
// Should see event stream with updates

// 3. Check if store has the data
// Open any page component that uses the store
// Check Zustand state in browser Redux DevTools if installed
```

### Problem: Admin Changes Not Persisting (Admin page updates then reverts)

**Possible Causes:**
1. saveAdminControlState() throwing error
2. Backend endpoint returning 5xx error
3. Database commit failed

**Solution:**
```bash
# Check backend logs for errors
docker logs flood_api | tail -50

# Manually test the save endpoint
curl -X PUT http://localhost:8000/api/v1/integration/admin-control \
  -H "Content-Type: application/json" \
  -d '{"broadcastFeed": [{"text": "test"}]}'

# Should return 200 with the saved state
```

### Problem: Database Connection Refused

**Possible Causes:**
1. PostgreSQL container not running
2. Wrong DATABASE_URL in .env
3. Port 5432 not exposed from container

**Solution:**
```bash
# Check if Postgres is running
docker ps | grep flood_postgres

# If not, start it
docker-compose up -d postgres

# Check connection string in docker-compose.yml
# Should be: postgresql+asyncpg://postgres:password@postgres:5432/flood_resilience

# Wait for health check to pass
docker-compose ps postgres
# STATUS should show "healthy"
```

---

## MONITORING IN PRODUCTION

### Enable Debug Logging
```python
# In app/main.py or through environment
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Key Logs to Watch
```
[SSE] Client connected → Someone opened public page
[SSE] Publishing event → Admin made a change
[SSE] Client disconnected → User closed page/lost connection
```

### Performance Metrics
- SSE subscriber count (logs show number)
- Event publishing latency (should be <100ms)
- Bootstrap fetch time (should be <500ms)
- Poll interval when SSE unavailable (30s)

---

## ROLLBACK PLAN

If issues arise, these are reversible changes:

### Frontend Rollback
```bash
# Revert to using VITE_BACKEND_URL
# In integrationApi.ts, change buildUrl to:
const backendBase = import.meta.env.VITE_BACKEND_URL || '';
return `${backendBase}${integrationPrefix}${path}`;

# Set env var
echo "VITE_BACKEND_URL=http://localhost:8000" >> .env

# Restart: npm run dev
```

### Backend Rollback
```bash
# Remove logging changes (optional, just noise)
# Revert CORS changes if issues
# Rebuild: docker-compose up --build
```

All code changes are minimal and don't affect core logic.

---

## NEXT STEPS

1. ✅ Run deployment steps above
2. ✅ Perform Test Scenarios 1-3
3. ✅ Run pgAdmin verification queries
4. ✅ Monitor logs for SSE activity
5. Make sure frontend and backend builds are fresh
6. Test on multiple browsers (Chrome, Firefox, Safari)
7. Test on mobile (check responsive SSE)
8. Test network conditions (throttle SSE to see fallback polling)

---

## CONTACT & SUPPORT

For issues:
1. Check browser DevTools Console for errors
2. Check `docker logs flood_api` for backend errors
3. Verify all requirements in Prerequisites section
4. Run verification queries in pgAdmin
5. Check this troubleshooting section

