# ============================================================================
# FLOOD RESILIENCE SYSTEM - DEVELOPMENT ENVIRONMENT LAUNCHER
# Robust startup script for backend + frontend + database
# ============================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$Colors = @{
    "Green" = "Green"
    "Red" = "Red"
    "Yellow" = "Yellow"
    "Cyan" = "Cyan"
    "Blue" = "DarkCyan"
}

# State tracking
$ScriptRoot = "e:\floodweb"
$BackendProc = $null
$FrontendProc = $null
$StartupErrors = @()

# ============================================================================
# CLEANUP ON EXIT
# ============================================================================
function Cleanup {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║             SHUTTING DOWN SERVICES - PLEASE WAIT              ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
    
    if ($BackendProc -and -not $BackendProc.HasExited) {
        Write-Host "Stopping Backend (PID: $($BackendProc.Id))..." -ForegroundColor Cyan
        Stop-Process -Id $BackendProc.Id -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
    
    if ($FrontendProc -and -not $FrontendProc.HasExited) {
        Write-Host "Stopping Frontend (PID: $($FrontendProc.Id))..." -ForegroundColor Cyan
        Stop-Process -Id $FrontendProc.Id -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }
    
    Write-Host "✓ Services stopped" -ForegroundColor Green
    exit 0
}

$ExecutionContext.InvokeCommand.LocationChangedAction = {
    if ($host.Name -eq "ConsoleHost") {
        $host.UI.RawUI.WindowTitle = "Flood Resilience - Dev Launcher"
    }
}

trap {
    Write-Host "ERROR: $_" -ForegroundColor Red
    Cleanup
}

Register-EngineEvent -SourceIdentifier ([System.Management.Automation.PsEngineEvent]::Exiting) -Action { Cleanup }

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $($Text.PadRight(62)) ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Write-Status {
    param([string]$Check, [bool]$Success, [string]$Details = "")
    $Icon = if ($Success) { "✓" } else { "✗" }
    $Color = if ($Success) { "Green" } else { "Red" }
    $Msg = "$Icon $Check"
    if ($Details) { $Msg += ": $Details" }
    Write-Host $Msg -ForegroundColor $Color
}

function Test-Port {
    param([int]$Port, [int]$Timeout = 1000)
    $Socket = New-Object System.Net.Sockets.TcpClient
    try {
        $AsyncResult = $Socket.BeginConnect("127.0.0.1", $Port, $null, $null)
        $AsyncResult.AsyncWaitHandle.WaitOne($Timeout) | Out-Null
        if ($Socket.Connected) {
            $Socket.Close()
            return $false  # Port is IN USE
        }
        return $true  # Port is AVAILABLE
    }
    catch {
        return $true  # Port is AVAILABLE
    }
    finally {
        $Socket.Dispose()
    }
}

function Test-HealthCheck {
    param([string]$Url, [int]$Timeout = 30)
    $StartTime = Get-Date
    while ((Get-Date) -lt $StartTime.AddSeconds($Timeout)) {
        try {
            $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -ErrorAction Stop
            if ($Response.StatusCode -eq 200) {
                return $true
            }
        }
        catch {
            Start-Sleep -Milliseconds 500
        }
    }
    return $false
}

# ============================================================================
# ENVIRONMENT CHECKS
# ============================================================================

Write-Header "SYSTEM PREREQUISITES CHECK"

Set-Location $ScriptRoot

# Check Python environment
Write-Host "Checking Python virtual environment..." -ForegroundColor Cyan
if (-not (Test-Path ".venv\Scripts\Activate.ps1")) {
    Write-Status "Python venv" $false "Not found"
    $StartupErrors += "Python virtual environment not found. Run: python -m venv .venv"
} else {
    Write-Status "Python venv" $true "Ready"
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Cyan
$NodeExists = (Get-Command node -ErrorAction SilentlyContinue) -ne $null
if (-not $NodeExists) {
    Write-Status "Node.js" $false "Not found"
    $StartupErrors += "Node.js not found. Install from https://nodejs.org/"
} else {
    $NodeVer = node --version
    Write-Status "Node.js" $true $NodeVer
}

# Check npm
Write-Host "Checking npm..." -ForegroundColor Cyan
$NpmExists = (Get-Command npm -ErrorAction SilentlyContinue) -ne $null
if (-not $NpmExists) {
    Write-Status "npm" $false "Not found"
    $StartupErrors += "npm not found"
} else {
    $NpmVer = npm --version
    Write-Status "npm" $true $NpmVer
}

# Check server .env
Write-Host "Checking server configuration..." -ForegroundColor Cyan
if (-not (Test-Path "server\.env")) {
    Write-Status "server/.env" $false "Not found"
    $StartupErrors += "server/.env not found. Copy from server/.env.example"
} else {
    Write-Status "server/.env" $true "Found"
}

# Check node_modules
Write-Host "Checking frontend dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "client\node_modules")) {
    Write-Status "node_modules" $false "Not found"
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    Push-Location client
    npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Status "npm install" $true "Success"
    } else {
        Write-Status "npm install" $false "Failed"
        $StartupErrors += "npm install failed"
    }
    Pop-Location
} else {
    Write-Status "node_modules" $true "Found"
}

# Check port availability
Write-Host "Checking port availability..." -ForegroundColor Cyan
$Backend8000Free = Test-Port 8000
$Frontend5173Free = Test-Port 5173

Write-Status "Port 8000 (Backend)" $Backend8000Free
Write-Status "Port 5173 (Frontend)" $Frontend5173Free

if (-not $Backend8000Free) {
    $StartupErrors += "Port 8000 is already in use"
}
if (-not $Frontend5173Free) {
    $StartupErrors += "Port 5173 is already in use"
}

# Check PostgreSQL
Write-Host "Checking PostgreSQL..." -ForegroundColor Cyan
try {
    $PgService = Get-Service postgresql-x64-18 -ErrorAction SilentlyContinue
    if ($PgService.Status -ne "Running") {
        Write-Status "PostgreSQL Service" $false "Not running"
        Write-Host "  Attempting to start service..." -ForegroundColor Yellow
        Start-Service postgresql-x64-18 -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
    Write-Status "PostgreSQL Service" $true "Running"
} catch {
    Write-Status "PostgreSQL" $false "Cannot determine status (may still work)"
}

# ============================================================================
# ERROR HANDLING
# ============================================================================

if ($StartupErrors.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ STARTUP FAILED - ERRORS FOUND:" -ForegroundColor Red
    foreach ($Error in $StartupErrors) {
        Write-Host "  • $Error" -ForegroundColor Red
    }
    exit 1
}

Write-Header "STARTING FLOOD RESILIENCE SYSTEM"

# ============================================================================
# START BACKEND
# ============================================================================

Write-Host ""
Write-Host "Starting Backend API Server..." -ForegroundColor Cyan
Write-Host "  Location: server/" -ForegroundColor Gray
Write-Host "  Command: uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" -ForegroundColor Gray
Write-Host ""

$BackendProc = Start-Process powershell `
    -ArgumentList "-NoExit", "-File", "$ScriptRoot\run-backend.ps1" `
    -PassThru `
    -NoNewWindow:$false

Write-Status "Backend Process Started" $true "PID: $($BackendProc.Id)"

# Wait for backend health check
Write-Host "Waiting for Backend to be ready..." -ForegroundColor Yellow
if (Test-HealthCheck "http://127.0.0.1:8000/health" 30) {
    Write-Status "Backend Health Check" $true "API is responding"
} else {
    Write-Status "Backend Health Check" $false "API not responding (may still be starting)"
}

Start-Sleep -Seconds 2

# ============================================================================
# START FRONTEND
# ============================================================================

Write-Host ""
Write-Host "Starting Frontend Dev Server..." -ForegroundColor Cyan
Write-Host "  Location: client/" -ForegroundColor Gray
Write-Host "  Command: npm run dev (Vite)" -ForegroundColor Gray
Write-Host ""

$FrontendProc = Start-Process powershell `
    -ArgumentList "-NoExit", "-File", "$ScriptRoot\run-frontend.ps1" `
    -PassThru `
    -NoNewWindow:$false

Write-Status "Frontend Process Started" $true "PID: $($FrontendProc.Id)"

# Wait for frontend health check
Write-Host "Waiting for Frontend to be ready..." -ForegroundColor Yellow
if (Test-HealthCheck "http://localhost:5173" 30) {
    Write-Status "Frontend Health Check" $true "Dev server is responding"
} else {
    Write-Status "Frontend Health Check" $false "Dev server not responding (may still be starting)"
}

# ============================================================================
# STARTUP COMPLETE
# ============================================================================

Write-Host ""
Write-Header "SYSTEM RUNNING SUCCESSFULLY"

Write-Host ""
Write-Host "🌍 Access the Application:" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend UI:       " -ForegroundColor Cyan -NoNewline
Write-Host "http://localhost:5173" -ForegroundColor Yellow
Write-Host "  Backend API:       " -ForegroundColor Cyan -NoNewline
Write-Host "http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "  API Documentation: " -ForegroundColor Cyan -NoNewline
Write-Host "http://127.0.0.1:8000/api/v1/docs" -ForegroundColor Yellow
Write-Host "  Health Check:      " -ForegroundColor Cyan -NoNewline
Write-Host "http://127.0.0.1:8000/health" -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 Process Information:" -ForegroundColor Green
Write-Host "  Backend PID:       $($BackendProc.Id)" -ForegroundColor Cyan
Write-Host "  Frontend PID:      $($FrontendProc.Id)" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚙️  Database Configuration:" -ForegroundColor Green
Write-Host "  Database:          flood_resilience" -ForegroundColor Cyan
Write-Host "  Host:              localhost:5432" -ForegroundColor Cyan
Write-Host "  User:              postgres" -ForegroundColor Cyan
Write-Host ""

Write-Host "⛔ To Stop:" -ForegroundColor Yellow
Write-Host "  • Press Ctrl+C in this window to stop all services" -ForegroundColor Gray
Write-Host "  • All child processes will be terminated gracefully" -ForegroundColor Gray
Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Green

# Monitor process status
while ($true) {
    if ($BackendProc.HasExited) {
        Write-Host "⚠️  Backend process exited unexpectedly (PID: $($BackendProc.Id))" -ForegroundColor Yellow
        Cleanup
    }
    if ($FrontendProc.HasExited) {
        Write-Host "⚠️  Frontend process exited unexpectedly (PID: $($FrontendProc.Id))" -ForegroundColor Yellow
        Cleanup
    }
    Start-Sleep -Seconds 5
}
