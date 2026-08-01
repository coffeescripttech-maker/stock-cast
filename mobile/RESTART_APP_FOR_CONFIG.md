# Restart Mobile App to Apply Config Changes

## Problem
The app is still calling production URL even though config.ts has been updated to use local backend.

## Root Cause
React Native Metro bundler has cached the old configuration.

## Solution - Complete Restart Process

### Step 1: Stop Everything
1. In your terminal running the mobile app, press `Ctrl+C` to stop Metro bundler
2. Close the Expo Go app on your phone completely (swipe it away from recent apps)

### Step 2: Clear Metro Cache
```powershell
cd MOBILE_APP/mobile
npm start -- --clear
```

OR use the longer form:
```powershell
cd MOBILE_APP/mobile
npx expo start --clear
```

### Step 3: Verify Backend is Running
Make sure your backend is running on the local IP:
```powershell
# In a separate terminal
cd MOBILE_APP/backend
npm run dev
```

Backend should be accessible at: `http://192.168.43.25:3001`

### Step 4: Reconnect Mobile App
1. Wait for Metro bundler to fully start
2. Open Expo Go on your phone
3. Scan the QR code again
4. Wait for the app to fully reload

### Step 5: Verify the Fix
Check the logs - you should now see:
```
API Request: GET http://192.168.43.25:3001/api/v1/evacuation-centers/nearby?...
```

Instead of:
```
API Request: GET https://capstone-safe-haven.onrender.com/api/v1/evacuation-centers/nearby?...
```

## Current Configuration
- **Local Backend**: `http://192.168.43.25:3001/api/v1`
- **Config File**: `MOBILE_APP/mobile/src/constants/config.ts`
- **Env File**: `MOBILE_APP/mobile/.env`

## What to Test After Restart
1. Navigate to Evacuation Centers
2. Click on a center
3. You should see the "Reserve Slot" button become clickable
4. The status badge should show availability (Green/Yellow/Red/Gray)
5. Click "Reserve Slot" to test the reservation flow

## If Still Not Working
If you still see production URLs in the logs after clearing cache:

1. **Hard reset**:
   ```powershell
   cd MOBILE_APP/mobile
   rm -rf node_modules/.cache
   npm start -- --clear
   ```

2. **Check your phone's network**: Make sure your phone is on the same WiFi network as your computer (192.168.43.x)

3. **Test backend directly**: Open browser on your phone and go to:
   ```
   http://192.168.43.25:3001/api/v1/evacuation-centers
   ```
   You should see JSON data, not an error.
