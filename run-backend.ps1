# ============================================================================
# FLOOD RESILIENCE SYSTEM - BACKEND STARTUP SCRIPT
# PowerShell script for Windows development environment
# ============================================================================

# Set working directory
Set-Location e:\floodweb

# Activate Python virtual environment
Write-Host "Activating Python virtual environment..." -ForegroundColor Cyan
& .\.venv\Scripts\Activate.ps1
if ($LASTEXITCODE -ne 0) { exit 1 }

# Navigate to server directory
Set-Location server

# Verify environment configuration
Write-Host "Verifying environment configuration..." -ForegroundColor Cyan
if (-not (Test-Path .env)) {
    Write-Host "ERROR: .env file not found in server directory" -ForegroundColor Red
    Write-Host "Please copy .env.example to .env and configure it" -ForegroundColor Yellow
    exit 1
}

# Start backend server with auto-reload
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         FLOOD RESILIENCE - BACKEND API SERVER                ║" -ForegroundColor Green
Write-Host "║                   Starting on :8000                           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "API Documentation: http://127.0.0.1:8000/api/v1/docs" -ForegroundColor Yellow
Write-Host "Health Check: http://127.0.0.1:8000/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

# Start uvicorn server with development settings
uvicorn app.main:app `
    --host 127.0.0.1 `
    --port 8000 `
    --reload `
    --reload-dirs=. `
    --log-level info

# If we get here, the server was stopped
Write-Host ""
Write-Host "Backend server stopped." -ForegroundColor Yellow
