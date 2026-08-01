# 🚀 SafeHaven Mobile App - Quick Start Guide

## ✅ What's Ready

A complete React Native mobile app with:
- ✅ Authentication (Login, Register)
- ✅ Home Dashboard
- ✅ Disaster Alerts List
- ✅ Evacuation Centers List
- ✅ Emergency Contacts List
- ✅ User Profile

---

## 🏃 Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
cd mobile
npm install
```

### Step 2: Start Backend

Make sure your backend is running:

```bash
cd backend
npm run dev
```

Backend should be at: `http://localhost:3000`

### Step 3: Start Mobile App

```bash
cd mobile
npm start
```

Then press:
- `a` for Android emulator
- `i` for iOS simulator
- Scan QR code with Expo Go app on physical device

---

## 📱 Test the App

### 1. Register Account
- Tap "Get Started"
- Fill in registration form
- Tap "Create Account"

### 2. Explore Features
- **Home**: See dashboard with stats
- **Alerts**: View disaster alerts, filter by type/severity
- **Centers**: Find evacuation centers near you
- **Contacts**: View emergency contacts, call/SMS
- **Profile**: View your profile, logout

---

## 🔧 Configuration

### API URL (if needed)

Edit `mobile/src/constants/config.ts`:

```typescript
BASE_URL: 'http://10.0.2.2:3000/api/v1'  // Android emulator
// or
BASE_URL: 'http://localhost:3000/api/v1'  // iOS simulator
// or
BASE_URL: 'http://YOUR_IP:3000/api/v1'  // Physical device
```

---

## 🐛 Troubleshooting

### "Network Error"
- Check backend is running
- Check API URL in config.ts
- For Android emulator, use `10.0.2.2` not `localhost`

### "Cannot find module"
- Run `npm install` again
- Clear cache: `expo start -c`

### "Expo Go not connecting"
- Ensure phone and computer on same WiFi
- Try tunnel mode: `expo start --tunnel`

---

## 📋 Features Checklist

### ✅ Working Now:
- [x] User registration
- [x] User login
- [x] Auto-login on restart
- [x] View disaster alerts
- [x] Filter alerts by type/severity
- [x] View evacuation centers
- [x] Find nearest centers
- [x] Call evacuation centers
- [x] Get directions
- [x] View emergency contacts
- [x] Call/SMS contacts
- [x] View profile
- [x] Logout

### ⏳ Coming Soon:
- [ ] Push notifications
- [ ] Interactive maps
- [ ] Offline mode
- [ ] Edit profile
- [ ] Settings

---

## 🎯 Next Steps

1. **Test the app** - Try all features
2. **Add push notifications** - FCM integration
3. **Add maps** - React Native Maps
4. **Add offline mode** - Cache data locally
5. **Polish UI** - Animations, loading states

---

## 📚 Documentation

- `SETUP_INSTRUCTIONS.md` - Detailed setup guide
- `MOBILE_APP_COMPLETE.md` - Complete feature list
- `MOBILE_APP_PROGRESS.md` - Development progress

---

## 🎉 You're Ready!

The app is fully functional and ready to test. Enjoy! 🚀
