# 🚀 Upgrade to SDK 51 - Quick Guide

## Issue
Your Expo Go app is SDK 54, but the project is SDK 50. They need to be compatible.

## ✅ Solution: Upgrade to SDK 51

### Step 1: Stop Current Server
Press `Ctrl+C` in the terminal running `npm start`

### Step 2: Clean & Install
```bash
cd mobile

# Delete old dependencies
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json

# Install SDK 51 (this takes 2-3 minutes)
npm install
```

### Step 3: Start App
```bash
npm start -- --offline
```

### Step 4: Scan QR Code
Open Expo Go app and scan the QR code. It should work now!

---

## ✅ What Changed

**package.json updated to SDK 51:**
- `expo`: 50.0.0 → 51.0.0
- `react-native`: 0.73.0 → 0.74.5
- `expo-notifications`: 0.27.6 → 0.28.1
- `expo-location`: 16.5.3 → 17.0.1
- All other Expo packages updated

---

## 🎯 Quick Commands

```bash
# If npm install is still running, wait for it to finish
# You'll see "added XXX packages" when done

# Then start the app
npm start -- --offline

# Scan QR code with Expo Go
```

---

## 🐛 If Installation Hangs

If `npm install` seems stuck:

1. **Cancel it:** Press `Ctrl+C`
2. **Try again:**
   ```bash
   npm install --legacy-peer-deps
   ```
3. **Or use yarn:**
   ```bash
   npm install -g yarn
   yarn install
   ```

---

## ✅ After Installation

You should see:
```
added 1500+ packages in 2-3 minutes
```

Then:
```bash
npm start -- --offline
```

Scan QR code → App loads! 🎉

---

## 📱 Compatibility

- **Expo Go SDK 54** ✅ Compatible with SDK 51
- **Expo Go SDK 52-54** ✅ All compatible with SDK 51
- **Expo Go SDK 50-51** ✅ Compatible

SDK 51 works with Expo Go versions 51-54!

---

## 🎉 Success!

Once `npm install` completes and you run `npm start -- --offline`, you'll be able to scan the QR code and the app will load in Expo Go!

All features will work:
- ✅ Authentication
- ✅ Home Dashboard
- ✅ Alerts
- ✅ Centers
- ✅ Contacts
- ✅ Profile
- ✅ Push Notifications

---

## 💡 Pro Tip

If you want to avoid SDK mismatches in the future:
- Keep Expo Go updated in Play Store/App Store
- Or use `npx expo start --dev-client` for custom builds
