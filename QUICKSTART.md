# FLOOD RESILIENCE SYSTEM - QUICK START GUIDE

## Windows PowerShell Setup

### Prerequisites (Verify These Are Installed)

```powershell
# Check Node.js
node --version

# Check Python
python --version

# Check PostgreSQL
Get-Service postgresql-x64-18

# Check pip packages
pip list | grep fastapi
```

---

## 🚀 QUICK START - RUN THE ENTIRE SYSTEM

### Option 1: One Command (Recommended)

Copy and paste this in PowerShell from `e:\floodweb`:

```powershell
Start-Process powershell -ArgumentList "-NoExit -File .\run-dev.ps1"
```

This will:
- ✓ Verify all dependencies
- ✓ Start PostgreSQL (if not running)
- ✓ Launch backend API on http://127.0.0.1:8000
- ✓ Launch frontend on http://localhost:5173
- ✓ Show helpful links and logs

### Option 2: Run Backend and Frontend Separately

**Terminal 1 - Backend:**
```powershell
e:\floodweb\run-backend.ps1
```

**Terminal 2 - Frontend:**
```powershell
e:\floodweb\run-frontend.ps1
```

### Option 3: Manual Commands (Advanced)

**Backend:**
```powershell
cd e:\floodweb
.\.venv\Scripts\Activate.ps1
cd server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Frontend:**
```powershell
cd e:\floodweb\client
npm run dev
```

---

## 🌐 Access the Application

Once running, open in your browser:

| Component | URL | Purpose |
|-----------|-----|---------|
| **Frontend** | http://localhost:5173 | Main app |
| **Backend API** | http://127.0.0.1:8000 | REST API |
| **API Documentation** | http://127.0.0.1:8000/api/v1/docs | Swagger UI |
| **Health Check** | http://127.0.0.1:8000/health | API Status |

---

## 🛠️ Troubleshooting

### Port Already in Use

If port 8000 or 5173 is in use:

```powershell
# Find process using port 8000
Get-NetTCPConnection -LocalPort 8000

# Kill the process
Stop-Process -Id <ProcessID> -Force
```

### PostgreSQL Not Running

```powershell
# Start PostgreSQL
Start-Service postgresql-x64-18

# Verify it's running
Get-Service postgresql-x64-18 | Select-Object Status
```

### Python Virtual Environment Issues

```powershell
# Recreate the venv if needed
cd e:\floodweb
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r server\requirements.txt
```

### Node Modules Missing

```powershell
cd e:\floodweb\client
npm install
```

### Backend Extension Error

The backend gracefully handles missing PostgreSQL extensions:
- ✓ pgvector not installed → Logged as warning, app continues
- ✓ PostGIS not installed → Logged as warning, app continues
- ✓ UUID extension not installed → Logged as warning, app continues

The system will still function normally.

---

## 📝 Environment Configuration

Backend configuration is in `server\.env`:

```
DATABASE_URL=postgresql+asyncpg://postgres:2001@localhost:5432/flood_resilience
DATABASE_URL_SYNC=postgresql://postgres:2001@localhost:5432/flood_resilience
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=<your-secret-key>
JWT_SECRET_KEY=<your-jwt-secret-key>
```

---

## 🔌 Database Connection

The system uses PostgreSQL with these credentials:

- **Host:** localhost
- **Port:** 5432
- **User:** postgres
- **Password:** 2001
- **Database:** flood_resilience

To verify connection:

```powershell
psql -U postgres -h localhost -d flood_resilience -c "SELECT 1"
```

---

## 📊 API Endpoints (Examples)

```powershell
# Health check
curl http://127.0.0.1:8000/health

# List reports
curl http://127.0.0.1:8000/api/v1/reports

# Chat with bot
curl -X POST http://127.0.0.1:8000/api/v1/integration/chat `
  -H "Content-Type: application/json" `
  -d '{\"message\": \"What should I do?\"}'

# Get statistics
curl http://127.0.0.1:8000/api/v1/reports/stats

# Get emergency contacts
curl http://127.0.0.1:8000/api/v1/integration/emergency-contacts
```

---

## 🛑 Stop the Servers

```powershell
# Press Ctrl+C in each PowerShell window
# Or close the windows
# Or use:
Get-Process uvicorn | Stop-Process -Force
Get-Process node | Stop-Process -Force
```

---

## 📚 Useful Resources

- API Docs: http://127.0.0.1:8000/api/v1/docs
- ReDoc: http://127.0.0.1:8000/api/v1/redoc
- QA Report: Open QA_AUDIT_REPORT.md
- Source Code: https://github.com/WafryAhamed/Flood-Prediction-System

---

**System Status:** ✅ Production-Ready

All components are configured and tested. The system is ready for development and deployment.
