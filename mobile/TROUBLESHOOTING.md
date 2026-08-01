# 🔧 SafeHaven Mobile - Troubleshooting Guide

## ✅ Common Issues & Solutions

### Issue 1: Network Error on `npm start`

**Error:**
```
FetchError: request to https://api.expo.dev/v2/sdks/50.0.0/native-modules failed
reason: read ECONNRESET
```

**Cause:** Network connection issue with Expo's API (firewall, proxy, or internet)

**Solution 1: Start in Offline Mode (Recommended)**
```bash
npm start -- --offline
```

**Solution 2: Clear Expo Cache**
```bash
npx expo start -c
```

**Solution 3: Check Network**
- Disable VPN/Proxy
- Check firewall settings
- Try different network

---

### Issue 2: "Cannot find module" Errors

**Error:**
```
Cannot find module '@react-native-async-storage/async-storage'
```

**Solution:**
```bash
npm install
# or
npm install --legacy-peer-deps
```

---

### Issue 3: TypeScript Errors

**Error:**
```
Cannot find name 'Promise'
```

**Solution:** Already fixed in `tsconfig.json` with proper lib configuration

---

### Issue 4: Metro Bundler Issues

**Error:**
```
Metro bundler has encountered an error
```

**Solution:**
```bash
# Clear cache and restart
npx expo start -c
```

---

### Issue 5: Android Emulator Not Connecting

**Error:**
```
Could not connect to development server
```

**Solution:**
1. Check emulator is running
2. Check API URL in `src/constants/config.ts`:
   ```typescript
   BASE_URL: 'http://10.0.2.2:3000/api/v1'  // For Android emulator
   ```
3. Make sure backend is running on port 3000

---

### Issue 6: iOS Simulator Not Connecting

**Error:**
```
Could not connect to development server
```

**Solution:**
1. Check simulator is running
2. Check API URL in `src/constants/config.ts`:
   ```typescript
   BASE_URL: 'http://localhost:3000/api/v1'  // For iOS simulator
   ```
3. Make sure backend is running on port 3000

---

### Issue 7: Physical Device Not Connecting

**Error:**
```
Network request failed
```

**Solution:**
1. Make sure phone and computer are on same WiFi
2. Update API URL in `src/constants/config.ts`:
   ```typescript
   BASE_URL: 'http://YOUR_COMPUTER_IP:3000/api/v1'
   ```
3. Find your IP:
   - Windows: `ipconfig` (look for IPv4)
   - Mac/Linux: `ifconfig` (look for inet)

---

### Issue 8: Notifications Not Working

**Error:**
```
Notifications only work on physical devices
```

**Solution:**
- Push notifications require a real device
- Emulators/simulators don't support FCM
- Use Expo Go on physical device

---

### Issue 9: Location Not Working

**Error:**
```
Location permission denied
```

**Solution:**
1. Grant location permission in device settings
2. For emulator: Set location in emulator settings
3. Check `app.json` has location permissions

---

### Issue 10: Build Errors

**Error:**
```
Build failed with errors
```

**Solution:**
```bash
# Clean and reinstall
rm -rf node_modules
npm install

# Clear cache
npx expo start -c
```

---

## 🚀 Quick Fixes

### Reset Everything
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Clear Expo cache
npx expo start -c

# Clear Metro cache
npm start -- --reset-cache
```

### Check Backend Connection
```bash
# Test backend is running
curl http://localhost:3000/api/v1/auth/login

# Should return 400 or 401 (means backend is up)
```

### Check Dependencies
```bash
# List installed packages
npm list --depth=0

# Check for missing dependencies
npm install
```

---

## 📱 Platform-Specific Issues

### Android

**Issue: App crashes on startup**
- Check `android/app/build.gradle` for correct SDK versions
- Clear app data in device settings
- Uninstall and reinstall app

**Issue: White screen**
- Check Metro bundler is running
- Check network connection
- Clear cache: `npx expo start -c`

### iOS

**Issue: App not installing**
- Check Xcode is installed (Mac only)
- Check iOS simulator is running
- Try different simulator version

**Issue: Location not working**
- Check `Info.plist` has location permissions
- Grant permission in simulator settings

---

## 🔍 Debugging Tips

### Enable Debug Mode
```bash
# Start with debug logging
npm start -- --dev-client
```

### Check Logs
```bash
# Android logs
adb logcat

# iOS logs
xcrun simctl spawn booted log stream
```

### Network Debugging
```bash
# Check if backend is accessible
curl http://10.0.2.2:3000/api/v1/auth/login  # Android
curl http://localhost:3000/api/v1/auth/login  # iOS
```

### React Native Debugger
1. Shake device (or Cmd+D / Ctrl+M)
2. Select "Debug Remote JS"
3. Open Chrome DevTools

---

## 📊 System Requirements

### Minimum Requirements:
- Node.js 18+
- npm 8+
- Expo CLI (installed with dependencies)
- 4GB RAM
- 10GB free disk space

### For Android:
- Android Studio
- Android SDK 33+
- Android Emulator or physical device

### For iOS (Mac only):
- Xcode 14+
- iOS Simulator
- macOS 12+

---

## 🆘 Still Having Issues?

### Check These:

1. **Backend Running?**
   ```bash
   cd backend
   npm run dev
   ```

2. **Correct Node Version?**
   ```bash
   node --version  # Should be 18+
   ```

3. **Dependencies Installed?**
   ```bash
   npm list --depth=0
   ```

4. **Expo CLI Working?**
   ```bash
   npx expo --version
   ```

5. **Network Connection?**
   - Try offline mode: `npm start -- --offline`
   - Check firewall settings
   - Disable VPN

---

## 📝 Common Commands

### Start App
```bash
npm start                    # Normal start
npm start -- --offline       # Offline mode (recommended)
npm start -- -c              # Clear cache
npm start -- --reset-cache   # Reset Metro cache
```

### Run on Device
```bash
npm run android              # Android emulator
npm run ios                  # iOS simulator
npm start -- --tunnel        # For physical device (slower)
```

### Clean & Rebuild
```bash
rm -rf node_modules          # Delete dependencies
npm install                  # Reinstall
npx expo start -c            # Clear cache and start
```

---

## ✅ Success Checklist

Before reporting an issue, check:

- [ ] Backend is running on port 3000
- [ ] Node.js version is 18+
- [ ] Dependencies are installed (`npm install`)
- [ ] Expo cache is clear (`npx expo start -c`)
- [ ] Correct API URL in `config.ts`
- [ ] Device/emulator is running
- [ ] Network connection is stable
- [ ] Firewall allows Expo connections

---

## 🎯 Quick Start (Working Setup)

```bash
# 1. Install dependencies
cd mobile
npm install

# 2. Start backend
cd ../backend
npm run dev

# 3. Start mobile app (in new terminal)
cd ../mobile
npm start -- --offline

# 4. Scan QR code with Expo Go app
# or press 'a' for Android, 'i' for iOS
```

---

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Troubleshooting Guide](https://docs.expo.dev/troubleshooting/overview/)

---

**Most Common Fix:** Use offline mode!
```bash
npm start -- --offline
```

This bypasses Expo's API and works with local cache. ✅
