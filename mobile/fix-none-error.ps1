# Fix React Native NONE Property Error
# This script applies a workaround for the "Cannot assign to read-only property 'NONE'" error

Write-Host "🔧 Fixing React Native NONE property error..." -ForegroundColor Green

# Stop any running processes
Write-Host "🛑 Stopping running processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*expo*" -or $_.CommandLine -like "*metro*" } | Stop-Process -Force

# Clear all caches
Write-Host "🧹 Clearing all caches..." -ForegroundColor Yellow

if (Test-Path ".metro") {
    Remove-Item -Recurse -Force ".metro"
    Write-Host "✅ Cleared .metro cache" -ForegroundColor Green
}

if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✅ Cleared node_modules cache" -ForegroundColor Green
}

if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo"
    Write-Host "✅ Cleared .expo cache" -ForegroundColor Green
}

# Clear npm cache
Write-Host "🧹 Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Clear Expo cache
Write-Host "🧹 Clearing Expo cache..." -ForegroundColor Yellow
npx expo install --fix

Write-Host ""
Write-Host "✅ All caches cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 What was the problem?" -ForegroundColor Cyan
Write-Host "  - React Native WebSocket/Event system trying to modify read-only NONE property" -ForegroundColor White
Write-Host "  - This is a known issue with certain RN/Expo SDK combinations" -ForegroundColor White
Write-Host "  - Cache clearing and fresh start usually resolves it" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Starting fresh development server..." -ForegroundColor Green
npx expo start --clear --port 8082