# 🚨 Admin-to-User Data Connection Diagnostic Report

**Date:** March 24, 2026  
**System:** Flood Resilience Platform  
**Status:** ❌ CRITICAL DISCONNECTION FOUND  
**Severity:** HIGH - User side shows static/outdated data, admin changes never reach users

---

## Executive Summary

The admin dashboard and user-side display are **heavily disconnected**. Admin control changes (weather, alerts, metrics, status) are made locally in the frontend but **never persist to the database** or **trigger real-time updates** to the user interface.

**Core Issue:** Admin changes exist only in frontend state. User UI never sees them without manual database updates.

**Impact:**
- Admin sets weather overrides → User sees real weather (not overrides)
- Admin creates alerts → User doesn't see them (only hardcoded data)
- Admin updates metrics → User sees hardcoded values
- No real-time sync of admin control to user experience
- On page refresh, all admin changes are lost

---

## 1. Architecture Overview

### Data Flow (CURRENT - BROKEN)

```
ADMIN SIDE                          USER SIDE
━━━━━━━━━━━━━━━━━                  ━━━━━━━━━━━
setWeatherOverrides()    →   (LOCAL STATE)   ✗ No API Call
  [temp, wind, rain]                        ✗ No DB Save
     ↓                                       ✗ No Event
  ❌ STOPS HERE                             
                                   useWeatherData()
                                      ↓
                                   GET /weather/current
                                      ↓
                                   OLD WEATHER DATA
                                      ↓
                                   User sees real data, not overrides
```

### Data Flow (REQUIRED - FIXED)

```
ADMIN SIDE                              DB                  USER SIDE
━━━━━━━━━━━━━━━━━                      ━━                  ━━━━━━━━━━━━━
setWeatherOverrides()
   ↓
PUT /api/v1/integration/weather-overrides
   ↓                    
Updates DB ✓ ────────→ weather_overrides table
   ↓
publish_event("admin.weather-changed")
   ↓
SSE broadcast to all connected clients
                               ←────── User subscribes to SSE
                               ←────── Receives event  
                               ↓
                               Update local state
                               ↓
                               EmergencyDashboard refreshes
                               ↓
                               Shows admin overrides instantly ✓
```

---

## 2. Detailed Findings by Component

---

### 2.1 Weather Overrides (BROKEN)

**Component:** Admin Command Center  
**Files:**
- Frontend: `client/src/stores/adminCentralStore.ts` (lines 44-50, 108-112)
- Frontend UI: Not found in admin dashboard (need to locate)
- Backend: `server/app/api/v1/integration.py`

**Current Status:** ❌ **NOT CONNECTED**

#### What Works:
- ✅ Admin can set weather overrides in Zustand store (`setWeatherOverrides` action)
- ✅ State structure exists: `{ windSpeed, rainfall, temperature }`
- ✅ Backend has `PUT /admin-control` endpoint to save state
- ✅ Integration state service can persist to database (via `system_settings` table)
- ✅ `fetchBootstrapState()` exists to load state on app startup

#### What's Broken:
❌ **No API call when admin saves weather overrides**
- `setWeatherOverrides` only updates local Zustand state
- Does not call `saveAdminControlState()` or any backend API
- Changes lost on page refresh

❌ **No dedicated weather override endpoint**
- Could use `PUT /admin-control` but need to ensure it saves to DB
- No way to specifically fetch just weather overrides
- User side can't query stored overrides

❌ **User side never fetches admin overrides**
- `EmergencyDashboard.tsx` reads from `dashboardOverrides` store
- But `dashboardOverrides` is in `maintenanceStore`, not from backend
- `useWeatherData()` hook fetches from `/weather/current` API
- Fallback: `windSpeed ?? weather?.windSpeed` (always uses API data)

❌ **No event broadcast on weather override changes**
- No `publish_event()` call after admin saves
- SSE won't trigger user UI refresh
- User must manually refresh page

❌ **Database doesn't store weather overrides**
- No dedicated `weather_overrides` table
- `system_settings` could work but no schema for structure
- No migration or table definition

#### Data Flow Diagram:
```
Admin Dashboard (UI)
   ↓
setWeatherOverrides()  ← Only local state update
   ↓
adminCentralStore.weatherOverrides = { 29, 8, 2.5 }  ✓
   ↓
❌ STOPS - No API call
   ↓
Backend never sees this data
   ↓
Database never updated
   ↓
LOST ON REFRESH
```

#### File Locations:
- **Admin store:** [client/src/stores/adminCentralStore.ts](client/src/stores/adminCentralStore.ts#L44-L112)
- **Integration API:** [server/app/api/v1/integration.py](server/app/api/v1/integration.py#L222-L227)
- **Integration state service:** [server/app/services/integration_state.py](server/app/services/integration_state.py#L140-L190)

---

### 2.2 Alerts & Broadcasts (BROKEN)

**Component:** Emergency Alerts / Active Broadcasts  
**Files:**
- Backend API: `server/app/api/v1/broadcasts.py`
- Frontend admin: Need to locate admin broadcast creation UI
- Frontend user: `client/src/pages/EmergencyDashboard.tsx`

**Current Status:** ❌ **PARTIALLY BROKEN - API EXISTS, FRONTEND DOESN'T USE IT**

#### What Works:
- ✅ Backend broadcast API fully implemented:
  - `GET /broadcasts` - List all broadcasts with pagination
  - `GET /broadcasts/active` - Get currently active broadcasts (filtered by date/status)
  - `POST /broadcasts` - Create broadcast (admin only)
  - `POST /broadcasts/{id}/publish` - Publish broadcast
  - `POST /broadcasts/{id}/cancel` - Cancel broadcast
  - `PATCH /broadcasts/{id}` - Update broadcast
- ✅ Database schema exists: `broadcasts` table with full fields
- ✅ Broadcast table has: title, message, priority, status, active_from/to, channels, etc.
- ✅ Event broadcasting works: `publish_event("maintenance.updated")` after contact changes

#### What's Broken:
❌ **User side doesn't fetch broadcasts from API**
- `EmergencyDashboard.tsx` reads from `adminControlStore.broadcastFeed`
- This is **hardcoded seed data**, not from backend
- Line 15: `const broadcastFeed = useAdminControlStore((s) => s.broadcastFeed);`
- Never calls `GET /broadcasts/active` API

❌ **No API call on broadcast creation**
- Admin might have UI to create broadcasts
- But there's no indication it calls the backend API
- Would need to verify admin broadcast creation component

❌ **No event broadcast when admin creates/updates alerts**
- `POST /broadcasts` doesn't trigger SSE event (unlike contacts/markers)
- `PUT /broadcasts` doesn't trigger event
- User won't see new alerts in real-time

❌ **Broadcast status not tracked**
- User side shows "ACTIVE ALERT" hardcoded in red
- Should come from backend: check if any broadcasts have `status = ACTIVE` and `now BETWEEN active_from AND active_to`

#### Data Flow Diagram:
```
Admin Dashboard (Create Broadcast)
   ↓
POST /broadcasts  ✓ (API + DB work)
   ↓
Database updated ✓
   ↓
❌ NO EVENT BROADCAST
   ↓
User EmergencyDashboard
   ↓
Reads adminControlStore.broadcastFeed (HARDCODED)
   ↓
Never refreshes, never calls GET /broadcasts/active
   ↓
User doesn't see new broadcasts
```

#### File Locations:
- **Broadcast API:** [server/app/api/v1/broadcasts.py](server/app/api/v1/broadcasts.py#L47-L131)
- **Emergency Dashboard (user):** [client/src/pages/EmergencyDashboard.tsx](client/src/pages/EmergencyDashboard.tsx#L1-L80)
- **Admin store broadcasts:** [client/src/stores/adminCentralStore.ts](client/src/stores/adminCentralStore.ts#L35-L38) (seed data only)

---

### 2.3 Dashboard Metrics (BROKEN)

**Component:** Emergency Response Center Metrics  
**Files:**
- Frontend: `client/src/pages/EmergencyDashboard.tsx` (lines 50-67)
- Backend: ???

**Current Status:** ❌ **COMPLETELY BROKEN - NO BACKEND INTEGRATION**

#### What's Displayed:
```
┌─────────────────────────────────────────────────────────────┐
│ Wind Speed           Rainfall            Risk Level    System Status
│   8 km/h              2.5 mm            MODERATE         ACTIVE
└─────────────────────────────────────────────────────────────┘
```

#### Current Implementation:
```typescript
const windSpeed = dashboardOverrides.windSpeed ?? weather?.windSpeed ?? null;
const rainfall = dashboardOverrides.rainfall ?? weather?.rainfall ?? null;
const computedRisk = rainfall === null ? 'MODERATE' : ...;
const riskLevel = dashboardOverrides.riskStatus || computedRisk;

// System Status is HARDCODED to "ACTIVE"
const metrics = [
  { label: 'Wind Speed', value: windSpeed, ... },
  { label: 'Rainfall', value: rainfall, ... },
  { label: 'Risk Level', value: riskLevel, ... },
  { label: 'System Status', value: 'ACTIVE', ... },  // ❌ HARDCODED
]
```

#### Issues:
❌ **System Status hardcoded**
- Line 67: `value: 'ACTIVE'` - hardcoded string
- No backend health check
- No real-time system status
- No database persistence

❌ **Risk Level computed locally**
- Only based on rainfall
- No alert/warning level from admin
- No incident severity tracking
- Doesn't reflect admin's dashboard overrides

❌ **Missing admin-controlled metrics**
- No way for admin to set metrics
- No display of incidents, population at risk, response rate
- `useAdminCentralStore` has these fields but they're unused in Emergency Dashboard

❌ **Wind Speed/Rainfall fallback chain**
- Uses: `dashboardOverrides.windSpeed ?? weather?.windSpeed ?? null`
- Falls back to real weather after checking overrides (correct)
- But real weather is fetched every 5 minutes (not real-time)

#### Missing Endpoints:
- ❌ `GET /api/v1/dashboard/system-status` - No endpoint
- ❌ `GET /api/v1/dashboard/metrics` - No endpoint
- ❌ `PUT /api/v1/dashboard/status` - No endpoint for admin to update

#### File Locations:
- **Emergency Dashboard:** [client/src/pages/EmergencyDashboard.tsx](client/src/pages/EmergencyDashboard.tsx#L47-L67)
- **Dashboard metrics display:** [client/src/pages/EmergencyDashboard.tsx](client/src/pages/EmergencyDashboard.tsx#L56-L63)

---

### 2.4 Real-Time Sync (PARTIALLY WORKING)

**Component:** SSE / WebSocket Real-Time Updates  
**Files:**
- Frontend hook: `client/src/hooks/usePlatformRealtimeSync.ts`
- Backend events: `server/app/api/v1/integration.py`
- Event broadcaster: `server/app/services/integration_state.py`

**Current Status:** ⚠️  **INFRASTRUCTURE EXISTS BUT INCOMPLETE**

#### What Works:
✅ **SSE endpoint exists**
- `GET /events` → Opens EventSource stream
- Clients can subscribe to real-time events
- Connection has exponential backoff (1s to 30s)
- Fallback polling every 30 seconds

✅ **Event broadcaster exists**
- `integration_state_service.publish_event(event_name, payload)`
- Pushes to all connected SSE clients
- Queued delivery with stale client cleanup
- Async, non-blocking

✅ **Event handler implemented**
- Frontend listens to specific events
- Handles: 'keepalive', 'connected', unknown event types
- Fallback: Full state sync on unknown event

✅ **Some events actually broadcast**
- When emergency contacts created/updated/deleted: `publish_event("maintenance.updated", {...})`
- When map markers created/updated: `publish_event("maintenance.updated", {...})`

#### What's Broken:
❌ **Admin weather override changes don't broadcast**
- No `publish_event()` call after `PUT /admin-control`
- User won't see override changes in real-time
- Must refresh page

❌ **Broadcast (alert) creation doesn't broadcast**
- `POST /broadcasts` doesn't trigger event
- Only emergency contact/marker changes do
- Inconsistent pattern

❌ **General admin state changes don't broadcast**
- Frontend saves state with `saveAdminControlState()`
- Backend accepts it via `PUT /admin-control`
- But integration_state_service doesn't publish event

❌ **Dashboard metric changes not tracked**
- No events for metric updates
- No way to trigger user refresh

❌ **Event types limited**
- Only handles:
  - `keepalive` (heartbeat)
  - `connected` (connection ack)
  - Default: full state sync fallback
- Missing:
  - `admin.weather-changed`
  - `admin.alert-created`
  - `dashboard.metrics-updated`
  - `system.status-changed`

#### Data Flow:
```
Admin saves state:
  PUT /admin-control { weatherOverrides: {...} }
    ↓
  integration_state_service.set_admin_control()
    ↓
  ❌ NO publish_event() CALL
    ↓
  SSE clients not notified
    ↓
  Users must refresh manually

Contrast with contacts:
  POST /emergency-contacts
    ↓
  ✓ publish_event("maintenance.updated")
    ↓
  ✓ SSE clients notified instantly
    ↓
  ✓ Users see changes in real-time (if listening)
```

#### File Locations:
- **Frontend real-time sync:** [client/src/hooks/usePlatformRealtimeSync.ts](client/src/hooks/usePlatformRealtimeSync.ts)
- **Integration API:** [server/app/api/v1/integration.py](server/app/api/v1/integration.py#L220-L230)
- **Integration state service:** [server/app/services/integration_state.py](server/app/services/integration_state.py#L169-L190)
- **Broadcast API (missing events):** [server/app/api/v1/broadcasts.py](server/app/api/v1/broadcasts.py#L207-L331)

---

### 2.5 Database Persistence (PARTIAL)

**Component:** System Settings, Weather Overrides Storage  
**Files:**
- Backend models: `server/app/models/audit.py` (SystemSetting)
- Integration service: `server/app/services/integration_state.py`

**Current Status:** ⚠️  **WORKS FOR STATE, BUT MESSY**

#### What's Stored:
✅ **admin-control state** stored in `system_settings` table
- Key: `"adminControl"`
- Value: JSON blob
- Category: `"integration"`
- Persists: broadcasts, resources, advisory, recovery, learn hub data

✅ **maintenance state** stored in `system_settings` table
- Key: `"maintenance"`
- Value: JSON blob
- Category: `"integration"`
- Persists: dashboard overrides, emergency contacts, map markers, users, settings

✅ **Reports** stored in dedicated `citizen_reports` table
- Full CRUD works
- Real table with proper indexes

#### What's Missing:
❌ **No dedicated weather_overrides table**
- Should have:
  ```sql
  CREATE TABLE weather_overrides (
    id UUID PRIMARY KEY,
    temperature_c FLOAT NULL,
    wind_speed_kmh FLOAT NULL,
    rainfall_mm FLOAT NULL,
    active_from TIMESTAMP,
    active_to TIMESTAMP NULL,
    created_by UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );
  ```
- Instead, stored as JSON blob in system_settings
- Harder to query, filter, or audit

❌ **No dedicated system_status table**
- Could store:
  ```sql
  CREATE TABLE system_status (
    id UUID PRIMARY KEY,
    status_code VARCHAR(50),  -- ACTIVE, WARNING, DEGRADED, OFFLINE
    message VARCHAR(1000),
    updated_at TIMESTAMP,
    checked_at TIMESTAMP
  );
  ```

❌ **No dashboard_metrics table**
- Could track:
  ```sql
  CREATE TABLE dashboard_metrics (
    id UUID PRIMARY KEY,
    incidents_count INT,
    population_at_risk INT,
    response_rate FLOAT,
    timestamp TIMESTAMP
  );
  ```

#### File Locations:
- **System settings model:** [server/app/models/audit.py](server/app/models/audit.py#L50-L100)
- **Integration state service:** [server/app/services/integration_state.py](server/app/services/integration_state.py)

---

## 3. Summary Table: What's Connected vs Broken

| Component | Admin → DB | DB → Event | Event → User | User Displays | Status |
|-----------|:----------:|:----------:|:------------:|:-------------:|:------:|
| **Weather Overrides** | ❌ No | ❌ No | ❌ No | ❌ Real data only | 🔴 BROKEN |
| **Alerts/Broadcasts** | ✓ Yes | ❌ No | ❌ No | ❌ Hardcoded only | 🔴 BROKEN |
| **Risk Level** | ❌ No | N/A | N/A | ❌ Computed locally | 🔴 BROKEN |
| **System Status** | ❌ No | N/A | N/A | ❌ Hardcoded "ACTIVE" | 🔴 BROKEN |
| **Emergency Contacts** | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Real-time | 🟢 WORKING |
| **Map Markers** | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Real-time | 🟢 WORKING |
| **Real-Time Sync** | N/A | ⚠️ Partial | ✓ Yes | ✓ Works for contacts/markers | 🟡 PARTIAL |

---

## 4. Root Causes

### Root Cause #1: Admin Changes Don't Call Backend APIs
- **Problem:** Frontend actions (`setWeatherOverrides`, etc.) only update local state
- **Why:** Lazy implementation, no API integration layer
- **Impact:** Changes never persist, lost on refresh
- **Fix Required:** Add `async` action that calls `PUT /api/v1/...` endpoints

### Root Cause #2: Missing Event Broadcasting
- **Problem:** When state IS saved to backend, no SSE events published
- **Why:** `saveAdminControlState()` and `set_admin_control()` don't call `publish_event()`
- **Impact:** Real-time sync broken, users must refresh
- **Fix Required:** Add `publish_event()` calls in all save handlers

### Root Cause #3: User Side Reads Hardcoded Seed Data
- **Problem:** User components read from seeded store data, not backend APIs
- **Why:** Development shortcuts, no backend hydration
- **Impact:** User never sees real admin changes
- **Fix Required:** Fetch from APIs: `GET /broadcasts/active`, `GET /dashboard/metrics`, etc.

### Root Cause #4: Missing Database Tables
- **Problem:** No dedicated tables for overrides, metrics, system status
- **Why:** Using JSON blobs in system_settings instead
- **Impact:** Hard to query, filter, audit; no indexes; poor performance
- **Fix Required:** Create proper models and migrations

### Root Cause #5: Incomplete Real-Time Event Types
- **Problem:** Only weather/contact events, missing admin, dashboard, status events
- **Why:** Inconsistent implementation
- **Impact:** Some features sync, others don't
- **Fix Required:** Define complete event taxonomy, broadcast all changes

---

## 5. Verification Checklist

- [ ] Weather override changes appear in user dashboard within 500ms (no refresh)
- [ ] Admin closes browser, opens new tab → overrides still visible
- [ ] Admin sets alert → appears on user side within 500ms
- [ ] User refreshes page → admin-set data persists
- [ ] Multiple admin sessions → changes synced across all user-side windows
- [ ] System status shows real backend health (not hardcoded)
- [ ] Dashboard metrics reflect admin updates (incidents, population, response rate)
- [ ] Database queries show admin overrides stored correctly
- [ ] SSE logs show events published for all admin changes
- [ ] No console errors or failed API requests

---

## 6. Recommended Fix Sequence

1. **Phase 1: API Connections (High Impact, Medium Effort)**
   - Add async API calls to admin store actions
   - Make weather override API endpoint consistent
   - Publish events after every state save

2. **Phase 2: User-Side Hydration (Medium Impact, Low Effort)**
   - Fetch real alerts from `GET /broadcasts/active` on startup
   - Fetch real metrics from new `GET /dashboard/metrics` endpoint
   - Fetch real system status from new `GET /system/status` endpoint

3. **Phase 3: Database Schema (Low Impact, High Effort)**
   - Create dedicated tables (optional, for future scaling)
   - Add proper indexes and audit trails
   - Implement migration scripts

4. **Phase 4: Event System Completion (Medium Impact, Medium Effort)**
   - Define event taxonomy
   - Add event types for all changes
   - Ensure consistent patterns

---

## Next Steps

1. Review this report with team
2. Confirm the identified issues match your observations
3. Prioritize which areas to fix first
4. Proceed with implementation fixes
5. Create test cases for each flow
6. Deploy and verify real-time data sync works end-to-end

---

**Report prepared by:** GitHub Copilot  
**Report requires action:** YES - Critical disconnection prevents admin panel from controlling user experience  
**Estimated fix time:** 4-6 hours for full implementation testing
