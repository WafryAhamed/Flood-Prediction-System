# Comprehensive QA Test Orchestration Script for Flood Resilience System
# This script manages the entire testing workflow

param(
    [string]$Phase = "all",           # Which phase to run: all, 1, 2, 3, 4, 5, 6, 7
    [string]$BackendPort = "8001",    # Backend server port
    [string]$FrontendPort = "5173",   # Frontend dev server port
    [switch]$SkipBackendStart = $false,
    [switch]$SkipFrontendStart = $false,
    [switch]$OpenResults = $false,
    [switch]$Verbose = $false
)

# Color output
$Colors = @{
    Reset = "`e[0m"
    Bold = "`e[1m"
    Green = "`e[32m"
    Yellow = "`e[33m"
    Red = "`e[31m"
    Cyan = "`e[36m"
    Blue = "`e[34m"
}

function Write-Header {
    param([string]$Text)
    Write-Host "`n$($Colors.Cyan)$($Colors.Bold)$('='*80)$($Colors.Reset)"
    Write-Host "$($Colors.Cyan)$($Colors.Bold)$($Text.PadRight(80))$($Colors.Reset)" -NoNewline
    Write-Host "`n$($Colors.Cyan)$($Colors.Bold)$('='*80)$($Colors.Reset)`n"
}

function Write-Status {
    param([string]$Message, [ValidateSet("Info", "Success", "Warning", "Error")]$Type = "Info")
    
    $icon = switch ($Type) {
        "Info"    { "ℹ️ " }
        "Success" { "$($Colors.Green)✓$($Colors.Reset) " }
        "Warning" { "$($Colors.Yellow)⚠$($Colors.Reset) " }
        "Error"   { "$($Colors.Red)✗$($Colors.Reset) " }
    }
    
    Write-Host "$icon$Message"
}

function Wait-Port {
    param([int]$Port, [int]$Timeout = 30)
    
    $elapsed = 0
    Write-Status "Waiting for service on port $Port to be ready..." "Info"
    
    while ($elapsed -lt $Timeout) {
        try {
            $null = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
            if ($?) {
                Write-Status "Service on port $Port is ready" "Success"
                return $true
            }
        } catch {}
        
        Start-Sleep -Seconds 1
        $elapsed += 1
        Write-Host -NoNewline "."
    }
    
    Write-Host ""
    Write-Status "Service on port $Port did not respond within $Timeout seconds" "Error"
    return $false
}

function Start-Backend {
    Write-Header "STARTING BACKEND SERVER"
    
    # Check if backend is already running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$BackendPort/health" -WarningAction SilentlyContinue -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            Write-Status "Backend already running on port $BackendPort" "Info"
            return $true
        }
    } catch {}
    
    # Check if Python is available
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        Write-Status "Python not found in PATH" "Error"
        return $false
    }
    
    Write-Status "Starting backend server..." "Info"
    
    # Start backend in background
    try {
        $backendPath = Join-Path $PSScriptRoot "server"
        $env:PYTHONUNBUFFERED = "1"
        
        Start-Process -FilePath "python" -ArgumentList @(
            "-m", "uvicorn",
            "app.main:app",
            "--reload",
            "--port", $BackendPort
        ) -WorkingDirectory $backendPath -NoNewWindow -PassThru | Out-Null
        
        # Wait for backend to be ready
        if (Wait-Port -Port $BackendPort -Timeout 15) {
            Write-Status "Backend started successfully" "Success"
            return $true
        } else {
            Write-Status "Backend failed to start" "Error"
            return $false
        }
    } catch {
        Write-Status "Error starting backend: $_" "Error"
        return $false
    }
}

function Start-Frontend {
    Write-Header "STARTING FRONTEND SERVER"
    
    # Check if frontend is already running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$FrontendPort/" -WarningAction SilentlyContinue -TimeoutSec 2
        Write-Status "Frontend already running on port $FrontendPort" "Info"
        return $true
    } catch {}
    
    Write-Status "Starting frontend dev server..." "Info"
    
    try {
        $clientPath = Join-Path $PSScriptRoot "client"
        
        Start-Process -FilePath "npm" -ArgumentList @("run", "dev") -WorkingDirectory $clientPath -NoNewWindow | Out-Null
        
        # Wait for frontend to be ready
        if (Wait-Port -Port $FrontendPort -Timeout 30) {
            Write-Status "Frontend started successfully" "Success"
            return $true
        } else {
            Write-Status "Frontend failed to start" "Warning"
            # Frontend startup is not critical, continue with backend tests
            return $true
        }
    } catch {
        Write-Status "Error starting frontend: $_" "Warning"
        # Frontend startup is not critical, continue
        return $true
    }
}

function Run-Tests {
    Write-Header "RUNNING QA TEST SUITE"
    
    # Check if test script exists
    $testScript = Join-Path $PSScriptRoot "qa_comprehensive_test.py"
    if (-not (Test-Path $testScript)) {
        Write-Status "Test script not found at $testScript" "Error"
        return $false
    }
    
    Write-Status "Test Configuration:" "Info"
    Write-Host "  Backend: http://localhost:$BackendPort"
    Write-Host "  Phase: $Phase"
    Write-Host "  Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host ""
    
    # Run the test script
    try {
        if ($Verbose) {
            Write-Status "Running tests with verbose output..." "Info"
            python $testScript
        } else {
            Write-Status "Running tests..." "Info"
            python $testScript | Tee-Object -Variable testOutput | Out-Null
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "All tests passed successfully!" "Success"
            return $true
        } else {
            Write-Status "Some tests failed. Check output above." "Warning"
            return $false
        }
    } catch {
        Write-Status "Error running tests: $_" "Error"
        return $false
    }
}

function Show-Menu {
    Write-Header "FLOOD RESILIENCE QA TEST SUITE"
    
    Write-Host "Select test phase to run:"
    Write-Host ""
    Write-Host "  1. Phase 1:  Server Connectivity & Baseline"
    Write-Host "  2. Phase 2:  Authentication & Authorization"
    Write-Host "  3. Phase 3:  Core User Flows"
    Write-Host "  4. Phase 4:  API Validation"
    Write-Host "  5. Phase 5:  Real-time Features"
    Write-Host "  6. Phase 6:  Security & Headers"
    Write-Host "  7. Phase 7:  Performance Baseline"
    Write-Host "  all. Run all phases (recommended)"
    Write-Host "  exit. Exit"
    Write-Host ""
}

function Main {
    Write-Host "$($Colors.Bold)$($Colors.Blue)┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓$($Colors.Reset)"
    Write-Host "$($Colors.Bold)$($Colors.Blue)┃     FLOOD RESILIENCE SYSTEM - QA TESTING SUITE                         ┃$($Colors.Reset)"
    Write-Host "$($Colors.Bold)$($Colors.Blue)┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛$($Colors.Reset)`n"
    
    # Start servers if not skipped
    if (-not $SkipBackendStart) {
        if (-not (Start-Backend)) {
            Write-Status "Cannot proceed without backend server" "Error"
            exit 1
        }
    } else {
        Write-Status "Backend startup skipped (using existing service)" "Info"
    }
    
    if (-not $SkipFrontendStart) {
        Start-Frontend | Out-Null
    }
    
    # Run tests
    $testsPassed = Run-Tests
    
    # Show results
    Write-Header "TEST EXECUTION COMPLETED"
    
    if ($testsPassed) {
        Write-Host "$($Colors.Green)$($Colors.Bold)✅ QA Testing Suite Completed Successfully$($Colors.Reset)"
        Write-Host ""
        Write-Status "System is ready for staging deployment" "Success"
    } else {
        Write-Host "$($Colors.Yellow)$($Colors.Bold)⚠️  Some tests did not pass$($Colors.Reset)"
        Write-Host ""
        Write-Status "Review the test output above and fix issues before deploying" "Warning"
    }
    
    Write-Host ""
    Write-Status "Next Steps:" "Info"
    Write-Host "  1. Review test results above"
    Write-Host "  2. Check QA_TEST_EXECUTION_GUIDE.md for troubleshooting"
    Write-Host "  3. Address any failed tests"
    Write-Host "  4. Re-run tests after fixes"
    Write-Host ""
    
    # Exit with appropriate code
    if ($testsPassed) {
        exit 0
    } else {
        exit 1
    }
}

# Run main function
& Main
