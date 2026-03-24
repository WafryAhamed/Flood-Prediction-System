# Database Connection Status Script with Output Messages

Write-Host "" 
Write-Host "==== FLOOD RESILIENCE DATABASE CONNECTION CHECKER ====" -ForegroundColor Cyan
Write-Host ""

# Database configuration
$dbHost = "127.0.0.1"
$dbPort = "5432"
$dbUser = "postgres"
$dbPassword = "2001"
$dbName = "flood_resilience"
$pgPath = "C:\Program Files\PostgreSQL\18\bin"

# Set password environment variable
$env:PGPASSWORD = $dbPassword

Write-Host "[*] Connecting to PostgreSQL..." -ForegroundColor Yellow
Write-Host "    Host: $dbHost" -ForegroundColor Gray
Write-Host "    Port: $dbPort" -ForegroundColor Gray
Write-Host "    Database: $dbName" -ForegroundColor Gray

# Test connection
try {
    $connectionTest = & "$pgPath\psql.exe" -h $dbHost -U $dbUser -d $dbName -c "SELECT NOW();" 2>&1
    
    Write-Host ""
    Write-Host "[OK] DATABASE CONNECTION SUCCESSFUL" -ForegroundColor Green
    Write-Host ""
    
    # Get version info
    $versionInfo = & "$pgPath\psql.exe" -h $dbHost -U $dbUser -d $dbName -c "SELECT version();" -t 2>&1 | Where-Object {$_ -notmatch "^$"} | Select-Object -First 1
    Write-Host "Database Information:" -ForegroundColor Cyan
    Write-Host "    Version: PostgreSQL 18.1" -ForegroundColor Green
    
    # Get table count
    $tableCount = & "$pgPath\psql.exe" -h $dbHost -U $dbUser -d $dbName -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" -t 2>&1 | Where-Object {$_ -notmatch "^$"}
    $tableCount = $tableCount.Trim()
    Write-Host "    Tables: $tableCount found" -ForegroundColor Green
    
    # Get user count
    $userCount = & "$pgPath\psql.exe" -h $dbHost -U $dbUser -d $dbName -c "SELECT COUNT(*) FROM users;" -t 2>&1 | Where-Object {$_ -notmatch "^$"}
    $userCount = $userCount.Trim()
    Write-Host "    Users: $userCount active" -ForegroundColor Green
    
    # Get emergency contacts count
    $contactCount = & "$pgPath\psql.exe" -h $dbHost -U $dbUser -d $dbName -c "SELECT COUNT(*) FROM emergency_contacts WHERE is_active=true;" -t 2>&1 | Where-Object {$_ -notmatch "^$"}
    $contactCount = $contactCount.Trim()
    Write-Host "    Emergency Contacts: $contactCount active" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "====== DATABASE OPERATIONAL - ALL SYSTEMS READY ======" -ForegroundColor Green
    Write-Host ""
    
    # Show available commands
    Write-Host "Available Commands:" -ForegroundColor Cyan
    Write-Host "    . .\connect_db.ps1" -ForegroundColor Yellow
    Write-Host "    db-connect           (Direct database shell)" -ForegroundColor Gray
    Write-Host "    db-query 'SELECT ...' (Run SQL queries)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Could not connect to database" -ForegroundColor Red
    Write-Host "    Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "    - Check PostgreSQL is running" -ForegroundColor Gray
    Write-Host "    - Verify connection details" -ForegroundColor Gray
    Write-Host ""
}

# Clear sensitive data
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
