Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "      Port 11434 Conflict Resolver" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$port = 11434
$connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1

if ($connection) {
    $processId = $connection.OwningProcess
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    Write-Host "Found process: $($process.ProcessName) (PID: $processId)" -ForegroundColor Yellow
    $confirmation = Read-Host "Kill this process? (Y/N)"
    if ($confirmation -eq 'Y' -or $confirmation -eq 'y') {
        try {
            Stop-Process -Id $processId -Force
            Write-Host "? Success! Port $port is now free." -ForegroundColor Green
        } catch {
            Write-Host "? Error: Run PowerShell as Admin to kill this process." -ForegroundColor Red
        }
    }
} else {
    Write-Host "? Port $port is already available." -ForegroundColor Green
}
