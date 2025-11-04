# Start all Autologist components
Write-Host "Starting Autologist Microservices..." -ForegroundColor Green

$projectPath = "C:\Users\bauto\OneDrive\Документы\autologist-microservices"
Set-Location $projectPath

Write-Host "Project directory: $(Get-Location)" -ForegroundColor Yellow

function Start-Component {
    param(
        [string]$Name,
        [string]$Path,
        [string]$Command
    )
    
    Write-Host "Starting $Name..." -ForegroundColor Cyan
    
    if (-not (Test-Path $Path)) {
        Write-Host "Directory not found: $Path" -ForegroundColor Red
        return $false
    }
    
    try {
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Path'; Write-Host '$Name started' -ForegroundColor Green; $Command"
        Write-Host "$Name launched in new terminal" -ForegroundColor Green
        Start-Sleep 2
        return $true
    }
    catch {
        Write-Host "Error starting $Name : $_" -ForegroundColor Red
        return $false
    }
}

$successCount = 0

Write-Host "`n1. Backend Server..." -ForegroundColor Magenta
if (Start-Component -Name "Backend" -Path "$projectPath\backend" -Command "node server.js") {
    $successCount++
}

Write-Host "`n2. Frontend Client..." -ForegroundColor Magenta
if (Start-Component -Name "Frontend" -Path "$projectPath\frontend" -Command "npm start") {
    $successCount++
}

Write-Host "`n3. Telegram Parser..." -ForegroundColor Magenta
if (Start-Component -Name "Parser" -Path "$projectPath\telegram-parser" -Command "python telegram_parser.py") {
    $successCount++
}

Write-Host "`n==============================" -ForegroundColor Blue
Write-Host "STARTUP COMPLETED!" -ForegroundColor Green
Write-Host "Successfully started: $successCount of 3 components" -ForegroundColor Yellow

if ($successCount -eq 3) {
    Write-Host "`nALL SERVICES RUNNING!" -ForegroundColor Green
    Write-Host "Dashboard: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Backend API: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "Telegram Parser: Active" -ForegroundColor Cyan
} else {
    Write-Host "`nSome services failed to start. Check terminals." -ForegroundColor Yellow
}

Write-Host "`nTo stop all services use: stop-all.ps1" -ForegroundColor Gray
Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")