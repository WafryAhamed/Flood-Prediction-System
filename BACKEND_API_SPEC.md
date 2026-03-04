# Flood Resilience System - Backend API Specification

## Overview
This document specifies the REST API endpoints and database structure for the FloodWeb resilience platform. The backend is built with Express.js + MongoDB.

## Base Configuration
- **Server**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with Role-Based Access Control (RBAC)
- **Port**: 3001 (development), environment-configurable
- **API Base URL**: `/api/v1`

## Authentication & Authorization

### JWT Token Structure
```json
{
  "userId": "user_id",
  "role": "citizen|admin|moderator|system",
  "district": "district_name",
  "exp": 1234567890
}
```

### Roles
1. **citizen** - End users, limited access to own data
2. **admin** - District/regional administrators
3. **moderator** - Content moderators for community reports
4. **system** - Service accounts for automated tasks

### Endpoints Pattern
- Public endpoints: `/auth/login`, `/auth/register`, `/public/*`
- Protected: Include `Authorization: Bearer <token>` header

---

## 1. Authentication Service

### POST /api/v1/auth/register
Register new user account
```
Body: {
  email: string (unique),
  password: string (min 8 chars),
  fullName: string,
  phoneNumber: string,
  district: string,
  language: 'en' | 'si' | 'ta'
}
Response: {
  userId: string,
  email: string,
  token: string,
  refreshToken: string
}
Status: 201
```

### POST /api/v1/auth/login
Authenticate user
```
Body: {
  email: string,
  password: string
}
Response: {
  userId: string,
  role: string,
  token: string,
  refreshToken: string,
  expiresIn: number (seconds)
}
Status: 200
```

### POST /api/v1/auth/refresh
Refresh JWT token
```
Body: {
  refreshToken: string
}
Response: {
  token: string,
  expiresIn: number
}
Status: 200
```

### POST /api/v1/auth/logout
Invalidate user session (blacklist token)
```
Response: { message: "Logged out successfully" }
Status: 200
```

---

## 2. User Profile Service

### GET /api/v1/profile
Get current user profile
```
Response: {
  userId: string,
  email: string,
  fullName: string,
  phoneNumber: string,
  district: string,
  language: 'en' | 'si' | 'ta',
  safetyProfile?: { ... }
}
Status: 200
```

### PUT /api/v1/profile
Update user profile
```
Body: {
  fullName?: string,
  phoneNumber?: string,
  language?: 'en' | 'si' | 'ta'
}
Status: 200
```

### DELETE /api/v1/profile
Delete user account (soft delete)
```
Status: 204
```

---

## 3. Safety Profile Service

### POST /api/v1/safety-profile
Create user's safety profile
```
Body: {
  homeType: 'house' | 'apartment' | 'rural_structure' | 'houseboar',
  familySize: number,
  members: Array<{
    name: string,
    age: number,
    role: 'primary' | 'dependent' | 'elder' | 'child',
    medicalNeeds?: string,
    mobilityIssues?: boolean
  }>,
  livelihoods: string[],
  location: {
    village: string,
    district: string,
    coordinates: [longitude, latitude]
  },
  pets?: number,
  safeEvacuationPlace: string,
  emergencyContacts: Array<{
    name: string,
    phone: string,
    relationship: string
  }>
}
Response: {
  profileId: string,
  completionPercentage: number
}
Status: 201
```

### GET /api/v1/safety-profile
Retrieve user's safety profile
```
Response: { ... safety profile object ... }
Status: 200
```

### PUT /api/v1/safety-profile/{profileId}
Update safety profile
```
Status: 200
```

### DELETE /api/v1/safety-profile/{profileId}
Delete safety profile
```
Status: 204
```

---

## 4. Risk & Alert Service

### GET /api/v1/risk/current
Get current risk level for user's location
```
Query: {
  latitude?: number,
  longitude?: number,
  district?: string
}
Response: {
  riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'safe',
  severity: 1-5,
  affectedAreas: string[],
  timestamp: ISO8601,
  nextUpdate: ISO8601
}
Status: 200
```

### GET /api/v1/alerts
Get user's personalized alerts
```
Query: {
  limit?: number (default: 20),
  offset?: number (default: 0),
  status?: 'new' | 'acknowledged' | 'all'
}
Response: {
  alerts: Array<{
    alertId: string,
    type: 'flood' | 'wind' | 'alert' | 'all_clear',
    priority: 1-5,
    message: string,
    area: string,
    createdAt: ISO8601,
    status: 'new' | 'acknowledged'
  }>,
  total: number
}
Status: 200
```

### POST /api/v1/alerts/{alertId}/acknowledge
Mark alert as acknowledged
```
Response: { message: "Alert acknowledged" }
Status: 200
```

### GET /api/v1/alerts/subscribe
Server-Sent Events (SSE) for real-time alerts
```
Headers: {
  Accept: 'text/event-stream'
}
Response: Event stream of new alerts
Status: 200
```

### POST /api/v1/alerts/preferences
Update alert notification preferences
```
Body: {
  channels: {
    push: boolean,
    sms: boolean,
    email: boolean
  },
  riskLevels: ['critical', 'high'] // Only notify for these levels
}
Status: 200
```

---

## 5. Community Reports Service

### POST /api/v1/reports
Submit community report
```
Body: {
  type: 'flooding' | 'road_closed' | 'injured_person' | 'help_needed' | 'other',
  title: string,
  description: string,
  location: {
    latitude: number,
    longitude: number,
    address: string
  },
  media?: Array<{
    type: 'image' | 'video',
    url: string
  }>,
  urgency: 'low' | 'medium' | 'high' | 'critical'
}
Response: {
  reportId: string,
  status: 'pending_moderation',
  createdAt: ISO8601
}
Status: 201
```

### GET /api/v1/reports
Get community reports feed
```
Query: {
  type?: string,
  district?: string,
  limit?: number,
  offset?: number,
  sortBy?: 'newest' | 'mostHelpful' | 'trending'
}
Response: {
  reports: Array<{
    reportId: string,
    author: { name: string, avatar: string },
    type: string,
    title: string,
    description: string,
    location: object,
    helpCount: number,
    commentCount: number,
    verifiedBy?: string[],
    createdAt: ISO8601,
    status: 'published' | 'pending'
  }>,
  total: number
}
Status: 200
```

### POST /api/v1/reports/{reportId}/help
Mark report as helpful (upvote)
```
Response: { helpCount: number }
Status: 200
```

### POST /api/v1/reports/{reportId}/comments
Add comment to report
```
Body: {
  text: string,
  anonymous?: boolean
}
Response: {
  commentId: string,
  createdAt: ISO8601
}
Status: 201
```

### DELETE /api/v1/reports/{reportId}
Delete user's own report
```
Status: 204
```

---

## 6. Evacuation Service

### GET /api/v1/evacuation/routes
Get evacuation routes for user
```
Query: {
  latitude: number,
  longitude: number,
  destination?: string (safe place type)
}
Response: {
  routes: Array<{
    routeId: string,
    name: string,
    distance: number (meters),
    estimatedTime: number (minutes),
    safetyRating: 1-5,
    capacity: number,
    available: number,
    waypoints: Array<[longitude, latitude]>,
    alternativeRoutes: number
  }>
}
Status: 200
```

### GET /api/v1/evacuation/facilities
Get nearby evacuation facilities
```
Query: {
  latitude: number,
  longitude: number,
  radius?: number (meters, default 5000)
}
Response: {
  facilities: Array<{
    facilityId: string,
    name: string,
    type: 'shelter' | 'hospital' | 'community_center',
    distance: number,
    capacity: number,
    currentOccupancy: number,
    contact: string,
    location: object,
    amenities: string[]
  }>
}
Status: 200
```

### POST /api/v1/evacuation/plans
Create evacuation plan
```
Body: {
  safetyProfileId: string,
  destination: { latitude, longitude },
  route: string,
  departureTime?: ISO8601
}
Response: {
  planId: string,
  estimatedArrivalTime: ISO8601
}
Status: 201
```

---

## 7. Family Safety Service

### POST /api/v1/family/members
Add family member
```
Body: {
  name: string,
  phone: string,
  relationship: string,
  alertPreferences: {
    sms: boolean,
    whatsapp: boolean,
    call: boolean
  }
}
Response: { memberId: string }
Status: 201
```

### GET /api/v1/family/members
Get family members list
```
Response: {
  members: Array<{
    memberId: string,
    name: string,
    phone: string,
    status: 'safe' | 'at_risk' | 'evacuating' | 'unknown',
    lastUpdate: ISO8601
  }>
}
Status: 200
```

### POST /api/v1/family/status
Share family safety status with members
```
Body: {
  status: 'safe' | 'at_risk' | 'evacuating',
  location?: { latitude, longitude },
  destination?: string,
  eta?: ISO8601,
  message?: string
}
Response: {
  sentTo: number (count of recipients),
  timestamp: ISO8601
}
Status: 200
```

### DELETE /api/v1/family/members/{memberId}
Remove family member
```
Status: 204
```

---

## 8. Learning Hub Service

### GET /api/v1/learn/topics
Get all learning topics
```
Query: {
  category?: 'preparation' | 'response' | 'recovery',
  difficulty?: 'beginner' | 'intermediate' | 'advanced',
  language?: 'en' | 'si' | 'ta'
}
Response: {
  topics: Array<{
    topicId: string,
    title: string,
    description: string,
    category: string,
    difficulty: string,
    duration: number (minutes),
    resources: Array<{
      type: 'article' | 'video' | 'infographic',
      url: string,
      title: string
    }>,
    completed: boolean,
    progress: number
  }>
}
Status: 200
```

### POST /api/v1/learn/topics/{topicId}/progress
Track learning progress
```
Body: {
  completed: boolean,
  score?: number,
  timeSpent: number (seconds)
}
Response: {
  progress: number,
  badge?: string
}
Status: 200
```

### GET /api/v1/learn/progress
Get user's learning progress
```
Response: {
  totalTopics: number,
  completedTopics: number,
  averageScore: number,
  badges: string[],
  streakDays: number
}
Status: 200
```

---

## 9. What-If Lab Service

### POST /api/v1/whatif/simulate
Run what-if scenario
```
Body: {
  rainfallAmount: number,
  duration: number,
  initialWaterLevel?: number,
  interventions?: Array<{
    type: 'dam_release' | 'river_dredge' | 'canal_clean',
    location: { latitude, longitude },
    timing: ISO8601
  }>
}
Response: {
  simulationId: string,
  predictedFloodMap: GeoJSON,
  affectedAreas: Array<{
    area: string,
    riskLevel: 'critical' | 'high' | 'medium' | 'low',
    population: number
  }>,
  recommendations: string[]
}
Status: 200
```

### GET /api/v1/whatif/simulations
Get user's simulation history
```
Response: {
  simulations: Array<{
    simulationId: string,
    rainfallAmount: number,
    createdAt: ISO8601,
    shared: boolean
  }>
}
Status: 200
```

---

## 10. Admin: Analytics Service

### GET /api/v1/admin/analytics/dashboard
Get high-level analytics
```
Headers: { Authorization: "Bearer <admin_token>" }
Response: {
  totalUsers: number,
  activeUsers24h: number,
  alertsToday: number,
  reportsToday: number,
  evacuation: {
    total: number,
    ongoing: number
  },
  riskAreas: Array<{
    area: string,
    riskLevel: string,
    population: number
  }>
}
Status: 200
```

### GET /api/v1/admin/analytics/reports
Get detailed analytics report
```
Query: {
  metric: 'users' | 'alerts' | 'reports' | 'engagement',
  period: 'day' | 'week' | 'month' | 'year',
  startDate?: ISO8601,
  endDate?: ISO8601
}
Status: 200
```

---

## 11. Admin: Moderation Service

### GET /api/v1/admin/moderation/queue
Get reports pending moderation
```
Headers: { Authorization: "Bearer <moderator_token>" }
Response: {
  reports: Array<{
    reportId: string,
    author: string,
    type: string,
    content: string,
    flagCount: number,
    submittedAt: ISO8601
  }>,
  total: number
}
Status: 200
```

### POST /api/v1/admin/moderation/approve/{reportId}
Approve report for publication
```
Response: { message: "Report approved" }
Status: 200
```

### POST /api/v1/admin/moderation/reject/{reportId}
Reject report
```
Body: { reason: string }
Response: { message: "Report rejected" }
Status: 200
```

---

## 12. Admin: District Control

### GET /api/v1/admin/districts
Get managed districts
```
Response: {
  districts: Array<{
    districtId: string,
    name: string,
    population: number,
    facilities: number,
    lastAlert: ISO8601
  }>
}
Status: 200
```

### POST /api/v1/admin/broadcast-alert
Broadcast alert to district
```
Body: {
  districtId: string,
  message: string,
  riskLevel: 'critical' | 'high' | 'medium',
  affectedAreas: string[],
  estimatedDuration?: number
}
Response: {
  alertId: string,
  sentTo: number (users)
}
Status: 201
```

---

## Database Collections

### 1. Users
```javascript
{
  _id: ObjectId,
  email: String (unique),
  passwordHash: String,
  fullName: String,
  phoneNumber: String,
  role: String,
  district: String,
  language: String,
  avatar?: String,
  safetyProfileId?: ObjectId (ref),
  familyMembers: [ObjectId],
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean,
  lastLogin?: Date
}
```

### 2. SafetyProfiles
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref),
  homeType: String,
  familySize: Number,
  members: Array,
  livelihoods: [String],
  location: GeoJSON,
  pets: Number,
  safeEvacuationPlace: String,
  emergencyContacts: Array,
  completionPercentage: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Alerts
```javascript
{
  _id: ObjectId,
  type: String,
  priority: Number,
  message: String,
  district: String,
  affectedAreas: [String],
  riskLevel: String,
  createdAt: Date,
  sentTo: [ObjectId] (user IDs),
  acknowledgedBy: [ObjectId]
}
```

### 4. CommunityReports
```javascript
{
  _id: ObjectId,
  authorId: ObjectId (ref),
  type: String,
  title: String,
  description: String,
  location: GeoJSON,
  media: Array,
  status: String,
  helpCount: Number,
  verifiedBy: [String],
  comments: [ObjectId] (ref),
  flagged: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. EvacuationPlans
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref),
  safetyProfileId: ObjectId,
  destination: GeoJSON,
  route: String,
  status: String,
  familyMembers: Array,
  eta: Date,
  createdAt: Date
}
```

### 6. FamilyMembers
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref),
  name: String,
  phone: String,
  relationship: String,
  alertPreferences: Object,
  status: String,
  lastStatusUpdate: Date
}
```

### 7. LearningTopics
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: String,
  difficulty: String,
  duration: Number,
  resources: Array,
  translations: Object
}
```

### 8. UserProgress
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref),
  topicId: ObjectId,
  completed: Boolean,
  score: Number,
  timeSpent: Number,
  completedAt: Date
}
```

### 9. WhatIfSimulations
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  rainfallAmount: Number,
  duration: Number,
  interventions: Array,
  results: Object,
  createdAt: Date
}
```

### 10. Facilities
```javascript
{
  _id: ObjectId,
  name: String,
  type: String,
  location: GeoJSON,
  capacity: Number,
  currentOccupancy: Number,
  contact: String,
  amenities: [String]
}
```

### 11. DistrictConfig
```javascript
{
  _id: ObjectId,
  districtName: String,
  population: Number,
  riskProfile: Object,
  boundaries: GeoJSON,
  adminIds: [ObjectId]
}
```

### 12. AuditLogs
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  action: String,
  resource: String,
  timestamp: Date,
  ipAddress: String,
  changes: Object
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

### Common Status Codes
- **200**: Success
- **201**: Created
- **204**: No Content
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **429**: Too Many Requests (rate limit)
- **500**: Internal Server Error

---

## Rate Limiting
- **Authenticated requests**: 1000 per hour
- **Public endpoints**: 100 per hour per IP
- **Alert endpoints**: 100 per minute

## Implementation Notes
- All dates use ISO8601 format with timezone
- Coordinates use [longitude, latitude] format (GeoJSON)
- All responses should include `timestamp` field
- Implement pagination for list endpoints (limit: 1-100)
- Use connection pooling for MongoDB
- Implement JWT refresh token rotation
- Add request validation middleware
- Log all admin operations for audit trail
