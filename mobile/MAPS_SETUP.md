# Maps Integration Setup Guide

## ✅ What's Been Added

### New Screens (3 screens)
1. **CentersMapScreen** - Interactive map showing all evacuation centers
2. **CenterDetailsScreen** - Detailed information about a specific center
3. **AlertDetailsScreen** - Detailed information about a disaster alert with affected area map

### Features
- 📍 Interactive map with center markers
- 🎨 Color-coded markers (green = available, orange = filling up, red = full)
- 📱 Tap markers to see center info
- 🗺️ View affected areas on alert details
- 🧭 Get directions to centers
- 📞 Call centers directly
- 🔄 Switch between map and list view
- 📍 Show user location on map
- 🎯 Center map on user location

---

## 🚀 How to Use

### For Development (Expo Go)

The maps will work in Expo Go, but you'll see a default map without custom styling.

**Just run:**
```bash
npm start
```

### For Production (Development Build)

To get full Google Maps features with custom styling:

#### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
4. Create credentials (API Key)
5. Restrict the key to your app's package name

#### 2. Add API Key to app.json

Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` in `app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        }
      }
    },
    "ios": {
      "config": {
        "googleMapsApiKey": "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
      }
    }
  }
}
```

#### 3. Build Development Build

```bash
# For Android
npx expo run:android

# For iOS (Mac only)
npx expo run:ios
```

---

## 📱 Screen Navigation

### Centers Tab
```
Centers Tab
├── CentersMap (default) ← Interactive map view
│   ├── Tap marker → Shows center card
│   ├── "View Details" → CenterDetails
│   └── List button → CentersList
├── CentersList ← List view
│   ├── Map button (header) → CentersMap
│   └── Tap card → CenterDetails
└── CenterDetails ← Full center info
    ├── Map preview
    ├── Call button
    └── Directions button
```

### Alerts Tab
```
Alerts Tab
├── AlertsList ← List of alerts
│   └── Tap alert → AlertDetails
└── AlertDetails ← Full alert info
    ├── Affected area map
    ├── Timeline
    └── Additional info
```

---

## 🎨 Map Features

### Center Markers
- **Green** 🟢 - Available (< 70% full)
- **Orange** 🟠 - Filling up (70-90% full)
- **Red** 🔴 - Full (> 90% full)

### User Location
- Blue dot shows your current location
- Blue circle shows 5km radius around you
- "My Location" button centers map on you

### Alert Maps
- Shows affected area as colored circle
- Circle color matches alert severity
- Circle size matches alert radius

---

## 🔧 Technical Details

### Dependencies Used
- `react-native-maps` - Map component
- `expo-location` - User location
- `@react-navigation/native-stack` - Stack navigation

### Map Provider
- Android: Google Maps
- iOS: Apple Maps (default) or Google Maps
- Expo Go: Default map tiles

### Performance
- Maps are lazy-loaded
- Markers are optimized for performance
- Location updates are throttled

---

## 🐛 Troubleshooting

### Map shows blank/gray screen
**Solution:** 
- In Expo Go: This is normal, maps work but without custom styling
- In development build: Check if Google Maps API key is correct

### Markers not showing
**Solution:**
- Check if centers have valid latitude/longitude
- Check console for errors
- Verify API is returning data

### "My Location" not working
**Solution:**
- Grant location permissions
- Check if location services are enabled
- Verify LocationContext is working

### Map is slow/laggy
**Solution:**
- Reduce number of markers (filter by distance)
- Use development build instead of Expo Go
- Check device performance

---

## 📝 Code Structure

### CentersMapScreen.tsx
- Main map view
- Marker rendering
- Location handling
- Center selection

### CenterDetailsScreen.tsx
- Full center information
- Static map preview
- Action buttons (call, directions)

### AlertDetailsScreen.tsx
- Alert information
- Affected area visualization
- Timeline display

---

## 🎯 Next Steps

### Enhancements You Can Add:

1. **Clustering** - Group nearby markers when zoomed out
2. **Custom Markers** - Use custom images for markers
3. **Route Drawing** - Show route from user to center
4. **Offline Maps** - Cache map tiles for offline use
5. **Heat Maps** - Show alert density on map
6. **Search** - Search for centers on map
7. **Filters** - Filter centers by facilities
8. **Directions** - In-app navigation

---

## 📚 Resources

- [React Native Maps Docs](https://github.com/react-native-maps/react-native-maps)
- [Expo Location Docs](https://docs.expo.dev/versions/latest/sdk/location/)
- [Google Maps Platform](https://developers.google.com/maps)

---

## ✅ Testing Checklist

- [ ] Map loads successfully
- [ ] Markers appear for all centers
- [ ] Tap marker shows center card
- [ ] "View Details" navigates correctly
- [ ] "My Location" button works
- [ ] Switch to list view works
- [ ] Alert details shows affected area
- [ ] Call button opens phone dialer
- [ ] Directions button opens maps app
- [ ] Map works without location permission
- [ ] Map works in Expo Go
- [ ] Map works in development build

---

**Maps integration complete! 🎉**

Your app now has:
- ✅ Interactive evacuation center map
- ✅ Alert affected area visualization
- ✅ Center details with map preview
- ✅ Navigation between map and list views
- ✅ User location tracking
- ✅ Color-coded markers
- ✅ Tap-to-view details

Test it out and enjoy the enhanced user experience!
