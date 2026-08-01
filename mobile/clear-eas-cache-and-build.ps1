# Clear EAS Build cache and rebuild APK
Write-Host "Clearing EAS Build cache and rebuilding APK..." -ForegroundColor Cyan

# Navigate to mobile directory
Set-Location -Path "MOBILE_APP/mobile"

Write-Host "`n1. Clearing local Expo cache..." -ForegroundColor Yellow
npx expo start --clear

Write-Host "`n2. Building APK with --clear-cache flag..." -ForegroundColor Yellow
eas build --platform android --profile preview --clear-cache

Write-Host "`nBuild initiated! Check EAS dashboard for progress." -ForegroundColor Green
Write-Host "URL: https://expo.dev/accounts/[your-account]/projects/safehaven-mobile/builds" -ForegroundColor Cyan
