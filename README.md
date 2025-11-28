# Live NSWF Radar v4 🎯

**Tactical GPS Tracking and Coordination Platform**

A comprehensive real-time location tracking system designed for tactical operations, training coordination, and team management. Built as a Progressive Web App with advanced features for military and professional use.

---

## 🚀 Features Overview

### Core Features
- ✅ **Real-time GPS Tracking** - High-accuracy location sharing across multiple devices
- ✅ **Progressive Web App** - Install like a native app, works offline
- ✅ **Firebase Backend** - Real-time synchronization across all users
- ✅ **Two User Types** - Base (command/monitor) and User (field personnel)
- ✅ **School Icon Branding** - NSWTDC emblem throughout the app

### 🎨 Visual Enhancements
- ✅ **Dark Mode** - Toggle between light and dark themes
- ✅ **Glowing Markers** - Subtle pulsing effect on all user markers
- ✅ **Custom Marker Shapes** - Star for Base, circle for Users
- ✅ **Direction Arrows** - Shows which way users are facing
- ✅ **Trail History** - Dotted path showing last 10 minutes of movement
- ✅ **Accuracy Circles** - Visual representation of GPS precision

### 📊 Functional Indicators
- ✅ **Speed Indicator** - Real-time speed display (stationary/moving)
- ✅ **Altitude Display** - Elevation above sea level
- ✅ **Battery Level** - Device battery status (if supported)
- ✅ **GPS Accuracy** - Precision rating (Excellent/Good/Fair/Poor)
- ✅ **MGRS Coordinates** - Military Grid Reference System format

### 🎯 Tactical Tools
- ✅ **Waypoint Markers** - Drop pins for objectives, rally points
- ✅ **Measurement Tool** - Multi-point distance measurement
- ✅ **Satellite View** - Toggle between street and satellite imagery
- ✅ **Distance Calculation** - Route-based distance via roads
- ✅ **Map Layer Toggle** - Street, Satellite, Hybrid views

### 🔔 Alerts & Communication
- ✅ **Check-in System** - Three status levels (OK / Need Help / Emergency)
- ✅ **Emergency Alerts** - Red popup with sound and vibration
- ✅ **Proximity Alerts** - Warning when too far from Base
- ✅ **Visual Status Indicators** - Color-coded user status badges

---

## 📱 Installation

### Method 1: GitHub Pages (Recommended)

1. **Upload to GitHub:**
   - Create a new repository
   - Upload all v4 files
   - Enable GitHub Pages in repository settings

2. **Access the App:**
   - Open: `https://yourusername.github.io/repo-name/`
   - The app will load in your browser

3. **Install as PWA:**
   - On mobile: Tap "Install App" banner or browser menu → "Add to Home Screen"
   - On desktop: Click install icon in address bar

### Method 2: Local Server

1. **Using Python:**
   ```bash
   cd v4
   python3 -m http.server 8000
   ```
   Open: `http://localhost:8000`

2. **Using Node.js:**
   ```bash
   cd v4
   npx serve
   ```

---

## 🎮 How to Use

### As Regular User

1. **Open the app** in your browser
2. **User type** should be selected (default)
3. **Enter your name** in the input field
4. **Click "Start Sharing"**
5. **Allow location access** when prompted
6. Your location will appear on the map

### As Base (Command/Monitor)

1. **Open the app** in your browser
2. **Click "Base" button** (top right)
3. **Enter password:** `NSWTDC!!!`
4. **Click "Start Sharing"**
5. Your marker will appear as an orange star
6. You can see all users and monitor their status

### Using Features

#### Check-in Status
- **OK** - Everything normal (green)
- **Need Help** - Requires assistance (yellow)
- **Emergency** - Critical situation (red, alerts all users)

#### Waypoints
1. Click the waypoint button (📍)
2. Click on map where you want to place waypoint
3. Enter waypoint name
4. Waypoint appears for all users

#### Measurement Tool
1. Click the measurement button (📏)
2. Click multiple points on map
3. Total distance displays in bottom-right
4. Click "×" to clear measurement

#### Distance to User
- Click any user marker or user card in sidebar
- Distance panel shows in top-right
- Updates every 5 seconds

#### Dark Mode
- Click moon/sun icon in header
- Preference saved automatically

#### Satellite View
- Click layer button (🗺️)
- Toggles between street and satellite imagery

---

## 🔧 Configuration

### Firebase Setup

The app comes pre-configured with your Firebase credentials. If you need to change them:

1. Open `firebase-config.js`
2. Replace with your Firebase project credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     databaseURL: "https://YOUR_PROJECT.firebaseio.com",
     projectId: "YOUR_PROJECT",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### Base Password

To change the Base password:

1. Open `app.js`
2. Find line: `const BASE_PASSWORD = "NSWTDC!!!";`
3. Change to your desired password
4. Save and redeploy

### Trail Duration

To change trail history duration:

1. Open `app.js`
2. Find line: `const TRAIL_DURATION = 10 * 60 * 1000;`
3. Change `10` to desired minutes
4. Save and redeploy

### Proximity Alert Distance

To change proximity alert threshold:

1. Open `app.js`
2. Find line: `const PROXIMITY_ALERT_DISTANCE = 1000;`
3. Change `1000` to desired meters
4. Save and redeploy

---

## 📊 Technical Details

### Technologies Used
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Maps:** Leaflet.js with OpenStreetMap & ESRI tiles
- **Backend:** Firebase Realtime Database
- **Coordinates:** MGRS library for military grid format
- **Routing:** OSRM (Open Source Routing Machine)
- **PWA:** Service Worker for offline support

### Browser Compatibility
- ✅ Chrome/Chromium (Recommended)
- ✅ Brave
- ✅ Firefox
- ✅ Safari (iOS 11.3+)
- ✅ Edge

### Device Requirements
- **GPS:** Required for location tracking
- **Internet:** Required for real-time sync (offline mode available)
- **HTTPS:** Required for geolocation API (or localhost)
- **Screen:** Responsive design (mobile, tablet, desktop)

### Permissions Required
- **Location:** For GPS tracking
- **Notifications:** For emergency alerts (optional)
- **Wake Lock:** To keep screen on during tracking (optional)

---

## 🎯 Feature Details

### User Types

#### Base User
- **Marker:** Orange star (⭐)
- **Password:** `NSWTDC!!!`
- **Purpose:** Command, monitoring, coordination
- **Visibility:** All users can see Base location
- **Capabilities:** Same as regular users + monitoring

#### Regular User
- **Marker:** Colored circle with initials
- **Password:** None (just name)
- **Purpose:** Field personnel, team members
- **Visibility:** Can see all users including Base
- **Capabilities:** Full feature access

### GPS Accuracy Levels

| Accuracy | Range | Quality | Typical Source |
|----------|-------|---------|----------------|
| Excellent | 0-10m | ⭐⭐⭐⭐⭐ | GPS lock (outdoors) |
| Good | 10-50m | ⭐⭐⭐⭐ | GPS + WiFi |
| Fair | 50-100m | ⭐⭐⭐ | WiFi + Cell towers |
| Poor | 100m+ | ⭐⭐ | Cell towers only |

### Speed Indicator

- **Stationary:** < 1 km/h
- **Moving:** Displays speed in km/h
- **Updates:** Real-time from GPS

### Check-in Status

| Status | Color | Icon | Alerts |
|--------|-------|------|--------|
| OK | Green | ✓ | None |
| Need Help | Yellow | ? | None |
| Emergency | Red | ⚠️ | All users |

### Emergency Alert Behavior

When Emergency button is pressed:
1. ✅ Red modal appears for all users
2. ✅ Sound alarm plays (10 seconds)
3. ✅ Device vibrates (if supported)
4. ✅ Map zooms to emergency location
5. ✅ User marker highlighted in red
6. ✅ Alert auto-clears after 30 seconds

---

## 🔒 Security & Privacy

### Data Storage
- **Firebase:** User locations stored in real-time database
- **Automatic Cleanup:** Inactive users removed after 5 minutes
- **No History:** Locations not permanently stored
- **Session-based:** Data cleared when user stops sharing

### Password Security
- **Base Password:** Hardcoded in client (not secure for sensitive ops)
- **Recommendation:** Change password in code for your deployment
- **Note:** This is a client-side app, not suitable for classified operations

### Privacy Considerations
- ✅ Users must explicitly start sharing
- ✅ Location sharing can be stopped anytime
- ✅ No background tracking
- ✅ No permanent location history
- ⚠️ All users can see each other's locations
- ⚠️ Firebase data is not encrypted

---

## 📱 Mobile Usage Tips

### For Best GPS Accuracy
1. ✅ Use outdoors with clear sky view
2. ✅ Enable "High Accuracy" mode in phone settings
3. ✅ Disable battery saver mode
4. ✅ Keep app in foreground
5. ✅ Install as PWA for better performance

### Battery Optimization
- **Wake Lock:** Keeps screen on (drains battery faster)
- **Update Interval:** 1.5 seconds (can be increased to save battery)
- **Recommendation:** Keep phone plugged in for extended operations

### Data Usage
- **Minimal:** ~1-2 MB per hour per user
- **Firebase:** Free tier supports 100 simultaneous users
- **Maps:** Cached after first load
- **Offline Mode:** Works without internet (no real-time sync)

---

## 🐛 Troubleshooting

### Location Not Working

**Problem:** "Unable to get your location" error

**Solutions:**
1. Check browser permissions (Settings → Site Settings → Location)
2. Enable GPS in phone system settings
3. Ensure HTTPS connection (or localhost)
4. Try different browser
5. Go outdoors for better GPS signal

### Firebase Not Connecting

**Problem:** "Offline mode" message

**Solutions:**
1. Check `firebase-config.js` has correct credentials
2. Verify Firebase Realtime Database is enabled
3. Check Firebase security rules allow read/write
4. Check internet connection
5. Look at browser console for errors (F12)

### Users Not Appearing

**Problem:** Can't see other users on map

**Solutions:**
1. Verify both users are sharing location
2. Check Firebase connection status
3. Wait 5-10 seconds for sync
4. Refresh page (hard refresh: Ctrl+Shift+R)
5. Check if users timed out (5 min inactivity)

### Emergency Alert Not Working

**Problem:** Emergency button doesn't alert others

**Solutions:**
1. Verify Firebase is connected
2. Check other users are actively sharing
3. Ensure sound/notifications not blocked
4. Check browser console for errors

### Dark Mode Not Saving

**Problem:** Dark mode resets on reload

**Solutions:**
1. Check browser allows localStorage
2. Clear browser cache and try again
3. Check not in incognito/private mode

---

## 🚀 Deployment

### GitHub Pages (Free)

1. Create GitHub repository
2. Upload all v4 files
3. Settings → Pages → Source: main branch
4. Access: `https://username.github.io/repo-name/`

### Netlify (Free)

1. Drag & drop v4 folder to Netlify
2. Get instant HTTPS URL
3. Custom domain available

### Vercel (Free)

1. Import GitHub repository
2. Auto-deploy on push
3. Custom domain available

---

## 📝 Version History

### v4.0 (Current)
- ✅ Complete tactical platform
- ✅ All requested features implemented
- ✅ Dark mode
- ✅ Satellite view
- ✅ Trail history (10 min)
- ✅ Direction arrows
- ✅ Speed/altitude/battery indicators
- ✅ Waypoint system
- ✅ Measurement tool
- ✅ MGRS coordinates
- ✅ Check-in system
- ✅ Emergency alerts
- ✅ Proximity alerts
- ✅ School icon branding
- ✅ Glowing markers

### v3.0
- Firebase real-time sync
- User types (Base/User)
- Distance calculation
- Enhanced GPS accuracy

### v2.0
- PWA support
- Improved GPS settings
- Better mobile support

### v1.0
- Initial release
- Basic location sharing
- localStorage only

---

## 🤝 Support

For issues or questions:
1. Check Troubleshooting section above
2. Review browser console for errors (F12)
3. Verify Firebase configuration
4. Test in different browser

---

## 📄 License

This is a custom tactical tracking system built for NSWTDC.

---

## 🎖️ Credits

**Developed for:** Naval Special Warfare Training and Development Center (NSWTDC)

**Technologies:**
- Leaflet.js - Interactive maps
- Firebase - Real-time database
- OpenStreetMap - Map tiles
- ESRI - Satellite imagery
- OSRM - Routing engine
- MGRS - Coordinate conversion

---

**Live NSWF Radar v4** - Tactical GPS Tracking Platform
