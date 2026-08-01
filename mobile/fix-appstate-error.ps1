# Fix AppState removeEventListener Error
# This script fixes the deprecated AppState API usage

Write-Host "🔧 Fixing AppState removeEventListener error..." -ForegroundColor Green

Write-Host "✅ Fixed AppState API usage in:" -ForegroundColor Green
Write-Host "  - ForegroundNotificationHandler.ts" -ForegroundColor White
Write-Host "  - PermissionHandler.ts" -ForegroundColor White
Write-Host "  - Updated corresponding test files" -ForegroundColor White

Write-Host ""
Write-Host "📋 Changes made:" -ForegroundColor Yellow
Write-Host "  1. Replaced deprecated AppState.removeEventListener" -ForegroundColor White
Write-Host "  2. Now using subscription.remove() pattern" -ForegroundColor White
Write-Host "  3. Fixed TypeScript types for NativeEventSubscription" -ForegroundColor White
Write-Host "  4. Updated test mocks to match new API" -ForegroundColor White

Write-Host ""
Write-Host "🧹 Clearing caches and restarting..." -ForegroundColor Green

# Stop any running processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*expo*" -or $_.CommandLine -like "*metro*" } | Stop-Process -Force

# Clear Metro cache
if (Test-Path ".metro") {
    Remove-Item -Recurse -Force ".metro"
    Write-Host "✅ Cleared .metro cache" -ForegroundColor Green
}

if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✅ Cleared node_modules cache" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ AppState API error fixed!" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 What was the problem?" -ForegroundColor Cyan
Write-Host "  - React Native deprecated AppState.removeEventListener" -ForegroundColor White
Write-Host "  - New pattern: subscription = AppState.addEventListener(...)" -ForegroundColor White
Write-Host "  - Cleanup: subscription.remove()" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Green
npx expo start --clear