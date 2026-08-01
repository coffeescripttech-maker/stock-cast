# APK Build Fix - White Screen Crash

## Problem
The APK was crashing with a white screen after the splash screen. This happened because:
1. `expo-notifications` and `expo-dev-client` were causing conflicts in standalone builds
2. These packages work in Expo Go but crash in production APKs

## Solution Applied

### 1. Removed Problematic Packages
- ❌ Removed `expo-notifications` (not needed for basic functionality)
- ❌ Removed `expo-dev-client` (only needed for development builds)

### 2. Updated Build Configuration
- Simplified `eas.json` to remove `developmentClient` flags
- Kept only `preview` and `production` build profiles

### 3. Enhanced Error Handling
- Added better error boundary with detailed error messages
- Added safe module loading with try-catch
- Added console logs to track app startup

## How to Build the Fixed APK

### Step 1: Clean and Reinstall Dependencies
```powershell
cd MOBILE_APP/mobile
Remove-Item -Recurse -Force node_modules
npm install
```

### Step 2: Clear EAS Build Cache
```powershell
npx eas build:configure
```

### Step 3: Build the APK
```powershell
npx eas build --platform android --profile preview --clear-cache
```

### Step 4: Wait for Build
- The build will take 10-15 minutes
- You'll get a download link when it's done
- Download and install the APK on your phone

## Testing the APK

1. **Install the APK** on your Android device
2. **Open the app** - you should see:
   - Blue splash screen with logo
   - Then the login screen (if not logged in)
   - Or the home screen (if logged in)

3. **If it crashes**, you'll now see an error screen with:
   - Error icon ⚠️
   - Error message
   - Stack trace

## Getting Crash Logs (If Still Crashes)

If the app still crashes with a white screen:

```powershell
# Connect your phone via USB
# Enable USB debugging on your phone
# Run this command:
adb logcat | Select-String "FATAL|AndroidRuntime|ReactNative|SafeHaven"
```

Then open the app and watch the logs.

## What's Different Now

### Before:
- App had `expo-notifications` → Crashed in APK
- App had `expo-dev-client` → Caused conflicts
- No error boundary → White screen with no info

### After:
- ✅ No `expo-notifications` → App works without push notifications
- ✅ No `expo-dev-client` → Clean standalone build
- ✅ Error boundary → Shows errors on screen if something fails
- ✅ Safe module loading → Better error messages

## Features Still Working

✅ Login/Register
✅ Home screen with disaster info
✅ Alerts list and details
✅ Evacuation centers with maps
✅ Emergency contacts
✅ Family groups
✅ Incident reporting
✅ Profile settings
✅ Offline mode

## Features Temporarily Disabled

❌ Push notifications (can be re-enabled later with proper setup)

## Next Steps

1. Build the new APK with the command above
2. Test on your phone
3. If it works → Great! You can distribute it
4. If it still crashes → Run the adb logcat command and share the error

## Environment Variables

Make sure your `.env` file has:
```
EXPO_PUBLIC_API_URL=https://safe-haven-backend-api.onrender.com/api/v1
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao
```

## Build Command Reference

```powershell
# Preview APK (for testing)
npx eas build --platform android --profile preview --clear-cache

# Production AAB (for Play Store)
npx eas build --platform android --profile production
```

## Troubleshooting

### "Module not found" errors
```powershell
cd MOBILE_APP/mobile
Remove-Item -Recurse -Force node_modules
npm install
```

### "Build failed" on EAS
- Check your internet connection
- Try again with `--clear-cache` flag
- Make sure you're logged in: `npx eas login`

### App still crashes
- Get logs with `adb logcat`
- Check if Google Maps API key is valid
- Check if backend API is accessible

## Success Indicators

When the build succeeds, you should see:
```
✅ Build finished
📱 Install the app: [download link]
```

When the app works, you should see:
```
🚀 App starting...
✅ All modules loaded successfully
```

These logs appear in the Metro bundler when testing in Expo Go.
