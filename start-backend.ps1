# PowerShell скрипт для запуска Backend
Set-Location "c:\Users\bauto\OneDrive\Документы\autologist-microservices\backend"
Write-Host "🚀 Запуск Backend API..." -ForegroundColor Green
Write-Host "📂 Рабочая папка: $(Get-Location)" -ForegroundColor Yellow
node server.js