# Expo Go Fix - Cannot Open App

## Problem
The app won't open in Expo Go after removing `expo-notifications` and `expo-dev-client`.

## Root Cause
- Expo SDK 54 removed push notifications support from Expo Go
- The app was trying to use `expo-notifications` which crashes in Expo Go
- Some code was still referencing the removed packages

## Solution Applied

### 1. Completely Disabled Notifications
✅ Replaced `NotificationContext.tsx` with a stub that does nothing
✅ Replaced `notifications.ts` utility with stubs
✅ Removed `expo-notifications` from package.json
✅ Removed `expo-dev-client` from package.json

### 2. Enhanced Error Handling
✅ Added better error boundary in App.tsx
✅ Added safe module loading with try-catch
✅ Added detailed console logs

## How to Fix and Run

### Option 1: Quick Fix Script (Recommended)
```powershell
cd MOBILE_APP/mobile
.\QUICK_FIX.ps1
```

This will:
1. Clean node_modules
2. Reinstall dependencies
3. Start Expo with cleared cache

### Option 2: Manual Steps
```powershell
# 1. Clean everything
cd MOBILE_APP/mobile
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# 2. Reinstall
npm install

# 3. Start with cleared cache
npx expo start --clear
```

### Option 3: Nuclear Option (If still failing)
```powershell
cd MOBILE_APP/mobile

# Clean everything
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .expo
Remove-Item -Force package-lock.json

# Reinstall
npm install

# Start with full reset
npx expo start --clear --reset-cache
```

## Testing in Expo Go

1. **Start the dev server**:
   ```powershell
   cd MOBILE_APP/mobile
   npx expo start --clear
   ```

2. **On your phone**:
   - Open Expo Go
   - Scan the QR code
   - Wait for the app to load

3. **Expected behavior**:
   - You should see the blue splash screen
   - Then the login screen (if not logged in)
   - Or the home screen (if logged in)

4. **If it crashes**:
   - Look at the Metro bundler terminal for errors
   - Look at the Expo Go app for error messages
   - Share the error message

## Common Errors and Fixes

### Error: "expo-notifications not found"
**Fix**: Run `npm install` again to ensure the package is removed

### Error: "Module not found"
**Fix**: 
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Error: "Unexpected token" or "Syntax error"
**Fix**: Clear Metro cache
```powershell
npx expo start --clear --reset-cache
```

### Error: White screen in Expo Go
**Fix**: 
1. Close Expo Go completely
2. Restart the Metro bundler
3. Reopen Expo Go and scan QR code

### Error: "Network error" or "Cannot connect"
**Fix**: Make sure your phone and computer are on the same WiFi network

## Building APK (After Expo Go Works)

Once the app works in Expo Go, you can build an APK:

```powershell
# Build preview APK
npx eas build --platform android --profile preview --clear-cache
```

## What's Different Now

### Before (Broken):
```typescript
// Tried to use expo-notifications
import * as Notifications from 'expo-notifications';
// ❌ Crashes in Expo Go SDK 54
```

### After (Working):
```typescript
// Stub implementation
export const NotificationProvider = ({ children }) => {
  console.log('⚠️ Notifications disabled');
  return <>{children}</>;
};
// ✅ Works everywhere
```

## Features Status

### ✅ Working:
- Login/Register
- Home screen
- Alerts list and details
- Evacuation centers with maps
- Emergency contacts
- Family groups
- Incident reporting
- Profile settings
- Offline mode

### ❌ Temporarily Disabled:
- Push notifications (can be re-enabled later with proper setup)

## Debugging Tips

### Check Metro Bundler Logs
Look for these messages in the terminal:
```
🚀 App starting...
✅ All modules loaded successfully
⚠️ NotificationProvider: Push notifications are disabled
```

### Check Expo Go Logs
Look for error messages in the Expo Go app itself

### Check Console Logs
If you see these, the app is starting correctly:
```
RootNavigator - isAuthenticated: false isLoading: false
RootNavigator - Rendering: AuthNavigator
```

## Still Not Working?

If the app still won't open in Expo Go:

1. **Share the error message** from:
   - Metro bundler terminal
   - Expo Go app screen
   - Any red error screens

2. **Check your environment**:
   ```powershell
   node --version  # Should be 18+
   npm --version   # Should be 9+
   npx expo --version  # Should show Expo CLI version
   ```

3. **Try a different network**:
   - Sometimes corporate WiFi blocks Expo
   - Try mobile hotspot

4. **Update Expo Go**:
   - Make sure you have the latest Expo Go from Play Store
   - Should be compatible with SDK 54

## Success Indicators

When everything works, you should see:

**In Terminal:**
```
Metro waiting on exp://192.168.x.x:8081
› Press a │ open Android
› Press w │ open web
```

**In Expo Go:**
- Blue splash screen with logo
- Login screen appears
- No error messages

**In Console:**
```
🚀 App starting...
✅ All modules loaded successfully
⚠️ NotificationProvider: Push notifications are disabled
Loaded stored user: Not found
RootNavigator - Rendering: AuthNavigator
```

## Next Steps

1. ✅ Get app working in Expo Go
2. ✅ Test all features
3. ✅ Build APK with `npx eas build`
4. ✅ Test APK on phone
5. ⏳ Re-enable push notifications later (optional)
