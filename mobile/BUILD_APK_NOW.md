# Build APK Now - Quick Guide

## What You Need to Know

**`eas update`** vs **`eas build`**:
- `eas update` = Push code updates to existing apps (OTA updates)
- `eas build` = Build a new APK/AAB file (what you need)

## Build APK Command

Run this command to build your APK:

```bash
cd MOBILE_APP/mobile
eas build --profile preview --platform android
```

## What Will Happen

1. **EAS will ask questions:**
   - "Generate a new Android Keystore?" → Answer: `Y`
   - This creates signing credentials for your app

2. **Build starts on EAS servers:**
   - You'll get a URL to track progress
   - Build takes 10-20 minutes
   - You can close terminal and check the URL

3. **When complete:**
   - Download APK from the build URL
   - Install on Android device

## Alternative: Local Build (Faster but requires setup)

If you have Android SDK installed:
```bash
eas build --profile preview --platform android --local
```

## If You Get Network Errors

The network error you're seeing is likely temporary. Try:

1. **Check internet connection**
2. **Retry the command:**
   ```bash
   eas build --profile preview --platform android
   ```

3. **Clear cache and retry:**
   ```bash
   eas build --profile preview --platform android --clear-cache
   ```

## Quick Reference

```bash
# Navigate to mobile folder
cd MOBILE_APP/mobile

# Build APK for testing
eas build --profile preview --platform android

# Check build status
eas build:list

# View specific build
eas build:view [build-id]
```

## After Build Completes

1. Go to the build URL provided
2. Click "Download" button
3. Transfer APK to Android device
4. Install and test

## Important Notes

- **First build** takes longer (15-20 min)
- **Subsequent builds** are faster (10-15 min)
- You can track progress at the URL provided
- APK will be ~50-80 MB in size

---

**Ready? Run this:**
```bash
cd MOBILE_APP/mobile && eas build --profile preview --platform android
```
