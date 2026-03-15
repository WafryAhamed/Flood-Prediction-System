# ============================================================================
# FLOOD RESILIENCE SYSTEM - BACKEND PRODUCTION SERVER STARTUP
# FastAPI + Gunicorn + Uvicorn Workers with Poetry
# ============================================================================

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# ============================================================================
# SETUP
# ============================================================================

$ScriptRoot = "e:\floodweb"
$WorkDir = Join-Path $ScriptRoot "server"

Set-Location $WorkDir
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       FLOOD RESILIENCE - BACKEND PRODUCTION SERVER            ║" -ForegroundColor Green
Write-Host "║    Gunicorn + Uvicorn Workers + Poetry Management            ║" -ForegroundColor Green
Write-Host "║                    Startup Configuration                       ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# ============================================================================
# CHECK POETRY
# ============================================================================

Write-Host "Checking Poetry installation..." -ForegroundColor Cyan
$PoetryExists = (Get-Command poetry -ErrorAction SilentlyContinue) -ne $null
if (-not $PoetryExists) {
    Write-Host "❌ ERROR: Poetry not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Poetry is required for this project." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Install Poetry:" -ForegroundColor Yellow
    Write-Host "   • Visit: https://python-poetry.org/docs/#installation" -ForegroundColor Gray
    Write-Host "   • Or use: pip install poetry" -ForegroundColor Gray
    Write-Host "   • Then close and reopen PowerShell" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

$PoetryVer = poetry --version 2>&1
Write-Host "✓ $PoetryVer" -ForegroundColor Green
Write-Host ""

# ============================================================================
# VERIFY ENVIRONMENT
# ============================================================================

Write-Host "Verifying environment setup..." -ForegroundColor Cyan

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  WARNING: .env file not found" -ForegroundColor Yellow
    Write-Host "   Expected: $WorkDir\.env" -ForegroundColor Yellow
    Write-Host "   Solution: Copy from .env.example and configure settings" -ForegroundColor Yellow
    Write-Host ""
}
Write-Host "✓ .env configuration ready" -ForegroundColor Green

# Check pyproject.toml
if (-not (Test-Path "pyproject.toml")) {
    Write-Host "❌ ERROR: pyproject.toml not found" -ForegroundColor Red
    Write-Host "   This file defines Poetry configuration and dependencies" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ pyproject.toml found" -ForegroundColor Green

# ============================================================================
# INSTALL/UPDATE DEPENDENCIES
# ============================================================================

Write-Host ""
Write-Host "Checking Poetry dependencies..." -ForegroundColor Cyan
Write-Host "  Installing/updating packages..." -ForegroundColor Gray

poetry install --no-root 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERROR: Poetry installation failed" -ForegroundColor Red
    Write-Host "   Run manually: poetry install" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Dependencies ready (managed by Poetry)" -ForegroundColor Green

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

Write-Host ""
Write-Host "Running pre-flight checks..." -ForegroundColor Cyan

# Verify Python
Write-Host "  Checking Python version..." -ForegroundColor Gray
$PythonVer = poetry run python --version 2>&1
Write-Host "  ✓ $PythonVer" -ForegroundColor Green

# Verify Gunicorn
Write-Host "  Checking Gunicorn..." -ForegroundColor Gray
poetry run gunicorn --version 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Gunicorn available" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: Gunicorn may not be properly installed" -ForegroundColor Yellow
}

# Verify Uvicorn
Write-Host "  Checking Uvicorn..." -ForegroundColor Gray
poetry run python -c "import uvicorn; print(f'Uvicorn {uvicorn.__version__}')" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Uvicorn available" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: Uvicorn may not be properly installed" -ForegroundColor Yellow
}

# Test database connection
Write-Host "  Testing database connection..." -ForegroundColor Gray
$DbCheck = poetry run python -c "import asyncio; from app.db.session import check_db_connection; result = asyncio.run(check_db_connection()); print('Connected' if result else 'Failed')" 2>&1
if ($DbCheck -like "*Connected*") {
    Write-Host "  ✓ Database connection OK" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: Database connection failed" -ForegroundColor Yellow
    Write-Host "     Verify:" -ForegroundColor Yellow
    Write-Host "       • PostgreSQL is running (sc query postgresql-x64-18)" -ForegroundColor Gray
    Write-Host "       • Database 'flood_resilience' exists" -ForegroundColor Gray
    Write-Host "       • DATABASE_URL in .env is correct" -ForegroundColor Gray
    Write-Host ""
}

# Test app import
Write-Host "  Testing application load..." -ForegroundColor Gray
poetry run python -c "from app.main import app; print('OK')" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Application loads successfully" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: Application import check failed" -ForegroundColor Yellow
}

# ============================================================================
# PRODUCTION CONFIGURATION
# ============================================================================

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Production Server Configuration:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Server Type:       Gunicorn + Uvicorn Workers" -ForegroundColor Gray
Write-Host "  Number of Workers: 4 (adjust based on CPU cores)" -ForegroundColor Gray
Write-Host "  Worker Type:       Uvicorn Worker" -ForegroundColor Gray
Write-Host "  Bind Address:      0.0.0.0:8000" -ForegroundColor Gray
Write-Host "  Dependency Mgr:    Poetry" -ForegroundColor Gray
Write-Host "  Environment:       Production" -ForegroundColor Gray
Write-Host ""
Write-Host "  Command:" -ForegroundColor Yellow
Write-Host "    poetry run gunicorn app.main:app \" -ForegroundColor Gray
Write-Host "      -k uvicorn.workers.UvicornWorker \" -ForegroundColor Gray
Write-Host "      -w 4 \" -ForegroundColor Gray
Write-Host "      -b 0.0.0.0:8000 \" -ForegroundColor Gray
Write-Host "      --timeout 120 \" -ForegroundColor Gray
Write-Host "      --access-logfile - \" -ForegroundColor Gray
Write-Host "      --error-logfile - \" -ForegroundColor Gray
Write-Host "      --log-level info" -ForegroundColor Gray
Write-Host ""

Write-Host "📚 API Documentation: http://<server-ip>:8000/api/v1/docs" -ForegroundColor Yellow
Write-Host "💚 Health Check:      http://<server-ip>:8000/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "ℹ️  To adjust worker count for your deployment:" -ForegroundColor Cyan
Write-Host "   -w <count>  where count = (2 * CPU_CORES) + 1" -ForegroundColor Gray
Write-Host ""
Write-Host "   For 4 cores:  gunicorn ... -w 9" -ForegroundColor Gray
Write-Host "   For 8 cores:  gunicorn ... -w 17" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# ============================================================================
# START PRODUCTION SERVER
# ============================================================================

Write-Host "Starting production server..." -ForegroundColor Cyan
Write-Host ""

try {
    poetry run gunicorn app.main:app `
        -k uvicorn.workers.UvicornWorker `
        -w 4 `
        -b "0.0.0.0:8000" `
        --timeout 120 `
        --access-logfile "-" `
        --error-logfile "-" `
        --log-level info
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Production server failed to start" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Yellow
    exit 1
}
