# Admin User Management - Diagnostic Report

**Date:** March 24, 2026  
**Status:** ⚠️ **CRITICAL ISSUES FOUND**  
**Severity:** HIGH - All admin actions are non-functional for backend/database

---

## Executive Summary

The admin user management module has a **critical architecture flaw**: Frontend actions (Activate, Suspend, Delete) update local state only but never persist changes to the backend or database. While all backend API endpoints exist and work correctly, the frontend doesn't call them.

**Impact:**
- ✗ Admin actions don't persist
- ✗ Page refresh loses all changes
- ✗ Other users never see status updates
- ✗ Database remains unchanged
- ⚠️ UI shows fake updates (appears to work but doesn't)

---

## Detailed Findings

### 1. Frontend Issues

#### Issue 1.1: No API Functions in `integrationApi.ts`
**File:** `client/src/services/integrationApi.ts`  
**Status:** ❌ **MISSING**

The following functions do NOT exist:
```javascript
// ❌ NOT IMPLEMENTED - Missing functions:
- activateUser(userId: string): Promise<...>
- suspendUser(userId: string): Promise<...>
- deleteUser(userId: string): Promise<...>
```

**Impact:** Cannot call backend endpoints. No way to make API requests for user status changes.

---

#### Issue 1.2: Store Functions Don't Call Backend
**File:** `client/src/stores/maintenanceStore.ts` (lines 386-398)  
**Status:** ❌ **BROKEN**

Current implementation:
```typescript
suspendUser: (id) => {
  set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, status: 'suspended' as const } : u)) }));
  void saveMaintenanceState(pickPersistableState(get()));
},
activateUser: (id) => {
  set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, status: 'active' as const } : u)) }));
  void saveMaintenanceState(pickPersistableState(get()));
},
deleteUser: (id) => {
  set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, status: 'deleted' as const } : u)) }));
  void saveMaintenanceState(pickPersistableState(get()));
},
```

**Problems:**
1. Only updates local state with `set()`
2. Doesn't call any backend API
3. `saveMaintenanceState()` saves generic state, not specific user updates
4. Real-time sync never triggered
5. If page refreshes → changes lost (backend never updated)

**Expected behavior:**
```typescript
suspendUser: async (id) => {
  try {
    const result = await suspendUser(id); // ← Call backend API!
    set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, status: 'suspended' } : u)) }));
  } catch (error) {
    // Handle error
  }
},
```

---

#### Issue 1.3: UI Calls Non-Functional Store Actions
**File:** `client/src/pages/admin/UserManagement.tsx` (lines 52-60)  
**Status:** ❌ **CASCADING FAILURE**

```typescript
const handleAction = (userId: string, action: string) => {
  if (confirmAction?.userId === userId && confirmAction?.action === action) {
    if (action === 'suspend') suspendUser(userId);        // ← Calls broken function
    else if (action === 'activate') activateUser(userId); // ← Calls broken function
    else if (action === 'delete') deleteUser(userId);     // ← Calls broken function
    setConfirmAction(null);
  } else {
    setConfirmAction({ userId, action });
  }
};
```

**Issue:** UI works correctly, but calls store functions that don't call backend. Looks functional but is fake.

---

### 2. Backend Status

#### ✅ Activate Endpoint: Works
**File:** `server/app/api/v1/users.py` (lines 200-221)  
**Status:** ✅ **IMPLEMENTED & WORKING**

```python
@router.post("/{user_id}/activate", response_model=UserResponse)
async def activate_user(user_id: UUID, _admin: AdminUser, db: AsyncSession):
    """Activate a user account (admin only)."""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = UserStatus.ACTIVE
    await db.commit()
    await db.refresh(user)
    return user
```

**Status:** ✅ Correct - Updates DB, commits, returns updated user

---

#### ✅ Suspend/Deactivate Endpoint: Works
**File:** `server/app/api/v1/users.py` (lines 223-249)  
**Status:** ✅ **IMPLEMENTED & WORKING**

```python
@router.post("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(user_id: UUID, _admin: AdminUser, db: AsyncSession):
    """Deactivate a user account (admin only)."""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == _admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    user.status = UserStatus.SUSPENDED
    await db.commit()
    await db.refresh(user)
    return user
```

**Status:** ✅ Correct - Sets status to SUSPENDED, commits to DB, prevents self-deactivation

---

#### ✅ Delete Endpoint: Works
**File:** `server/app/api/v1/users.py` (lines 276-306)  
**Status:** ✅ **IMPLEMENTED & WORKING**

```python
@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(user_id: UUID, _admin: SuperAdminUser, db: AsyncSession):
    """Soft delete a user account (super admin only)."""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == _admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    await auth_service.soft_delete_user(user)
    return MessageResponse(message=f"User {user.email} has been deleted", success=True)
```

**Status:** ✅ Correct - Calls soft_delete which updates status to DELETED, revokes tokens

---

#### ✅ Soft Delete Service: Works
**File:** `server/app/services/auth_service.py` (lines 312-320)  
**Status:** ✅ **IMPLEMENTED & WORKING**

```python
async def soft_delete_user(self, user: User) -> None:
    """Soft delete a user."""
    user.status = UserStatus.DELETED
    await self.revoke_all_user_tokens(user.id)
    await self.db.commit()
```

**Status:** ✅ Correct - Sets status to DELETED, revokes tokens, commits

---

### 3. Database Status

#### ✅ User Model: Correct
**File:** `server/app/models/auth.py` (lines 53-100)  
**Status:** ✅ **CORRECT SCHEMA**

```python
class User(BaseModel):
    status: Mapped[UserStatus] = mapped_column(
        SQLEnum(UserStatus, name="user_status"),
        default=UserStatus.ACTIVE,
        nullable=False,
    )
```

**User Status Enum:**
```python
class UserStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"
    DELETED = "deleted"
```

**Status:** ✅ Correct - All status values defined, indexed for performance

---

### 4. Real-Time Sync Status

#### ❌ No Event Broadcasting for User Status Changes
**Issue:** After admin updates user status, no event is published to notify affected users.

**Current behavior:**
- Admin changes status → local update → DB update (if called)
- No SSE event published
- Other users don't get real-time notification
- Affected user doesn't see status change unless page refreshes

**Missing:** Event publishing in backend endpoints when user status changes.

---

## Action Flow Analysis

### Current (Broken) Flow:
```
Admin clicks "Suspend User"
    ↓
UserManagement.tsx calls suspendUser(userId)
    ↓
maintenanceStore.ts suspendUser() executes
    ↓
Local state updated immediately (FAKE UPDATE)
    ↓
saveMaintenanceState() called (generic state save)
    ↓
Backend NEVER updated ❌
    ↓
Database NEVER updated ❌
    ↓
Page reload → Original data from backend → Changes lost ❌
```

### Required (Correct) Flow:
```
Admin clicks "Suspend User"
    ↓
UserManagement.tsx calls suspendUser(userId)
    ↓
maintenanceStore.ts suspendUser() executes
    ↓
API function suspendUser() called → POST /api/v1/users/{id}/deactivate
    ↓
Backend endpoint updates database
    ↓
user.status = SUSPENDED
    ↓
db.commit() ✓
    ↓
Frontend receives response
    ↓
Local state updated
    ↓
Optional: SSE event published → User UI updates instantly
    ↓
Page reload → Data persists ✓
```

---

## Test Results

### Activate Action
**Status:** ❌ **BROKEN (Frontend → Backend)**
- Frontend UI: Works (shows button, confirms action)
- Frontend Store: Updates local state (fake)
- Backend API: Ready but never called
- Database: Never updated
- Real-time Sync: Never triggered
- Page Refresh: Changes lost

### Suspend Action
**Status:** ❌ **BROKEN (Frontend → Backend)**
- Frontend UI: Works (shows button, confirms action)
- Frontend Store: Updates local state (fake)
- Backend API: Ready (endpoint: POST /users/{id}/deactivate)
- Database: Never updated
- Real-time Sync: Never triggered
- Page Refresh: Changes lost

### Delete Action
**Status:** ❌ **BROKEN (Frontend → Backend)**
- Frontend UI: Works (shows button, confirms action)
- Frontend Store: Updates local state (fake)
- Backend API: Ready (endpoint: DELETE /users/{id})
- Database: Never updated
- Real-time Sync: Never triggered
- Page Refresh: Changes lost

---

## Root Cause Summary

| Component | Issue | Impact |
|-----------|-------|--------|
| **integrationApi.ts** | Missing API functions | Can't call backend endpoints |
| **maintenanceStore.ts** | No API calls in actions | Updates only local state |
| **UserManagement.tsx** | Calls non-functional store | UI appears to work but doesn't |
| **Backend** | None (works correctly!) | Endpoints ready but unused |
| **Database** | None (correct schema!) | Status column ready but unused |
| **SSE/WebSocket** | No event broadcasting | No real-time updates for users |

---

## What Works vs What's Broken

### ✅ What Works
1. Backend endpoints exist and are implemented correctly
2. Database schema supports all required status values
3. Soft delete logic works (revokes tokens, updates status)
4. Authentication layer prevents self-actions
5. UI shows buttons and confirmation dialogs
6. Store architecture is sound (just using it wrong)

### ❌ What's Broken
1. **Frontend doesn't call backend** (critical)
2. **API wrapper functions missing** (critical)
3. **Changes don't persist** (critical)
4. **No real-time sync events** (important)
5. **Page refresh loses changes** (critical)

---

## Fix Scope

### Frontend Fixes (Priority 1 - CRITICAL)
1. Add API wrapper functions to `integrationApi.ts`
2. Update store actions to call backend API
3. Handle loading states and errors
4. Update UI to show loading/error states

### Backend Fixes (Priority 2 - OPTIONAL)
1. Publish SSE events when user status changes
2. Add audit logging for user status changes
3. Add validation for admin permissions

### Testing
1. Test each action individually
2. Verify database updates
3. Test page refresh persistence
4. Test real-time sync (if implemented)

---

## Next Steps

1. **Create API functions** in `integrationApi.ts`
   - `activateUser(userId: string): Promise<UserResponse>`
   - `suspendUser(userId: string): Promise<UserResponse>`
   - `deleteUser(userId: string): Promise<MessageResponse>`

2. **Update store actions** in `maintenanceStore.ts`
   - Change functions to async
   - Call API functions before updating state
   - Add error handling
   - Show loading indicators

3. **Test all three actions**
   - Click activate → check database
   - Click suspend → check database
   - Click delete → check database
   - Refresh page → verify persistence

4. **Implement real-time sync** (optional but recommended)
   - Publish SSE events for user status changes
   - Listen for events on user detail pages
   - Update UI instantly when admin changes status

---

## Files to Fix

| File | Issue | Action |
|------|-------|--------|
| `client/src/services/integrationApi.ts` | Missing API functions | ADD 3 functions |
| `client/src/stores/maintenanceStore.ts` | No API calls | UPDATE 3 actions |
| `client/src/pages/admin/UserManagement.tsx` | None (works correctly) | NO CHANGES |
| `server/app/api/v1/users.py` | None (works correctly) | NO CHANGES |
| `server/app/services/auth_service.py` | None (works correctly) | NO CHANGES |

---

## Conclusion

The admin user management module is **non-functional** due to missing API integration. Backend is ready, database is ready, but frontend doesn't connect them. Fix is straightforward:

1. Add 3 API functions to integrationApi.ts
2. Update 3 store actions to call these functions
3. Test and verify database persistence

**Estimated Fix Time:** 30 minutes
**Difficulty:** Easy (copy existing patterns, add error handling)
**Risk:** Low (no breaking changes, all backend endpoints work correctly)
