# ============================================================================
# FLOOD RESILIENCE SYSTEM - DEVELOPMENT ENVIRONMENT HEALTH CHECK
# Quick diagnostic script to verify system is ready for development
# ============================================================================

$ErrorActionPreference = "Continue"
$Colors = @{
    "Green" = "Green"
    "Red" = "Red"
    "Yellow" = "Yellow"
    "Cyan" = "Cyan"
}

function Write-Status {
    param([string]$Check, [bool]$Success, [string]$Details = "")
    $Icon = if ($Success) { "[+]" } else { "[-]" }
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
            return $false
        }
        return $true
    } catch {
        return $true
    } finally {
        $Socket.Dispose()
    }
}

# Header
Write-Host ""
Write-Host "Flood Resilience - Development Environment Health Check" -ForegroundColor Cyan
Write-Host ""

Set-Location e:\floodweb

# Python environment
Write-Host "Python and Backend Setup:" -ForegroundColor Cyan
$PythonVenv = Test-Path ".venv\Scripts\Activate.ps1"
Write-Status "Python venv" $PythonVenv

# Node environment
Write-Host ""
Write-Host "Node.js and Frontend Setup:" -ForegroundColor Cyan
$Node = (Get-Command node -ErrorAction SilentlyContinue) -ne $null
Write-Status "Node.js" $Node
$Npm = (Get-Command npm -ErrorAction SilentlyContinue) -ne $null
Write-Status "npm" $Npm

# Dependencies
Write-Host ""
Write-Host "Dependencies:" -ForegroundColor Cyan
$NodeModules = Test-Path "client\node_modules"
Write-Status "node_modules" $NodeModules

# Environment files
Write-Host ""
Write-Host "Configuration Files:" -ForegroundColor Cyan
$BackendEnv = Test-Path "server\.env"
Write-Status "server/.env" $BackendEnv
$FrontendEnv = Test-Path "client\.env"
Write-Status "client/.env" $FrontendEnv

# Ports
Write-Host ""
Write-Host "Port Availability:" -ForegroundColor Cyan
$Port8000 = Test-Port 8000
Write-Status "Port 8000 (Backend)" $Port8000
$Port5173 = Test-Port 5173
Write-Status "Port 5173 (Frontend)" $Port5173

# Database
Write-Host ""
Write-Host "Database:" -ForegroundColor Cyan
try {
    & .\.venv\Scripts\Activate.ps1 | Out-Null
    Push-Location server
    python --version | Out-Null
    Write-Status "Python available" $true
    Pop-Location
} catch {
    Write-Status "Database check" $false "Cannot test"
}

# Summary
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan

$AllGood = $PythonVenv -and $Node -and $Npm -and $Port8000 -and $Port5173
if ($AllGood) {
    Write-Host "[OK] System is ready for development!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Start the system with: .\run-dev.ps1" -ForegroundColor Yellow
} else {
    Write-Host "[WARNING] Some issues found - see above" -ForegroundColor Yellow
}

Write-Host ""
