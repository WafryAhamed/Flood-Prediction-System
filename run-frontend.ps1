# ============================================================================
# FLOOD RESILIENCE SYSTEM - FRONTEND DEV SERVER STARTUP
# React + Vite development server with error handling
# ============================================================================

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# ============================================================================
# SETUP
# ============================================================================

$ScriptRoot = "e:\floodweb"
$WorkDir = Join-Path $ScriptRoot "client"

Set-Location $WorkDir

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         FLOOD RESILIENCE - FRONTEND APPLICATION              ║" -ForegroundColor Green
Write-Host "║                   Starting on :5173                           ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# ============================================================================
# VERIFY ENVIRONMENT
# ============================================================================

Write-Host "Verifying environment setup..." -ForegroundColor Cyan

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  WARNING: .env file not found in client directory" -ForegroundColor Yellow
    Write-Host "   Expected: $WorkDir\.env" -ForegroundColor Gray
    Write-Host "   Creating .env with defaults..." -ForegroundColor Yellow
    $EnvContent = @"
VITE_BACKEND_URL=http://localhost:8000
VITE_WEATHER_API=https://api.open-meteo.com
VITE_RAIN_API=https://api.rainviewer.com
VITE_OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
"@
    $EnvContent | Set-Content ".env" -Encoding UTF8
    Write-Host "✓ Created .env with default values" -ForegroundColor Green
} else {
    Write-Host "✓ .env configuration found" -ForegroundColor Green
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Cyan
$NodeExists = (Get-Command node -ErrorAction SilentlyContinue) -ne $null
if (-not $NodeExists) {
    Write-Host "❌ ERROR: Node.js not found" -ForegroundColor Red
    Write-Host "   Install from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
$NodeVer = node --version
Write-Host "✓ Node.js $NodeVer" -ForegroundColor Green

# Check npm
Write-Host "Checking npm..." -ForegroundColor Cyan
$NpmExists = (Get-Command npm -ErrorAction SilentlyContinue) -ne $null
if (-not $NpmExists) {
    Write-Host "❌ ERROR: npm not found" -ForegroundColor Red
    Write-Host "   npm should come with Node.js installation" -ForegroundColor Yellow
    exit 1
}
$NpmVer = npm --version
Write-Host "✓ npm $NpmVer" -ForegroundColor Green

# ============================================================================
# CHECK DEPENDENCIES
# ============================================================================

Write-Host ""
Write-Host "Checking Node.js dependencies..." -ForegroundColor Cyan

if (-not (Test-Path "node_modules")) {
    Write-Host "  ⚠️  node_modules not found - installing dependencies..." -ForegroundColor Yellow
    Write-Host "  This may take a minute on first run..." -ForegroundColor Gray
    Write-Host ""
    
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ ERROR: Failed to install Node.js dependencies" -ForegroundColor Red
        Write-Host "   Troubleshooting:" -ForegroundColor Yellow
        Write-Host "     • Check npm connectivity: npm ping" -ForegroundColor Gray
        Write-Host "     • Clear npm cache: npm cache clean --force" -ForegroundColor Gray
        Write-Host "     • Delete node_modules and try again: rm -r node_modules" -ForegroundColor Gray
        exit 1
    }
    
    Write-Host ""
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✓ Dependencies already installed" -ForegroundColor Green
    
    # Optional: Check for package.json changes
    $PackageModified = (Get-Item package-lock.json -ErrorAction SilentlyContinue)
    if ($PackageModified) {
        Write-Host "  Tip: Run 'npm install' to sync dependencies if needed" -ForegroundColor Gray
    }
}

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

Write-Host ""
Write-Host "Running pre-flight checks..." -ForegroundColor Cyan

# Check if Vite is available
Write-Host "  Checking Vite..." -ForegroundColor Gray
npx vite --version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  WARNING: Vite not available properly" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Vite is ready" -ForegroundColor Green
}

# Verify basic configuration
Write-Host "  Checking configuration..." -ForegroundColor Gray
if (Test-Path "vite.config.ts") {
    Write-Host "  ✓ vite.config.ts found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: vite.config.ts not found" -ForegroundColor Yellow
}

if (Test-Path "tsconfig.json") {
    Write-Host "  ✓ tsconfig.json found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: tsconfig.json not found" -ForegroundColor Yellow
}

if (Test-Path "tailwind.config.js") {
    Write-Host "  ✓ tailwind.config.js found" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  WARNING: tailwind.config.js not found" -ForegroundColor Yellow
}

# ============================================================================
# START SERVER
# ============================================================================

Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Starting Vite development server..." -ForegroundColor Cyan
Write-Host "  Framework:         React 18 + TypeScript" -ForegroundColor Gray
Write-Host "  Build Tool:        Vite" -ForegroundColor Gray
Write-Host "  Port:              5173" -ForegroundColor Gray
Write-Host "  Hot Module Reload: enabled" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Frontend URL: http://localhost:5173" -ForegroundColor Yellow
Write-Host "🔌 Backend API:  http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "📚 API Docs:     http://127.0.0.1:8000/api/v1/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""
Write-Host "═════════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# Start the dev server
try {
    npm run dev
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Vite dev server exited with error code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ ERROR: Failed to start dev server" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  • Ensure port 5173 is not in use: netstat -ano | findstr :5173" -ForegroundColor Gray
    Write-Host "  • Check npm scripts in package.json" -ForegroundColor Gray
    Write-Host "  • Try deleting node_modules and running npm install again" -ForegroundColor Gray
    exit 1
}

