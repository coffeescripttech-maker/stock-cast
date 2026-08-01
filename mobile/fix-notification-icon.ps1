# Fix notification icon issue by creating a copy
Write-Host "Fixing notification icon for APK build..." -ForegroundColor Cyan

Write-Host "`n1. Creating notification-icon.png from logo.png..." -ForegroundColor Yellow
Copy-Item -Path "assets/logo.png" -Destination "assets/notification-icon.png" -Force

Write-Host "`n2. Verifying files exist..." -ForegroundColor Yellow
if (Test-Path "assets/logo.png") {
    Write-Host "   ✓ logo.png exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ logo.png missing!" -ForegroundColor Red
}

if (Test-Path "assets/notification-icon.png") {
    Write-Host "   ✓ notification-icon.png exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ notification-icon.png missing!" -ForegroundColor Red
}

Write-Host "`n3. Now try building again with:" -ForegroundColor Cyan
Write-Host "   eas build --platform android --profile preview" -ForegroundColor White

Write-Host "`nDone! Notification icon issue should be fixed." -ForegroundColor Green
