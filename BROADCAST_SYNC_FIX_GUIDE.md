# Broadcast Sync Fix - Implementation Guide

## The Issue
When an admin publishes a broadcast, it appears to users immediately via WebSocket alert, but the admin's own `broadcastFeed` store doesn't update until they manually edit or refresh the page.

## Root Cause
The `publish_broadcast()` endpoint in `broadcasts.py` sends a WebSocket message to users but doesn't publish the `adminControl.updated` SSE event that would update the admin's store.

## The Fix

### File: `server/app/api/v1/broadcasts.py`

**Location:** After the `alert_manager.broadcast()` call (around line 310)

### Current Code (Lines 279-318)
```python
@router.post("/{broadcast_id}/publish", response_model=BroadcastResponse)
async def publish_broadcast(
    broadcast_id: UUID,
    operator: OperatorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Publish a draft broadcast (operator and above)."""
    query = select(Broadcast).where(Broadcast.id == broadcast_id)
    result = await db.execute(query)
    broadcast = result.scalar_one_or_none()
    
    if broadcast is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Broadcast not found",
        )
    
    if broadcast.status != BroadcastStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft broadcasts can be published",
        )
    
    broadcast.status = BroadcastStatus.ACTIVE
    broadcast.active_from = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(broadcast)
    
    # Broadcast via WebSocket to all connected clients
    await alert_manager.broadcast({
        "type": "new_alert",
        "data": {
            "id": str(broadcast.id),
            "title": broadcast.title,
            "message": broadcast.message,
            "severity": broadcast.priority.value if broadcast.priority else "MEDIUM",
            "created_at": broadcast.active_from.isoformat() if broadcast.active_from else datetime.now(timezone.utc).isoformat(),
        }
    })
    # ← INSERT NEW CODE HERE
    
    # In production, trigger async task to deliver notifications
    # await celery_app.send_task("deliver_broadcast", args=[str(broadcast.id)])
    
    return BroadcastResponse.model_validate(broadcast)
```

### New Code to Add (3 lines + import)

**Add this import at the top of the file:**
```python
from app.services.integration_state import integration_state_service
```

**Add these 2 lines after `alert_manager.broadcast()`:**
```python
    # Publish SSE event to update admin control store on all connected clients
    fresh_admin = await integration_state_service.get_bootstrap()
    await integration_state_service.publish_event("adminControl.updated", fresh_admin["adminControl"])
```

### Complete Fixed Function
```python
@router.post("/{broadcast_id}/publish", response_model=BroadcastResponse)
async def publish_broadcast(
    broadcast_id: UUID,
    operator: OperatorUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Publish a draft broadcast (operator and above)."""
    query = select(Broadcast).where(Broadcast.id == broadcast_id)
    result = await db.execute(query)
    broadcast = result.scalar_one_or_none()
    
    if broadcast is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Broadcast not found",
        )
    
    if broadcast.status != BroadcastStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft broadcasts can be published",
        )
    
    broadcast.status = BroadcastStatus.ACTIVE
    broadcast.active_from = datetime.now(timezone.utc)
    
    await db.commit()
    await db.refresh(broadcast)
    
    # Broadcast via WebSocket to all connected clients
    await alert_manager.broadcast({
        "type": "new_alert",
        "data": {
            "id": str(broadcast.id),
            "title": broadcast.title,
            "message": broadcast.message,
            "severity": broadcast.priority.value if broadcast.priority else "MEDIUM",
            "created_at": broadcast.active_from.isoformat() if broadcast.active_from else datetime.now(timezone.utc).isoformat(),
        }
    })
    
    # Publish SSE event to update admin control store on all connected clients
    fresh_admin = await integration_state_service.get_bootstrap()
    await integration_state_service.publish_event("adminControl.updated", fresh_admin["adminControl"])
    
    # In production, trigger async task to deliver notifications
    # await celery_app.send_task("deliver_broadcast", args=[str(broadcast.id)])
    
    return BroadcastResponse.model_validate(broadcast)
```

## What This Does

1. **Fetches fresh admin state** from the database (latest broadcasts, resources, etc.)
2. **Publishes SSE event** to all connected clients with the updated adminControl state
3. **Frontend receives event** via SSE stream in `usePlatformRealtimeSync.ts`
4. **adminControlStore hydrates** with new data automatically
5. **All admin pages** that subscribe to broadcastFeed re-render immediately
6. **No page refresh needed** ✅

## Testing the Fix

### Before Fix
1. Open admin dashboard
2. Create a broadcast
3. Publish the broadcast
4. ❌ broadcastFeed doesn't update (shows stale data)
5. Users see alert immediately in SmartAlertCenter ✅

### After Fix
1. Open admin dashboard
2. Create a broadcast
3. Publish the broadcast
4. ✅ broadcastFeed updates immediately (no refresh needed)
5. Users see alert immediately in SmartAlertCenter ✅

### Manual Test
```bash
# 1. Get initial bootstrap state
curl http://localhost:8000/api/v1/integration/bootstrap | jq '.adminControl.broadcastFeed'

# 2. Create a broadcast
curl -X POST http://localhost:8000/api/v1/broadcasts \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Broadcast",
    "message": "Testing broadcast sync",
    "broadcast_type": "EMERGENCY",
    "priority": "HIGH",
    "content": "Test content"
  }'

# Note the broadcast ID from response

# 3. Publish the broadcast
curl -X POST "http://localhost:8000/api/v1/broadcasts/<broadcast_id>/publish" \
  -H "Authorization: Bearer <admin_token>"

# 4. Watch SSE stream for adminControl.updated event
curl -N http://localhost:8000/api/v1/integration/events | grep -A 5 "adminControl.updated"

# Expected output:
# data: {"event":"adminControl.updated","payload":{"broadcastFeed":[...],...}}
```

## Performance Impact
- **Minimal:** Adds ~10-50ms per publish (one extra DB query + SSE publish)
- **No performance regression** for other operations
- **Benefit:** Eliminates need for manual refresh or page reload

## Rollback Plan
If issues occur:
1. Remove the 2 new lines (revert to WebSocket-only)
2. Redeploy
3. System still functional (broadcast appears after manual refresh)

## Related Code References
- Frontend SSE handler: `client/src/hooks/usePlatformRealtimeSync.ts` line 62-69
- Admin store hydration: `client/src/stores/adminControlStore.ts` line 212-230
- Integration state service: `server/app/services/integration_state.py` line 180-183

---

## Deployment Checklist
- [ ] Apply code changes to broadcasts.py
- [ ] Verify imports are correct
- [ ] Run local tests
- [ ] Test broadcast publish workflow manually
- [ ] Deploy to staging
- [ ] Verify SSE events in logs: `tail -f logs | grep "adminControl.updated"`
- [ ] Deploy to production
- [ ] Monitor logs for errors

---

**Estimated Time to Fix:** 2 minutes
**Testing Time:** 5 minutes
**Rollback Time:** 1 minute (if needed)
