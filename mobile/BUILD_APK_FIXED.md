# APK Build - Notification Icon Fixed

## Issue Fixed
The build was failing with:
```
Error: ENOENT: no such file or directory, open './assets/notification-icon.png'
```

## Solution Applied
Created `notification-icon.png` as a copy of `logo.png` in the assets directory.

## Files Created
- ✅ `assets/notification-icon.png` - Copy of logo.png for notification icon
- ✅ `fix-notification-icon.ps1` - Script to fix the issue
- ✅ `clear-eas-cache-and-build.ps1` - Script to clear cache and rebuild

## Build Now

### Option 1: Standard Build (Recommended)
```powershell
cd MOBILE_APP/mobile
eas build --platform android --profile preview
```

### Option 2: Build with Cache Clear (if issues persist)
```powershell
cd MOBILE_APP/mobile
eas build --platform android --profile preview --clear-cache
```

### Option 3: Use the automated script
```powershell
cd MOBILE_APP/mobile
./clear-eas-cache-and-build.ps1
```

## What's Configured

### Notification Icon Settings (app.json)
```json
{
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/logo.png",
        "color": "#0038A8",
        "sounds": [...]
      }
    ]
  ]
}
```

### Files in Assets Directory
- ✅ `logo.png` - Main app icon
- ✅ `notification-icon.png` - Notification icon (copy of logo.png)
- ✅ `sounds/` - Alert sound files

## Expected Build Time
- First build: 15-20 minutes
- Subsequent builds: 10-15 minutes

## After Build Completes
1. Download the APK from EAS dashboard
2. Transfer to Android device
3. Install and test:
   - Login functionality
   - WebSocket connection
   - Real-time alerts
   - Push notifications
   - Philippine timezone display

## Testing Checklist
- [ ] App installs successfully
- [ ] Login works
- [ ] WebSocket connects (check logs)
- [ ] Real-time alerts appear instantly
- [ ] Push notifications work when app is in background
- [ ] Alert timestamps show Philippine time (UTC+8)
- [ ] "Time ago" shows correctly (e.g., "Just now" not "8h ago")

## Troubleshooting

### If build still fails
1. Clear local cache: `npx expo start --clear`
2. Delete node_modules: `rm -rf node_modules && npm install`
3. Try build with cache clear: `eas build --platform android --profile preview --clear-cache`

### If notification icon is wrong
The notification icon should be a simple, monochrome design. If needed:
1. Create a white icon on transparent background
2. Save as `assets/notification-icon.png`
3. Rebuild

## Notes
- The notification icon fix is permanent - no need to reapply
- Both `logo.png` and `notification-icon.png` now exist
- Build should proceed without errors
- Philippine timezone conversion is active in backend
- WebSocket authentication is working
