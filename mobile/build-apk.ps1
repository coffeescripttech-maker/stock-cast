# SafeHaven Mobile - Build APK Script
# This script builds an APK file for Android

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SafeHaven Mobile - APK Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if EAS CLI is installed
Write-Host "Checking EAS CLI..." -ForegroundColor Yellow
$easVersion = eas --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: EAS CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g eas-cli" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ EAS CLI found: $easVersion" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "Checking EAS login..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not logged in to EAS!" -ForegroundColor Red
    Write-Host "Login with: eas login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ Logged in as: $whoami" -ForegroundColor Green
Write-Host ""

# Confirm build
Write-Host "This will build an APK file for Android." -ForegroundColor Cyan
Write-Host "Build profile: preview (APK for testing)" -ForegroundColor Cyan
Write-Host "Platform: Android" -ForegroundColor Cyan
Write-Host ""
Write-Host "The build will take 10-20 minutes." -ForegroundColor Yellow
Write-Host "You'll get a URL to track progress." -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Build cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Starting build..." -ForegroundColor Green
Write-Host ""

# Start the build
eas build --profile preview --platform android

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build command completed!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check the build URL provided above" -ForegroundColor White
Write-Host "2. Wait for build to complete (10-20 min)" -ForegroundColor White
Write-Host "3. Download the APK file" -ForegroundColor White
Write-Host "4. Install on Android device" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
