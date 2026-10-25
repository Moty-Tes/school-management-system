# SMS Database Startup Helper
$port = 5433
$dbDir = "C:\Users\motit\.sms_postgres"
$pgCtl = "C:\Program Files\PostgreSQL\18\bin\pg_ctl.exe"

Write-Host "[SMS] Checking PostgreSQL on port $port..." -ForegroundColor Cyan

$conn = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue

if ($conn) {
    Write-Host "[SMS] PostgreSQL is already running on port $port (PID: $($conn[0].OwningProcess))" -ForegroundColor Green
    exit 0
}

Write-Host "[SMS] Starting local PostgreSQL on port $port..." -ForegroundColor Yellow

if (Test-Path $pgCtl) {
    if (Test-Path $dbDir) {
        & $pgCtl -D $dbDir -l "$dbDir\server.log" start
        Start-Sleep -Seconds 2
        $testConn = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
        if ($testConn) {
            Write-Host "[SMS] PostgreSQL started successfully on port $port" -ForegroundColor Green
            exit 0
        }
    }
}

Write-Host "[SMS] Attempting docker compose as fallback..." -ForegroundColor Yellow
docker compose up -d postgres
