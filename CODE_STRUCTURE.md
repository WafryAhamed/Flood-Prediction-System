# Flood Resilience System - Complete Code Structure

## Project Overview

**Flood Resilience System** - A comprehensive disaster management and citizen safety platform for Sri Lanka featuring real-time weather data, flood predictions, citizen reporting, alert broadcasting, and emergency shelter management.

**Technology Stack:**
- Backend: FastAPI (Python 3.12) + SQLAlchemy + PostgreSQL
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Realtime: WebSocket + Server-Sent Events (SSE)
- State Management: Zustand
- Database: PostgreSQL 18.1 with 63 tables

---

## Backend Structure (`server/`)

### Entry Point
```
server/app/main.py
```
- FastAPI application factory
- Middleware configuration (CORS, GZIP, security headers)
- Health check endpoints
- Exception handlers
- Lifespan management (startup/shutdown)

### Configuration (`server/app/core/`)
```
server/app/core/
├── config.py                    # Settings and environment variables
├── security.py                  # JWT, password hashing, authorization
├── security_middleware.py       # HTTPS redirect, security audit logging
└── rate_limit.py               # Rate limiting configuration
```

**Key Files:**
- `config.py` - Database URL, API prefix, secret key, CORS origins
- `security.py` - JWT token creation/validation, role-based access control
- `rate_limit.py` - Rate limiting for auth, chat, reports

### Database Layer (`server/app/db/`)
```
server/app/db/
├── session.py                   # Database session, connection pooling
├── base.py                      # SQLAlchemy declarative base
└── __init__.py
```

**Features:**
- Async SQLAlchemy with asyncpg driver
- Connection pooling configuration
- Database echo logging in debug mode

### ORM Models (`server/app/models/`)
```
server/app/models/
├── alerts.py                    # Broadcast, Alert, EmergencyContact
├── districts.py                 # District, RiskZone
├── shelters.py                  # Shelter, Facility
├── weather.py                   # WeatherObservation, WeatherForecast, RiverGaugeReading
├── reports.py                   # CitizenReport, ReportEvent, ReportMedia
├── users.py                     # User, Role, Permission, AdminSession
├── audit.py                     # SystemSetting, AuditLog
└── base.py                      # Base model with timestamps
```

**Total Tables:** 63
- **Users & Auth**: User, Role, UserRole, RefreshToken, AdminSession
- **Reports**: CitizenReport, ReportEvent, ReportMedia, ReportUpvote, ReportTarget
- **Shelters**: Shelter, ShelterCapacity, ShelterAmenity
- **Weather**: WeatherObservation, WeatherForecast, WeatherAlert, RiverGaugeReading, RadarSnapshot, FloodPrediction
- **Broadcasts**: Broadcast, BroadcastTarget, NotificationDelivery, BroadcastPreference
- **GIS**: District, RiskZone, DistrictRiskSnapshot
- **Admin**: AdminControl, Maintenance, EmergencyContact, MapMarker
- **Audit**: SystemSetting, AuditLog, AdminAuditLog

### API Routes (`server/app/api/v1/`)
```
server/app/api/v1/
├── router.py                    # API router aggregator (includes all sub-routers)
├── auth.py                      # Authentication endpoints (login, register, refresh, logout)
├── users.py                     # User management (list, create, update, delete, roles)
├── reports.py                   # Citizen reports CRUD + moderation (verify, reject, dispatch, resolve)
├── districts.py                 # Districts, risk zones, risk history
├── shelters.py                  # Emergency shelters, capacity, find nearby
├── broadcasts.py                # Alert broadcasts, delivery stats, preferences
├── weather.py                   # Weather, forecasts, alerts, flood predictions
├── websocket.py                 # WebSocket endpoint for real-time alerts
├── integration.py               # Frontend integration API (bootstrap, events, state sync)
├── admin/
│   ├── __init__.py
│   ├── emergency_contacts.py    # Admin emergency contact management
│   └── map_markers.py           # Admin GIS marker management
└── __init__.py
```

**Route Prefixes:**
- `/auth` - Authentication (public)
- `/users` - User management (admin only)
- `/reports` - Citizen reports (public read, authenticated write)
- `/districts` - Geographic data (public)
- `/shelters` - Shelter locations (public)
- `/broadcasts` - Alert broadcasts (public read, operator write)
- `/weather` - Weather data (public)
- `/ws/alerts` - WebSocket for real-time alerts
- `/integration` - Frontend sync API (mixed auth)
- `/admin` - Admin operations (admin only)

### Services Layer (`server/app/services/`)
```
server/app/services/
├── auth_service.py              # User authentication, token management
├── integration_state.py         # Bootstrap state, SSE event publishing
├── admin_control_service.py     # Admin state management
└── __init__.py
```

**Key Functions:**
- `AuthService.authenticate_user()` - Validate credentials
- `AuthService.create_tokens()` - Generate JWT tokens
- `AuthService.refresh_tokens()` - Refresh expired tokens
- `integration_state_service.get_bootstrap()` - Get initial app state
- `integration_state_service.publish_event()` - Publish SSE events
- `AdminControlService.list_emergency_contacts()` - Get emergency numbers

### Request/Response Schemas (`server/app/schemas/`)
```
server/app/schemas/
├── auth.py              # LoginRequest, UserRegisterRequest, TokenResponse
├── users.py             # UserResponse, UserUpdateRequest, AdminCreateUserRequest
├── reports.py           # ReportCreateRequest, ReportResponse, ReportModerationRequest
├── districts.py         # DistrictResponse, RiskZoneResponse
├── shelters.py          # ShelterResponse, ShelterCapacityUpdate
├── broadcasts.py        # BroadcastResponse, BroadcastCreateRequest
├── weather.py           # CurrentWeatherResponse, WeatherAlertResponse
└── integration.py       # BootstrapResponse, EmergencyContactPayload, MapMarkerPayload
```

### Database Migrations (`server/alembic/`)
```
server/alembic/
├── env.py               # Alembic environment configuration
├── script.py.mako       # Migration template
├── versions/            # Migration files
│   ├── rev1.py
│   └── ...
└── alembic.ini         # Alembic configuration
```

### Utilities and Scripts
```
server/
├── init_db_simple.py    # Initialize database with seed data
├── check_backend.py     # Health check script
├── verify_system.py     # System verification script
├── test_db.py          # Database connection test
└── pyproject.toml      # Python dependencies and project metadata
```

---

## Frontend Structure (`client/`)

### Entry Points
```
client/
├── index.html           # HTML entry point
├── src/
│   ├── main.tsx         # React DOM render (deprecated, use index.tsx)
│   ├── index.tsx        # React application bootstrap
│   └── vite-env.d.ts    # Vite environment type definitions
```

### Main Application
```
client/src/
├── App.tsx              # Root component, routing setup
├── index.css            # Global styles
└── contexts/            # React Context providers
    ├── AccessibilityContext.tsx
    ├── ModeContext.tsx
    └── ModeContextDef.tsx
```

### Components (`client/src/components/`)
```
client/src/components/

# Core UI Components
├── Navigation.tsx               # Top navigation bar
├── ModeSelector.tsx            # Mode switcher (Citizen/Operator/Admin)
├── SystemLogo.tsx              # Logo component
├── OfflineBanner.tsx           # Offline status indicator
├── SafeModeBanner.tsx          # Safe mode indicator
├── QuickHelpButton.tsx         # Help button

# Alert & Notification
├── SmartAlertCenter.tsx         # Real-time alert display (WebSocket)
├── SmartAlertCenter.tsx.bak     # Backup version

# Accessibility Features
├── AccessibilityPanel.tsx       # Accessibility settings panel
├── AccessibilityControlCenter.tsx   # Accessibility controls
├── VoiceNarration.tsx          # Text-to-speech functionality

# Messaging & Chatbots
├── CitizenChatbot.tsx          # Citizen-facing chatbot
├── FloodAIChatbot.tsx          # AI-powered flood advice chatbot

# Safety & Security
├── FamilySafetyTools.tsx        # Family check-in features
├── SafetyProfileWizard.tsx      # User safety profile setup
├── GuardianContent.tsx          # Parental/guardian features

# Emergency Features
├── EmergencyQuickDial.tsx       # Quick emergency contact dialing
├── ActionChecklist.tsx          # Pre-flood action checklist
├── WhatShouldIDoNow.tsx         # Real-time guidance component

# Mapping & Visualization
├── RiskMap.tsx                  # Interactive flood risk map (GIS markers, shelters)

# Utility Components
├── AppLoader.tsx               # App initialization loader
├── OnboardingFlow.tsx          # First-time user onboarding
├── FloatingActionButtons.tsx   # FAB menu (speedial)

# UI Component Library (`client/src/components/ui/`)
├── Button.tsx                  # Reusable button component
├── Card.tsx                    # Card container
├── Dialog.tsx                  # Modal dialog
├── Input.tsx                   # Text input
├── Select.tsx                  # Dropdown select
├── Tabs.tsx                    # Tab navigation
├── Toast.tsx                   # Toast notifications
├── Badge.tsx                   # Badge/chip component
├── Slider.tsx                  # Slider input
├── Checkbox.tsx                # Checkbox input
└── ...other UI components

# Admin Components (`client/src/components/admin/`)
├── AdminDashboard.tsx          # Admin overview dashboard
├── BroadcastManager.tsx        # Broadcast creation/management
├── ReportModeration.tsx        # Report verification interface
├── UserManagement.tsx          # User administration
├── ShelterManagement.tsx        # Shelter capacity updates
├── DisasterMetrics.tsx         # KPI and metric displays
├── AIAssistant.tsx             # AI-powered admin assistant
├── Analytics.tsx               # Analytics and reporting
├── SettingsPanel.tsx           # System settings
└── ...other admin features
```

### Pages (`client/src/pages/`)
```
client/src/pages/

# Main Pages (Public)
├── HomePage.tsx                # Landing/home page
├── DashboardPage.tsx           # Main citizen dashboard
├── RiskMapPage.tsx             # Interactive risk map
├── ShelteredPage.tsx           # Shelter finder and information
├── WeatherPage.tsx             # Weather forecast and alerts
├── CommunityReportsPage.tsx    # Citizen reports feed
├── ResourcesPage.tsx           # Emergency resources
├── FAQPage.tsx                 # Frequently asked questions

# Disease/Disaster Specific
├── AgricultureAdvisor.tsx      # Agricultural flood advisory
├── EmergencyDashboard.tsx      # Emergency situation dashboard

# Admin Pages (`client/src/pages/admin/`)
├── AdminDashboard.tsx          # Admin main dashboard
├── AdminLogin.tsx              # Admin login page
├── AlertBroadcast.tsx          # Create/manage emergency broadcasts
├── ReportsTab.tsx              # Moderation queue for citizen reports
├── UserManagement.tsx          # Manage admin/operator users
├── ShelterManagement.tsx        # Update shelter status/capacity
├── WeatherControl.tsx          # Manage weather alerts
├── Analytics.tsx               # View system analytics
└── SettingsPanel.tsx           # System configuration
```

### Services (`client/src/services/`)
```
client/src/services/
└── integrationApi.ts           # API client for backend
    ├── buildUrl()              # Build API URL
    ├── requestJson()           # Make JSON requests
    ├── fetchBootstrapState()   # Get initial app state
    ├── fetchEmergencyContacts()
    ├── createEmergencyContact()
    ├── fetchMapMarkers()
    ├── createMapMarker()
    ├── createReport()
    ├── fetchWeatherSnapshot()
    ├── sendChatMessage()
    ├── openRealtimeStream()    # Open SSE event stream
    └── ...other API functions
```

**Proxy Configuration:** Vite proxies `/api/*` to `http://localhost:8000`

### Stores (`client/src/stores/`)
```
client/src/stores/
├── adminControlStore.ts        # Zustand store for admin control data
│   ├── broadcastFeed[]         # Emergency broadcasts
│   ├── dashboardResources[]    # Resource availability
│   ├── agricultureAdvisories[] # Agricultural alerts
│   ├── recoveryProgress[]      # Recovery status metrics
│   └── learnGuides[]           # Educational content
├── maintenanceStore.ts         # Maintenance/operational data
│   ├── emergencyContacts[]     # Emergency phone numbers
│   ├── mapMarkers[]            # GIS markers
│   └── users[]                 # System users
├── reportStore.ts              # Citizen reports store
│   ├── reports: FloodReport[]  # Array of reports
│   ├── addReport()             # Create new report
│   ├── verifyReport()          # Verify report (admin)
│   └── ...moderation functions
├── ...other stores
```

**API Integration:**
- Stores hydrated from `/api/v1/integration/bootstrap` on startup
- SSE event stream at `/api/v1/integration/events` triggers store updates
- Zustand listeners debounce state changes to backend

### Hooks (`client/src/hooks/`)
```
client/src/hooks/
├── useFloodMode.ts             # Access flood mode context
├── useOnboarding.ts            # Manage onboarding state
├── usePlatformRealtimeSync.ts  # Real-time data synchronization
│   ├── fetchBootstrapState()
│   ├── openRealtimeStream()    # SSE connection
│   └── handleEvent()           # Process incoming events
├── useWeatherData.ts           # Fetch and cache weather data
│   ├── fetchWeatherSnapshot()
│   └── Refresh every 5 minutes
└── ...other custom hooks
```

### Internationalization (`client/src/i18n/`)
```
client/src/i18n/
├── i18nConfig.ts               # i18n configuration (i18next)
└── translationStrings.ts       # Translation keys and strings
    ├── English (en)
    ├── Sinhala (si)
    └── Tamil (ta)
```

### Styling
```
client/
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── src/index.css               # Global styles
└── src/components/*.tsx        # Per-component Tailwind classes
```

### Build & Configuration
```
client/
├── vite.config.ts              # Vite build configuration
│   ├── React plugin
│   ├── API proxy to backend
│   ├── Environment variables
│   └── Build optimization
├── tsconfig.json               # TypeScript configuration
├── tsconfig.node.json          # Node.js TypeScript config
├── eslint.config.js            # ESLint linting rules
├── package.json                # npm dependencies
│   ├── react 18
│   ├── typescript
│   ├── tailwindcss
│   ├── zustand (state management)
│   ├── lucide-react (icons)
│   └── ...other dependencies
├── vite-env.d.ts               # Vite environment types
└── public/
    ├── manifest.json           # PWA manifest
    └── service-worker.js       # Service worker for offline support
```

---

## Key API Flows

### Bootstrap (App Startup)
```
Frontend App Load
    ↓
GET /api/v1/integration/bootstrap
    ↓
Returns: { adminControl, maintenance, reports }
    ↓
Zustand stores hydrated
    ↓
useAdminControlStore.hydrateFromBackend()
useMaintenanceStore.hydrateFromBackend()
useReportStore.hydrateReports()
    ↓
Components render with initial data
```

### Real-Time Sync (SSE)
```
usePlatformRealtimeSync() hook
    ↓
openRealtimeStream() → GET /api/v1/integration/events
    ↓
EventSource API listens to server
    ↓
Backend publishes events:
    - adminControl.updated
    - maintenance.updated
    - reports.updated
    ↓
handleEvent() processes payload
    ↓
Zustand stores updated
    ↓
Components re-render with new data
```

### Broadcast Publishing
```
Admin creates broadcast → POST /api/v1/broadcasts
    ↓
Backend saves to database
    ↓
POST /api/v1/broadcasts/{id}/publish
    ↓
status = ACTIVE
    ↓
WebSocket broadcast to SmartAlertCenter
    ↓
SSE event "adminControl.updated"
    ↓
Frontend stores sync
    ↓
User pages (EmergencyDashboard) update
```

### Citizen Report Flow
```
User submits report → POST /api/v1/reports
    ↓
Backend saves with status: PENDING
    ↓
Frontend adds to reportStore
    ↓
Admin reviews (POST /reports/{id}/verify)
    ↓
status = VERIFIED
    ↓
SSE triggers reports.updated
    ↓
Frontend updates map markers
    ↓
(Optional) Admin dispatches response
```

---

## Database Relationships

### Users
```sql
User (1) ←─── (M) Role
  │         UserRole
  ├─→ RefreshToken
  ├─→ AdminSession
  └─→ CitizenReport (as reporter)
```

### Reports
```sql
CitizenReport (1) ←─── (M) ReportEvent
                   ├─→ ReportMedia
                   ├─→ ReportUpvote
                   └─→ ReportTarget
```

### Shelters
```sql
Shelter (1) ←─── (M) ShelterCapacity
        ├─→ ShelterAmenity
        └─→ District
```

### Broadcasts
```sql
Broadcast (1) ←─── (M) BroadcastTarget
          ├─→ NotificationDelivery
          └─→ BroadcastPreference
```

### Districts
```sql
District (1) ←─── (M) RiskZone
         ├─→ WeatherObservation
         ├─→ WeatherForecast
         ├─→ DistrictRiskSnapshot
         └─→ FloodPrediction
```

---

## Environment Variables

### Backend
```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/db
DEBUG=True
SECRET_KEY=your-secret-key
CORS_ORIGINS=["http://localhost:5173"]
RATE_LIMIT_AUTH_REQUESTS_PER_MINUTE=5
```

### Frontend
```
VITE_API_BASE=http://localhost:8000
VITE_DEFAULT_LAT=8.3593
VITE_DEFAULT_LON=80.5103
```

---

## Performance Optimizations

### Backend
- Connection pooling (asyncpg)
- Query optimization with eager loading
- Rate limiting on public endpoints
- Response compression (gzip)
- Caching headers for static content

### Frontend
- Code splitting per route
- Lazy component loading
- Image optimization
- Debounced API calls
- Zustand for efficient state updates
- WebSocket for real-time instead of polling

---

## Security Measures

- JWT tokens with expiration
- Password hashing (bcrypt)
- CORS origin validation
- Request validation (Pydantic)
- Rate limiting
- SQL injection prevention (ORM)
- XSS protection (CSP headers)
- HTTPS in production
- Secure cookie flags

---

## Testing

### Backend
```
pytest tests/
pytest tests/api_tests.py -v
```

### Frontend
```
npm test
npm run test:coverage
```

### API Tests
```
python quick_test.py
python full_workflow_test.py
python test_api_endpoints.py
```

---

## Deployment Checklist

- [ ] Set DATABASE_URL to production database
- [ ] Generate secure SECRET_KEY
- [ ] Configure CORS_ORIGINS for production domain
- [ ] Set DEBUG=False
- [ ] Run `npm run build` for production bundle
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Enable HTTPS/SSL
- [ ] Set up log aggregation
- [ ] Configure monitoring (AppInsights, New Relic)
- [ ] Database backups scheduled
- [ ] Test disaster recovery plan

---

## File Size Summary

```
server/
  ├── app/                    ~500 KB
  ├── alembic/               ~100 KB
  └── Other                  ~50 KB
  Total: ~650 KB

client/
  ├── src/                   ~400 KB
  ├── node_modules/          ~800 MB
  ├── dist/ (built)          ~2 MB
  └── Other                  ~50 KB
  Total: ~800+ MB (with deps)
```

---

## Maintenance Guidelines

1. **Database**: Backup daily, monitor query performance
2. **Frontend**: Update dependencies monthly, test compatibility
3. **API**: Monitor 404/500 errors, track response times
4. **Security**: Rotate secrets quarterly, audit access logs
5. **Documentation**: Keep inline comments up-to-date

---

## Additional Notes

- **Language Support**: English, Sinhala, Tamil
- **Accessibility**: WCAG 2.1 Level AA compliant
- **Mobile**: Responsive design, works on all devices
- **Offline**: Service worker for offline browsing
- **Analytics**: Event tracking for user interactions
- **Notifications**: Push, SMS, Email (configurable)

This system is production-ready and fully tested.
