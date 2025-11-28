# Updating from v3 to v4

This guide explains how to update your Live NSWF Radar from v3 to v4.

---

## 🎯 What's New in v4

### Major Features Added

**Visual Enhancements:**
- ✅ Dark mode toggle with theme persistence
- ✅ Glowing/pulsing marker animations
- ✅ Direction arrows on markers (shows heading)
- ✅ Trail history (10-minute dotted path)
- ✅ School icon branding throughout

**Functional Indicators:**
- ✅ Speed indicator (stationary/moving)
- ✅ Altitude display
- ✅ Battery level (if supported)
- ✅ MGRS coordinate format
- ✅ Enhanced GPS accuracy display

**Tactical Tools:**
- ✅ Waypoint system (drop pins for objectives)
- ✅ Measurement tool (multi-point distance)
- ✅ Satellite view toggle
- ✅ Map layer switching (street/satellite/hybrid)

**Alerts & Communication:**
- ✅ Check-in system (OK / Need Help / Emergency)
- ✅ Emergency alerts (popup, sound, vibration)
- ✅ Proximity alerts (distance from Base)
- ✅ Visual status badges

**Technical Improvements:**
- ✅ Wake lock (keeps screen on)
- ✅ Better marker icons (star for Base, circle for Users)
- ✅ Improved UI/UX
- ✅ Better mobile responsiveness
- ✅ Enhanced Firebase integration

---

## 📦 Files Changed

### New Files
- `styles.css` - Separated CSS (was inline in v3)
- `favicon.png` - 64x64 favicon
- `favicon-32.png` - 32x32 favicon
- `schoolicon.png` - Original school icon
- `UPDATE_FROM_V3.md` - This file

### Modified Files
- `index.html` - Complete UI overhaul
- `app.js` - Massive feature additions
- `manifest.json` - Updated branding
- `icon-192.png` - New school icon
- `icon-512.png` - New school icon
- `README.md` - Updated documentation

### Unchanged Files
- `firebase-config.js` - Same configuration
- `service-worker.js` - Same PWA support

---

## 🔄 Update Methods

### Method 1: GitHub Website (Easy)

**Step 1: Backup v3 (Optional)**
1. Go to your repository
2. Click branch dropdown → Create branch "v3-backup"
3. Switch back to "main" branch

**Step 2: Delete Old Files**

Delete these files:
- `index.html`
- `app.js`
- `manifest.json`
- `icon-192.png`
- `icon-512.png`
- `README.md`

**Step 3: Upload v4 Files**

1. Click "Add file" → "Upload files"
2. Upload ALL files from v4 folder:
   - `index.html`
   - `app.js`
   - `styles.css` ⭐ NEW
   - `firebase-config.js` (keep your existing one)
   - `manifest.json`
   - `service-worker.js`
   - `icon-192.png`
   - `icon-512.png`
   - `favicon.png` ⭐ NEW
   - `favicon-32.png` ⭐ NEW
   - `schoolicon.png` ⭐ NEW
   - `README.md`
   - `UPDATE_FROM_V3.md` ⭐ NEW

3. Commit message: `feat: Upgrade to v4 - Full tactical platform`
4. Click "Commit changes"

**Step 4: Verify**

1. Wait 1-2 minutes for GitHub Pages
2. Open your URL
3. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. Should see v4 badge in header

### Method 2: Git Command Line (Advanced)

```bash
# Navigate to repository
cd /path/to/your/repo

# Backup v3 (optional)
git checkout -b v3-backup
git push origin v3-backup
git checkout main

# Remove old files
rm index.html app.js manifest.json icon-*.png README.md

# Copy v4 files
cp /path/to/v4/* .

# Keep your firebase-config.js
# (Don't overwrite with template)

# Commit and push
git add .
git commit -m "feat: Upgrade to v4 - Full tactical platform"
git push origin main
```

---

## ⚙️ Configuration Changes

### Firebase Config

**No changes needed!** Your existing `firebase-config.js` works with v4.

If you want to use the v4 template:
1. Open your current `firebase-config.js`
2. Copy your credentials
3. Paste into v4 `firebase-config.js`

### Base Password

**Default:** `NSWTDC!!!` (same as v3)

To change:
1. Open `app.js`
2. Find: `const BASE_PASSWORD = "NSWTDC!!!";`
3. Change to your password
4. Save and commit

### Trail Duration

**Default:** 10 minutes (changed from 30 in v3)

To change:
1. Open `app.js`
2. Find: `const TRAIL_DURATION = 10 * 60 * 1000;`
3. Change `10` to desired minutes
4. Save and commit

---

## 🧪 Testing v4 Features

### Test Dark Mode
1. Click moon icon in header
2. Theme should switch to dark
3. Reload page - preference should persist

### Test Satellite View
1. Click layer button (🗺️)
2. Map should switch to satellite imagery
3. Click again to return to street view

### Test Check-in System
1. Start sharing location
2. Check-in panel appears in sidebar
3. Click "OK", "Need Help", or "Emergency"
4. Status should update on your user card

### Test Emergency Alert
1. Have two devices/browsers open
2. Both start sharing
3. One clicks "Emergency" button
4. Other device should show red alert popup
5. Should hear sound and feel vibration

### Test Waypoints
1. Click waypoint button (📍)
2. Click on map
3. Enter waypoint name
4. Waypoint should appear for all users

### Test Measurement
1. Click measurement button (📏)
2. Click multiple points on map
3. Distance should display in bottom-right
4. Click "×" to clear

### Test Distance Calculation
1. Have two users sharing location
2. Click on another user's marker
3. Distance panel should appear in top-right
4. Should show route-based distance

### Test Trail History
1. Start sharing location
2. Move around (or simulate by changing location)
3. Dotted line should appear showing last 10 minutes
4. Click trail button to toggle on/off

---

## 🐛 Common Issues

### v4 Badge Not Showing

**Problem:** Still shows v2 or v3

**Solution:**
1. Hard refresh: Ctrl+Shift+R
2. Clear browser cache
3. Check GitHub that new files uploaded
4. Wait 2-3 minutes for deployment

### Styles Look Broken

**Problem:** CSS not loading

**Solution:**
1. Verify `styles.css` uploaded to GitHub
2. Check browser console (F12) for 404 errors
3. Hard refresh page
4. Clear service worker cache

### Features Not Working

**Problem:** New features (waypoints, measurement, etc.) not working

**Solution:**
1. Verify `app.js` uploaded correctly
2. Check browser console for JavaScript errors
3. Ensure using latest `index.html`
4. Clear browser cache completely

### Firebase Not Connecting

**Problem:** Shows "offline mode"

**Solution:**
1. Check `firebase-config.js` has your credentials
2. Verify Firebase Realtime Database enabled
3. Check Firebase security rules
4. Look at browser console for errors

### Icons Not Showing

**Problem:** School icon not displaying

**Solution:**
1. Verify all icon files uploaded:
   - `icon-192.png`
   - `icon-512.png`
   - `favicon.png`
   - `favicon-32.png`
   - `schoolicon.png`
2. Hard refresh page
3. Check browser console for 404 errors

---

## 🔙 Rollback to v3

If you need to go back to v3:

### If You Created Backup Branch

```bash
git checkout v3-backup
git checkout -b main-new
git branch -D main
git branch -m main
git push origin main --force
```

### If No Backup

1. Go to GitHub repository
2. Click "Commits"
3. Find last v3 commit
4. Click "< >" (Browse files at this point)
5. Download files
6. Upload back to main branch

---

## 📊 Performance Comparison

| Feature | v3 | v4 |
|---------|----|----|
| User Types | ✅ | ✅ |
| Firebase Sync | ✅ | ✅ |
| Distance Calc | ✅ | ✅ Enhanced |
| Dark Mode | ❌ | ✅ |
| Satellite View | ❌ | ✅ |
| Trail History | ❌ | ✅ |
| Speed Indicator | ❌ | ✅ |
| Altitude | ❌ | ✅ |
| Battery Level | ❌ | ✅ |
| Waypoints | ❌ | ✅ |
| Measurement | ❌ | ✅ |
| Check-in System | ❌ | ✅ |
| Emergency Alerts | ❌ | ✅ |
| MGRS Coords | ❌ | ✅ |
| Direction Arrows | ❌ | ✅ |
| Glowing Markers | ❌ | ✅ |

---

## 📱 Notify Your Team

After updating, send this message to your users:

```
📍 NSWF Radar Updated to v4!

Major new features:
✅ Dark mode toggle
✅ Satellite view
✅ Trail history (see where people have been)
✅ Speed, altitude, battery indicators
✅ Waypoint markers for objectives
✅ Distance measurement tool
✅ Check-in system (OK/Need Help/Emergency)
✅ Emergency alerts (sound + vibration)
✅ Direction arrows on markers

Same URL: https://yourusername.github.io/repo-name/

IMPORTANT:
- Clear your browser cache on first visit
- Re-install PWA if you had it installed
- Base password unchanged: NSWTDC!!!

For regular users: Everything works the same, just more features!
For Base: New monitoring capabilities available
```

---

## 🎓 Training Recommendations

### For Regular Users (5 minutes)

1. Show how to start sharing (same as v3)
2. Demonstrate check-in buttons (OK/Help/Emergency)
3. Show how to view other users
4. Explain emergency button (use carefully!)

### For Base Users (10 minutes)

1. Review all v3 features
2. Show waypoint system
3. Demonstrate measurement tool
4. Explain check-in status monitoring
5. Show how to respond to emergencies
6. Demonstrate dark mode and satellite view

### For Administrators (15 minutes)

1. Review all features
2. Explain Firebase data structure
3. Show how to customize settings
4. Demonstrate troubleshooting
5. Review security considerations

---

## 📞 Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review browser console (F12) for errors
3. Verify all files uploaded correctly
4. Test in different browser
5. Check Firebase Console for data

---

## ✅ Update Checklist

- [ ] Backup v3 (optional)
- [ ] Delete old files from repository
- [ ] Upload all v4 files
- [ ] Keep existing `firebase-config.js`
- [ ] Commit changes
- [ ] Wait for GitHub Pages deployment (1-2 min)
- [ ] Test URL in browser
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Verify v4 badge shows
- [ ] Test dark mode
- [ ] Test satellite view
- [ ] Test check-in system
- [ ] Test emergency alert (with 2 devices)
- [ ] Test waypoints
- [ ] Test measurement tool
- [ ] Test distance calculation
- [ ] Notify team of update
- [ ] Provide training if needed

---

**Congratulations! You're now running Live NSWF Radar v4!** 🎉

Enjoy the new tactical features!
