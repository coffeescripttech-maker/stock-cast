# Setup Silent SMS for SafeHaven Android

Write-Host "`n=== Setting Up Silent SMS ===" -ForegroundColor Cyan

# Step 1: Install dependencies
Write-Host "`n1. Installing @expo/config-plugins..." -ForegroundColor Yellow
npm install @expo/config-plugins

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Step 2: Prebuild
Write-Host "`n2. Running expo prebuild to generate native code..." -ForegroundColor Yellow
Write-Host "This will add the silent SMS module to Android..." -ForegroundColor Gray

npx expo prebuild --clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prebuild failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Native code generated" -ForegroundColor Green

# Step 3: Verify
Write-Host "`n3. Verifying setup..." -ForegroundColor Yellow

if (Test-Path "android/app/src/main/AndroidManifest.xml") {
    $manifest = Get-Content "android/app/src/main/AndroidManifest.xml" -Raw
    
    if ($manifest -match "android.permission.SEND_SMS") {
        Write-Host "✅ SEND_SMS permission added to AndroidManifest" -ForegroundColor Green
    } else {
        Write-Host "⚠️ SEND_SMS permission not found in AndroidManifest" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor White
Write-Host "1. Build APK: eas build --platform android --profile preview" -ForegroundColor Gray
Write-Host "2. Install on Android device" -ForegroundColor Gray
Write-Host "3. Grant SMS permission when prompted" -ForegroundColor Gray
Write-Host "4. Test SOS in offline mode - SMS will send automatically!" -ForegroundColor Gray
Write-Host "`nSee SILENT_SMS_SETUP.md for full documentation" -ForegroundColor Gray
