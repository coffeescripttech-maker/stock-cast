# Silent SMS Setup Guide

## Overview
This adds silent SMS capability to SafeHaven for Android devices. When the user has granted SEND_SMS permission, emergency SOS alerts will be sent automatically without requiring the user to press "Send" in the SMS app.

## How It Works

### Flow Priority:
1. **Online**: Send via API (instant, preferred) ✅
2. **Offline + Android + Permission**: Send via silent SMS (automatic) ✅ NEW
3. **Fallback**: Open SMS app with pre-filled message (user presses send) ✅

### Platform Support:
- **Android**: Silent SMS available with SEND_SMS permission
- **iOS**: Not supported (iOS never allows silent SMS for security)
- **Fallback**: Works on all platforms with user confirmation

## Files Created

### 1. Native Module (`modules/silent-sms/`)
- `android/src/main/java/expo/modules/silentsms/SilentSMSModule.kt` - Kotlin native module
- `index.ts` - TypeScript interface
- `expo-module.config.json` - Module configuration

### 2. Config Plugin
- `plugins/withSilentSMS.js` - Adds SEND_SMS permission to AndroidManifest

### 3. Updated Files
- `app.json` - Added plugin and SEND_SMS permission
- `src/services/sms.ts` - Enhanced to try silent SMS first
- `src/components/home/SOSButton.tsx` - Requests SMS permission on mount

## Setup Steps

### 1. Install Dependencies
```bash
cd MOBILE_APP/mobile
npm install @expo/config-plugins
```

### 2. Prebuild (Generate Native Code)
```bash
npx expo prebuild --clean
```

This will:
- Generate Android native code with the silent SMS module
- Add SEND_SMS permission to AndroidManifest.xml
- Keep your existing Expo managed workflow

### 3. Build APK
```bash
eas build --platform android --profile preview
```

Or for local build:
```bash
npx expo run:android
```

## Testing

### Test Silent SMS Capability:
```javascript
import { canSendSilentSMS } from './src/services/sms';

const hasSilent = await canSendSilentSMS();
console.log('Silent SMS available:', hasSilent);
```

### Test SOS Flow:
1. Turn off WiFi/mobile data (offline mode)
2. Press SOS button
3. Select agency
4. Confirm send
5. **Android with permission**: SMS sends automatically (no user action needed)
6. **iOS or no permission**: SMS app opens with pre-filled message

## User Experience

### First Time (Android):
1. User opens app
2. App requests SMS permission
3. User grants permission
4. Silent SMS now available for emergencies

### During Emergency (Android with permission):
1. User presses SOS
2. Selects agency
3. Confirms (1 second countdown)
4. SMS sends **automatically** - no SMS app opens
5. User sees success message

### During Emergency (iOS or no permission):
1. User presses SOS
2. Selects agency
3. Confirms (1 second countdown)
4. SMS app opens with pre-filled message
5. User presses "Send" in SMS app

## Security & Privacy

- Permission requested with clear explanation
- User can deny permission - app still works with fallback
- Silent SMS only used for emergency SOS alerts
- All SMS content is visible in device SMS history
- Complies with Android security guidelines

## Advantages

✅ **Faster emergency response** - No user action needed when offline
✅ **Better UX** - Seamless experience on Android
✅ **Backward compatible** - Falls back gracefully on iOS or without permission
✅ **No breaking changes** - Existing functionality preserved
✅ **Transparent** - SMS appears in user's message history

## Limitations

- **Android only** - iOS doesn't support silent SMS
- **Requires permission** - User must grant SEND_SMS permission
- **Carrier dependent** - Requires active SIM with SMS capability
- **Not instant** - SMS delivery depends on cellular network

## Troubleshooting

### Silent SMS not working?
1. Check permission: Settings > Apps > SafeHaven > Permissions > SMS
2. Verify SIM card is inserted and active
3. Check logs for "Silent SMS available" message
4. Test with `canSendSilentSMS()` function

### Permission denied?
- App will automatically fall back to SMS app with pre-filled message
- User can manually grant permission in Android settings later

### Build errors?
```bash
# Clean and rebuild
npx expo prebuild --clean
cd android
./gradlew clean
cd ..
npx expo run:android
```

## Next Steps

1. Run `npm install @expo/config-plugins` in mobile folder
2. Run `npx expo prebuild --clean` to generate native code
3. Build new APK with `eas build`
4. Test on Android device with SMS permission granted
5. Verify silent SMS sends automatically when offline
