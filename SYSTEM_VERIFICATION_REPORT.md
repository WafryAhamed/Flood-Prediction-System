# System Verification & E2E Testing Report

**Date**: 2026-03-23
**Tester**: Claude Code Agent
**Status**: IN PROGRESS

---

## Section 1: Frontend-Backend Connection Verification

### Setup Prerequisites
- [ ] Backend server running on `http://localhost:8000` or `https://localhost`
- [ ] PostgreSQL database online and accessible
- [ ] Frontend dev server running on `http://localhost:5173` (Vite)
- [ ] Admin account created and verified in database
- [ ] User account created and verified in database

### Initial Bootstrap & Store Hydration

**Test: Bootstrap Fetch on App Init**
- **Procedure**:
  1. Open DevTools → Console
  2. Navigate to http://localhost:5173
  3. Look for `[Sync] Bootstrap complete` message in console
  4. Verify response includes: adminControl, maintenance, reports

**Expected Result**:
- adminControl.broadcastFeed is populated from backend (NOT seed defaults)
- maintenanceStore has emergencyContacts from API
- adminControlStore.frontendSettings contains actual backend values

**Status**: ⬜ TODO

---

## Section 2: Critical Path E2E Tests

### Test 1: Broadcast Flow (Admin → User)

**Procedure**:
1. Admin opens AdminCommandCenter
2. Navigate to "Reports" or "Resources" tab
3. Create new broadcast item:
   ```json
   {
     "text": "TEST_BROADCAST_20260323",
     "type": "warning",
     "time": "14:30",
     "active": true
   }
   ```
4. Save (click save button or wait for autosave)

**Verification**:
- [ ] Broadcast appears in adminControlStore (console: `useAdminControlStore.getState().broadcastFeed`)
- [ ] DevTools Network → see `PUT /api/v1/integration/admin-control` request with new broadcast in payload
- [ ] Response is 200 OK
- [ ] Broadcast.id is assigned by frontend (bf-XXX pattern)
- [ ] User logs in / opens EmergencyDashboard
- [ ] TEST_BROADCAST_20260323 appears in the broadcast feed
- [ ] Broadcast reflects admin changes (type, active status, time)
- [ ] SSE real-time: watch DevTools Network → EventSource → should see `adminControl.updated` event with 1-2s delay

**Expected Outcome**: User sees the broadcast within 2 seconds via SSE or 30 seconds via polling fallback

**Status**: ⬜ TODO

**Database Check**:
- [ ] Open pgAdmin4 → connect to database
- [ ] Verify broadcasts table (if admin broadcasts are persisted there)
- [ ] OR verify system_settings table has key like "adminControl.broadcasts" with JSON value

---

### Test 2: Emergency Contact Flow (Admin → User)

**Procedure**:
1. Admin opens AdminCommandCenter → "Settings" or "Maintenance" tab
2. Navigate to emergency contacts section
3. Create new contact:
   ```json
   {
     "label": "TEST_HOTLINE_FIRE",
     "number": "+94-11-222-3333",
     "type": "fire",
     "active": true
   }
   ```
4. Submit

**Verification**:
- [ ] Contact added to maintenanceStore.emergencyContacts temporarily with optimistic ID
- [ ] DevTools Network → see `POST /api/v1/integration/emergency-contacts` request
- [ ] Response includes id assigned by backend (UUID or string)
- [ ] Optimistic contact swapped with backend contact
- [ ] maintenanceStore re-syncs to ensure ID consistency (should see follow-up GET request)
- [ ] User opens AlertPanel or notification area
- [ ] TEST_HOTLINE_FIRE appears in emergency contacts list
- [ ] Contact is clickable / shows phone number

**Expected Outcome**: Emergency contact appears in user UI within 1 second

**Status**: ⬜ TODO

**Database Check**:
- [ ] pgAdmin4 → Query: `SELECT * FROM emergency_contacts WHERE label LIKE 'TEST_HOTLINE%'`
- [ ] Verify record exists with correct data
- [ ] Verify `is_active = true`

---

### Test 3: Map Marker Flow (Admin → User)

**Procedure**:
1. Admin opens SystemMaintenance or FrontendControlCenter
2. Navigate to "Map Markers" section
3. Create new marker:
   ```json
   {
     "label": "TEST_SHELTER_COLOMBO",
     "markerType": "shelter",
     "position": [6.9271, 79.8612],
     "detail": "Colombo Central Shelter - Capacity 500",
     "visible": true
   }
   ```
4. Submit/Save

**Verification**:
- [ ] Marker added with optimistic ID
- [ ] DevTools Network → see `POST /api/v1/integration/map-markers` request
- [ ] Backend returns marker with UUID
- [ ] maintenanceStore updates mapMarkers array
- [ ] User opens RiskMapPage
- [ ] TEST_SHELTER_COLOMBO marker appears on map
- [ ] Marker is clickable and shows detail popup: "Colombo Central Shelter - Capacity 500"
- [ ] Marker position is correct (6.9271, 79.8612)

**Expected Outcome**: Map marker appears in real-time on user's map

**Status**: ⬜ TODO

**Marker Update Test**:
1. Admin edits position to [6.9271, 79.8700] (moved slightly east)
2. User's map updates in real-time
3. Database verified with new coordinates

**Database Check**:
- [ ] pgAdmin4 → Query: `SELECT * FROM system_settings WHERE key = 'maintenance.mapMarkers'`
- [ ] Verify JSON value contains TEST_SHELTER marker
- [ ] Verify position [6.9271, 79.8700]

---

### Test 4: Page Visibility Toggle

**Procedure**:
1. Admin opens AdminCommandCenter → "Settings" tab
2. Find "Page Visibility" section
3. Locate SafetyProfile toggle
4. Toggle OFF (disable)
5. Save

**Verification**:
- [ ] adminControlStore.frontendSettings.pageVisibility.safetyProfile = false
- [ ] DevTools Network → PUT request sent with complete frontendSettings state
- [ ] User page (any normal user view) refreshes
- [ ] SafetyProfile link/nav item is HIDDEN from sidebar/navigation
- [ ] User cannot access /safety-profile (should redirect or 404)

**Toggle ON Test**:
1. Admin toggles SafetyProfile ON
2. User's page shows SafetyProfile link again immediately (via SSE or next page load)

**Database Check**:
- [ ] pgAdmin4 → system_settings: `SELECT * WHERE key LIKE '%pageVisibility%'`
- [ ] Verify JSON has `"safetyProfile": false`

**Status**: ⬜ TODO

---

### Test 5: Flood Mode Toggle

**Procedure**:
1. Admin opens AdminCommandCenter → "Settings" tab
2. Find "Site Flood Mode" dropdown
3. Change from "normal" to "critical"
4. Save

**Verification**:
- [ ] adminControlStore.frontendSettings.siteFloodMode = "critical"
- [ ] CSS color scheme changes throughout app:
   - [ ] Buttons turn urgent color (red/orange vs blue)
   - [ ] Alerts more prominent
   - [ ] Dashboard displays warning banner or changed colors
- [ ] User page reflects changes IMMEDIATELY (via SSE or next load)
- [ ] All pages with danger notifications show heightened styling

**Database Check**:
- [ ] pgAdmin4 → system_settings: `SELECT value FROM system_settings WHERE key = 'frontendSettings'`
- [ ] Verify JSON has `"siteFloodMode": "critical"`

**Status**: ⬜ TODO

---

## Section 3: Database Verification (pgAdmin4)

### Table Structure Validation

**emergency_contacts table**:
- [ ] Columns: id (UUID), name, phone, category (ENUM), is_active, is_featured, display_order, created_at, updated_at
- [ ] All columns have correct types
- [ ] Primary key on id
- [ ] is_active default = true
- [ ] Sample data visible:
  ```sql
  SELECT * FROM emergency_contacts LIMIT 5;
  ```

**system_settings table**:
- [ ] Columns: key (STRING, PK), value (TEXT), value_type (ENUM), is_sensitive, last_modified_at, last_modified_by_id
- [ ] Records exist for:
   - [ ] `maintenance.mapMarkers` (JSON value)
   - [ ] `frontendSettings` (JSON value with all sub-keys)
   - [ ] `general.*` (any general settings)
- [ ] Sample query:
  ```sql
  SELECT key, value_type FROM system_settings WHERE key LIKE 'frontendSettings' LIMIT 1;
  ```

**broadcasts table** (if applicable):
- [ ] Status values: DRAFT, SCHEDULED, ACTIVE, EXPIRED, CANCELLED
- [ ] Sample:
  ```sql
  SELECT id, title, status, created_at FROM broadcasts ORDER BY created_at DESC LIMIT 5;
  ```

**Foreign Keys & Relationships**:
- [ ] emergency_contacts.id is referenced (no errors in constraints)
- [ ] broadcasts.author_id → users.id (valid FK)
- [ ] All geom columns have proper PostGIS types

**Status**: ⬜ TODO

---

## Section 4: Real-Time Mechanism Testing

### SSE Connection & Event Flow

**Test: SSE Stream Initialization**
1. Open DevTools → Network tab → filter by "Fetch/XHR"
2. Navigate to app homepage
3. Look for GET request to `/api/v1/integration/events`
4. Expected response headers:
   - `Content-Type: text/event-stream`
   - `Status: 200 OK`
   - Connection stays OPEN (not closing)

**Verification**:
- [ ] EventSource is open and active
- [ ] No console errors related to SSE
- [ ] Console shows "Connected" event received

**Status**: ⬜ TODO

**Test: SSE Event Reception**
1. Keep Network tab open and SSE request visible
2. Admin makes a change (e.g., create broadcast)
3. Observe EventSource → in Response tab:
   ```
   data: {"event":"adminControl.updated","payload":{...},"timestamp":1711193456}
   ```

**Verification**:
- [ ] Event appears within 2 seconds of save
- [ ] Payload contains adminControl object
- [ ] Timestamp is current (within 1s)
- [ ] No errors or "500" responses

**Status**: ⬜ TODO

**Test: SSE Reconnection with Exponential Backoff**
1. Start with SSE connected
2. Disconnect network (DevTools → Offline, or unplug network cable)
3. Wait and observe console
4. Expected console output:
   ```
   [SSE] Reconnecting in 1000ms (attempt 1)
   [SSE] Reconnecting in 2000ms (attempt 2)
   [SSE] Reconnecting in 4000ms (attempt 3)
   ```
5. Reconnect network
6. Console should show:
   ```
   [Sync] Bootstrap complete
   ```

**Verification**:
- [ ] Exponential backoff delays increase (1s → 2s → 4s → 8s up to 30s)
- [ ] No crashes or infinite loops
- [ ] Happy to reconnect successfully
- [ ] State synced on reconnection

**Status**: ⬜ TODO

### Fallback Polling

**Test: Polling Activates When SSE Unavailable**
1. In DevTools Console, close EventSource:
   ```javascript
   // Simulate SSE failure
   fetch('/api/v1/integration/events').then(r => r.body.cancel());
   ```
2. Wait 30+ seconds
3. Observe Network tab for GET `/api/v1/integration/bootstrap`
4. Should appear approximately every 30 seconds

**Verification**:
- [ ] Bootstrap request appears around 30s mark
- [ ] Response is 200 OK with full state
- [ ] adminControl store updates from poll response
- [ ] No duplicates or excessive requests

**Status**: ⬜ TODO

---

## Section 5: Bug Detection & Issues

### Silent Failures (Console Inspection)

**Procedure**:
1. Open browser console (DevTools → Console tab)
2. Filter warnings: show only errors and warnings
3. Perform all E2E test flows above
4. Make rapid admin changes (broadcast, contact, marker)
5. Close browser after 100ms (mid-save)

**Expected Findings**:
- [ ] NO red error messages
- [ ] Optional yellow warnings (non-critical)
- [ ] Network tab shows all 200/201/204 responses
- [ ] Failed or aborted requests are retried (no silent failures)

**Status**: ⬜ TODO

### Race Conditions (Rapid Changes)

**Procedure**:
1. Admin rapidly toggles page visibility on/off 5 times
2. Admin rapidly changes flood mode (normal → critical → normal)
3. Admin rapidly creates 3 broadcasts in succession

**Expected**:
- [ ] Final state matches last action taken
- [ ] No data corruption or mixed state
- [ ] All API calls complete successfully
- [ ] Store state consistent with database state

**Status**: ⬜ TODO

### State Consistency Across Layers

**Procedure**:
1. Admin creates broadcast X
2. User logs in on different browser/tab
3. User sees broadcast X within 2 seconds
4. Database contains broadcast X

**Expected**:
- [ ] Admin store, Backend, Database, User UI all show same data
- [ ] No data is lost or duplicated
- [ ] Timestamps match (within 1s)

**Status**: ⬜ TODO

### Connection Failure Handling

**Procedure**:
1. Admin starts editing broadcast
2. Disconnect network (or stop backend server)
3. Admin clicks save
4. Reconnect network (or restart backend)
5. Observe what happens

**Expected**:
- [ ] Error message displayed to user (not silent failure)
- [ ] User can retry save
- [ ] Once reconnected, save succeeds
- [ ] Data persists correctly

**Status**: ⬜ TODO

---

## Section 6: Summary & Findings

### Critical Issues Found
- [ ] NONE (or list if found)

### Medium Issues Found
- [ ] (None expected if hydration fix was successful)

### Low Issues / Improvements
- [ ] (To be documented)

### All Tests Passed?
- [ ] YES / NO

---

## Section 7: Implementation Fixes Applied

### ✅ Fix 1: AdminControl Bootstrap Hydration
- **File**: `client/src/hooks/usePlatformRealtimeSync.ts`
- **Change**: Added `hydrateFromBackend()` call with bootstrap adminControl snapshot
- **Result**: adminControlStore now receives real backend data on init, not just seed defaults
- **Impact**: Prevents stale admin data if SSE fails during startup

### ✅ Fix 2: BeforeUnload Safety Handler
- **File**: `client/src/hooks/usePlatformRealtimeSync.ts`
- **Change**: Added `beforeunload` event listener to flush pending adminControl saves
- **Result**: Admin changes persisted even if user closes browser before 500ms debounce
- **Impact**: Prevents data loss from rapid changes + immediate page close

---

## Next Steps
1. Execute all test procedures in **Section 2-5** (E2E flows, DB verification, Real-time tests)
2. Document any findings in **Section 6**
3. If issues found, implement fixes and re-test
4. Create final report summary

