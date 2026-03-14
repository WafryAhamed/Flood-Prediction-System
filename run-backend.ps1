# ============================================================================
# FLOOD RESILIENCE SYSTEM - BACKEND API SERVER STARTUP
# FastAPI + Uvicorn development server with error handling
# ============================================================================

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# ============================================================================
# SETUP
# ============================================================================

$ScriptRoot = "e:\floodweb"
$WorkDir = Join-Path $ScriptRoot "server"

Set-Location $ScriptRoot
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         FLOOD RESILIENCE - BACKEND API SERVER                ║" -ForegroundColor Green
Write-Host "║                   Starting on :8000                           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# ============================================================================
# ACTIVATE VIRTUAL ENVIRONMENT
# ============================================================================

$VenvActivate = ".\.venv\Scripts\Activate.ps1"
if (-not (Test-Path $VenvActivate)) {
    Write-Host "❌ ERROR: Python virtual environment not found" -ForegroundColor Red
    Write-Host "   Expected: $VenvActivate" -ForegroundColor Yellow
    Write-Host "   Run: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

try {
    & $VenvActivate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Failed to activate virtual environment" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ ERROR: Virtual environment activation failed: $_" -ForegroundColor Red
    exit 1
}

# ============================================================================
# VERIFY ENVIRONMENT
# ============================================================================

Write-Host "Verifying environment setup..." -ForegroundColor Cyan

# Check .env file
Set-Location $WorkDir
if (-not (Test-Path ".env")) {
    Write-Host "❌ ERROR: .env file not found in server directory" -ForegroundColor Red
    Write-Host "   Expected: $WorkDir\.env" -ForegroundColor Yellow
    Write-Host "   Solution: Copy from .env.example and configure settings" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ .env configuration found" -ForegroundColor Green

# Verify Python and required packages
Write-Host "Checking Python version..." -ForegroundColor Cyan
$PythonVer = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Python not found or not working properly" -ForegroundColor Red
    exit 1
}
Write-Host "✓ $PythonVer" -ForegroundColor Green

# Check if FastAPI is installed
Write-Host "Checking FastAPI installation..." -ForegroundColor Cyan
python -c "import fastapi; print(f'FastAPI {fastapi.__version__}')" 2>&1 | Tee-Object -Variable FastAPICheck | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: FastAPI not installed" -ForegroundColor Red
    Write-Host "   Run: pip install -e ." -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ $FastAPICheck" -ForegroundColor Green

# Check if Uvicorn is installed
Write-Host "Checking Uvicorn installation..." -ForegroundColor Cyan
python -c "import uvicorn; print(f'Uvicorn {uvicorn.__version__}')" 2>&1 | Tee-Object -Variable UvicornCheck | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Uvicorn not installed" -ForegroundColor Red
    Write-Host "   Run: pip install -e ." -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ $UvicornCheck" -ForegroundColor Green

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

Write-Host ""
Write-Host "Running pre-flight checks..." -ForegroundColor Cyan

# Test database connection
Write-Host "  Testing database connection..." -ForegroundColor Gray
$DbCheck = python -c "import asyncio; from app.db.session import check_db_connection; result = asyncio.run(check_db_connection()); print('Connected' if result else 'Failed')" 2>&1
if ($DbCheck -like "*Failed*" -or $LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  WARNING: Database connection failed" -ForegroundColor Yellow
    Write-Host "     Backend may fail during initialization" -ForegroundColor Yellow
    Write-Host "     Verify:" -ForegroundColor Yellow
    Write-Host "       • PostgreSQL is running (sc query postgresql-x64-18)" -ForegroundColor Gray
    Write-Host "       • Database 'flood_resilience' exists" -ForegroundColor Gray
    Write-Host "       • DATABASE_URL in .env is correct" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "  ✓ Database connection OK" -ForegroundColor Green
}

# Test app import
Write-Host "  Testing application load..." -ForegroundColor Gray
python -c "from app.main import app; print('OK')" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  WARNING: Application import check failed" -ForegroundColor Yellow
    Write-Host "     Backend may fail during startup" -ForegroundColor Yellow
}else {
    Write-Host "  ✓ Application loads successfully" -ForegroundColor Green
}

# ============================================================================
# START SERVER
# ============================================================================

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Starting FastAPI server with Uvicorn..." -ForegroundColor Cyan
Write-Host "  Host:              127.0.0.1" -ForegroundColor Gray
Write-Host "  Port:              8000" -ForegroundColor Gray
Write-Host "  Reload:            enabled" -ForegroundColor Gray
Write-Host "  Log Level:         info" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 API Documentation: http://127.0.0.1:8000/api/v1/docs" -ForegroundColor Yellow
Write-Host "💚 Health Check:      http://127.0.0.1:8000/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Start the server
try {
    uvicorn app.main:app `
        --host 127.0.0.1 `
        --port 8000 `
        --reload `
        --reload-dirs=. `
        --log-level info
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Server failed to start" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Yellow
    exit 1
}

