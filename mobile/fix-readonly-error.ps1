# Fix "Cannot assign to read-only property 'NONE'" Error
# This error typically occurs due to React Native/Expo dependency conflicts

Write-Host "🔧 Fixing 'Cannot assign to read-only property NONE' error..." -ForegroundColor Green

# Stop any running processes
Write-Host "Stopping existing processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*expo*" -or $_.CommandLine -like "*metro*" } | Stop-Process -Force

# Clear all caches
Write-Host "Clearing all caches..." -ForegroundColor Yellow

# Clear Metro cache
if (Test-Path ".metro") {
    Remove-Item -Recurse -Force ".metro"
    Write-Host "✅ Removed .metro directory" -ForegroundColor Green
}

# Clear node_modules cache
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✅ Removed node_modules cache" -ForegroundColor Green
}

# Clear Expo cache
Write-Host "Clearing Expo cache..." -ForegroundColor Yellow
npx expo r -c

# Clear npm cache
Write-Host "Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Clear watchman cache (if available)
Write-Host "Clearing watchman cache..." -ForegroundColor Yellow
try {
    watchman watch-del-all
    Write-Host "✅ Cleared watchman cache" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Watchman not available, skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔄 Reinstalling dependencies..." -ForegroundColor Green

# Remove node_modules and reinstall
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules"
}

if (Test-Path "package-lock.json") {
    Write-Host "Removing package-lock.json..." -ForegroundColor Yellow
    Remove-Item -Force "package-lock.json"
}

# Reinstall dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host ""
Write-Host "✅ Dependencies reinstalled!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Green
npx expo start --clear