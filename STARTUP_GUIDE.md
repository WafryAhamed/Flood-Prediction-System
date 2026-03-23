# System Startup Guide - All Services Ready

**Status:** ✅ Ready to Start (with PostgreSQL setup needed)  
**Date:** March 23, 2026  
**Environment:** Windows PowerShell  

---

##  PART 1: PRE-STARTUP STATUS

### Dependencies Installed ✅

**Backend (Python):**
```
✓ FastAPI 0.135.2
✓ SQLAlchemy + asyncpg
✓ Uvicorn (async server)
✓ All other backend packages
  Location: e:\floodweb\server\.venv_fresh\
```

**Frontend (Node.js):**
```
✓ React 19.2
✓ Vite 8.0  
✓ TypeScript 5.5
✓ Zustand 5.0
✓ All frontend packages
  Location: e:\floodweb\client\node_modules\
```

**Configuration Fixed ✅**
```
✓ Vite proxy port: 8001 → 8000 (client/vite.config.ts)
✓ Python venv: Recreated fresh (.venv_fresh)
```

---

## PART 2: DATABASE SETUP (CRITICAL - Must Do Before Starting Backend)

### Option A: Install Local PostgreSQL (Recommended for Dev)

**Download and Install:**
1. Download PostgreSQL 16 from: https://www.postgresql.org/download/windows/
2. Run installer with these settings:
   - **Database Superuser Password:** `2001` (or match your preference)
   - **Port:** 5432 (default)
   - **Include pgAdmin4:** Yes

**After Installation:**
```powershell
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Create the flood_resilience database
psql -U postgres -c "CREATE DATABASE flood_resilience;"

# Verify database created
psql -U postgres -l | findstr flood_resilience
```

**Then Update .env:**
```ini
# server/.env
DATABASE_URL=postgresql+asyncpg://postgres:2001@127.0.0.1:5432/flood_resilience
```

### Option B: Use Docker (If Docker Desktop Installed)

```powershell
cd e:\floodweb\server
docker-compose up postgres redis -d
# Wait for healthy status (~15 seconds)
docker-compose ps
```

---

## PART 3: STARTUP SEQUENCE

### Terminal 1: PostgreSQL (SKIP IF ALREADY RUNNING)

**If using Docker:**
```powershell
cd e:\floodweb\server
docker-compose up postgres redis
```

**If using local PostgreSQL:**
- Start from Services (services.msc → PostgreSQL Service → Start)
- Or: `pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start` (if CLI available)

**Verify Ready:**
```powershell
psql -U postgres -c "SELECT 1;" # Should return: 1 ✓
```

---

### Terminal 2: Backend FastAPI Server

**Start Backend:**
```powershell
cd e:\floodweb\server

# Run development server
& "e:\floodweb\server\.venv_fresh\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Once Running:**
- API Docs: http://127.0.0.1:8000/api/v1/docs
- Health Check: http://127.0.0.1:8000/api/v1/health
- Bootstrap: http://127.0.0.1:8000/api/v1/integration/bootstrap

---

### Terminal 3: Frontend Vite Development Server

**Start Frontend:**
```powershell
cd e:\floodweb\client

# Run Vite development server
npm run dev
```

**Expected Output:**
```
Local:   http://127.0.0.1:5173/
```

**Vite Proxy Active For:**
- `/api/*` → http://127.0.0.1:8000/api/*
- `/health` → http://127.0.0.1:8000/health

---

## PART 4: BROWSER TESTING

**Open:** http://127.0.0.1:5173

### Test Checklist

```
Page Loading:
  [ ] Home page loads
  [ ] No CORS errors in console
  [ ] Vite proxy working (/api requests succeed)

Navigation:
  [ ] Can navigate to pages
  [ ] All routes accessible

Authentication:
  [ ] Admin login page appears
  [ ] Can attempt login (may fail if no admin user in DB yet)

Real-Time Console:
  [ ] Open DevTools → Console
  [ ] Watch for SSE connection to /api/v1/integration/events
  [ ] Check for WebSocket connection to /api/v1/ws/alerts
  [ ] Should see minimal errors

Database Connection:
  [ ] Backend logs should show database connected
  [ ] No "connection refused" errors
```

---

## PART 5: INITIALIZATION (First Run Only)

### Create Admin User (If Needed)

```powershell
cd e:\floodweb
python create_admin.py
# Follow prompts to create first admin account
```

### Initialize Database Tables (If Needed)

```powershell
cd e:\floodweb\server
& "e:\floodweb\server\.venv_fresh\Scripts\python.exe" init_db_simple.py
# Should output: ✓ Database initialization COMPLETE!
```

---

## PART 6: DEVELOPMENT WORKFLOW

### Adding Dependencies

**Backend (Python):**
```powershell
cd e:\floodweb\server
& "e:\floodweb\server\.venv_fresh\Scripts\python.exe" -m pip install newpackage
# Update pyproject.toml manually
```

**Frontend (JavaScript):**
```powershell
cd e:\floodweb\client
npm install newpackage --save
```

### Database Migrations (If Needed)

```powershell
cd e:\floodweb\server
# Create migration:
& "e:\floodweb\server\.venv_fresh\Scripts\python.exe" -m alembic revision --autogenerate -m "Description"

# Apply migrations:
& "e:\floodweb\server\.venv_fresh\Scripts\python.exe" -m alembic upgrade head
```

### Hot Reload

- **Backend:** Uvicorn auto-restarts on file changes (--reload flag)
- **Frontend:** Vite hot-reload on save (automatic)

---

## PART 7: TROUBLESHOOTING

### Port 8000 Already in Use

```powershell
# Find process using port 8000
Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess

# Kill process (replace PID with actual process ID)
Stop-Process -Id PID -Force
```

### Port 5173 Already in Use

```powershell
# Find and kill:
Get-NetTCPConnection -LocalPort 5173 | Select-Object OwningProcess
Stop-Process -Id PID -Force
```

### PostgreSQL Connection Refused

```powershell
#  Check if PostgreSQL running
Get-Service | findstr postgres

# Or check Docker
docker ps | findstr postgres

# If not running, start it
# Windows Services: services.msc → PostgreSQL → Start
```

### Frontend Can't Connect to Backend

1. **Check Vite proxy:** `client/vite.config.ts` line 14 should be `:8000`
2. **Check backend running:** `curl http://127.0.0.1:8000/api/v1/health`
3. **Check console:** Open browser DevTools → Network → look for /api requests
4. **CORS issue?** Backend logs should show error

### Backend Can't Connect to Database

```powershell
# Check connection string in .env
cat server/.env | findstr DATABASE_URL

# Test connection manually:
& "e:\floodweb\server\.venv_fresh\Scripts\python.exe" -c "
from app.core.config import settings
print('Database URL:', settings.database_url)
"

# Or test with psql:
psql postgresql://postgres:2001@127.0.0.1:5432/flood_resilience
```

---

## PART 8: SYSTEM VALIDATION CHECKLIST

### Quick Validation Commands

Run these to verify everything is working:

```powershell
# Terminal 2 (Backend) - Check API Health
curl http://127.0.0.1:8000/api/v1/health

# Terminal 2 (Backend) - Check Bootstrap State
curl http://127.0.0.1:8000/api/v1/integration/bootstrap | convertfrom-json | select -first 3

# Terminal 3 (Frontend) - Check logs show Vite proxy active
# Look for: "Local: http://127.0.0.1:5173"

# Browser - Open and test
start "http://127.0.0.1:5173"
```

### Expected Success Indicators

1. **No Errors in Any Terminal**
   - Backend: No red errors, just info logs
   - Frontend: No build errors, just "Local: ..."
   - Database: No connection refused messages

2. **Browser Loads Without CORS Errors**
   - Page renders
   - DevTools Console shows no red errors
   - Network tab shows successful /api requests

3. **Real-Time Sync Works**
   - Can see SSE stream in DevTools Network (/api/v1/integration/events)
   - WebSocket connection established (/api/v1/ws/alerts)
   - No "ERR_FAILED" network errors

4. **Admin → User Sync Functional**
   - Create broadcast in admin
   - See immediately on user dashboard (from broadcast SSE fix)
   - No manual refresh needed

---

## PART 9: NEXT STEPS AFTER STARTUP

Once all 3 services are running:

1. **Login to Admin Panel**
   - URL: http://127.0.0.1:5173/admin
   - Credentials: Created with `create_admin.py`

2. **Test Features**
   - Create emergency contact (should appear on user QuickDial)
   - Create map marker (should appear on user RiskMap)
   - Create broadcast (should appear in alerts)
   - Submit report as citizen (should appear in admin ReportsTab)

3. **Monitor Real-Time Sync**
   - Each action should sync immediately (< 100ms)
   - No manual refresh needed
   - Data persists in PostgreSQL

4. **Review Logs**
   - Backend: `tail -f` the console output
   - Frontend: DevTools Console
   - Database: Check with `psql`

---

## PART 10: DEPLOYMENT REFERENCE

### Environment Variables Needed

**Backend (.env):**
```ini
DATABASE_URL=postgresql+asyncpg://postgres:2001@127.0.0.1:5432/flood_resilience
ENVIRONMENT=development
DEBUG=true
# ... others in .env.example
```

**Frontend (.env):**
```ini
VITE_WEATHER_API=https://api.open-meteo.com
VITE_RAIN_API=https://api.rainviewer.com
```

### Production Build

**Frontend:**
```powershell
cd e:\floodweb\client
npm run build
# Output: dist/ folder ready for serving
```

**Backend:**
```powershell
# Use gunicorn or uvicorn with workers:
& "e:\floodweb\server\.venv_fresh\Scripts\uvicorn.exe" app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## QUICK START SCRIPT

Save as `start_all.ps1`:

```powershell
# Start all services
Write-Host "Starting Flood Resilience System..."

# Terminal 1: Backend
Start-Process powershell -ArgumentList {
    cd e:\floodweb\server
    & "e:\floodweb\server\.venv_fresh\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
}

# Wait for backend to start
Start-Sleep -Seconds 3

# Terminal 2: Frontend
Start-Process powershell -ArgumentList {
    cd e:\floodweb\client
    npm run dev
}

Write-Host "Services starting..."
Write-Host "Backend:  http://127.0.0.1:8000"
Write-Host "Frontend: http://127.0.0.1:5173"
Write-Host ""
Write-Host "Press CTRL+C in either terminal to stop"
```

Run with: `powershell -ExecutionPolicy Bypass -File start_all.ps1`

---

## SUMMARY

| Component | Status | Location | Command |
|-----------|--------|----------|---------|
| **Backend** | ✓ Ready | server/ | `uvicorn app.main:app --port 8000 --reload` |
| **Frontend** | ✓ Ready | client/ | `npm run dev` |
| **Database** | ⚠️ Setup Needed | PostgreSQL | Install or Docker |
| **Node.js** | ✓ v25.1.0 | System | `npm --version` |
| **Python** | ✓ 3.12.10 | System | `python --version` |
| **venv** | ✓ Active | .venv_fresh/ | Ready to use |

---

**Next Step: Install PostgreSQL (Option A) or Docker (Option B), then start all 3 services!**

Questions? Check TROUBLESHOOTING section or review SYSTEM_SETUP_ANALYSIS.md for full details.
