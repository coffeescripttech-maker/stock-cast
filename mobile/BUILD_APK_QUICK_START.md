# Build APK - Quick Start Guide

## Prerequisites Check

```powershell
# Check EAS CLI version
eas --version
# Should be 18.x or higher

# Update if needed
npm install -g eas-cli@latest

# Login to Expo
eas login
```

## Method 1: EAS Build (Recommended)

### Step 1: Navigate to Mobile Folder
```powershell
cd MOBILE_APP/mobile
```

### Step 2: Build APK
```powershell
eas build --profile preview --platform android
```

### Step 3: Wait for Build
- Build happens on Expo servers (5-15 minutes)
- You'll get a download link when done
- APK will be available at: https://expo.dev/accounts/[your-account]/projects/safehaven/builds

### Step 4: Download APK
- Click the download link in terminal
- Or visit https://expo.dev and download from builds page

## Method 2: If Network Errors Persist

### Option A: Use Expo Website
1. Go to https://expo.dev
2. Login with your account
3. Select "SafeHaven" project
4. Click "Builds" → "Create a build"
5. Select Android → Preview profile
6. Wait for build to complete
7. Download APK

### Option B: Try Different Network
```powershell
# Use mobile hotspot or VPN
eas build --profile preview --platform android
```

### Option C: Local Build (Requires Android Studio)
```powershell
# Install dependencies
npm install

# Build locally
npx expo run:android --variant release
```

## Method 3: Quick Script

Use the automated script:

```powershell
cd MOBILE_APP/mobile
.\fix-and-build.ps1
```

This will:
1. Check EAS CLI version
2. Login to Expo
3. Start build process
4. Show download link

## Troubleshooting

### Error: "read ECONNRESET"
**Cause:** Network connection to Expo servers failed

**Solutions:**
1. Wait 5 minutes and retry
2. Use mobile hotspot instead of WiFi
3. Use VPN
4. Try Expo website method
5. Update EAS CLI: `npm install -g eas-cli@latest`

### Error: "Not logged in"
```powershell
eas login
# Enter your Expo credentials
```

### Error: "Project not configured"
```powershell
eas build:configure
```

### Error: "Build failed"
Check build logs:
```powershell
eas build:list
# Click on failed build to see logs
```

## Build Profiles

Your `eas.json` has these profiles:

### Preview (For Testing)
```powershell
eas build --profile preview --platform android
```
- Development build
- Includes debugging tools
- Larger file size
- Good for testing

### Production (For Release)
```powershell
eas build --profile production --platform android
```
- Optimized build
- Smaller file size
- Ready for Google Play Store
- No debugging tools

## After Build Completes

### 1. Download APK
```powershell
# Download link will be shown in terminal
# Or visit: https://expo.dev/accounts/[your-account]/projects/safehaven/builds
```

### 2. Install on Android Device

**Method A: Direct Install**
1. Transfer APK to phone
2. Open APK file
3. Allow "Install from unknown sources"
4. Install app

**Method B: QR Code**
1. Expo will show QR code
2. Scan with phone camera
3. Download and install

### 3. Test the App
1. Open SafeHaven app
2. Register new account or login
3. Test all features:
   - ✅ Login/Register
   - ✅ Report incident with agency selection
   - ✅ View alerts
   - ✅ SOS feature
   - ✅ Maps
   - ✅ Profile

## Build Status Check

```powershell
# List all builds
eas build:list

# Check specific build
eas build:view [build-id]

# Cancel running build
eas build:cancel
```

## Expected Build Time

- **EAS Cloud Build:** 5-15 minutes
- **Local Build:** 10-30 minutes (first time)

## Build Output

After successful build:

```
✔ Build finished

Build details: https://expo.dev/accounts/[account]/projects/safehaven/builds/[build-id]

APK: https://expo.dev/artifacts/eas/[artifact-id].apk

Install on device:
- Download APK from link above
- Transfer to Android device
- Install APK
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `eas build --profile preview --platform android` | Build preview APK |
| `eas build --profile production --platform android` | Build production APK |
| `eas build:list` | List all builds |
| `eas build:cancel` | Cancel current build |
| `eas login` | Login to Expo |
| `eas whoami` | Check logged in user |

## Network Error Solutions Summary

1. **Update EAS CLI:** `npm install -g eas-cli@latest`
2. **Try different network:** Mobile hotspot, VPN
3. **Use Expo website:** https://expo.dev
4. **Wait and retry:** Network issues are often temporary
5. **Check firewall:** Ensure Expo servers aren't blocked

## Need Help?

If build still fails:
1. Check build logs at https://expo.dev
2. Verify `app.json` and `eas.json` are correct
3. Ensure all dependencies are installed: `npm install`
4. Try clearing cache: `npx expo start -c`

## Success Checklist

- [ ] EAS CLI updated to latest version
- [ ] Logged into Expo account
- [ ] Build command executed
- [ ] Build completed successfully
- [ ] APK downloaded
- [ ] APK installed on device
- [ ] App tested and working
