# ============================================================================
# FLOOD RESILIENCE SYSTEM - FRONTEND STARTUP SCRIPT
# PowerShell script for Windows development environment
# ============================================================================

# Set working directory
Set-Location e:\floodweb\client

# Verify node_modules exists
Write-Host "Checking Node.js dependencies..." -ForegroundColor Cyan
if (-not (Test-Path node_modules)) {
    Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Start development server
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         FLOOD RESILIENCE - FRONTEND APPLICATION              ║" -ForegroundColor Green
Write-Host "║                   Starting on :5173                           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend URL: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend API: http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
Write-Host ""

# Start Vite development server
npm run dev

# If we get here, the server was stopped
Write-Host ""
Write-Host "Frontend server stopped." -ForegroundColor Yellow
