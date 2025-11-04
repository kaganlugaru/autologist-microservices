# PowerShell скрипт для запуска Frontend
Set-Location "c:\Users\bauto\OneDrive\Документы\autologist-microservices\frontend"
Write-Host "🌐 Запуск Frontend..." -ForegroundColor Green
Write-Host "📂 Рабочая папка: $(Get-Location)" -ForegroundColor Yellow
npm run dev