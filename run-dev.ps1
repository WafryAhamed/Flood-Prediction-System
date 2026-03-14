# ============================================================================
# FLOOD RESILIENCE SYSTEM - COMPLETE STARTUP SCRIPT
# PowerShell script that launches both backend and frontend servers
# ============================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                            ║" -ForegroundColor Cyan
Write-Host "║        FLOOD RESILIENCE SYSTEM - DEVELOPMENT ENVIRONMENT LAUNCHER         ║" -ForegroundColor Cyan
Write-Host "║                                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Set working directory
Set-Location e:\floodweb

# Verify PostgreSQL is running
Write-Host "Checking PostgreSQL service..." -ForegroundColor Cyan
$pgService = Get-Service postgresql-x64-18 -ErrorAction SilentlyContinue
if ($null -eq $pgService) {
    Write-Host "ERROR: PostgreSQL service not found" -ForegroundColor Red
    Write-Host "Please install PostgreSQL 18 on your system" -ForegroundColor Yellow
    exit 1
}

if ($pgService.Status -ne "Running") {
    Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
    Start-Service postgresql-x64-18
    Start-Sleep -Seconds 2
}

Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
Write-Host ""

# Verify Python environment
Write-Host "Checking Python environment..." -ForegroundColor Cyan
if (-not (Test-Path .venv\Scripts\Activate.ps1)) {
    Write-Host "ERROR: Python virtual environment not found" -ForegroundColor Red
    Write-Host "Please run: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Python environment ready" -ForegroundColor Green
Write-Host ""

# Verify Node.js environment
Write-Host "Checking Node.js environment..." -ForegroundColor Cyan
$nodeVersion = node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js not found" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Node.js $nodeVersion found" -ForegroundColor Green
Write-Host ""

# Verify database configuration
Write-Host "Checking database configuration..." -ForegroundColor Cyan
if (-not (Test-Path server\.env)) {
    Write-Host "ERROR: server\.env file not found" -ForegroundColor Red
    Write-Host "Please create server\.env with database credentials" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Database configuration ready" -ForegroundColor Green
Write-Host ""

Write-Host "═════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting services in background..." -ForegroundColor Yellow
Write-Host ""

# Function to check if port is available
function Test-PortAvailable {
    param([int]$Port)
    
    $connection = New-Object System.Net.Sockets.TcpClient
    $connectionResult = $connection.BeginConnect("127.0.0.1", $Port, $null, $null)
    $wait = $connectionResult.AsyncWaitHandle.WaitOne(1000, $false)
    
    if ($wait) {
        try { $connection.EndConnect($connectionResult) }
        catch { return $true }
        $connection.Close()
        return $false
    }
    return $true
}

# Check if ports are available
if (-not (Test-PortAvailable 8000)) {
    Write-Host "ERROR: Port 8000 is already in use (Backend)" -ForegroundColor Red
    Write-Host "Please stop the existing process or use a different port" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-PortAvailable 5173)) {
    Write-Host "ERROR: Port 5173 is already in use (Frontend)" -ForegroundColor Red
    Write-Host "Please stop the existing process or use a different port" -ForegroundColor Yellow
    exit 1
}

# Start backend in separate process
$backendProcess = Start-Process powershell `
    -ArgumentList "-NoExit -File e:\floodweb\run-backend.ps1" `
    -PassThru

Write-Host "✓ Backend server starting (PID: $($backendProcess.Id))" -ForegroundColor Green

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in separate process
$frontendProcess = Start-Process powershell `
    -ArgumentList "-NoExit -File e:\floodweb\run-frontend.ps1" `
    -PassThru

Write-Host "✓ Frontend server starting (PID: $($frontendProcess.Id))" -ForegroundColor Green
Write-Host ""

Write-Host "═════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 FLOOD RESILIENCE SYSTEM IS RUNNING" -ForegroundColor Green
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Cyan
Write-Host "  • Frontend:       http://localhost:5173" -ForegroundColor Yellow
Write-Host "  • Backend API:    http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "  • API Docs:       http://127.0.0.1:8000/api/v1/docs" -ForegroundColor Yellow
Write-Host "  • Health:         http://127.0.0.1:8000/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "Logs:" -ForegroundColor Cyan
Write-Host "  • Backend logs appear in this window" -ForegroundColor Yellow
Write-Host "  • Frontend logs appear in a new window" -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop the servers:" -ForegroundColor Cyan
Write-Host "  • Press Ctrl+C in each server window" -ForegroundColor Yellow
Write-Host "  • Or close the windows" -ForegroundColor Yellow
Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Wait for processes
$backendProcess.WaitForExit()
$frontendProcess.WaitForExit()
