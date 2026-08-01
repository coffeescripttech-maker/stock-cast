# Clear Metro Cache and Restart Expo Development Server
# This script clears all caches and restarts the development server

Write-Host "🧹 Clearing Metro cache and restarting development server..." -ForegroundColor Green

# Stop any running processes
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*expo*" -or $_.CommandLine -like "*metro*" } | Stop-Process -Force

# Clear Metro cache
Write-Host "Clearing Metro cache..." -ForegroundColor Yellow
if (Test-Path ".metro") {
    Remove-Item -Recurse -Force ".metro"
    Write-Host "✅ Removed .metro directory" -ForegroundColor Green
}

if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✅ Removed node_modules\.cache directory" -ForegroundColor Green
}

# Clear Expo cache
Write-Host "Clearing Expo cache..." -ForegroundColor Yellow
npx expo r -c

Write-Host ""
Write-Host "✅ All caches cleared!" -ForegroundColor Green
Write-Host "🚀 Development server should start automatically..." -ForegroundColor Cyan