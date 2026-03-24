# ADMIN SYSTEM API QUICK REFERENCE

## Authentication

### Login
```
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

Response 200:
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "full_name": "Admin User",
    "roles": ["admin"]
  },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer"
  }
}
```

### Get Current User
```
GET /api/v1/auth/me
Authorization: Bearer {access_token}

Response 200:
{
  "id": "uuid",
  "email": "admin@example.com",
  "full_name": "Admin User",
  "public_id": "admin_123",
  "roles": ["admin"]
}
```

---

## Page Visibility Management

### Get All Page Visibility Settings
```
GET /api/v1/admin/page-visibility
Authorization: Bearer {access_token}

Response 200:
[
  {"page_name": "whatIfLab", "is_enabled": true},
  {"page_name": "learnHub", "is_enabled": false},
  {"page_name": "historicalTimeline", "is_enabled": true},
  {"page_name": "recoveryTracker", "is_enabled": true},
  {"page_name": "evacuationPlanner", "is_enabled": false},
  {"page_name": "communityReports", "is_enabled": true},
  {"page_name": "agricultureAdvisor", "is_enabled": true},
  {"page_name": "safetyProfile", "is_enabled": true}
]
```

### Toggle Specific Page Visibility
```
PUT /api/v1/admin/page-visibility/{page_name}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "is_enabled": false
}

Example:
PUT /api/v1/admin/page-visibility/whatIfLab
Body: {"is_enabled": false}

Response 200:
{
  "page_name": "whatIfLab",
  "is_enabled": false
}

Database Verification:
SELECT is_enabled FROM page_visibility WHERE page_name = 'whatIfLab';
→ Returns: false
```

---

## System Settings

### Get All Settings
```
GET /api/v1/admin/settings
Authorization: Bearer {access_token}

Response 200:
{
  "dark_mode": true,
  "sound_alerts": true,
  "push_notifications": true,
  "data_collection": false,
  "anonymous_reporting": true
}
```

### Update Settings
```
PUT /api/v1/admin/settings
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "dark_mode": false,
  "sound_alerts": true,
  "push_notifications": false,
  "data_collection": true,
  "anonymous_reporting": true
}

Response 200:
{
  "dark_mode": false,
  "sound_alerts": true,
  "push_notifications": false,
  "data_collection": true,
  "anonymous_reporting": true
}
```

---

## Emergency Contacts CRUD

### List All Contacts
```
GET /api/v1/integration/emergency-contacts
Authorization: Bearer {access_token}

Response 200:
[
  {
    "id": "uuid1",
    "name": "Police Station",
    "phone": "119",
    "category": "police",
    "is_active": true,
    "display_order": 1,
    "is_featured": true
  },
  {
    "id": "uuid2",
    "name": "Ambulance Service",
    "phone": "120",
    "category": "ambulance",
    "is_active": true,
    "display_order": 2,
    "is_featured": true
  }
]
```

### Create Contact
```
POST /api/v1/integration/emergency-contacts
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Fire Department",
  "phone": "121",
  "category": "fire",
  "is_active": true,
  "display_order": 3
}

Response 201:
{
  "id": "uuid3",
  "name": "Fire Department",
  "phone": "121",
  "category": "fire",
  "is_active": true,
  "display_order": 3,
  "is_featured": false
}
```

### Update Contact
```
PATCH /api/v1/integration/emergency-contacts/{id}
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "phone": "122",
  "is_featured": true
}

Response 200:
{
  "id": "uuid3",
  "name": "Fire Department",
  "phone": "122",
  "category": "fire",
  "is_active": true,
  "display_order": 3,
  "is_featured": true
}
```

### Delete Contact
```
DELETE /api/v1/integration/emergency-contacts/{id}
Authorization: Bearer {access_token}

Response 204 No Content

Database Verification:
SELECT is_active FROM emergency_contacts WHERE id = '{id}';
→ Returns: false (soft delete)
```

---

## Broadcasts Management

### Create Broadcast
```
POST /api/v1/broadcasts
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "broadcast_type": "warning",
  "priority": "high",
  "title": "Flood Alert",
  "message": "Rapid flooding expected in District 5",
  "affected_districts": ["uuid-dist-5"]
}

Response 201:
{
  "id": "uuid",
  "status": "draft",
  "broadcast_type": "warning",
  "priority": "high",
  "title": "Flood Alert",
  "message": "Rapid flooding expected in District 5",
  "author_id": "uuid",
  "created_at": "2026-03-25T10:30:00Z"
}
```

### Publish Broadcast
```
POST /api/v1/broadcasts/{id}/publish
Authorization: Bearer {access_token}

Response 200:
{
  "id": "uuid",
  "status": "published",
  "published_at": "2026-03-25T10:35:00Z"
}

Effect:
- SSE event broadcasts to all connected clients
- Firebase Cloud Messaging sends push notifications
- Database timestamp recorded
```

### Cancel Broadcast
```
POST /api/v1/broadcasts/{id}/cancel
Authorization: Bearer {access_token}

Response 200:
{
  "id": "uuid",
  "status": "cancelled",
  "cancelled_at": "2026-03-25T10:40:00Z"
}
```

---

## Database Consistency Checks

### Verify Page Visibility
```sql
-- Check all pages have visibility setting
SELECT COUNT(*) FROM page_visibility;
→ Should be 8

-- Verify no NULL values
SELECT * FROM page_visibility WHERE is_enabled IS NULL;
→ Should return 0 rows

-- Check page names
SELECT page_name FROM page_visibility ORDER BY page_name;
→ Should include: agricultureAdvisor, communityReports, evacuationPlanner,
                  historicalTimeline, learnHub, recoveryTracker, safetyProfile,
                  whatIfLab
```

### Verify System Settings
```sql
-- Check settings record exists
SELECT COUNT(*) FROM system_settings_config;
→ Should be 1

-- Verify all columns
SELECT dark_mode, sound_alerts, push_notifications, data_collection, 
       anonymous_reporting FROM system_settings_config;
→ Should return 5 boolean values
```

### Verify Emergency Contacts
```sql
-- Check contacts exist
SELECT COUNT(*) FROM emergency_contacts WHERE is_active = true;
→ Should be > 0

-- Verify all required columns populated
SELECT id, name, phone, category, is_active, display_order 
FROM emergency_contacts 
WHERE is_active = true
ORDER BY display_order;
→ Should show ordered list of active contacts
```

### Verify User Roles
```sql
-- Check admin user exists
SELECT * FROM users WHERE 'admin' = ANY(SELECT role FROM user_roles WHERE user_id = users.id);
→ Should return admin user records

-- Check role permissions
SELECT r.name, COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name;
→ admin should have multiple permissions
```

---

## Testing Checklist

- [ ] Login with admin account → JWT token received
- [ ] Call GET /admin/page-visibility → Returns 8 pages
- [ ] Call PUT /admin/page-visibility/whatIfLab with is_enabled=false → Database updated
- [ ] Query page_visibility table → Confirms whatIfLab.is_enabled = false
- [ ] Call GET /admin/settings → Returns 5 settings
- [ ] Call PUT /admin/settings with dark_mode=false → Database updated
- [ ] Call GET /integration/emergency-contacts → Returns list
- [ ] Call POST /integration/emergency-contacts → New contact created
- [ ] Call PATCH /integration/emergency-contacts/{id} → Contact updated
- [ ] Call DELETE /integration/emergency-contacts/{id} → Contact deactivated
- [ ] Verify no orphaned records in database
- [ ] Test without auth token → Should return 401
- [ ] Test with non-admin role → Should return 403
- [ ] Create broadcast → Draft status
- [ ] Publish broadcast → Published status + SSE event
- [ ] Cancel broadcast → Cancelled status
- [ ] Verify all responses have correct status codes
- [ ] Verify all timestamps in UTC
- [ ] Test edge cases (empty strings, missing fields, invalid types)
- [ ] Verify no SQL injection vulnerabilities
- [ ] Check API response times < 100ms

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid input: Empty name field"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Admin role required"
}
```

### 404 Not Found
```json
{
  "detail": "Emergency contact not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Database Credentials

```
Host: localhost
Port: 5432
Database: flood_resilience
User: postgres
Password: 2001
```

---

## Ports

```
Backend API: http://localhost:8001
Frontend: http://localhost:5173
Database: localhost:5432
```

---

**Last Updated:** 2026-03-25  
**Admin System Version:** 1.0  
**Database:** PostgreSQL 18.1