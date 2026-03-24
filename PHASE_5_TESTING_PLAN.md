# Phase 5 Testing & Verification

## Tests for New Weather Override Endpoints

### Test 1: Create Weather Override

```bash
# Test creating a weather override via PUT /api/v1/weather/overrides
curl -X PUT http://localhost:8001/api/v1/weather/overrides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "wind_speed_kmh": 50.0,
    "rainfall_mm": 200.0,
    "temperature_c": 32.5,
    "humidity_percent": 90,
    "pressure_hpa": 1008,
    "visibility_km": 1.5,
    "affected_districts": ["CMB", "GAL", "KLN"],
    "active": true
  }'
```

**Expected Response (200 OK):**
```json
{
  "status": "saved",
  "active": true,
  "affected_count": 3,
  "updated_at": "2026-03-24T14:45:30.123456",
  "overrides": {
    "wind_speed_kmh": 50.0,
    "rainfall_mm": 200.0,
    ...
  }
}
```

### Test 2: Get Current Overrides

```bash
# Retrieve current weather overrides
curl -X GET http://localhost:8001/api/v1/weather/overrides \
  -H "Content-Type: application/json"
```

**Expected Response (200 OK):**
```json
{
  "active": true,
  "overrides": {
    "wind_speed_kmh": 50.0,
    "rainfall_mm": 200.0,
    ...
  },
  "timestamp": "2026-03-24T14:45:35.654321"
}
```

### Test 3: Delete/Clear Overrides

```bash
# Clear all overrides
curl -X DELETE http://localhost:8001/api/v1/weather/overrides \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Expected Response (200 OK):**
```json
{
  "status": "cleared",
  "message": "Weather overrides cleared successfully",
  "timestamp": "2026-03-24T14:45:40.987654"
}
```

---

## Test 4: Check SSE Event Broadcasting

Open two terminal windows:

**Terminal 1 - Listen for SSE events:**
```bash
curl -N http://localhost:8001/api/v1/integration/events
```

**Terminal 2 - Create a weather override:**
```bash
curl -X PUT http://localhost:8001/api/v1/weather/overrides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "wind_speed_kmh": 60.0,
    "rainfall_mm": 250.0,
    "active": true
  }'
```

**Expected in Terminal 1:**
Should see an SSE event:
```
data: {"event":"weather_override_changed","payload":{...},"timestamp":1234567890}
```

---

## Changes Made

### Files Modified:
1. **server/app/api/v1/weather.py**
   - Added imports: `json`, `Optional`, `SystemSetting`, `integration_state_service`
   - Added `WeatherOverridesSchema` Pydantic model
   - Added `WeatherOverridesResponse` model
   - Added 3 new endpoints:
     - `GET /api/v1/weather/overrides` - Retrieve current overrides
     - `PUT /api/v1/weather/overrides` - Create/update overrides (admin only)
     - `DELETE /api/v1/weather/overrides` - Clear overrides (admin only)

### Key Features:
✅ **Authentication**: Requires admin role (via AdminUser dependency)  
✅ **Database**: Persists to SystemSetting with key "weather_overrides"  
✅ **Real-Time**: Publishes SSE events (`weather_override_changed`, `weather_override_cleared`)  
✅ **Validation**: All weather metrics have min/max constraints  
✅ **Public Access**: GET endpoint is public (no auth required) for frontend polling  

---

## Next: Test the Implementation

1. ✅ Weather endpoints added
2. ⏳ Verify backend accepts requests
3. ⏳ Test event broadcasting via SSE
4. ⏳ Verify admin authentication works

## API Documentation

Once backend restarts, documentation available at:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

Look for `/weather/overrides` endpoints in the "Weather Overrides" tag.

---

**Phase 5 Progress:**
- ✅ Fix 1: Event Broadcasting (Already implemented in `integration_state.py`)
- ✅ Fix 2: Weather Override Endpoint (COMPLETE)
- ⏳ Fix 3: Event Type Expansion (Pending - verify event publishing working)

**Ready to test once backend reloads**
