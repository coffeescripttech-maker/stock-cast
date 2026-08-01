# 🔧 Fix "Runtime not ready" Error

## Error
```
Runtime not ready
Cannot read property 'md' of undefined
```

## ✅ Fixes Applied

### 1. Fixed notification utils
- Removed `expo-constants` dependency
- Updated `getExpoPushToken` to work without projectId

### 2. Fixed config.ts
- Added fallback for `__DEV__` variable
- Now works in SDK 52

---

## 🚀 How to Fix

### Step 1: Reload App
In the terminal where Metro is running, press **'r'** to reload

### Step 2: If Still Broken
```bash
# Stop the server (Ctrl+C)
# Clear cache and restart
npx expo start -c --offline
```

### Step 3: If Still Not Working
```bash
# Reinstall dependencies
cd mobile
Remove-Item -Recurse -Force node_modules
npm install
npm start -- --offline
```

---

## 🐛 Common Causes

1. **expo-constants not installed** - Fixed by removing dependency
2. **__DEV__ undefined** - Fixed with fallback
3. **Cache issues** - Fixed by clearing cache
4. **SDK mismatch** - Already fixed (SDK 52)

---

## ✅ What Should Work Now

After reloading (press 'r'), you should see:
- ✅ Welcome screen loads
- ✅ No runtime errors
- ✅ App is functional

---

## 📱 Test Steps

1. Press 'r' in terminal to reload
2. Wait for app to reload in Expo Go
3. Should see Welcome screen
4. Tap "Get Started" to test

---

## 🆘 If Still Broken

Check the error message in Expo Go:
- Red screen with error details
- Take a screenshot or note the error
- Share the error message

Common errors:
- "Cannot find module" → Run `npm install`
- "Network error" → Check backend is running
- "Syntax error" → Check for typos in code

---

## 💡 Quick Fix Commands

```bash
# Reload app
Press 'r' in terminal

# Clear cache
npx expo start -c

# Restart everything
Ctrl+C
npm start -- --offline
```

---

## ✅ Success Checklist

- [ ] Pressed 'r' to reload
- [ ] App reloaded in Expo Go
- [ ] Welcome screen appears
- [ ] No red error screen
- [ ] Can tap buttons

If all checked, the app is working! 🎉
