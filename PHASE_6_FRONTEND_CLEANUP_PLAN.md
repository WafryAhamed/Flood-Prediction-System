# Phase 6: Frontend Cleanup & Seed Data Removal

**Status:** 🟡 READY TO START  
**Date:** 2026-03-24  
**Backend:** ✅ Ready - Weather override endpoints active  
**Frontend:** ✅ Running on port 5174  

---

## Objective

Remove hardcoded seed data (800+ lines) from frontend stores and replace with API calls. This prepares the system for clean admin panel rebuild in Phase 7.

---

## Overview of Hardcoded Data to Remove

### 1️⃣ **adminControlStore.ts** 
**File:** `client/src/stores/adminControlStore.ts`

**Lines to Delete:** ~230 lines of hardcoded seed data (lines 28-250)

**Current Structure:**
```typescript
// SEED DATA (to remove)
const SEED_BROADCASTS = [...]     // ~50 fake broadcasts
const SEED_RESOURCES = [...]      // ~20 fake resources
const SEED_AGRI_TIPS = [...]      // ~30 agriculture tips
const SEED_RECOVERY_SERVICES = [] // ~20 recovery services
const SEED_LEARN_CONTENT = [...]  // ~20 learning items
```

**Replacement Strategy:**
- ✅ Keep: State interface definitions
- ✅ Keep: API call functions
- ❌ Remove: All SEED_* constants
- ✅ Add: Default state initialization from API

---

### 2️⃣ **maintenanceStore.ts**
**File:** `client/src/stores/maintenanceStore.ts`

**Lines to Delete:** ~140 lines (lines 31-170)

**Current Seed Data:**
```typescript
const SEED_MAP_ZONES = [...]          // ~15 risk zones
const SEED_CHATBOT_KNOWLEDGE = [...]  // ~25 FAQ items
const SEED_USERS = [...]              // ~10 admin users
const SEED_HISTORY = [...]            // ~15 evacuation history
const SEED_EVACUATION_ROUTES = [...]  // ~10 routes
const SEED_SIMULATION_SCENARIOS = [...] // ~5 scenarios
```

**Replacement:**
- ✅ Keep: Store state & actions
- ✅ Keep: Existing API call functions (recently fixed)
- ❌ Remove: All SEED_* definitions
- ✅ Load: Data from `/api/v1/...` endpoints on app init

---

### 3️⃣ **reportStore.ts**
**File:** `client/src/stores/reportStore.ts`

**Lines to Delete:** ~40 lines (lines 101-140)

**Current Data:**
```typescript
const SEED_REPORTS = [...]  // ~25 mock citizen reports
```

**Replacement:**
- ✅ Keep: Report interface
- ❌ Remove: SEED_REPORTS constant
- ✅ Load: From `/api/v1/citizen-reports` endpoint

---

## Files with Unused/Mock Components

### **Admin Components to Review**

| File | Status | Action |
|------|--------|--------|
| `client/src/components/admin/AdminDataTable.tsx` | ✅ Reusable | KEEP |
| `client/src/components/admin/AdminActionMenu.tsx` | ✅ Reusable | KEEP |
| `client/src/components/admin/AdminRouteGuard.tsx` | ✅ Authentication | KEEP |
| `client/src/components/admin/AIAssistant.tsx` | ❓ Check usage | REVIEW |

### **Admin Pages to Schedule for Rebuild (Phase 7)**

| File | Size | Remove? | Replace With |
|------|------|---------|--------------|
| `AdminCommandCenter.tsx` | 400+ | ✅ YES | Clean rebuild with real APIs |
| `AdminDashboard.tsx` | 100+ | ✅ YES | Metrics from backend |
| `FrontendControlCenter.tsx` | 150+ | ✅ YES | Real feature flags |
| `SystemMaintenance.tsx` | 600+ | ✅ YES | API-driven configuration |
| `DataUpload.tsx` | 78 | ✅ YES | Real data preview |
| `AuditLogs.tsx` | 100+ | ✅ YES | Real audit log queries |
| `AdminLayout.tsx` | 150+ | ✅ KEEP | Reusable routing structure |
| `AdminLogin.tsx` | 60 | ⚠️ FIX | Already fixed in Phase 2 |
| `UserManagement.tsx` | 200+ | ⚠️ REFACTOR | Already calling APIs (Phase 2) |

### **Admin Subtab Components (All Delete)**

**File:** `client/src/pages/admin/tabs/`

All these tabs have hardcoded seed data and will be rebuilt:
- SituationRoomTab.tsx (hardcoded metrics) 
- UsersTab.tsx (hardcoded users list)
- ReportsTab.tsx (hardcoded reports)
- ResourcesTab.tsx (hardcoded resources)
- WeatherTab.tsx (hardcoded forecasts)
- SettingsTab.tsx (hardcoded settings)
- AgricultureTab.tsx (hardcoded tips)
- RecoveryTab.tsx (hardcoded services)
- RoutesTab.tsx (hardcoded routes)
- EducationTab.tsx (hardcoded content)
- HistoryTab.tsx (hardcoded events)

---

## Implementation Checklist

### Part 1: Remove Hardcoded Data (Should Take 10-15 min)

- [ ] **adminControlStore.ts** 
  - Remove lines 28-250 (SEED_* constants)
  - Keep state interface & API functions
  - Initialize empty state: `adminControl: {}`

- [ ] **maintenanceStore.ts**
  - Remove lines 31-170 (SEED_* constants)
  - Keep store structure
  - Initialize state from defaults

- [ ] **reportStore.ts**
  - Remove lines 101-140 (SEED_REPORTS)
  - Keep interface & store logic

### Part 2: Verify Builds Successfully (Should Take 5 min)

- [ ] Run `npm run build` in `client/` folder
- [ ] Check for TypeScript errors
- [ ] Check for unused import warnings
- [ ] Fix any compilation issues

### Part 3: Test Frontend Still Works (Should Take 5 min)

- [ ] Frontend still loads (localhost:5174)
- [ ] No console errors about missing data
- [ ] App renders login page normally
- [ ] Navigation still works

---

## Data Loading Strategy

### App Initialization Flow (Phase 8)
```
App Mounts
  ↓
Check Authentication (JWT token valid?)
  ↓
If Admin:
  └─→ Fetch from /api/v1/integration/bootstrap
      └─→ Load adminControl & maintenance data
  └─→ Fetch from /api/v1/citizen-reports
      └─→ Load reports
  └─→ Subscribe to /api/v1/integration/events (SSE)
      └─→ Real-time updates to stores
  ↓
If Citizen:
  └─→ Fetch from /api/v1/weather/current
  └─→ Fetch from /api/v1/shelters
  └─→ Fetch from /api/v1/evacuation-routes
  ↓
Render UI with live data
```

---

## Expected Outcome

### Before Phase 6
```
Frontend Code Size: ~850KB
Hardcoded Data: ~800 lines
API Dependency: ~50%
Tests: None for admin
```

### After Phase 6
```
Frontend Code Size: ~750KB (-100KB ✅)
Hardcoded Data: ~0 lines ✅
API Dependency: ~100% ✅
Ready for: Phase 7 rebuild
```

---

## Files to Edit

### Stores (Remove seed data)
1. `client/src/stores/adminControlStore.ts`
2. `client/src/stores/maintenanceStore.ts`
3. `client/src/stores/reportStore.ts`

### Verify (No changes, just test)
1. `client/src/App.tsx` (entry point)
2. `client/src/pages/routes.ts` (routing config)
3. `client/src/components/Navigation.tsx` (menu)

---

## Git Strategy

```bash
# Before cleanup - ensure we can rollback
git add -A
git commit -m "PRE-PHASE6: Frontend before seed data removal"

# After cleanup
git add -A
git commit -m "Phase 6: Removed hardcoded seed data from stores

- Deleted SEED_* constants from adminControlStore.ts
- Deleted SEED_* constants from maintenanceStore.ts
- Deleted SEED_* constants from reportStore.ts
- Reduced frontend code by ~800 lines
- All data now loaded from backend APIs
- Verified TypeScript compilation succeeds
- Frontend loads and functions normally
"
```

---

## Estimated Duration

| Task | Time |
|------|------|
| Remove seed data | 15 min |
| Fix imports/types | 5 min |
| Verify build | 5 min |
| Test frontend | 5 min |
| **Total** | **~30 min** |

---

## Success Criteria

✅ All SEED_* constants removed  
✅ No hardcoded mock data in stores  
✅ TypeScript builds without errors  
✅ Frontend loads at localhost:5174  
✅ No console errors  
✅ App routing still works  
✅ Page size reduced by ~100KB  

---

## Next Phase (Phase 7)

After Phase 6 cleanup, Phase 7 will:
1. Delete old admin pages (complete rebuild)
2. Create new admin pages with proper API integration
3. Implement real-time updates via SSE
4. Add proper error handling & loading states
5. Create reusable admin components

---

**Phase 6 Status:** Ready to begin  
**Estimated Start:** Immediately after Phase 5  
**Prerequisite:** Phase 5 complete (✅)
