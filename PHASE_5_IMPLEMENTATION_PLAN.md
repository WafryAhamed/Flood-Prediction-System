# Phase 5: Backend Fixes & Missing APIs

**Status:** 🟡 IN PROGRESS  
**Start Time:** 2026-03-24 14:40:00  
**Backend:** ✅ Running on port 8001  
**Database:** ✅ Verified (postgresql://postgres:2001@127.0.0.1:5432/flood_resilience)  

---

## Overview

Based on the **Phase 3 Backend Audit Report**, the backend is **85% ready** but has 3 critical blocking issues that prevent full real-time admin functionality.

### Blocking Issues Summary
| Issue | Status | Priority | Impact |
|-------|--------|----------|--------|
| Event Broadcasting | 🔴 Broken | CRITICAL | Admin changes don't reach users in real-time |
| Weather Override Endpoint | 🔴 Missing | CRITICAL | Can't persist weather overrides to database |
| Event Type Expansion | 🔴 Incomplete | HIGH | Frontend can't listen for specific change events |

---

## 🔧 Fix 1: Event Broadcasting in Integration Endpoints

### Problem
Admin state changes (PUT /admin-control, PUT /maintenance) save to database but **don't trigger SSE broadcasts** to notify connected clients.

### Location
**File:** `server/app/api/v1/integration.py`

### Current Code (Lines ~80-120)
```python
@router.put("/admin-control")
async def save_admin_control_state(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin)
):
    """Save admin control center state"""
    body = await request.json()
    
    settings = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "admin-control")
    )
    setting = settings.scalar_one_or_none()
    
    if setting:
        setting.value = json.dumps(body)
        setting.updated_at = datetime.utcnow()
    else:
        setting = SystemSetting(
            key="admin-control",
            value=json.dumps(body),
            value_type="json",
            updated_by_id=current_user.id
        )
    
    # ❌ MISSING: Event broadcast after save!
    await db.commit()
    return {"status": "saved"}
```

### Fix Required
Add event publishing after successful database commit:

```python
# ADD THESE IMPORTS at top of file
from app.services.event_service import EventService

# MODIFY the save_admin_control_state function:
@router.put("/admin-control")
async def save_admin_control_state(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin),
    event_service: EventService = Depends(get_event_service)
):
    """Save admin control center state"""
    body = await request.json()
    
    settings = await db.execute(
        select(SystemSetting).where(SystemSetting.key == "admin-control")
    )
    setting = settings.scalar_one_or_none()
    
    if setting:
        setting.value = json.dumps(body)
        setting.updated_at = datetime.utcnow()
    else:
        setting = SystemSetting(
            key="admin-control",
            value=json.dumps(body),
            value_type="json",
            updated_by_id=current_user.id
        )
    
    db.add(setting)
    await db.commit()
    await db.refresh(setting)
    
    # ✅ ADD: Broadcast event to all connected clients
    await event_service.publish_event(
        event_type="admin_control_updated",
        data={
            "timestamp": datetime.utcnow().isoformat(),
            "updated_by": current_user.email,
            "broadcasts": body.get("broadcasts", []),
            "resources": body.get("resources", []),
            "agriculture": body.get("agriculture", []),
            "recovery": body.get("recovery", [])
        }
    )
    
    return {"status": "saved", "updated_at": setting.updated_at}
```

### Same Fix for PUT /maintenance endpoint (Lines ~130-170)
Apply identical event publishing after commit:
```python
await event_service.publish_event(
    event_type="maintenance_updated",
    data={
        "timestamp": datetime.utcnow().isoformat(),
        "updated_by": current_user.email,
        "emergency_contacts": body.get("emergency_contacts", []),
        "map_markers": body.get("map_markers", []),
        "chat_settings": body.get("chat_settings", [])
    }
)
```

---

## 🔧 Fix 2: Create Weather Override Endpoint

### Problem
Currently weather overrides exist in JSON settings but there's **no dedicated POST/PUT endpoint** to update them. Frontend can't make targeted API calls.

### Location
**File:** `server/app/api/v1/weather.py` (add new endpoint)

### Current Code
```python
# Lines 1-50: Weather endpoints
@router.get("/observations/{district_id}")
@router.get("/forecasts/{district_id}")
# ... but NO PUT /overrides endpoint
```

### Fix Required
Add this new endpoint after the existing GET endpoints:

```python
# ADD around line 120 in weather.py

@router.put("/overrides")
async def update_weather_overrides(
    overrides: WeatherOverridesSchema,
    db: AsyncSession = Depends(get_db),
    current_user: AdminUser = Depends(require_admin),
    event_service: EventService = Depends(get_event_service)
):
    """
    Update weather override settings for testing/simulation
    
    Allows admins to temporarily override weather data for specific districts
    or entire system. Overrides last until cleared or system restart.
    """
    
    # Get or create weather_overrides setting
    stmt = select(SystemSetting).where(
        SystemSetting.key == "weather_overrides"
    )
    result = await db.execute(stmt)
    setting = result.scalar_one_or_none()
    
    override_data = {
        "wind_speed_kmh": overrides.wind_speed_kmh,
        "rainfall_mm": overrides.rainfall_mm,
        "temperature_c": overrides.temperature_c,
        "humidity_percent": overrides.humidity_percent,
        "pressure_hpa": overrides.pressure_hpa,
        "visibility_km": overrides.visibility_km,
        "affected_districts": overrides.affected_districts,
        "active": overrides.active,
        "created_at": datetime.utcnow().isoformat(),
        "created_by": current_user.email
    }
    
    if setting:
        setting.value = json.dumps(override_data)
        setting.updated_at = datetime.utcnow()
        setting.updated_by_id = current_user.id
    else:
        setting = SystemSetting(
            key="weather_overrides",
            value=json.dumps(override_data),
            value_type="json",
            is_encrypted=False,
            updated_by_id=current_user.id
        )
    
    db.add(setting)
    await db.commit()
    await db.refresh(setting)
    
    # ✅ Broadcast override to all connected clients
    await event_service.publish_event(
        event_type="weather_override_changed",
        data={
            "wind_speed_kmh": overrides.wind_speed_kmh,
            "rainfall_mm": overrides.rainfall_mm,
            "temperature_c": overrides.temperature_c,
            "active": overrides.active,
            "affected_districts": overrides.affected_districts,
            "changed_by": current_user.email
        }
    )
    
    return {
        "status": "saved",
        "overrides": override_data,
        "affected_count": len(overrides.affected_districts or [])
    }


@router.get("/overrides")
async def get_weather_overrides(
    db: AsyncSession = Depends(get_db)
):
    """Get current weather overrides (public endpoint)"""
    
    stmt = select(SystemSetting).where(
        SystemSetting.key == "weather_overrides"
    )
    result = await db.execute(stmt)
    setting = result.scalar_one_or_none()
    
    if not setting:
        return {"active": False, "overrides": None}
    
    try:
        data = json.loads(setting.value)
        if data.get("active"):
            return {"active": True, "overrides": data}
    except json.JSONDecodeError:
        pass
    
    return {"active": False, "overrides": None}
```

### Add Pydantic Schema
Add to `server/app/schemas/weather.py` (or create if doesn't exist):

```python
from pydantic import BaseModel
from typing import Optional, List

class WeatherOverridesSchema(BaseModel):
    wind_speed_kmh: Optional[float] = None
    rainfall_mm: Optional[float] = None
    temperature_c: Optional[float] = None
    humidity_percent: Optional[float] = None
    pressure_hpa: Optional[float] = None
    visibility_km: Optional[float] = None
    affected_districts: Optional[List[str]] = None
    active: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "wind_speed_kmh": 45.5,
                "rainfall_mm": 150.0,
                "temperature_c": 28.5,
                "humidity_percent": 85,
                "pressure_hpa": 1012,
                "visibility_km": 2.0,
                "affected_districts": ["CMB", "GAL"],
                "active": True
            }
        }
```

---

## 🔧 Fix 3: Expand SSE Event Types

### Problem
Backend can only broadcast generic "admin_update" events. Frontend needs specific event types to listen for targeted updates.

### Location
**File:** `server/app/services/event_service.py` OR create this file if missing

### Create/Update Event Service

```python
# server/app/services/event_service.py

from typing import Dict, Any, Optional, List
from datetime import datetime
from fastapi import WebSocket
import json
import asyncio
from collections import defaultdict

class EventBroadcaster:
    """Manages SSE connections and event broadcasting"""
    
    def __init__(self):
        self.subscriptions: Dict[str, List[asyncio.Queue]] = defaultdict(list)
        self.admin_queues: List[asyncio.Queue] = []
    
    async def subscribe(self, event_type: str) -> asyncio.Queue:
        """Subscribe to specific event type"""
        queue = asyncio.Queue()
        self.subscriptions[event_type].append(queue)
        return queue
    
    async def subscribe_admin(self) -> asyncio.Queue:
        """Subscribe to all admin events"""
        queue = asyncio.Queue()
        self.admin_queues.append(queue)
        return queue
    
    async def publish_event(
        self, 
        event_type: str,
        data: Dict[str, Any],
        admin_only: bool = False
    ) -> None:
        """Publish event to all subscribers"""
        
        event = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Broadcast to specific event type subscribers
        queues = self.subscriptions.get(event_type, [])
        for queue in queues:
            try:
                await queue.put(event)
            except:
                pass  # Queue might be closed
        
        # Broadcast to all admin subscribers
        if admin_only:
            for queue in self.admin_queues:
                try:
                    await queue.put(event)
                except:
                    pass
    
    def unsubscribe(self, event_type: str, queue: asyncio.Queue) -> None:
        """Unsubscribe from event type"""
        if event_type in self.subscriptions:
            try:
                self.subscriptions[event_type].remove(queue)
            except ValueError:
                pass
    
    def unsubscribe_admin(self, queue: asyncio.Queue) -> None:
        """Unsubscribe from admin events"""
        try:
            self.admin_queues.remove(queue)
        except ValueError:
            pass


# Global instance
_event_broadcaster = EventBroadcaster()

async def get_event_service():
    """Dependency for FastAPI"""
    return _event_broadcaster


class EventService:
    """Service wrapper for event operations"""
    
    def __init__(self, broadcaster: EventBroadcaster):
        self.broadcaster = broadcaster
    
    async def publish_event(
        self,
        event_type: str,
        data: Dict[str, Any]
    ) -> None:
        """Publish event to all connected clients"""
        await self.broadcaster.publish_event(event_type, data, admin_only=False)
    
    async def publish_admin_event(
        self,
        event_type: str,
        data: Dict[str, Any]
    ) -> None:
        """Publish event to admin users only"""
        await self.broadcaster.publish_event(event_type, data, admin_only=True)
```

### Update integration.py to use proper imports

```python
from app.services.event_service import _event_broadcaster as event_broadcaster

# In dependency
async def get_event_service():
    class Service:
        async def publish_event(self, event_type: str, data: dict):
            await event_broadcaster.publish_event(event_type, data)
    return Service()
```

### Supported Event Types (Document in code)

Add this enum or constants file: `server/app/core/event_types.py`

```python
# Supported SSE Event Types for frontend subscription

# Admin control events
ADMIN_CONTROL_UPDATED = "admin_control_updated"
BROADCASTS_UPDATED = "broadcasts_updated"
RESOURCES_UPDATED = "resources_updated"
AGRICULTURE_UPDATED = "agriculture_updated"
RECOVERY_UPDATED = "recovery_updated"

# Maintenance events
MAINTENANCE_UPDATED = "maintenance_updated"
EMERGENCY_CONTACTS_UPDATED = "emergency_contacts_updated"
MAP_MARKERS_UPDATED = "map_markers_updated"

# Weather events
WEATHER_UPDATED = "weather_updated"
WEATHER_FORECAST_UPDATED = "weather_forecast_updated"
WEATHER_OVERRIDE_CHANGED = "weather_override_changed"

# Broadcast events
BROADCAST_PUBLISHED = "broadcast_published"
BROADCAST_CANCELLED = "broadcast_cancelled"

# System events
SYSTEM_STATUS_CHANGED = "system_status_changed"
METRICS_UPDATED = "metrics_updated"

# Report events
REPORT_SUBMITTED = "report_submitted"
REPORT_VERIFIED = "report_verified"
REPORT_DISPATCHED = "report_dispatched"

ALL_EVENT_TYPES = [
    ADMIN_CONTROL_UPDATED,
    BROADCASTS_UPDATED,
    RESOURCES_UPDATED,
    AGRICULTURE_UPDATED,
    RECOVERY_UPDATED,
    MAINTENANCE_UPDATED,
    EMERGENCY_CONTACTS_UPDATED,
    MAP_MARKERS_UPDATED,
    WEATHER_UPDATED,
    WEATHER_FORECAST_UPDATED,
    WEATHER_OVERRIDE_CHANGED,
    BROADCAST_PUBLISHED,
    BROADCAST_CANCELLED,
    SYSTEM_STATUS_CHANGED,
    METRICS_UPDATED,
    REPORT_SUBMITTED,
    REPORT_VERIFIED,
    REPORT_DISPATCHED,
]
```

---

## 📋 Implementation Checklist

### Fix 1: Event Broadcasting
- [ ] Update `integration.py` PUT /admin-control endpoint
- [ ] Update `integration.py` PUT /maintenance endpoint
- [ ] Add EventService dependency injection
- [ ] Test via Thunder Client: PUT to endpoints should trigger SSE

### Fix 2: Weather Override Endpoint
- [ ] Create WeatherOverridesSchema in schemas/weather.py
- [ ] Add PUT /api/v1/weather/overrides endpoint
- [ ] Add GET /api/v1/weather/overrides endpoint
- [ ] Test weather override API
- [ ] Verify override broadcasts to clients

### Fix 3: Event Type Expansion
- [ ] Create event_service.py with EventBroadcaster
- [ ] Create event_types.py with all event type constants
- [ ] Update integration.py to use event types
- [ ] Update weather.py to use event types
- [ ] Test event publishing via API calls

### Testing
- [ ] All endpoints return 200 OK
- [ ] Database updates persist (verify via psql)
- [ ] SSE clients receive events in real-time
- [ ] Frontend EventSource listeners work

---

## 🚀 Implementation Order

1. **Start with Fix 1** (Event Broadcasting) - Most critical for admin real-time sync
2. **Then Fix 2** (Weather Override Endpoint) - Closes API completeness gap
3. **Finally Fix 3** (Event Type Expansion) - Enables proper event-based architecture

**Estimated time:** 30-45 minutes for all three fixes

---

## Testing Endpoints

### Test Event Broadcasting
```bash
# Terminal 1: Listen for events
curl http://localhost:8001/api/v1/integration/events

# Terminal 2: Trigger event
curl -X PUT http://localhost:8001/api/v1/admin-control \
  -H "Content-Type: application/json" \
  -d '{"broadcasts": [...], "resources": [...]}'
```

### Test Weather Override
```bash
# Create override
curl -X PUT http://localhost:8001/api/v1/weather/overrides \
  -H "Content-Type: application/json" \
  -d '{
    "wind_speed_kmh": 50.0,
    "rainfall_mm": 200.0,
    "affected_districts": ["CMB", "GAL"],
    "active": true
  }'

# Get current override
curl http://localhost:8001/api/v1/weather/overrides
```

### Verify Event Publishing
```bash
# Connect to SSE stream
curl -N http://localhost:8001/api/v1/integration/events

# In another terminal, make an API call
curl -X PUT http://localhost:8001/api/v1/admin-control ...
# Should see event in SSE stream
```

---

**Phase Status:** 🟡 Ready to implement  
**Backend:** ✅ Running and listening  
**Database:** ✅ Connected and ready  
**Next:** Begin implementation of Fix 1
