# Status check script for Autologist
Write-Host "Status Autologist Microservices" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Blue

function Check-ProcessStatus {
    param(
        [string]$ProcessName,
        [string]$ServiceName,
        [string]$Icon
    )
    
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if ($processes) {
        $count = $processes.Count
        Write-Host "$Icon $ServiceName : Running ($count process)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "$Icon $ServiceName : Stopped" -ForegroundColor Red
        return $false
    }
}

Write-Host "`nChecking processes..." -ForegroundColor Cyan

$backendRunning = Check-ProcessStatus -ProcessName "node" -ServiceName "Backend/Frontend" -Icon "NODE"
$parserRunning = Check-ProcessStatus -ProcessName "python" -ServiceName "Telegram Parser" -Icon "PYTHON"

$activeServices = 0
if ($backendRunning) { $activeServices++ }
if ($parserRunning) { $activeServices++ }

Write-Host "`n================================" -ForegroundColor Blue
Write-Host "TOTAL STATUS" -ForegroundColor Green
Write-Host "Active services: $activeServices" -ForegroundColor Yellow

if ($activeServices -gt 0) {
    Write-Host "System is running!" -ForegroundColor Green
} else {
    Write-Host "All services stopped" -ForegroundColor Red
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")