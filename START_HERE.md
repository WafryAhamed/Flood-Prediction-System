# Quick Reference - Starting Flood Resilience System

## TL;DR - Start Everything in 1 Command
```powershell
.\run-dev.ps1
```
Then go to: http://localhost:5173

---

## Before First Run (One Time Setup)
```powershell
# Check everything is ready
.\dev-check.ps1

# If there are issues, see ENVIRONMENT_SETUP.md for fixes
```

---

## Three Ways to Run

### 1. Full System (Frontend + Backend)
```powershell
.\run-dev.ps1
```
- Starts backend on http://127.0.0.1:8000
- Starts frontend on http://localhost:5173
- Both in separate windows with monitoring

### 2. Backend Only
```powershell
.\run-backend.ps1
```
- FastAPI server on http://127.0.0.1:8000
- Auto-reload enabled
- API docs: http://127.0.0.1:8000/api/v1/docs

### 3. Frontend Only
```powershell
.\run-frontend.ps1
```
- React dev server on http://localhost:5173
- Hot Module Reload enabled
- Will auto-connect to backend if available

---

## Access the Application

| Component | URL |
|-----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://127.0.0.1:8000 |
| API Docs | http://127.0.0.1:8000/api/v1/docs |
| Health Check | http://127.0.0.1:8000/health |
| Database | localhost:5432 (postgres/2001) |

---

## Making Code Changes

### Frontend Changes
- Edit files in `client/src/`
- Changes auto-reload in browser (HMR)
- Check browser console for errors

### Backend Changes
- Edit files in `server/app/`
- Changes auto-reload via Uvicorn
- Check terminal for errors

### Database Schema Changes
```powershell
cd server
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## Stopping the System

**From run-dev.ps1 window**: Press Ctrl+C  
All services will shut down gracefully

**Individual services**: Press Ctrl+C in their window

---

## During Development

### Monitor Backend
```powershell
# Check if running
curl http://127.0.0.1:8000/health

# View API docs
# Visit: http://127.0.0.1:8000/api/v1/docs
```

### Monitor Frontend
```powershell
# Check if running
curl http://localhost:5173

# View browser console (F12)
```

### Check Database
```powershell
# From another terminal
cd server
python -c "import asyncio; from app.db.session import check_db_connection; print('DB OK' if asyncio.run(check_db_connection()) else 'DB Failed')"
```

---

## Common Issues & Quick Fixes

### Port in Use
```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill it
taskkill /PID <number> /F
```

### npm Dependencies Missing
```powershell
cd client
npm install
```

### Python Issues
```powershell
# Activate venv
& .\.venv\Scripts\Activate.ps1

# Check Python
python --version
```

### Database Connection Issues
```powershell
# Start PostgreSQL service
Start-Service postgresql-x64-18

# Verify connection
psql -U postgres -d flood_resilience
```

---

## Useful Commands

```powershell
# Health check
.\dev-check.ps1

# Start everything
.\run-dev.ps1

# View backend logs (from another terminal)
cd server
& .\..\\.venv\Scripts\Activate.ps1
uvicorn app.main:app --log-level debug

# Run backend tests
cd server
pytest tests/

# Build frontend
cd client
npm run build

# Database migration
cd server
alembic upgrade head

# System verification
cd server
python verify_system.py

# Seed database
cd server
python scripts/seed_db.py
```

---

## Ports Used

- **5173** - Frontend (Vite dev server)
- **8000** - Backend (FastAPI)
- **5432** - PostgreSQL
- **6379** - Redis (optional, not required)

If any port is in use, see "Port in Use" section above.

---

## Full Documentation

- **Development Guide**: [DEVELOPMENT.md](./DEVELOPMENT.md)
- **Environment Setup**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **Database Info**: [QA_AUDIT_REPORT.md](./QA_AUDIT_REPORT.md)

---

**Ready to code?** Just run: `.\run-dev.ps1` ⚡
