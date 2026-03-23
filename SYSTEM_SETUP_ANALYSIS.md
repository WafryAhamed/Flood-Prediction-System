# System Setup Analysis & Pre-Run Report

**Date:** March 23, 2026  
**Status:** Ready to Initialize (with fixes needed)

---

## 1. ENVIRONMENT CHECK ✅

### Installed Tools
- ✅ **Node.js:** v25.1.0 
- ✅ **npm:** 11.6.2
- ✅ **Python:** 3.12.10
- ⚠️ **pip:** Not accessible (venv issue)
- ❌ **PostgreSQL:** Not in system PATH

### Issue #1: Virtual Environment Problem
**Current:** Server venv activated but pip broken
```
Error: python -m pip → No module named pip
```
**Root Cause:** Corrupted or incomplete venv
**Fix:** Recreate venv cleanly

### Issue #2: PostgreSQL Not Installed Locally
**Current:** PostgreSQL not found in system PATH  
**Solution:** Use Docker Compose to run PostgreSQL instead (preferred, cleaner)
**Alternative:** Install PostgreSQL locally (if Docker not available)

### Analysis: Use Docker or Native Postgres?
- **Recommended:** Docker Compose (database only, not the whole stack)
- **Reason:** Cleaner setup, no PATH issues, reproducible
- **Approach:** Start only `postgres` + `redis` services via docker-compose

---

## 2. PROJECT STRUCTURE SUMMARY

```
flood-resilience/
├── server/ (FastAPI Backend)
│   ├── app/
│   │   ├── main.py (FastAPI entry)
│   │   ├── api/v1/ (API routes)
│   │   ├── models/ (SQLAlchemy ORM)
│   │   ├── schemas/ (Pydantic models)
│   │   ├── services/ (Business logic)
│   │   └── db/ (Database layer)
│   ├── alembic/ (Database migrations)
│   ├── scripts/ (Database setup)
│   ├── .env (Config - has DB_PASSWORD=2001, PORT not set)
│   ├── pyproject.toml (Python dependencies)
│   ├── docker-compose.yml (PostgreSQL + Redis)
│   └── Dockerfile (Container)
│
├── client/ (React Frontend)
│   ├── src/
│   │   ├── App.tsx (Main component)
│   │   ├── pages/ (Admin + User pages)
│   │   ├── components/ (Reusable components)
│   │   ├── services/ (API client)
│   │   ├── stores/ (Zustand state)
│   │   └── hooks/ (Custom hooks, including real-time sync)
│   ├── .env (Frontend config)
│   ├── vite.config.ts (Vite proxy: /api → :8001) ⚠️
│   ├── package.json (npm dependencies)
│   └── tsconfig.json
│
└── Multiple audit docs (from previous fix)
```

---

## 3. DEPENDENCIES SUMMARY

### Backend (Python 3.12+)
**Core:**
- FastAPI 0.115+
- Uvicorn (async server)
- SQLAlchemy + asyncpg (PostgreSQL)
- Alembic (migrations)
- Pydantic (validation)

**Features:**
- Authentication: python-jose, bcrypt
- Real-time: WebSocket support (built-in)
- Geo: geoalchemy2, shapely, geopy
- Cache: redis
- File upload: aiofiles, boto3
- Observability: opentelemetry

**Status:** All dependencies defined in pyproject.toml ✅

### Frontend (Node 20+)
**Core:**
- React 19.2
- Vite 8.0
- TypeScript 5.5
- React Router 7.13
- Zustand 5.0

**UI:**
- Tailwind CSS 3.4
- Framer Motion (animations)
- Lucide React (icons)
- Leaflet (map library)
- Recharts (data visualization)

**Status:** All dependencies defined in package.json ✅

### Database
**PostgreSQL 16** with:
- PostGIS extension (geospatial)
- pgvector extension (embeddings)
- Required tables: users, broadcasts, reports, emergency_contacts, etc.

### Cache & Task Queue
- **Redis 7** (caching + Celery broker)
- **Celery 5.4** (optional, for background tasks)

---

## 4. ENVIRONMENT VARIABLES

### Backend (.env file exists)
**Current:**
```
DATABASE_URL=postgresql+asyncpg://postgres:2001@127.0.0.1:5432/flood_resilience
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=...
JWT_SECRET_KEY=...
ENVIRONMENT=development
```

**Issues:**
- ⚠️ No PORT specified (defaults to 8000)
- ⚠️ DB_PASSWORD in .env (should be env variable)
- ✅ CORS configured for localhost:5173

**Check needed:** Verify DATABASE_URL can connect

### Frontend (.env file exists)
**Current:**
```
VITE_WEATHER_API=https://api.open-meteo.com
VITE_OPENROUTER_API_KEY=...
```

**Issues Found:**
1. ⚠️ **CRITICAL:** Vite proxy points to `:8001` but backend runs on `:8000`
   - File: client/vite.config.ts line 14
   - Current: `target: 'http://127.0.0.1:8001',`
   - Should be: `target: 'http://127.0.0.1:8000',`

---

## 5. REQUIRED RUN COMMANDS

### Terminal 1: Database (Docker)
```bash
cd e:\floodweb\server
docker-compose up postgres redis  # Starts PostgreSQL 16 + Redis 7
```

**Expected:**
- PostgreSQL: Listening on :5432
- Redis: Listening on :6379
- Healthcheck: Should show "healthy"

### Terminal 2: Backend
```bash
cd e:\floodweb\server

# Fix venv (if needed)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -e .

# Initialize database (if first run)
# python -m alembic upgrade head

# Run server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Expected:**
- Logs: "Application startup complete"
- API endpoint: http://127.0.0.1:8000
- Docs: http://127.0.0.1:8000/docs (OpenAPI UI)

### Terminal 3: Frontend
```bash
cd e:\floodweb\client

# Install dependencies (if not done)
npm install

# Start dev server
npm run dev
```

**Expected:**
- Logs: "Local: http://127.0.0.1:5173"
- Vite proxy active for /api routes
- Hot reload enabled

---

## 6. PREREQUISITE CHECKS

### Before Starting

**Step 1: Fix Vite Proxy Port**
```diff
// client/vite.config.ts line 14
- target: 'http://127.0.0.1:8001',
+ target: 'http://127.0.0.1:8000',
```

**Step 2: Verify Docker Installed**
```bash
docker --version
docker-compose --version
```

**Step 3: Clean Python Environment** (if needed)
```bash
cd e:\floodweb\server
Remove-Item -Recurse -Force .venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -e .
```

**Step 4: Verify Frontend Dependencies**
```bash
cd e:\floodweb\client
npm install --legacy-peer-deps  # if peer dependency issues
```

---

## 7. STARTUP SEQUENCE (Correct Order)

1. **Terminal 1 - Database:** `docker-compose up postgres redis`
   - Wait for "healthy" status (~15 seconds)

2. **Terminal 2 - Backend:** `uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload`
   - Wait for "Application startup complete"
   - Database migration check

3. **Terminal 3 - Frontend:** `npm run dev`
   - Wait for "Local: http://127.0.0.1:5173"

4. **Browser:** Open http://127.0.0.1:5173
   - Vite proxy will route /api/* to http://127.0.0.1:8000

---

## 8. EXPECTED ENDPOINTS

### Backend API (Port 8000)
- `GET /` - Root
- `GET /api/v1/health` - Health check
- `GET /api/v1/docs` - OpenAPI documentation
- `GET /api/v1/integration/bootstrap` - Initial state
- `GET /api/v1/integration/events` - SSE stream
- `WS /api/v1/ws/alerts` - WebSocket alerts
- `POST /api/v1/broadcasts` - Create broadcast
- `POST /api/v1/broadcasts/{id}/publish` - Publish broadcast
- `GET /api/v1/broadcasts` - List broadcasts
- `POST /api/v1/reports` - Submit report
- etc.

### Frontend App (Port 5173)
- `/` - Home (public)
- `/dashboard` - User emergency dashboard
- `/admin` - Admin panel
- `/admin/broadcasts` - Broadcast management
- `/admin/reports` - Report management
- `/login` - Authentication
- etc.

---

## 9. KNOWN ISSUES TO FIX

### Issue 1: Vite Proxy Port Mismatch ⚠️ MUST FIX
- **File:** client/vite.config.ts
- **Line:** 14
- **Current:** `target: 'http://127.0.0.1:8001',`
- **Fix:** Change to `target: 'http://127.0.0.1:8000',`
- **Impact:** Frontend API calls will fail if not fixed

### Issue 2: Python Virtual Environment Corrupted
- **Symptom:** pip not available in venv
- **Fix:** Recreate .venv from scratch
- **Time:** ~2 minutes

### Issue 3: PostgreSQL Not in PATH
- **Solution:** Use Docker Compose (simplest)
- **Alternative:** Install PostgreSQL 16 locally
- **Time:** ~5 minutes for Docker

---

## 10. POST-RUN VALIDATION CHECKLIST

Once all 3 terminals are running:

```
Database (Terminal 1):
  [ ] PostgreSQL listening on :5432
  [ ] Redis listening on :6379
  [ ] Healthcheck passing

Backend (Terminal 2):
  [ ] Uvicorn startup complete
  [ ] Database connection successful
  [ ] No errors in logs
  [ ] GET http://127.0.0.1:8000/api/v1/health → 200
  [ ] GET http://127.0.0.1:8000/api/v1/docs → OpenAPI UI loads

Frontend (Terminal 3):
  [ ] Vite dev server running
  [ ] No build errors
  [ ] Open browser: http://127.0.0.1:5173

Connection Tests:
  [ ] Frontend loads without CORS errors
  [ ] Admin login works
  [ ] Create broadcast in admin
  [ ] Broadcast appears in user interface
  [ ] Real-time sync works (SSE/WebSocket)

System Integration:
  [ ] Admin-to-user data sync working
  [ ] Database changes persist
  [ ] No stale data issues (after broadcast SSE fix)
  [ ] All pages accessible
```

---

## 11. SUMMARY

### What's Set Up ✅
- Project structure complete
- All dependencies defined
- Environment files created
- Docker compose ready for database
- Real-time sync infrastructure complete

### What Needs Fixing ⚠️
1. **Vite proxy port:** 8001 → 8000 (1 line fix)
2. **Python venv:** Possibly corrupted (can be rebuilt)
3. **PostgreSQL:** Not installed locally (use Docker instead)

### Estimated Setup Time
- Fix Vite proxy: 1 minute
- Rebuild Python venv: 2 minutes
- Start Docker database: 1 minute
- Install frontend dependencies: 3 minutes  
- Start backend: 1 minute
- Start frontend: 1 minute

**Total: ~10 minutes**

### Risk Level: LOW
- No database migrations needed (assumed tables exist)
- All code is production-ready (from previous audit)
- Main issue is config (Vite port) which is trivial to fix

---

## NEXT STEP

**Ready to proceed with full system startup?**

The fix list:
1. Fix Vite proxy port
2. Verify/fix Python venv (if needed)
3. Start all 3 terminals
4. Validate connectivity
5. Test admin → user sync (already fixed in previous PR)

All procedures documented above.
