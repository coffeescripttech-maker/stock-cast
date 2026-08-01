# Fix EAS Network Error (ECONNRESET)

## The Problem
```
request to https://api.expo.dev/graphql failed, reason: read ECONNRESET
Error: GraphQL request failed.
```

This means your computer can't connect to Expo's servers. This is usually temporary.

## Solutions (Try in Order)

### Solution 1: Check Internet Connection
1. Make sure you have stable internet
2. Try opening https://expo.dev in your browser
3. If it loads, your internet is working

### Solution 2: Wait and Retry
Network issues are often temporary. Wait 5-10 minutes and try again:
```bash
cd MOBILE_APP/mobile
eas build --profile preview --platform android
```

### Solution 3: Use VPN or Different Network
Sometimes your ISP or firewall blocks Expo servers:
1. Try using a VPN
2. Try using mobile hotspot
3. Try a different WiFi network

### Solution 4: Update EAS CLI
Your version is outdated. Update it:
```bash
npm install -g eas-cli
```

Then try building again:
```bash
cd MOBILE_APP/mobile
eas build --profile preview --platform android
```

### Solution 5: Clear Cache and Retry
```bash
cd MOBILE_APP/mobile
eas build --profile preview --platform android --clear-cache
```

### Solution 6: Check Firewall/Antivirus
Your firewall might be blocking the connection:
1. Temporarily disable antivirus/firewall
2. Try the build command again
3. Re-enable security software after

### Solution 7: Use Different DNS
Change your DNS to Google's:
1. Open Network Settings
2. Change DNS to: `8.8.8.8` and `8.8.4.4`
3. Restart computer
4. Try again

### Solution 8: Build Locally (Advanced)
If cloud build keeps failing, build on your computer:

**Requirements:**
- Android Studio installed
- Android SDK configured
- Java JDK installed

**Command:**
```bash
cd MOBILE_APP/mobile
eas build --profile preview --platform android --local
```

This builds on your machine instead of Expo's servers.

## Alternative: Use Expo Application Services Website

Instead of CLI, use the web interface:

1. Go to https://expo.dev
2. Login with your account
3. Navigate to your project: `safehaven-mobile`
4. Click "Builds" in sidebar
5. Click "Create a build"
6. Select:
   - Platform: Android
   - Profile: preview
7. Click "Build"

This uses the same system but through the website instead of CLI.

## Check EAS Status

Check if Expo's servers are having issues:
- https://status.expo.dev
- https://twitter.com/expo

If there's an outage, you'll need to wait for Expo to fix it.

## Quick Diagnostic Commands

```bash
# Check if you can reach Expo
ping expo.dev

# Check EAS CLI version
eas --version

# Check if logged in
eas whoami

# Update EAS CLI
npm install -g eas-cli

# Clear all caches
npm cache clean --force
eas build --profile preview --platform android --clear-cache
```

## What to Try Right Now

1. **Update EAS CLI first:**
   ```bash
   npm install -g eas-cli
   ```

2. **Wait 5 minutes** (network issues are often temporary)

3. **Try building again:**
   ```bash
   cd MOBILE_APP/mobile
   eas build --profile preview --platform android
   ```

4. **If still failing, try different network:**
   - Use mobile hotspot
   - Use VPN
   - Try from different location

## Still Not Working?

If none of these work, you have two options:

### Option A: Wait for Network to Stabilize
The error is on the network connection between you and Expo's servers. It will likely work later.

### Option B: Build Locally
Set up Android development environment and build on your machine:
```bash
eas build --profile preview --platform android --local
```

This requires:
- Android Studio
- Android SDK
- Java JDK
- More setup time

## Success Indicators

When it works, you'll see:
```
✔ Logged in
✔ Project configured
✔ Credentials configured
✔ Build started
Build URL: https://expo.dev/accounts/.../builds/...
```

## Common Causes of This Error

1. **Temporary network glitch** (most common)
2. **Firewall blocking Expo servers**
3. **ISP blocking certain ports**
4. **Expo servers having issues**
5. **Outdated EAS CLI**
6. **Proxy/VPN interfering**

---

**Quick Fix to Try Now:**
```bash
# Update CLI
npm install -g eas-cli

# Wait 5 minutes

# Try again
cd MOBILE_APP/mobile
eas build --profile preview --platform android
```
