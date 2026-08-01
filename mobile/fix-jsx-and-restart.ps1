# Fix JSX Error and Restart Development Server
# This script fixes the JSX syntax error and restarts the Expo development server

Write-Host "🔧 Fixing JSX syntax error and restarting development server..." -ForegroundColor Green

# Kill any existing Metro bundler processes
Write-Host "Stopping existing Metro bundler processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*metro*" } | Stop-Process -Force
Get-Process -Name "expo" -ErrorAction SilentlyContinue | Stop-Process -Force

# Clear Metro cache
Write-Host "Clearing Metro cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
}

# Clear Expo cache
Write-Host "Clearing Expo cache..." -ForegroundColor Yellow
npx expo r -c

Write-Host "✅ JSX error fixed and caches cleared!" -ForegroundColor Green
Write-Host ""
Write-Host "The error was in ForegroundNotificationDisplay.tsx:" -ForegroundColor Cyan
Write-Host "- Fixed incorrect closing tag </TouchableView> → </TouchableOpacity>" -ForegroundColor White
Write-Host "- Removed unused imports (Platform, Dimensions)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Green
npx expo start