# FLOOD RESILIENCE INTEGRATION - QUICK DEPLOYMENT CHECKLIST

## Pre-Flight Checklist

- [ ] Docker installed (`docker --version`)
- [ ] Node.js 18+ installed (`node --version`)  
- [ ] PostgreSQL healthcheck passing
- [ ] Redis healthcheck passing

## Startup Checklist (Run in Order)

### Terminal 1: Backend Services
```bash
cd e:\floodweb\server

# ✓ Start containers
docker-compose up -d postgres redis

# ✓ Wait for health (should show green)
docker-compose ps

# ✓ Run migrations (creates tables if needed)
alembic upgrade head

# ✓ Start backend on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Exit Criteria**: See "Application startup complete"

### Terminal 2: Frontend
```bash
cd e:\floodweb\client

# ✓ Install dependencies (if new)
npm install

# ✓ Start dev server on port 5173
npm run dev
```

**Exit Criteria**: See "Local: http://localhost:5173/"

### Terminal 3: Health Checks
```bash
# ✓ Backend health
curl http://localhost:8000/health

# ✓ Frontend proxy works
curl http://localhost:5173/api/v1/integration/bootstrap

# ✓ SSE connects
curl -N http://localhost:5173/api/v1/integration/events
# Should show: data: {"event":"connected",...}
# Press Ctrl+C to stop
```

---

## Manual Testing Checklist

### Test 1: Admin Edit → Public Update
- [ ] Open `http://localhost:5173` in one tab (Public)
- [ ] Open `http://localhost:5173/admin` in another tab (Admin)
- [ ] Open DevTools on BOTH tabs → Network panel
- [ ] On Admin: Change a broadcast message
- [ ] Verify Network shows POST request (should not error)
- [ ] Verify SSE stream shows `adminControl.updated` event
- [ ] Check Public page updated without refresh
- [ ] ✅ PASS if all above verified

### Test 2: Browser Refresh
- [ ] Refresh PUBLIC page (Ctrl+R)
- [ ] Verify it still shows the admin-edited content
- [ ] This proves bootstrap state loaded from backend
- [ ] ✅ PASS if content persists

### Test 3: Database Persistence
- [ ] Open pgAdmin at `http://localhost:5050`
- [ ] Login (default: admin@example.com / admin)
- [ ] Navigate to: Servers → PostgreSQL → flood_resilience
- [ ] Run this query:
  ```sql
  SELECT last_modified_at FROM system_setting 
  WHERE category = 'integration'
  ORDER BY last_modified_at DESC LIMIT 1;
  ```
- [ ] Timestamp should be recent (last few seconds)
- [ ] ✅ PASS if timestamp is fresh

### Test 4: Emergency Contact Add
- [ ] On Admin page, go to Maintenance → Emergency Contacts
- [ ] Click "Add Contact" button
- [ ] Add new contact (name, number, type)
- [ ] Watch Network tab for POST to `/api/v1/emergency-contacts`
- [ ] Should get 201 response (not 500 or 404)
- [ ] Run pgAdmin query:
  ```sql
  SELECT name, phone FROM emergency_contact 
  ORDER BY created_at DESC LIMIT 1;
  ```
- [ ] New contact should appear (might need refresh)
- [ ] ✅ PASS if contact in database

### Test 5: SSE Reconnection
- [ ] On public page, open DevTools Network tab
- [ ] Find the `/api/v1/integration/events` request (EventStream)
- [ ] Right-click → Block URL
- [ ] Watch browser console: Should see reconnect logs
- [ ] Wait 2-3 seconds, unblock the URL
- [ ] New connection should establish
- [ ] Backend logs should show: `[SSE] Client connected` again
- [ ] ✅ PASS if reconnect happens and succeeds

---

## Troubleshooting Quick Links

| Error | Check |
|-------|-------|
| `net::ERR_CONNECTION_REFUSED` on localhost:8000 | Backend not running on port 8000 |
| `502 Bad Gateway` | FastAPI crashed; check backend terminal |
| SSE pending forever | Vite proxy config or CORS issue; test `/health` |
| Admin change doesn't appear on public | SSE dropped; check console for reconnect logs |
| Database errors | Run `docker-compose ps postgres` and check health |
| `404` on `/api/v1/...` routes | Routes might not be registered; check backend startup |

---

## Expected Behavior

### On Startup (First Time)
1. Backend starts, runs migrations (creates tables)
2. Frontend builds, starts dev server
3. Both show healthy status
4. Health checks pass

### During Admin Edit
1. Click button/change field in admin
2. Small delay (<500ms)
3. Network shows POST request
4. SSE gets update event
5. Public pages update instantly (no refresh)

### During SSE Drop
1. Network shows reconnect attempts
2. Logs show exponential backoff (1s, 2s, 4s, 8s, 16s, 30s)
3. After reconnect succeeds, logging stops
4. Public page stays functional (polling backup)

### During Database Check
1. Can query via pgAdmin
2. Timestamps match recent edits
3. Data matches what's shown in UI
4. No SQL errors

---

## Success Criteria

✅ All systems started without errors  
✅ Health checks pass  
✅ Admin edits visible on public page  
✅ No page refresh required for updates  
✅ Data persists in PostgreSQL  
✅ SSE reconnects and recovers  
✅ No console spam (errors, not spam)  

---

## Common Success Indicators in Logs

**Backend Terminal:**
```
✓ [SSE] Client connected
✓ [SSE] Publishing event: adminControl.updated to X subscribers
✓ [SSE] Client disconnected
```

**Frontend Console:**
```
✓ [SSE] Reconnecting in 1000ms (attempt 2) [after manual block]
✓ No "ERR_CONNECTION_REFUSED" spam
```

**pgAdmin Query Results:**
```
✓ system_setting with category='integration' and recent timestamp
✓ emergency_contact with newly added entries
```

---

## If Everything Works

🎉 Admin → Public integration is complete!

You can now:
1. Manage floods, shelters, alerts from admin panel
2. Real-time updates appear on public pages
3. Users see changes without refreshing
4. Data persists across restarts
5. System recovers from network issues automatically

---

## Next: Production Deployment

When ready for production:
1. Update CORS_ORIGINS env var to actual domain
2. Set DEBUG=false in docker-compose
3. Use `docker-compose.prod.yml` (if available)
4. Point frontend frontend to actual backend domain
5. Set up SSL/TLS certificates
6. Configure PostgreSQL backups
7. Set up monitoring/alerting

See `INTEGRATION_FIX_GUIDE.md` for full production checklist.

