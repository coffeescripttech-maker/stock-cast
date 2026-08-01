# 🚀 How to Start SafeHaven Mobile App

## ✅ Quick Start (3 Steps)

### Step 1: Start Backend
```bash
cd backend
npm run dev
```
Backend should be running on `http://localhost:3000`

### Step 2: Start Mobile App
```bash
cd mobile
npx expo start
```

### Step 3: Open on Device
- **Android Emulator:** Press `a`
- **iOS Simulator:** Press `i`
- **Physical Device:** Scan QR code with Expo Go app

---

## 📱 What You'll See

```
› Metro waiting on exp://192.168.8.116:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS
› Press w │ open web
```

---

## 🎯 Testing the App

### 1. Register Account
- Tap "Get Started"
- Fill in registration form
- Tap "Create Account"

### 2. Explore Features
- **Home:** Dashboard with stats and quick actions
- **Alerts:** View disaster alerts, filter by type/severity
- **Centers:** Find evacuation centers near you
- **Contacts:** Emergency contacts with call/SMS
- **Profile:** View profile and logout

### 3. Test Notifications
- Home screen shows "Enable Notifications" card
- Tap card to grant permission
- FCM token will be registered with backend

---

## 🔧 If You Get Network Error

**Error:**
```
FetchError: request to https://api.expo.dev failed
```

**Solution:** Use offline mode (already in command above)
```bash
npm start -- --offline
```

This is normal and works perfectly! ✅

---

## 📊 App Status

### ✅ Working Features:
- Authentication (Login, Register)
- Home Dashboard
- Disaster Alerts List
- Evacuation Centers List
- Emergency Contacts List
- User Profile
- Push Notifications Setup

### 🎯 Ready to Test:
- All screens functional
- API integration complete
- State management working
- Navigation working
- Notifications ready (needs real device)

---

## 🆘 Troubleshooting

### Backend Not Running?
```bash
cd backend
npm run dev
```

### App Not Loading?
```bash
# Clear cache and restart
npx expo start -c --offline
```

### Can't Connect to Backend?
Check `mobile/src/constants/config.ts`:
- Android emulator: `http://10.0.2.2:3000/api/v1`
- iOS simulator: `http://localhost:3000/api/v1`
- Physical device: `http://YOUR_IP:3000/api/v1`

---

## 📝 Commands Reference

```bash
# Start app
npm start -- --offline

# Clear cache
npx expo start -c

# Run on Android
npm run android

# Run on iOS
npm run ios

# Stop app
Ctrl+C
```

---

## 🎉 You're Ready!

The app is now running and ready to test. Enjoy exploring SafeHaven! 🚀

For detailed troubleshooting, see `TROUBLESHOOTING.md`
