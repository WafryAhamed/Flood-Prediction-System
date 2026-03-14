# Flood Resilience System - Development Setup Guide

## Quick Start

### Prerequisites
- **Python 3.12+** with virtual environment
- **Node.js 20+** with npm
- **PostgreSQL 18+** running locally with database `flood_resilience`
- **Windows PowerShell** (version 5.1 or higher)

### Fastest Way to Start

```powershell
# Check system readiness
.\dev-check.ps1

# Start everything (backend + frontend)
.\run-dev.ps1
```

Then access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://127.0.0.1:8000
- **API Docs**: http://127.0.0.1:8000/api/v1/docs

## System Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (React 18 + TypeScript + Vite)       │
│  http://localhost:5173                          │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/JSON (Fetch API)
                   ↓
┌─────────────────────────────────────────────────┐
│  Backend (FastAPI + Python 3.12)               │
│  http://127.0.0.1:8000                         │
└──────────────────┬──────────────────────────────┘
                   │ Async/Await (asyncpg)
                   ↓
┌─────────────────────────────────────────────────┐
│  Database (PostgreSQL 18 + PostGIS)            │
│  localhost:5432 / flood_resilience             │
└─────────────────────────────────────────────────┘
```

## Startup Options

### Option 1: Full System (Recommended)
```powershell
.\run-dev.ps1
```
Starts backend and frontend in separate windows with health checks and monitoring.

### Option 2: Backend Only
```powershell
.\run-backend.ps1
```
Starts FastAPI development server on http://127.0.0.1:8000
- Auto-reload enabled (watches for code changes)
- OpenAPI documentation at http://127.0.0.1:8000/api/v1/docs
- Health check at http://127.0.0.1:8000/health

### Option 3: Frontend Only
```powershell
.\run-frontend.ps1
```
Starts Vite development server on http://localhost:5173
- Hot Module Reload (HMR) enabled
- API proxy configured for backend calls
- Auto-installation of dependencies if needed

## Environment Configuration

### Backend (.env)
Location: `server/.env`

Key variables:
```env
DATABASE_URL=postgresql+asyncpg://postgres:2001@localhost:5432/flood_resilience
DEBUG=true
API_V1_PREFIX=/api/v1
SECRET_KEY=your-secret-key-32-chars-minimum
JWT_SECRET_KEY=your-jwt-secret-key-32-chars
```

### Frontend (.env)
Location: `client/.env`

Key variables:
```env
VITE_BACKEND_URL=http://localhost:8000
VITE_WEATHER_API=https://api.open-meteo.com
VITE_RAIN_API=https://api.rainviewer.com
```

## Database Setup

### Initial Setup
1. Create PostgreSQL database:
   ```sql
   CREATE DATABASE flood_resilience
       ENCODING UTF8
       LC_COLLATE='C'
       LC_CTYPE='C'
       TEMPLATE=template0;
   ```

2. Run migrations:
   ```powershell
   cd server
   alembic upgrade head
   ```

3. Seed sample data:
   ```powershell
   python scripts/seed_db.py
   ```

### Database Verification
The system automatically:
- Creates required extensions (PostGIS, pgvector, uuid-ossp)
- Validates schema on startup
- Checks for database connectivity

## Troubleshooting

### Port Already in Use
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or use different port
SetEnv PORT 8001  # Backend
SetEnv FRONTEND_PORT 5174  # Frontend
```

### Virtual Environment Issues
```powershell
# Recreate virtual environment
python -m venv .venv
& .\.venv\Scripts\Activate.ps1
pip install -e server/
```

### npm Dependency Issues
```powershell
# Clean install
cd client
rm node_modules package-lock.json -r
npm install
```

### Database Connection Failed
```powershell
# Check PostgreSQL service
sc query postgresql-x64-18

# Start service if stopped
Start-Service postgresql-x64-18

# Verify connection
psql -U postgres -d flood_resilience
```

### Frontend API Connection Issues
The frontend uses environment variable `VITE_BACKEND_URL`. To verify:

1. Check `client/.env` has `VITE_BACKEND_URL=http://localhost:8000`
2. Verify backend is running: `curl http://127.0.0.1:8000/health`
3. Check browser console for CORS errors
4. Vite proxy configuration handles `/api` routes automatically

## Development Workflow

### Starting Fresh
```powershell
# 1. Check system
.\dev-check.ps1

# 2. Start full system
.\run-dev.ps1
```

### Making Changes

**Frontend Code**:
- Edit files in `client/src/`
- Vite will auto-reload (HMR)
- Check browser console for errors

**Backend Code**:
- Edit files in `server/app/`
- Uvicorn will auto-reload when file changes detected
- Check terminal for error messages

**Database Schema**:
- Create migration: `alembic revision --autogenerate -m "description"`
- Apply migration: `alembic upgrade head`

### Testing

**Backend Tests**:
```powershell
cd server
pytest tests/ -v
pytest --cov=app tests/  # With coverage
```

**Frontend Tests** (if configured):
```powershell
cd client
npm test
```

## API Integration Example

The frontend uses the `integrationApi` service to communicate with backend:

```typescript
// client/src/services/integrationApi.ts
const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
const integrationPrefix = '/api/v1/integration';

// Fetch bootstrap state
export async function fetchBootstrapState(): Promise<BackendBootstrapState> {
  return requestJson<BackendBootstrapState>('/bootstrap');
}
```

The backend serves API routes at `/api/v1/*`:
```python
# server/app/api/v1/router.py
api_router = APIRouter(prefix="/api/v1")

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}
```

## Real-Time Features

The system supports Server-Sent Events (SSE) for real-time updates:

**Frontend**: Listens to SSE stream from backend
**Backend**: Broadcasts events when data changes
**WebSocket**: Configured in Vite proxy for upgrades

## Performance Considerations

### Frontend
- Lazy loading for large components
- Code splitting with Vite
- Service Worker for offline support
- Gzip compression enabled

### Backend
- Connection pooling (5 connections default, 10 overflow)
- Async/await for high concurrency
- Database query optimization with indexes
- Rate limiting on sensitive endpoints

### Optional Services (Non-Blocking)
The system gracefully handles unavailable optional services:
- **Redis**: Used for caching/sessions (optional)
- **Celery**: Used for background tasks (optional)
- **PostGIS**: Full-text search (graceful fallback)
- **pgvector**: Vector embeddings (graceful fallback)

## Port Reference

| Service | Port | Purpose |
|---------|------|---------|
| Frontend (Vite) | 5173 | React development server |
| Backend (FastAPI) | 8000 | REST API server |
| PostgreSQL | 5432 | Database server |
| Redis | 6379 | Cache/Session store (optional) |
| pgAdmin | 5050 | Database management (optional) |

## Common Commands

```powershell
# Check system health
.\dev-check.ps1

# Start full system
.\run-dev.ps1

# Start backend alone
.\run-backend.ps1

# Start frontend alone
.\run-frontend.ps1

# Database migration
cd server
alembic upgrade head

# Run verification
python verify_system.py

# Backend tests
cd server
pytest tests/

# View backend logs (from another terminal)
cd server
& .\..\\.venv\Scripts\Activate.ps1
uvicorn app.main:app --log-level debug
```

## Documentation

- **Backend API Docs**: http://127.0.0.1:8000/api/v1/docs (when running)
- **Database Schema**: [QA_AUDIT_REPORT.md](../QA_AUDIT_REPORT.md)
- **Project Overview**: [QUICKSTART.md](../QUICKSTART.md) & [Full Context Doc](../full-context.md)
- **Database Setup**: [Integration Notes](./integration-notes.md)

## Getting Help

1. **Check system health**: `.\dev-check.ps1`
2. **Review logs**: Check terminal output from startup scripts
3. **API documentation**: http://127.0.0.1:8000/api/v1/docs
4. **Database issues**: Verify PostgreSQL is running and connected
5. **Frontend issues**: Check browser console (F12) for errors

## Notes for Windows Users

- PowerShell execution policy may need to be adjusted: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned`
- Use backslashes for paths: `e:\floodweb`
- Service names on Windows: `postgresql-x64-18` (may vary by version)
- Kill processes: `taskkill /PID <PID> /F` instead of `kill -9`
