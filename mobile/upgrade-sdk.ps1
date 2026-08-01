# Upgrade SafeHaven Mobile to SDK 51

Write-Host "🚀 Upgrading SafeHaven Mobile to Expo SDK 51..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Delete node_modules and package-lock.json
Write-Host "📦 Step 1: Cleaning old dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ Deleted node_modules" -ForegroundColor Green
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ Deleted package-lock.json" -ForegroundColor Green
}
Write-Host ""

# Step 2: Install new dependencies
Write-Host "📦 Step 2: Installing SDK 51 dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
npm install
Write-Host ""

# Step 3: Clear Expo cache
Write-Host "🧹 Step 3: Clearing Expo cache..." -ForegroundColor Yellow
npx expo start -c --offline
Write-Host ""

Write-Host "✅ Upgrade complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 Now you can:" -ForegroundColor Cyan
Write-Host "   1. Scan QR code with Expo Go app" -ForegroundColor White
Write-Host "   2. Press 'a' for Android emulator" -ForegroundColor White
Write-Host "   3. Press 'i' for iOS simulator" -ForegroundColor White
Write-Host ""
