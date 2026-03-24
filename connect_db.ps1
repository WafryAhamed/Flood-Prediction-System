# Quick database connection script for PowerShell
# Usage: . .\connect_db.ps1

# Add PostgreSQL to current session PATH
$pgPath = "C:\Program Files\PostgreSQL\18\bin"
if ($pgPath -notin $env:PATH.Split(";")) {
    $env:PATH += ";$pgPath"
    Write-Host "✅ PostgreSQL bin added to PATH (this session only)" -ForegroundColor Green
}

# Create psql alias
function psql {
    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -h 127.0.0.1 @args
}

# Create quick database connection functions
function db-connect {
    <#
    .SYNOPSIS
    Quick connect to flood_resilience database
    #>
    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
        -h 127.0.0.1 `
        -U postgres `
        -d flood_resilience
}

function db-query {
    param([string]$query)
    <#
    .SYNOPSIS
    Run a SQL query against flood_resilience database
    #>
    $env:PGPASSWORD = "2001"
    & "C:\Program Files\PostgreSQL\18\bin\psql.exe" `
        -h 127.0.0.1 `
        -U postgres `
        -d flood_resilience `
        -c $query
}

Write-Host @"
🎯 Database Connection Tools Ready:
   • psql <args>          - Full psql with default host (127.0.0.1)
   • db-connect           - Quick connect to flood_resilience
   • db-query "<sql>"     - Run SQL queries (password auto-applied)

For password-free connections, create a .pgpass file:
   C:\Users\$env:USERNAME\AppData\postgresql\pgpass.conf
   Contents (no quotes):
   127.0.0.1:5432:flood_resilience:postgres:2001
   
Then run: icacls "C:\Users\$env:USERNAME\AppData\postgresql\pgpass.conf" /grant "%USERNAME%:F" /inheritance:r
"@ -ForegroundColor Cyan
