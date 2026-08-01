# SafeHaven - Fix Network Error and Build APK
# This script helps troubleshoot and fix the ECONNRESET error

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SafeHaven - Network Fix & Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check EAS CLI version
Write-Host "Step 1: Checking EAS CLI version..." -ForegroundColor Yellow
$easVersion = eas --version 2>&1
Write-Host "Current version: $easVersion" -ForegroundColor White
Write-Host ""

# Step 2: Check if logged in
Write-Host "Step 2: Checking login status..." -ForegroundColor Yellow
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Logged in as: $whoami" -ForegroundColor Green
} else {
    Write-Host "✗ Not logged in" -ForegroundColor Red
    Write-Host "Please run: eas login" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 3: Check internet connectivity
Write-Host "Step 3: Checking internet connectivity..." -ForegroundColor Yellow
try {
    $response = Test-Connection -ComputerName expo.dev -Count 1 -ErrorAction Stop
    Write-Host "✓ Can reach expo.dev" -ForegroundColor Green
} catch {
    Write-Host "✗ Cannot reach expo.dev" -ForegroundColor Red
    Write-Host "Check your internet connection or firewall" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Offer solutions
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Network Error Solutions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The ECONNRESET error means connection to Expo servers failed." -ForegroundColor White
Write-Host ""
Write-Host "Try these solutions:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Update EAS CLI (recommended):" -ForegroundColor White
Write-Host "   npm install -g eas-cli" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Wait 5-10 minutes and try again" -ForegroundColor White
Write-Host "   (Network issues are often temporary)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Try different network:" -ForegroundColor White
Write-Host "   - Use mobile hotspot" -ForegroundColor Gray
Write-Host "   - Use VPN" -ForegroundColor Gray
Write-Host "   - Try different WiFi" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Check firewall/antivirus" -ForegroundColor White
Write-Host "   (Temporarily disable and try again)" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Use Expo website instead:" -ForegroundColor White
Write-Host "   https://expo.dev" -ForegroundColor Cyan
Write-Host "   (Build through web interface)" -ForegroundColor Gray
Write-Host ""

# Step 5: Ask if user wants to try building now
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
$tryNow = Read-Host "Try building now? (Y/N)"

if ($tryNow -eq "Y" -or $tryNow -eq "y") {
    Write-Host ""
    Write-Host "Starting build..." -ForegroundColor Green
    Write-Host "If it fails with ECONNRESET, try the solutions above." -ForegroundColor Yellow
    Write-Host ""
    
    # Try building
    eas build --profile preview --platform android
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "  Build Failed" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Update EAS CLI: npm install -g eas-cli" -ForegroundColor White
        Write-Host "2. Wait 10 minutes and try again" -ForegroundColor White
        Write-Host "3. Try different network (mobile hotspot)" -ForegroundColor White
        Write-Host "4. Use Expo website: https://expo.dev" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Host ""
    Write-Host "Build cancelled. Try the solutions above first." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "For more help, see: FIX_NETWORK_ERROR.md" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
