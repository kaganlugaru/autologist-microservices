# Stop all Autologist components
Write-Host "Stopping Autologist Microservices..." -ForegroundColor Red

function Stop-ProcessByName {
    param(
        [string]$ProcessName,
        [string]$ServiceName
    )
    
    Write-Host "Stopping $ServiceName..." -ForegroundColor Yellow
    
    try {
        $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
        if ($processes) {
            $count = $processes.Count
            $processes | Stop-Process -Force
            Write-Host "Stopped $count process(es) of $ServiceName" -ForegroundColor Green
            return $count
        } else {
            Write-Host "$ServiceName not running" -ForegroundColor Gray
            return 0
        }
    }
    catch {
        Write-Host "Error stopping $ServiceName : $_" -ForegroundColor Red
        return 0
    }
}

$stoppedCount = 0

Write-Host "`n1. Node.js services..." -ForegroundColor Magenta
$stoppedCount += Stop-ProcessByName -ProcessName "node" -ServiceName "Node.js (Backend/Frontend)"

Write-Host "`n2. Python services..." -ForegroundColor Magenta
$stoppedCount += Stop-ProcessByName -ProcessName "python" -ServiceName "Python (Telegram Parser)"

Write-Host "`n3. NPM processes..." -ForegroundColor Magenta
$stoppedCount += Stop-ProcessByName -ProcessName "npm" -ServiceName "NPM"

Write-Host "`n==============================" -ForegroundColor Blue
Write-Host "STOP COMPLETED!" -ForegroundColor Red
Write-Host "Stopped processes: $stoppedCount" -ForegroundColor Yellow

if ($stoppedCount -gt 0) {
    Write-Host "`nAll Autologist services stopped" -ForegroundColor Green
} else {
    Write-Host "`nNo active processes found" -ForegroundColor Gray
}

Write-Host "`nTo start all services use: start-all.ps1" -ForegroundColor Gray
Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")