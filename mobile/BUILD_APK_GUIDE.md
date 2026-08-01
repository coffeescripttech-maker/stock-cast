# SafeHaven Mobile - APK Build Guide

## Prerequisites

Before building the APK, ensure you have:

1. **EAS CLI installed globally**
   ```bash
   npm install -g eas-cli
   ```

2. **Expo account** (free)
   - Sign up at https://expo.dev if you don't have one

3. **EAS CLI logged in**
   ```bash
   eas login
   ```

## Build Configuration

Your app is already configured with:
- **Package Name**: `com.safehaven.app`
- **App Name**: SafeHaven
- **Version**: 1.0.0
- **EAS Project ID**: `658ac31a-7930-47e9-9adc-8126ed6a438a`

## Build Options

### Option 1: Preview Build (APK) - Recommended for Testing
This creates an APK file you can install directly on Android devices.

```bash
cd MOBILE_APP/mobile
eas build --profile preview --platform android
```

**What happens:**
- Builds an APK file (not AAB)
- Can be installed directly on devices
- Good for testing and distribution to testers
- No Google Play Store required

### Option 2: Production Build (AAB) - For Play Store
This creates an Android App Bundle for Google Play Store submission.

```bash
cd MOBILE_APP/mobile
eas build --profile production --platform android
```

**What happens:**
- Builds an AAB file (Android App Bundle)
- Required for Google Play Store
- Cannot be installed directly on devices
- Optimized for Play Store distribution

## Step-by-Step Build Process

### Step 1: Navigate to Mobile Directory
```bash
cd MOBILE_APP/mobile
```

### Step 2: Login to EAS (if not already logged in)
```bash
eas login
```
Enter your Expo account credentials.

### Step 3: Start the Build
```bash
eas build --profile preview --platform android
```

### Step 4: Follow the Prompts

**You'll be asked:**

1. **"Would you like to automatically create an EAS project for @your-username/safehaven-mobile?"**
   - Answer: `Y` (Yes)

2. **"Generate a new Android Keystore?"**
   - Answer: `Y` (Yes) - This creates signing credentials for your app
   - EAS will securely store your keystore

3. **Build will start on EAS servers**
   - You'll see a URL to track build progress
   - Example: `https://expo.dev/accounts/your-username/projects/safehaven-mobile/builds/...`

### Step 5: Wait for Build to Complete
- Build typically takes 10-20 minutes
- You can close the terminal and check status at the URL provided
- You'll receive an email when build completes

### Step 6: Download the APK
Once build completes:
1. Visit the build URL
2. Click "Download" button
3. Save the APK file (e.g., `safehaven-1.0.0.apk`)

## Installing the APK

### On Physical Device
1. Transfer APK to your Android device
2. Open the APK file
3. Allow "Install from Unknown Sources" if prompted
4. Tap "Install"

### On Emulator
```bash
adb install path/to/safehaven-1.0.0.apk
```

## Environment Variables

Your app uses these environment variables (from `.env`):
```
EXPO_PUBLIC_API_URL=http://192.168.1.8:3001/api/v1
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao
```

**Important:** For production builds, update `EXPO_PUBLIC_API_URL` to your production backend URL.

## Build Profiles Explained

### Preview Profile (eas.json)
```json
"preview": {
  "distribution": "internal",
  "android": {
    "buildType": "apk"
  }
}
```
- Creates APK for internal testing
- Can be shared with testers
- No Play Store required

### Production Profile (eas.json)
```json
"production": {
  "android": {
    "buildType": "app-bundle"
  }
}
```
- Creates AAB for Play Store
- Optimized for distribution
- Requires Play Store submission

## Troubleshooting

### Build Fails with "Invalid credentials"
```bash
eas login
eas build --profile preview --platform android --clear-cache
```

### Build Fails with "Keystore error"
```bash
eas credentials
# Select Android > Production > Remove keystore
# Then rebuild
```

### "Unable to resolve module" errors
```bash
cd MOBILE_APP/mobile
npm install
eas build --profile preview --platform android --clear-cache
```

### API Connection Issues in APK
- Ensure backend is accessible from the device's network
- Update `EXPO_PUBLIC_API_URL` in `.env` to use public IP or domain
- For local testing, use your computer's local IP (not localhost)

## Quick Commands Reference

```bash
# Login to EAS
eas login

# Build APK for testing
eas build --profile preview --platform android

# Build AAB for Play Store
eas build --profile production --platform android

# Check build status
eas build:list

# View build details
eas build:view [build-id]

# Configure credentials
eas credentials

# Clear cache and rebuild
eas build --profile preview --platform android --clear-cache
```

## Build Variants

### Development Build (with Expo Go features)
If you need a development build with debugging:
```bash
eas build --profile preview --platform android --local
```
Note: Requires Android SDK and build tools installed locally.

### Local Build (without EAS servers)
```bash
eas build --profile preview --platform android --local
```
Builds on your machine instead of EAS servers.

## App Permissions

Your APK will request these permissions:
- **Location** (Fine & Coarse) - For disaster alerts and evacuation centers
- **Background Location** - For location-based alerts when app is closed
- **Camera** - For incident photo reporting
- **Storage** (Read/Write) - For saving photos

## Version Management

To update version for new builds:

**app.json:**
```json
{
  "expo": {
    "version": "1.0.1",  // Update this
    "android": {
      "versionCode": 2   // Add this and increment
    }
  }
}
```

## Distribution

### Internal Testing
1. Build with `preview` profile
2. Share APK file via:
   - Email
   - Google Drive
   - Direct download link from EAS

### Google Play Store
1. Build with `production` profile
2. Download AAB file
3. Upload to Google Play Console
4. Complete store listing
5. Submit for review

## Next Steps After Building

1. **Test the APK thoroughly**
   - Install on multiple devices
   - Test all features (SOS, incidents, alerts, maps)
   - Verify backend connectivity
   - Test offline functionality

2. **Prepare for production**
   - Update API URL to production backend
   - Configure Firebase for push notifications
   - Set up proper SSL/HTTPS for backend
   - Test with production database

3. **Create store listing** (if publishing)
   - App icon (512x512)
   - Screenshots (phone & tablet)
   - Feature graphic (1024x500)
   - App description
   - Privacy policy URL

## Support

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **EAS CLI Docs**: https://docs.expo.dev/eas/cli/
- **Expo Forums**: https://forums.expo.dev/

---

**Ready to build?** Run this command:
```bash
cd MOBILE_APP/mobile && eas build --profile preview --platform android
```
