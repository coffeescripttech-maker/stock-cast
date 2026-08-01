# Quick Fix Script for SafeHaven Mobile App

Write-Host "🔧 SafeHaven Mobile - Quick Fix" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean install
Write-Host "Step 1: Cleaning node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "✅ Cleaned node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "✅ Cleaned package-lock.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Clearing Expo cache..." -ForegroundColor Yellow
npx expo start --clear
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Expo started with cleared cache" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start Expo" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Done! Scan the QR code with Expo Go" -ForegroundColor Green
Write-Host ""
Write-Host "If you still see errors:" -ForegroundColor Yellow
Write-Host "1. Close Expo Go completely on your phone" -ForegroundColor White
Write-Host "2. Reopen Expo Go and scan the QR code again" -ForegroundColor White
Write-Host "3. If it still fails, run: npx expo start --clear --reset-cache" -ForegroundColor White
