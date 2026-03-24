# Flood Resilience System - How to Run the Application

## Quick Start (5 minutes)

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- PostgreSQL 15+ (running on localhost:5432)
- Windows PowerShell or terminal

### Start Backend (Terminal 1)
```powershell
cd e:\floodweb\server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

### Start Frontend (Terminal 2)
```powershell
cd e:\floodweb\client
npm run dev
```

**Expected Output:**
```
VITE v8.0.1  ready in 5531 ms
➜  Local:   http://localhost:5173/
```

### Open in Browser
```
http://localhost:5173
```

---

## Full Setup Guide

### 1. Install Python Dependencies

#### First Time Setup
```powershell
cd e:\floodweb\server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e .
```

#### Or Activate Existing Environment
```powershell
cd e:\floodweb\server
.\.venv\Scripts\Activate.ps1
```

### 2. Configure Environment Variables

**Create `server/.env`:**
```env
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/floodweb
DEBUG=False
ENVIRONMENT=development
```

### 3. Initialize Database

```powershell
cd e:\floodweb\server
python init_db_simple.py
```

### 4. Install Node Dependencies

```powershell
cd e:\floodweb\client
npm install
```

### 5. Start Both Servers

**Terminal 1 - Backend:**
```powershell
cd e:\floodweb\server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```powershell
cd e:\floodweb\client
npm run dev
```

**Terminal 3 - Browser (Optional):**
```powershell
start http://localhost:5173
```

---

## Project Structure

```
floodweb/
├── server/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py        # Application entry point
│   │   ├── api/v1/        # API endpoints
│   │   ├── db/            # Database setup
│   │   ├── models/        # SQLAlchemy ORM models
│   │   └── services/      # Business logic
│   ├── .env               # Environment variables
│   └── pyproject.toml     # Python dependencies
│
├── client/                # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx        # Main component
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components (admin, user)
│   │   ├── services/      # API client (integrationApi.ts)
│   │   ├── stores/        # Zustand state management
│   │   └── hooks/         # Custom React hooks
│   ├── vite.config.ts     # Build and proxy config
│   ├── tailwind.config.js # CSS styling
│   └── package.json       # Node.js dependencies
│
└── docs/                  # Documentation
```

---

## Available Commands

### Backend Commands

```powershell
# Start development server with auto-reload
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Start production server (no reload)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Check health status
python server/check_backend.py

# Verify system setup
python server/verify_system.py

# Initialize database
python server/init_db_simple.py

# Run tests
pytest server/tests/
```

### Frontend Commands

```powershell
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Format code
npm run format
```

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout

### Integration (Frontend Data Sync)
- `GET /api/v1/integration/bootstrap` - Initial app state
- `GET /api/v1/integration/events` - Real-time event stream (SSE)
- `GET /api/v1/integration/emergency-contacts` - Emergency phone numbers
- `POST /api/v1/integration/emergency-contacts` - Create contact
- `PATCH /api/v1/integration/emergency-contacts/{id}` - Update contact
- `DELETE /api/v1/integration/emergency-contacts/{id}` - Delete contact
- `GET /api/v1/integration/map-markers` - GIS markers
- `POST /api/v1/integration/map-markers` - Create marker
- `POST /api/v1/integration/chat` - Chat with AI system

### Broadcasts
- `GET /api/v1/broadcasts` - List all broadcasts
- `GET /api/v1/broadcasts/active` - Get active broadcasts
- `POST /api/v1/broadcasts` - Create broadcast (requires auth)
- `POST /api/v1/broadcasts/{id}/publish` - Publish broadcast (requires auth)

### Citizen Reports
- `GET /api/v1/reports` - List reports
- `POST /api/v1/reports` - Submit report (requires auth)
- `GET /api/v1/reports/{id}` - Get report details

### District Data
- `GET /api/v1/districts` - List districts
- `GET /api/v1/districts/{id}` - Get district details
- `GET /api/v1/districts/{id}/zones` - Get risk zones

### Shelters
- `GET /api/v1/shelters` - List shelters
- `GET /api/v1/shelters/nearby` - Find nearby shelters
- `GET /api/v1/shelters/{id}` - Get shelter details

### Weather
- `GET /api/v1/weather/current` - Current weather conditions
- `GET /api/v1/weather/observations` - Historical weather data
- `GET /api/v1/weather/forecasts` - Weather forecast

### WebSocket
- `WS /api/v1/ws/alerts` - Real-time alert streaming

### Health
- `GET /health` - Health check endpoint

---

## Troubleshooting

### Backend Won't Start

**Error: `ModuleNotFoundError: No module named 'fastapi'`**
```powershell
cd e:\floodweb\server
pip install fastapi uvicorn pydantic sqlalchemy asyncpg
```

**Error: `Database connection failed`**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify PostgreSQL credentials

### Frontend Won't Load

**Error: `npm: command not found`**
- Install Node.js from https://nodejs.org
- Restart terminal after installation

**Error: `Port 5173 already in use`**
```powershell
# Kill process on port 5173
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### API Connection Issues

**Error: `fetch failed` in browser console**
- Verify backend is running on port 8000
- Check Vite proxy configuration in `vite.config.ts`
- Ensure CORS is enabled

**Error: `401 Unauthorized`**
- Login first to get authentication token
- Token stored in localStorage
- Check if token is being sent in headers

---

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/floodweb

# Server
DEBUG=True                           # Enable debug mode
ENVIRONMENT=development              # development, staging, or production
APP_NAME=Flood Resilience System
VERSION=1.0.0

# API Configuration
API_V1_PREFIX=/api/v1

# CORS
CORS_ORIGINS=["http://localhost:5173", "http://127.0.0.1:5173"]

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Rate Limiting
RATE_LIMIT_AUTH_REQUESTS_PER_MINUTE=5
RATE_LIMIT_CHAT_REQUESTS_PER_MINUTE=10
RATE_LIMIT_REPORT_REQUESTS_PER_MINUTE=5
```

### Frontend (.env.local)
```env
VITE_API_BASE=http://localhost:8000
VITE_DEFAULT_LAT=8.3593
VITE_DEFAULT_LON=80.5103
```

---

## Performance Tips

### Backend Optimization
- Use `--reload` only in development
- Enable HTTP/2 in production
- Configure connection pooling for database
- Enable gzip compression (default: on)

### Frontend Optimization
- Run `npm run build` for production
- Use lazy loading for components
- Enable code splitting in bundler
- Minimize API calls with caching

---

## Security Checklist

- [ ] Change default database password
- [ ] Generate secure SECRET_KEY for JWT tokens
- [ ] Configure CORS_ORIGINS for production domain
- [ ] Enable HTTPS in production
- [ ] Set `DEBUG=False` in production
- [ ] Store secrets in environment variables
- [ ] Enable rate limiting for public endpoints
- [ ] Implement request validation

---

## Production Deployment

### Build Frontend
```powershell
cd e:\floodweb\client
npm run build
```

### Start Backend (Production)
```powershell
cd e:\floodweb\server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Serve Frontend
- Use Nginx or Apache as reverse proxy
- Serve `client/dist/` directory
- Point `/api` to backend server
- Cache static assets aggressively

---

## Testing

### Backend Tests
```powershell
cd e:\floodweb\server
pytest tests/ -v
```

### Frontend Tests
```powershell
cd e:\floodweb\client
npm run test
```

### API Testing
```powershell
python test_api_endpoints.py
python quick_test.py
python full_workflow_test.py
```

---

## Additional Resources

- **Backend Documentation**: See [BACKEND_DIAGNOSTIC_REPORT.md](BACKEND_DIAGNOSTIC_REPORT.md)
- **API Verification**: See [FINAL_VERIFICATION_REPORT.md](FINAL_VERIFICATION_REPORT.md)
- **Frontend Components**: Check `client/src/components/`
- **Database Schema**: See `server/app/models/`
- **API Routes**: Check `server/app/api/v1/`

---

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs in terminal
3. Verify all services are running
4. Check database connectivity
5. Review environment variables

**System Status Check:**
```powershell
# Backend health
python -c "import requests; print(requests.get('http://localhost:8000/health').json())"

# Frontend availability
start http://localhost:5173

# Database connection
python server/test_db.py
```
