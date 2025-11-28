# Live NSWF Radar v4.1 - Changelog

## What's New in v4.1

### 🐛 Bug Fixes

#### 1. Map Controls Repositioned ✅
**Problem:** Map controls (layer, measure, waypoint, trail buttons) were overlapping with zoom in/out buttons, especially on mobile devices.

**Solution:**
- Moved map controls from top-left to **bottom-left**
- Now positioned at `bottom: 80px` to avoid conflicts
- Mobile optimized at `bottom: 70px`
- No more overlap with Leaflet's default zoom controls

**Visual Improvement:**
- Cleaner interface
- Better accessibility on phones
- All controls easily reachable

---

#### 2. Fullscreen Mode Added ✅
**Problem:** No way to maximize map view for better visibility.

**Solution:**
- Added fullscreen button in **bottom-right corner**
- Click to expand map to full viewport
- Click again to return to normal view
- Icon changes to indicate state (expand/collapse)

**Features:**
- Map resizes automatically
- All controls remain accessible
- Smooth transition animation
- Works on mobile and desktop

**Usage:**
- Click fullscreen button (⛶ icon)
- Map expands to fill entire screen
- Click again to exit fullscreen

---

#### 3. Session Persistence Implemented ✅
**Problem:** If browser refreshes or closes accidentally, location sharing stops and user has to start over.

**Solution:**
- Implemented **localStorage session management**
- Saves user state every 30 seconds
- Auto-resumes sharing on page reload
- Works like Grab's live location feature

**What's Saved:**
- User name
- User type (Base/User)
- Sharing status
- User ID

**Behavior:**
- **Refresh page** → Automatically resumes sharing
- **Close tab** → Reopens with same session
- **Browser crash** → Recovers on restart
- **Click "Stop Sharing"** → Clears session (won't auto-resume)

**Technical Details:**
- Uses `localStorage` API
- Session key: `nswfRadarSession`
- Auto-loads on page load
- Updates every 30 seconds while active
- Cleared when user manually stops sharing

---

#### 4. Auto-Centering Fixed ✅
**Problem:** Map kept auto-centering on user's location on every GPS update, making it impossible to navigate freely or view other areas.

**Solution:**
- **Auto-center only on first position**
- After initial center, map stays where user pans it
- Added `autoCenter` flag in state
- Resets when stopping/starting new session

**Before (v4.0):**
```javascript
// Centered on EVERY update
if (!state.lastPosition || state.users.size === 1) {
    map.setView([latitude, longitude], 15);
}
```

**After (v4.1):**
```javascript
// Centers ONLY on first position
if (!state.lastPosition && state.autoCenter) {
    map.setView([latitude, longitude], 15);
    state.autoCenter = false; // Disable after first center
}
```

**User Experience:**
- Start sharing → Map centers on your location
- Pan/zoom to view other areas → Map stays there
- GPS updates continue → Map doesn't jump back
- Stop and restart → Auto-center re-enabled

---

## Technical Changes

### Files Modified

**styles.css:**
- Moved `.map-controls` from `top: 16px` to `bottom: 80px`
- Added `.fullscreen-btn` styles
- Added `.map-container.fullscreen` styles
- Updated mobile responsive styles

**index.html:**
- Added fullscreen button with SVG icon
- Positioned in bottom-right corner

**app.js:**
- Added `loadSession()` function
- Added `saveSession()` function
- Added `clearSession()` function
- Added `autoCenter` flag to state
- Modified auto-center logic in `updatePosition()`
- Added fullscreen toggle event listener
- Added session save on sharing start
- Added session clear on sharing stop
- Added periodic session updates (30s interval)
- Updated version log to v4.1

### New Functions

```javascript
loadSession()      // Loads saved session from localStorage
saveSession()      // Saves current session to localStorage
clearSession()     // Clears session from localStorage
```

### State Changes

```javascript
state.savedName      // Stores saved user name
state.savedType      // Stores saved user type
state.autoCenter     // Controls auto-centering behavior
```

---

## Upgrade Instructions

### From v4.0 to v4.1

1. **Backup v4.0** (optional):
   ```bash
   git tag v4.0
   git push origin v4.0
   ```

2. **Replace files**:
   - `index.html` (fullscreen button added)
   - `styles.css` (controls repositioned, fullscreen styles)
   - `app.js` (session persistence, auto-center fix)

3. **Keep unchanged**:
   - `firebase-config.js` (no changes)
   - `manifest.json` (no changes)
   - `service-worker.js` (no changes)
   - All icon files (no changes)

4. **Upload to GitHub**:
   ```bash
   git add .
   git commit -m "feat: Update to v4.1 - Fix controls, add fullscreen, session persistence"
   git push origin main
   ```

5. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or clear cache in browser settings

6. **Test new features**:
   - Check map controls are in bottom-left
   - Test fullscreen button
   - Refresh page while sharing (should resume)
   - Pan map (should not auto-center)

---

## User Impact

### Positive Changes

✅ **Better Mobile Experience**
- No more overlapping controls
- Easier to zoom and navigate
- Fullscreen mode for better visibility

✅ **Improved Reliability**
- Accidental refresh doesn't stop tracking
- Browser crash recovery
- Session persistence like professional apps

✅ **Better Navigation**
- Can view other users without map jumping
- Pan and zoom freely
- Only centers on initial location

### No Breaking Changes

✅ All v4.0 features still work
✅ Firebase integration unchanged
✅ User data compatible
✅ No re-configuration needed

---

## Testing Checklist

### Map Controls
- [ ] Controls visible in bottom-left
- [ ] No overlap with zoom buttons
- [ ] All 4 buttons functional (layer, measure, waypoint, trail)
- [ ] Mobile: Controls at bottom-left

### Fullscreen
- [ ] Fullscreen button visible in bottom-right
- [ ] Click expands map to full screen
- [ ] Click again exits fullscreen
- [ ] Icon changes correctly
- [ ] Map resizes properly

### Session Persistence
- [ ] Start sharing → Refresh page → Still sharing
- [ ] Close tab → Reopen → Resumes session
- [ ] Stop sharing → Refresh → Doesn't auto-start
- [ ] Name and type remembered

### Auto-Centering
- [ ] Start sharing → Map centers on location
- [ ] Pan to different area → Map stays there
- [ ] GPS updates → Map doesn't jump
- [ ] Stop and restart → Auto-centers again

---

## Known Issues

### None Reported

All reported issues from v4.0 have been fixed in v4.1.

---

## Future Improvements (v4.2?)

Potential features for next version:
- Manual re-center button (in case user wants to center back)
- Session timeout (auto-stop after X hours)
- Multiple saved sessions (switch between profiles)
- Session sharing (QR code to join same session)

---

## Support

### If Controls Still Overlap
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Check you're using v4.1 (console log should say "v4.1")

### If Session Doesn't Persist
1. Check browser allows localStorage
2. Not in incognito/private mode
3. Check browser console for errors
4. Try different browser

### If Map Still Auto-Centers
1. Verify using v4.1 files
2. Check console for "v4.1 initialized"
3. Clear browser cache
4. Hard refresh page

---

## Version Comparison

| Feature | v4.0 | v4.1 |
|---------|------|------|
| Map Controls Position | Top-left | Bottom-left ✅ |
| Fullscreen Mode | ❌ | ✅ |
| Session Persistence | ❌ | ✅ |
| Auto-Center Behavior | Every update | First time only ✅ |
| Control Overlap | Yes (issue) | No ✅ |
| Free Navigation | Limited | Full ✅ |
| Crash Recovery | ❌ | ✅ |

---

## Credits

**Reported Issues:**
- Control overlap on mobile
- Need for fullscreen mode
- Session persistence request
- Auto-centering problem

**Developed:** November 2024
**Version:** 4.1
**Status:** Production Ready

---

**Live NSWF Radar v4.1** - Enhanced Tactical GPS Tracking Platform
