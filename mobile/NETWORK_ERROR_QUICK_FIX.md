# Quick Fix: ECONNRESET Network Error

## The Error You're Getting
```
request to https://api.expo.dev/graphql failed, reason: read ECONNRESET
Error: GraphQL request failed.
```

## What This Means
Your computer can't connect to Expo's build servers. This is usually temporary.

## Quick Fixes (Try These in Order)

### 1️⃣ Update EAS CLI (Most Important)
Your CLI is outdated (v16.27.0, latest is v18.1.0)

```bash
npm install -g eas-cli
```

Then try building again:
```bash
cd MOBILE_APP/mobile
eas build --profile preview --platform android
```

### 2️⃣ Wait and Retry
Network issues are often temporary. Wait 5-10 minutes and try again.

### 3️⃣ Use Different Network
- Turn on mobile hotspot on your phone
- Connect your computer to the hotspot
- Try building again

### 4️⃣ Use VPN
If your ISP is blocking Expo:
- Connect to a VPN
- Try building again

### 5️⃣ Use Expo Website (Easiest Alternative)
Instead of CLI, use the web interface:

1. Go to https://expo.dev
2. Login with your account (coffescript)
3. Find your project: `safehaven-mobile`
4. Click "Builds" → "Create a build"
5. Select: Android, preview profile
6. Click "Build"

This does the same thing but through the website!

## Why This Happens
- Temporary network glitch (most common)
- Firewall blocking Expo servers
- ISP blocking certain connections
- Outdated EAS CLI
- Expo servers having issues

## What to Do Right Now

**Option A: Update CLI and Retry**
```bash
npm install -g eas-cli
cd MOBILE_APP/mobile
eas build --profile preview --platform android
```

**Option B: Use Expo Website**
Go to https://expo.dev and build through the web interface

**Option C: Wait and Try Later**
Network issues often resolve themselves in 10-30 minutes

## Check Expo Status
If Expo's servers are down:
- https://status.expo.dev
- https://twitter.com/expo

## Need More Help?
See detailed guide: `FIX_NETWORK_ERROR.md`

---

**Recommended: Update CLI first, then try again in 10 minutes**
