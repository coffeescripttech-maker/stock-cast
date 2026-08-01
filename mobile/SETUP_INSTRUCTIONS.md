# SafeHaven Mobile App - Setup Instructions

## 📱 What We've Built

A complete React Native mobile app foundation with:
- ✅ Authentication (Login, Register, Welcome screens)
- ✅ API services (Auth, Alerts, Centers, Contacts)
- ✅ State management (Auth, Alerts, Location contexts)
- ✅ Common UI components (Button, Input, Card, Loading)
- ✅ Navigation structure (Auth & Main navigators)
- ✅ TypeScript types and utilities
- ✅ Philippine-inspired design system

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Start the Development Server

```bash
npm start
```

This will open Expo DevTools in your browser.

### 3. Run on Device/Emulator

**Android Emulator:**
```bash
npm run android
```

**iOS Simulator (Mac only):**
```bash
npm run ios
```

**Physical Device:**
1. Install "Expo Go" app from Play Store/App Store
2. Scan the QR code from Expo DevTools

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- For Android: Android Studio with emulator
- For iOS: Xcode (Mac only)
- Expo CLI (installed automatically with dependencies)

## 🔧 Configuration

### API Configuration

The app is configured to connect to your backend:

**File:** `src/constants/config.ts`

```typescript
BASE_URL: 'http://10.0.2.2:3000/api/v1'  // Android emulator
// Change to 'http://localhost:3000/api/v1' for iOS
// Change to 'http://YOUR_IP:3000/api/v1' for physical device
```

### Backend Requirements

Make sure your backend is running:

```bash
cd backend
npm run dev
```

Backend should be accessible at `http://localhost:3000`

## 📱 Current Features

### ✅ Implemented

1. **Authentication Flow**
   - Welcome screen with app intro
   - Login with email/password
   - Registration with validation
   - Auto-login on app restart
   - Token refresh handling

2. **API Integration**
   - Axios instance with interceptors
   - Automatic token injection
   - Token refresh on 401
   - Error handling
   - Services for all endpoints

3. **State Management**
   - AuthContext (user, login, register, logout)
   - AlertContext (fetch, search, cache)
   - LocationContext (GPS, permissions)

4. **UI Components**
   - Button (primary, secondary, outline, danger)
   - Input (with validation, icons)
   - Card (with elevation)
   - Loading (spinner with message)

5. **Navigation**
   - Auth stack (Welcome → Login → Register)
   - Main tabs (Home, Alerts, Centers, Contacts, Profile)
   - Auto-switch based on auth state

### 🔄 Placeholder Screens

These screens show "Coming soon..." and need implementation:
- Home Screen
- Alerts List Screen
- Centers Map Screen
- Contacts List Screen
- Profile Screen

## 🎯 Next Steps

### Phase 1: Core Screens (Priority)

1. **Home Screen** - Dashboard with:
   - Active alerts count
   - Nearest evacuation center
   - Quick action buttons
   - Recent notifications

2. **Alerts List Screen** - Show all alerts:
   - List of disaster alerts
   - Filter by type/severity
   - Pull to refresh
   - Tap to view details

3. **Alert Details Screen** - Single alert view:
   - Full alert information
   - Affected areas map
   - Share button
   - Directions to safety

4. **Centers Map Screen** - Interactive map:
   - Show all evacuation centers
   - User location marker
   - Tap marker for details
   - Get directions

5. **Contacts List Screen** - Emergency contacts:
   - Grouped by category
   - Call/SMS buttons
   - Search functionality

### Phase 2: Advanced Features

1. **Push Notifications**
   - Request permissions
   - Register FCM token
   - Handle incoming notifications
   - Notification history

2. **Offline Support**
   - Cache alerts locally
   - Cache centers locally
   - Sync when online
   - Offline indicator

3. **Profile Management**
   - View/edit profile
   - Update location
   - Settings screen
   - Logout

## 🧪 Testing

### Test Authentication

1. Start the app
2. Tap "Get Started"
3. Fill registration form
4. Should navigate to main app
5. Close and reopen app
6. Should stay logged in

### Test API Connection

1. Make sure backend is running
2. Try to register/login
3. Check console for API calls
4. Should see successful responses

### Common Issues

**Issue:** "Network Error"
- Check backend is running
- Check API URL in config.ts
- For Android emulator, use `10.0.2.2` not `localhost`
- For physical device, use your computer's IP

**Issue:** "Cannot find module"
- Run `npm install` again
- Clear cache: `expo start -c`

**Issue:** "Expo Go not connecting"
- Make sure phone and computer are on same WiFi
- Check firewall settings
- Try using tunnel mode: `expo start --tunnel`

## 📁 Project Structure

```
mobile/
├── App.tsx                          # Main entry point
├── src/
│   ├── components/
│   │   └── common/                  # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       └── Loading.tsx
│   ├── constants/                   # App constants
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── config.ts
│   ├── navigation/                  # Navigation setup
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── screens/
│   │   └── auth/                    # Auth screens
│   │       ├── WelcomeScreen.tsx
│   │       ├── LoginScreen.tsx
│   │       └── RegisterScreen.tsx
│   ├── services/                    # API services
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── alerts.ts
│   │   ├── centers.ts
│   │   └── contacts.ts
│   ├── store/                       # State management
│   │   ├── AuthContext.tsx
│   │   ├── AlertContext.tsx
│   │   └── LocationContext.tsx
│   ├── types/                       # TypeScript types
│   │   ├── models.ts
│   │   ├── api.ts
│   │   └── navigation.ts
│   └── utils/                       # Utility functions
│       ├── storage.ts
│       ├── location.ts
│       ├── formatting.ts
│       ├── notifications.ts
│       └── validation.ts
├── app.json                         # Expo configuration
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript config
```

## 🎨 Design System

### Colors (Philippine-inspired)
- Primary: #0038A8 (Blue from flag)
- Secondary: #CE1126 (Red from flag)
- Accent: #FCD116 (Yellow from flag)
- Success: #10B981
- Warning: #F59E0B
- Error: #EF4444

### Typography
- Sizes: xs (12), sm (14), md (16), lg (18), xl (20), xxl (24)
- Weights: regular (400), medium (500), semibold (600), bold (700)

### Spacing
- xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48

## 📝 Development Tips

1. **Hot Reload**: Changes auto-reload in Expo
2. **Console Logs**: View in terminal or Expo DevTools
3. **Debugging**: Shake device → "Debug Remote JS"
4. **TypeScript**: Use types for better autocomplete
5. **State**: Use contexts for global state
6. **API**: All API calls go through services

## 🚀 Ready to Continue?

The foundation is complete! You can now:

1. **Test the auth flow** - Register and login
2. **Build core screens** - Alerts, Centers, Contacts
3. **Add push notifications** - FCM integration
4. **Implement offline mode** - Cache data locally
5. **Polish UI** - Animations, loading states

Need help with any of these? Just ask! 🎉
