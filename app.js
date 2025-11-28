// Live NSWF Radar v4 - Tactical GPS Tracking Platform
// Full-featured tactical coordination system

// Constants
const BASE_PASSWORD = "NSWTDC!!!";
const USER_TYPE_BASE = "base";
const USER_TYPE_USER = "user";
const TRAIL_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const PROXIMITY_ALERT_DISTANCE = 1000; // 1km in meters
const UPDATE_INTERVAL = 1500; // 1.5 seconds

// Initialize Firebase
let database = null;
let firebaseInitialized = false;

try {
    if (window.firebaseConfig) {
        firebase.initializeApp(window.firebaseConfig);
        database = firebase.database();
        firebaseInitialized = true;
        updateFirebaseStatus('connected', 'Connected to real-time server');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
    updateFirebaseStatus('error', 'Firebase setup error: ' + error.message);
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => console.log('ServiceWorker registered:', registration))
            .catch(error => console.log('ServiceWorker registration failed:', error));
    });
}

// PWA Install Prompt
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBanner.classList.add('show');
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);
        deferredPrompt = null;
        installBanner.classList.remove('show');
    }
});

window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    installBanner.classList.remove('show');
});

// Initialize map
const map = L.map('map').setView([14.5995, 120.9842], 13);

// Map layers
const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
});

const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri',
    maxZoom: 19
});

const hybridLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri',
    maxZoom: 19
});

// Default to street view
let currentLayer = 'street';
streetLayer.addTo(map);

// State management
const state = {
    users: new Map(),
    markers: new Map(),
    accuracyCircles: new Map(),
    trails: new Map(),
    waypoints: new Map(),
    myId: null,
    myType: USER_TYPE_USER,
    watchId: null,
    isSharing: false,
    currentAccuracy: null,
    selectedUserId: null,
    checkInStatus: null,
    isDarkMode: false,
    showTrails: true,
    measurementMode: false,
    waypointMode: false,
    measurementPoints: [],
    measurementLine: null,
    lastPosition: null,
    speed: 0,
    altitude: null,
    battery: null,
    heading: null,
    // Session persistence
    savedName: null,
    savedType: null,
    autoCenter: true, // Allow disabling auto-center
    // Navigation
    navigationRoute: null,
    navigationLine: null,
    navigationMode: false,
    showGridLines: false
};

// Load saved session from localStorage
function loadSession() {
    try {
        const savedSession = localStorage.getItem('nswfRadarSession');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            state.savedName = session.name;
            state.savedType = session.type;
            state.myId = session.id;
            
            // Restore UI state
            if (session.type === USER_TYPE_BASE) {
                baseTypeBtn.click();
            }
            userNameInput.value = session.name || '';
            
            // Auto-resume sharing if was active
            if (session.isSharing && session.name) {
                console.log('Resuming previous session...');
                setTimeout(() => {
                    shareBtn.click();
                }, 1000);
            }
        }
    } catch (error) {
        console.error('Error loading session:', error);
    }
}

// Save session to localStorage
function saveSession() {
    try {
        const session = {
            name: state.myType === USER_TYPE_BASE ? 'BASE' : userNameInput.value.trim(),
            type: state.myType,
            id: state.myId,
            isSharing: state.isSharing,
            timestamp: Date.now()
        };
        localStorage.setItem('nswfRadarSession', JSON.stringify(session));
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

// Clear session from localStorage
function clearSession() {
    try {
        localStorage.removeItem('nswfRadarSession');
    } catch (error) {
        console.error('Error clearing session:', error);
    }
}

// Color palette for user markers
const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];
const baseColor = '#f59e0b';
let colorIndex = 0;

// DOM elements
const userNameInput = document.getElementById('userName');
const basePasswordInput = document.getElementById('basePassword');
const baseTypeBtn = document.getElementById('baseTypeBtn');
const userTypeBtn = document.getElementById('userTypeBtn');
const shareBtn = document.getElementById('shareBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const userListEl = document.getElementById('userList');
const userCountEl = document.getElementById('userCount');
const userStatsPanel = document.getElementById('userStatsPanel');
const accuracyTextEl = document.getElementById('accuracyText');
const speedTextEl = document.getElementById('speedText');
const altitudeTextEl = document.getElementById('altitudeText');
const batteryTextEl = document.getElementById('batteryText');
const coordsTextEl = document.getElementById('coordsText');
const checkInPanel = document.getElementById('checkInPanel');
const checkInOkBtn = document.getElementById('checkInOk');
const checkInHelpBtn = document.getElementById('checkInHelp');
const checkInEmergencyBtn = document.getElementById('checkInEmergency');
const distanceDisplay = document.getElementById('distanceDisplay');
const distanceTitle = document.getElementById('distanceTitle');
const distanceValue = document.getElementById('distanceValue');
const distanceType = document.getElementById('distanceType');
const closeDistanceBtn = document.getElementById('closeDistance');
const navigateBtn = document.getElementById('navigateBtn');
const measurementDisplay = document.getElementById('measurementDisplay');
const measurementValue = document.getElementById('measurementValue');
const clearMeasurementBtn = document.getElementById('clearMeasurement');
const darkModeToggle = document.getElementById('darkModeToggle');
const layerToggle = document.getElementById('layerToggle');
const measureToggle = document.getElementById('measureToggle');
const waypointToggle = document.getElementById('waypointToggle');
const trailToggle = document.getElementById('trailToggle');
const gridToggle = document.getElementById('gridToggle');
const emergencyModal = document.getElementById('emergencyModal');
const emergencyUser = document.getElementById('emergencyUser');
const emergencyCoords = document.getElementById('emergencyCoords');
const emergencyTimestamp = document.getElementById('emergencyTimestamp');
const closeEmergencyBtn = document.getElementById('closeEmergency');
const permissionModal = document.getElementById('permissionModal');
const httpsModal = document.getElementById('httpsModal');
const closeModalBtn = document.getElementById('closeModal');
const closeHttpsModalBtn = document.getElementById('closeHttpsModal');

// Dark Mode Toggle
darkModeToggle.addEventListener('click', () => {
    state.isDarkMode = !state.isDarkMode;
    document.body.classList.toggle('dark-mode', state.isDarkMode);
    
    // Update icon
    const icon = document.getElementById('darkModeIcon');
    if (state.isDarkMode) {
        icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    } else {
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    }
});

// Layer Toggle
layerToggle.addEventListener('click', () => {
    if (currentLayer === 'street') {
        map.removeLayer(streetLayer);
        satelliteLayer.addTo(map);
        hybridLayer.addTo(map);
        currentLayer = 'satellite';
    } else {
        map.removeLayer(satelliteLayer);
        map.removeLayer(hybridLayer);
        streetLayer.addTo(map);
        currentLayer = 'street';
    }
});

// Measurement Toggle
measureToggle.addEventListener('click', () => {
    state.measurementMode = !state.measurementMode;
    measureToggle.classList.toggle('active', state.measurementMode);
    
    if (state.measurementMode) {
        measurementDisplay.style.display = 'block';
        measurementValue.textContent = 'Click on map to measure';
        map.getContainer().style.cursor = 'crosshair';
    } else {
        clearMeasurement();
    }
});

// Waypoint Toggle
waypointToggle.addEventListener('click', () => {
    state.waypointMode = !state.waypointMode;
    waypointToggle.classList.toggle('active', state.waypointMode);
    
    if (state.waypointMode) {
        map.getContainer().style.cursor = 'crosshair';
    } else {
        map.getContainer().style.cursor = '';
    }
});

// Trail Toggle
trailToggle.addEventListener('click', () => {
    state.showTrails = !state.showTrails;
    trailToggle.classList.toggle('active', state.showTrails);
    
    if (!state.showTrails) {
        // Hide all trails
        state.trails.forEach(trail => {
            trail.forEach(line => map.removeLayer(line));
        });
    }
});

// My Location Button
const myLocationBtn = document.getElementById('myLocationBtn');
myLocationBtn.addEventListener('click', () => {
    if (state.lastPosition && state.isSharing) {
        map.setView([state.lastPosition.lat, state.lastPosition.lng], 16);
        
        // Flash the button to indicate action
        myLocationBtn.style.background = 'var(--primary-color)';
        setTimeout(() => {
            myLocationBtn.style.background = '';
        }, 300);
    }
});

// Military Grid Overlay
let gridLayer = null;

function drawMilitaryGrid() {
    // Remove existing grid
    if (gridLayer) {
        map.removeLayer(gridLayer);
        gridLayer = null;
    }
    
    if (!state.showGridLines) return;
    
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    
    // Adjust grid spacing based on zoom level
    let gridSize;
    if (zoom >= 16) {
        gridSize = 0.001; // ~100m
    } else if (zoom >= 14) {
        gridSize = 0.01; // ~1km
    } else if (zoom >= 12) {
        gridSize = 0.05; // ~5km
    } else {
        gridSize = 0.1; // ~10km
    }
    
    const lines = [];
    const labels = [];
    
    // Calculate grid bounds
    const minLat = Math.floor(bounds.getSouth() / gridSize) * gridSize;
    const maxLat = Math.ceil(bounds.getNorth() / gridSize) * gridSize;
    const minLng = Math.floor(bounds.getWest() / gridSize) * gridSize;
    const maxLng = Math.ceil(bounds.getEast() / gridSize) * gridSize;
    
    // Draw vertical lines (longitude)
    for (let lng = minLng; lng <= maxLng; lng += gridSize) {
        lines.push([
            [minLat, lng],
            [maxLat, lng]
        ]);
        
        // Add label
        if (zoom >= 12) {
            const label = L.marker([minLat + gridSize * 0.5, lng], {
                icon: L.divIcon({
                    className: 'grid-label',
                    html: `<div style="color: #f59e0b; font-size: 10px; font-weight: bold; text-shadow: 0 0 3px black;">${lng.toFixed(3)}</div>`,
                    iconSize: [50, 20]
                })
            });
            labels.push(label);
        }
    }
    
    // Draw horizontal lines (latitude)
    for (let lat = minLat; lat <= maxLat; lat += gridSize) {
        lines.push([
            [lat, minLng],
            [lat, maxLng]
        ]);
        
        // Add label
        if (zoom >= 12) {
            const label = L.marker([lat, minLng + gridSize * 0.5], {
                icon: L.divIcon({
                    className: 'grid-label',
                    html: `<div style="color: #f59e0b; font-size: 10px; font-weight: bold; text-shadow: 0 0 3px black;">${lat.toFixed(3)}</div>`,
                    iconSize: [50, 20]
                })
            });
            labels.push(label);
        }
    }
    
    // Create layer group
    const gridLines = lines.map(line => 
        L.polyline(line, {
            color: '#f59e0b',
            weight: 1,
            opacity: 0.5,
            dashArray: '5, 5'
        })
    );
    
    gridLayer = L.layerGroup([...gridLines, ...labels]).addTo(map);
}

// Grid toggle button
gridToggle.addEventListener('click', () => {
    state.showGridLines = !state.showGridLines;
    gridToggle.classList.toggle('active', state.showGridLines);
    
    if (state.showGridLines) {
        drawMilitaryGrid();
    } else if (gridLayer) {
        map.removeLayer(gridLayer);
        gridLayer = null;
    }
});

// Redraw grid on map move/zoom
map.on('moveend', () => {
    if (state.showGridLines) {
        drawMilitaryGrid();
    }
});

map.on('zoomend', () => {
    if (state.showGridLines) {
        drawMilitaryGrid();
    }
});

// Map click handler for measurement and waypoints
map.on('click', (e) => {
    if (state.measurementMode) {
        addMeasurementPoint(e.latlng);
    } else if (state.waypointMode) {
        addWaypoint(e.latlng);
    }
});

// User type selection
baseTypeBtn.addEventListener('click', () => {
    state.myType = USER_TYPE_BASE;
    baseTypeBtn.classList.add('active');
    userTypeBtn.classList.remove('active');
    userNameInput.style.display = 'none';
    basePasswordInput.style.display = 'block';
    basePasswordInput.placeholder = 'Enter Base password';
});

userTypeBtn.addEventListener('click', () => {
    state.myType = USER_TYPE_USER;
    userTypeBtn.classList.add('active');
    baseTypeBtn.classList.remove('active');
    basePasswordInput.style.display = 'none';
    userNameInput.style.display = 'block';
});

// Check-in buttons
checkInOkBtn.addEventListener('click', () => updateCheckInStatus('ok'));
checkInHelpBtn.addEventListener('click', () => updateCheckInStatus('help'));
checkInEmergencyBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to send an EMERGENCY alert to all users?')) {
        updateCheckInStatus('emergency');
        triggerEmergency();
    }
});

// Close buttons
closeDistanceBtn.addEventListener('click', () => {
    distanceDisplay.style.display = 'none';
    state.selectedUserId = null;
    clearNavigationRoute();
});

// Navigate button
navigateBtn.addEventListener('click', async () => {
    if (!state.selectedUserId || !state.myId) return;
    
    const myData = state.users.get(state.myId);
    const targetData = state.users.get(state.selectedUserId);
    
    if (!myData || !targetData) return;
    
    // Get navigation route
    navigateBtn.textContent = 'Loading...';
    navigateBtn.disabled = true;
    
    const route = await getNavigationRoute(
        myData.lat, myData.lng,
        targetData.lat, targetData.lng
    );
    
    if (route) {
        state.navigationRoute = route;
        state.navigationMode = true;
        drawNavigationRoute(route);
        
        // Update button
        navigateBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
            Clear Route
        `;
        navigateBtn.onclick = () => {
            clearNavigationRoute();
            navigateBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
                Navigate
            `;
        };
    } else {
        alert('Could not calculate route. Please try again.');
    }
    
    navigateBtn.disabled = false;
});

clearMeasurementBtn.addEventListener('click', () => {
    clearMeasurement();
});

closeEmergencyBtn.addEventListener('click', () => {
    emergencyModal.classList.remove('show');
    stopEmergencySound();
});

closeModalBtn.addEventListener('click', () => {
    permissionModal.classList.remove('show');
});

closeHttpsModalBtn.addEventListener('click', () => {
    httpsModal.classList.remove('show');
});

// Update Firebase status UI
function updateFirebaseStatus(status, message) {
    const statusEl = document.getElementById('firebaseStatus');
    const textEl = document.getElementById('firebaseStatusText');
    
    statusEl.className = 'firebase-status ' + status;
    textEl.textContent = message;
    
    if (status === 'connected') {
        statusEl.innerHTML = '<strong>✅ Real-time sync enabled</strong><span id="firebaseStatusText">' + message + '</span>';
    } else if (status === 'error') {
        statusEl.innerHTML = '<strong>⚠️ Offline mode</strong><span id="firebaseStatusText">' + message + '</span>';
    }
}

// Check if geolocation is available and secure context
function checkGeolocationSupport() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return false;
    }

    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        httpsModal.classList.add('show');
        return false;
    }

    return true;
}

// Generate unique ID
function generateId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get persistent device ID
function getDeviceId() {
    // Check if we already have a device ID
    let deviceId = localStorage.getItem('nswfDeviceId');
    
    if (!deviceId) {
        // Generate new persistent ID
        deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('nswfDeviceId', deviceId);
    }
    
    return deviceId;
}

// Get user initials
function getInitials(name) {
    if (name === 'BASE') return 'B';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substr(0, 2);
}

// Format time ago
function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
}

// Format accuracy
function formatAccuracy(accuracy) {
    if (accuracy < 10) return `±${accuracy.toFixed(1)}m (Excellent)`;
    if (accuracy < 50) return `±${accuracy.toFixed(0)}m (Good)`;
    if (accuracy < 100) return `±${accuracy.toFixed(0)}m (Fair)`;
    return `±${accuracy.toFixed(0)}m (Poor)`;
}

// Format speed
function formatSpeed(speedMps) {
    if (speedMps === null || speedMps === undefined) return '--';
    const speedKmh = speedMps * 3.6;
    if (speedKmh < 1) return 'Stationary';
    return `${speedKmh.toFixed(1)} km/h`;
}

// Format altitude
function formatAltitude(altitude) {
    if (altitude === null || altitude === undefined) return '--';
    return `${altitude.toFixed(0)}m`;
}

// Format battery
function formatBattery(level, charging) {
    if (level === null || level === undefined) return '--';
    const percentage = Math.round(level * 100);
    const icon = charging ? '⚡' : '🔋';
    return `${icon} ${percentage}%`;
}

// Convert coordinates to MGRS
function toMGRS(lat, lng) {
    try {
        if (typeof mgrs !== 'undefined') {
            return mgrs.forward([lng, lat]);
        }
    } catch (error) {
        console.error('MGRS conversion error:', error);
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
}

// Format distance
function formatDistance(km) {
    if (km < 1) {
        return `${Math.round(km * 1000)} meters`;
    } else if (km < 10) {
        return `${km.toFixed(2)} km`;
    } else {
        return `${Math.round(km)} km`;
    }
}

// Get route distance using OSRM
async function getRouteDistance(lat1, lon1, lat2, lon2) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const distanceMeters = data.routes[0].distance;
            return distanceMeters / 1000; // Convert to km
        }
    } catch (error) {
        console.error('Route calculation error:', error);
    }
    
    // Fallback to straight-line distance
    return calculateDistance(lat1, lon1, lat2, lon2);
}

// Get full route with geometry
async function getNavigationRoute(lat1, lon1, lat2, lon2) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&steps=true`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            return data.routes[0];
        }
    } catch (error) {
        console.error('Navigation route error:', error);
    }
    return null;
}

// Draw navigation route on map
function drawNavigationRoute(route) {
    // Clear existing route
    if (state.navigationLine) {
        map.removeLayer(state.navigationLine);
        state.navigationLine = null;
    }
    
    if (!route || !route.geometry) return;
    
    // Convert GeoJSON coordinates to Leaflet format [lat, lng]
    const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
    
    // Draw route line
    state.navigationLine = L.polyline(coordinates, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.8,
        smoothFactor: 1
    }).addTo(map);
    
    // Fit map to route bounds
    map.fitBounds(state.navigationLine.getBounds(), { padding: [50, 50] });
}

// Clear navigation route
function clearNavigationRoute() {
    if (state.navigationLine) {
        map.removeLayer(state.navigationLine);
        state.navigationLine = null;
    }
    state.navigationRoute = null;
    state.navigationMode = false;
}

// Show distance to user
async function showDistanceToUser(userId) {
    const myData = state.users.get(state.myId);
    const targetData = state.users.get(userId);
    
    if (!myData || !targetData) return;
    
    state.selectedUserId = userId;
    distanceDisplay.style.display = 'block';
    distanceTitle.textContent = `Distance to ${targetData.name}`;
    distanceValue.textContent = 'Calculating...';
    distanceType.textContent = 'Via road';
    
    // Calculate route distance
    const distance = await getRouteDistance(
        myData.lat, myData.lng,
        targetData.lat, targetData.lng
    );
    
    if (state.selectedUserId === userId) {
        distanceValue.textContent = formatDistance(distance);
    }
}

// Continued in next part...

// Create custom marker icon
function createMarkerIcon(color, isBase, initials, heading, isEmergency = false) {
    const size = isBase ? 48 : 40;
    const rotation = heading !== null ? `rotate(${heading}deg)` : '';
    
    let markerHtml = '';
    
    if (isBase) {
        // Base marker - star shape
        markerHtml = `
            <div class="custom-marker ${isEmergency ? 'emergency-marker' : ''}" style="
                width: ${size}px;
                height: ${size}px;
                position: relative;
                transform: ${rotation};
            ">
                <svg width="${size}" height="${size}" viewBox="0 0 24 24" style="
                    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
                ">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                        fill="${color}" stroke="#fff" stroke-width="1.5"/>
                </svg>
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-weight: bold;
                    font-size: 14px;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                ">${initials}</div>
            </div>
        `;
    } else {
        // Regular user marker - circle with optional direction arrow
        markerHtml = `
            <div class="custom-marker ${isEmergency ? 'emergency-marker' : ''}" style="
                width: ${size}px;
                height: ${size}px;
                position: relative;
            ">
                <svg width="${size}" height="${size}" viewBox="0 0 40 40" style="
                    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
                ">
                    <circle cx="20" cy="20" r="18" fill="${color}" stroke="#fff" stroke-width="2"/>
                    ${heading !== null ? `
                        <path d="M20 5 L15 15 L20 12 L25 15 Z" 
                            fill="#fff" 
                            transform="rotate(${heading} 20 20)"/>
                    ` : ''}
                </svg>
                <div style="
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                    text-shadow: 0 1px 3px rgba(0,0,0,0.5);
                ">${initials}</div>
            </div>
        `;
    }
    
    return L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
    });
}

// Create or update marker
function updateMarker(userId, userData) {
    const isBase = userData.userType === USER_TYPE_BASE;
    const color = isBase ? baseColor : userData.color;
    const initials = getInitials(userData.name);
    
    // Create or update marker
    const isEmergency = userData.checkInStatus === 'emergency';
    
    if (state.markers.has(userId)) {
        const marker = state.markers.get(userId);
        marker.setLatLng([userData.lat, userData.lng]);
        marker.setIcon(createMarkerIcon(color, isBase, initials, userData.heading, isEmergency));
    } else {
        const marker = L.marker([userData.lat, userData.lng], {
            icon: createMarkerIcon(color, isBase, initials, userData.heading, isEmergency)
        }).addTo(map);
        
        // Popup
        marker.bindPopup(`
            <div class="popup-content">
                <h3>${userData.name}</h3>
                <p>Accuracy: ${formatAccuracy(userData.accuracy)}</p>
                <p>Speed: ${formatSpeed(userData.speed)}</p>
                <p>Altitude: ${formatAltitude(userData.altitude)}</p>
                <p>Updated: ${timeAgo(userData.timestamp)}</p>
                ${userData.checkInStatus ? `<p>Status: ${userData.checkInStatus.toUpperCase()}</p>` : ''}
            </div>
        `);
        
        // Click handler
        marker.on('click', () => {
            if (state.myId && userId !== state.myId) {
                showDistanceToUser(userId);
            }
        });
        
        state.markers.set(userId, marker);
    }
    
    // Update or create accuracy circle
    if (state.accuracyCircles.has(userId)) {
        const circle = state.accuracyCircles.get(userId);
        circle.setLatLng([userData.lat, userData.lng]);
        circle.setRadius(userData.accuracy);
    } else {
        const circle = L.circle([userData.lat, userData.lng], {
            radius: userData.accuracy,
            color: color,
            fillColor: color,
            fillOpacity: 0.1,
            weight: 1
        }).addTo(map);
        
        state.accuracyCircles.set(userId, circle);
    }
    
    // Update trail
    if (state.showTrails) {
        updateTrail(userId, userData);
    }
}

// Update trail
function updateTrail(userId, userData) {
    const now = Date.now();
    const cutoffTime = now - TRAIL_DURATION;
    
    if (!state.trails.has(userId)) {
        state.trails.set(userId, []);
    }
    
    const trail = state.trails.get(userId);
    const color = userData.userType === USER_TYPE_BASE ? baseColor : userData.color;
    
    // Add new point
    const lastUser = state.users.get(userId);
    if (lastUser && (lastUser.lat !== userData.lat || lastUser.lng !== userData.lng)) {
        const line = L.polyline(
            [[lastUser.lat, lastUser.lng], [userData.lat, userData.lng]],
            {
                color: color,
                weight: 3,
                opacity: 0.6,
                dashArray: '5, 10'
            }
        ).addTo(map);
        
        line._timestamp = now;
        trail.push(line);
    }
    
    // Remove old trail segments
    for (let i = trail.length - 1; i >= 0; i--) {
        if (trail[i]._timestamp < cutoffTime) {
            map.removeLayer(trail[i]);
            trail.splice(i, 1);
        }
    }
}

// Remove user marker and trail
function removeUserMarker(userId) {
    if (state.markers.has(userId)) {
        map.removeLayer(state.markers.get(userId));
        state.markers.delete(userId);
    }
    
    if (state.accuracyCircles.has(userId)) {
        map.removeLayer(state.accuracyCircles.get(userId));
        state.accuracyCircles.delete(userId);
    }
    
    if (state.trails.has(userId)) {
        state.trails.get(userId).forEach(line => map.removeLayer(line));
        state.trails.delete(userId);
    }
}

// Add waypoint
function addWaypoint(latlng) {
    const name = prompt('Enter waypoint name:');
    if (!name) return;
    
    const waypointId = 'waypoint_' + Date.now();
    
    const marker = L.marker(latlng, {
        icon: L.divIcon({
            html: `
                <div style="
                    background: #ef4444;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: bold;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">📍 ${name}</div>
            `,
            className: '',
            iconSize: [null, null],
            iconAnchor: [0, 0]
        })
    }).addTo(map);
    
    marker.bindPopup(`
        <div class="popup-content">
            <h3>Waypoint: ${name}</h3>
            <p>Coordinates: ${toMGRS(latlng.lat, latlng.lng)}</p>
            <button onclick="removeWaypoint('${waypointId}')" style="
                background: #ef4444;
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 4px;
            ">Remove</button>
        </div>
    `);
    
    state.waypoints.set(waypointId, marker);
    
    // Save to Firebase if available
    if (firebaseInitialized && state.myId) {
        database.ref(`waypoints/${waypointId}`).set({
            name: name,
            lat: latlng.lat,
            lng: latlng.lng,
            createdBy: state.myId,
            timestamp: Date.now()
        });
    }
    
    state.waypointMode = false;
    waypointToggle.classList.remove('active');
    map.getContainer().style.cursor = '';
}

// Remove waypoint
window.removeWaypoint = function(waypointId) {
    if (state.waypoints.has(waypointId)) {
        map.removeLayer(state.waypoints.get(waypointId));
        state.waypoints.delete(waypointId);
    }
    
    if (firebaseInitialized) {
        database.ref(`waypoints/${waypointId}`).remove();
    }
};

// Add measurement point
function addMeasurementPoint(latlng) {
    state.measurementPoints.push(latlng);
    
    // Add marker
    L.circleMarker(latlng, {
        radius: 5,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 1
    }).addTo(map);
    
    if (state.measurementPoints.length >= 2) {
        // Draw line
        if (state.measurementLine) {
            map.removeLayer(state.measurementLine);
        }
        
        state.measurementLine = L.polyline(state.measurementPoints, {
            color: '#3b82f6',
            weight: 3,
            dashArray: '10, 5'
        }).addTo(map);
        
        // Calculate total distance
        let totalDistance = 0;
        for (let i = 1; i < state.measurementPoints.length; i++) {
            const p1 = state.measurementPoints[i - 1];
            const p2 = state.measurementPoints[i];
            totalDistance += calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
        }
        
        measurementValue.textContent = `Total: ${formatDistance(totalDistance)}`;
    } else {
        measurementValue.textContent = 'Click another point to measure';
    }
}

// Clear measurement
function clearMeasurement() {
    state.measurementMode = false;
    state.measurementPoints = [];
    measureToggle.classList.remove('active');
    measurementDisplay.style.display = 'none';
    map.getContainer().style.cursor = '';
    
    if (state.measurementLine) {
        map.removeLayer(state.measurementLine);
        state.measurementLine = null;
    }
    
    // Remove measurement markers
    map.eachLayer(layer => {
        if (layer instanceof L.CircleMarker && layer.options.color === '#3b82f6') {
            map.removeLayer(layer);
        }
    });
}

// Update check-in status
function updateCheckInStatus(status) {
    state.checkInStatus = status;
    
    // Update button states
    checkInOkBtn.classList.toggle('active', status === 'ok');
    checkInHelpBtn.classList.toggle('active', status === 'help');
    checkInEmergencyBtn.classList.toggle('active', status === 'emergency');
    
    // Update Firebase
    if (firebaseInitialized && state.myId) {
        database.ref(`users/${state.myId}/checkInStatus`).set(status);
    }
}

// Trigger emergency alert
function triggerEmergency() {
    if (!firebaseInitialized || !state.myId) return;
    
    const myData = state.users.get(state.myId);
    if (!myData) return;
    
    // Send emergency alert to Firebase
    database.ref('emergencies').push({
        userId: state.myId,
        userName: myData.name,
        lat: myData.lat,
        lng: myData.lng,
        timestamp: Date.now()
    });
    
    // Vibrate if supported
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
}

// Show emergency alert
function showEmergencyAlert(emergencyData) {
    emergencyUser.textContent = emergencyData.userName;
    emergencyCoords.textContent = toMGRS(emergencyData.lat, emergencyData.lng);
    emergencyTimestamp.textContent = new Date(emergencyData.timestamp).toLocaleTimeString();
    
    emergencyModal.classList.add('show');
    
    // Play alert sound (browser beep)
    playEmergencySound();
    
    // Vibrate
    if (navigator.vibrate) {
        navigator.vibrate([500, 250, 500, 250, 500]);
    }
    
    // Zoom to emergency location
    map.setView([emergencyData.lat, emergencyData.lng], 16);
}

// Play emergency sound
let emergencySoundInterval = null;
function playEmergencySound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    function beep() {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    beep();
    emergencySoundInterval = setInterval(beep, 1000);
    
    // Stop after 10 seconds
    setTimeout(stopEmergencySound, 10000);
}

function stopEmergencySound() {
    if (emergencySoundInterval) {
        clearInterval(emergencySoundInterval);
        emergencySoundInterval = null;
    }
}

// Get battery status
async function updateBatteryStatus() {
    try {
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            state.battery = {
                level: battery.level,
                charging: battery.charging
            };
            
            // Update on battery change
            battery.addEventListener('levelchange', () => {
                state.battery.level = battery.level;
            });
            battery.addEventListener('chargingchange', () => {
                state.battery.charging = battery.charging;
            });
        }
    } catch (error) {
        console.log('Battery API not supported');
    }
}

// Update user stats display
function updateUserStats() {
    if (!state.isSharing) return;
    
    accuracyTextEl.textContent = state.currentAccuracy ? formatAccuracy(state.currentAccuracy) : '--';
    speedTextEl.textContent = formatSpeed(state.speed);
    altitudeTextEl.textContent = formatAltitude(state.altitude);
    
    // Update battery status (re-fetch to get current value)
    updateBatteryStatusSync();
    batteryTextEl.textContent = state.battery ? formatBattery(state.battery.level, state.battery.charging) : '--';
    
    if (state.lastPosition) {
        coordsTextEl.textContent = toMGRS(state.lastPosition.lat, state.lastPosition.lng);
    }
}

// Synchronous battery update for stats display
function updateBatteryStatusSync() {
    if ('getBattery' in navigator && state.battery) {
        navigator.getBattery().then(battery => {
            state.battery = {
                level: battery.level,
                charging: battery.charging
            };
        });
    }
}

// Continued in next part...

// Start sharing location
shareBtn.addEventListener('click', async () => {
    if (!checkGeolocationSupport()) return;
    
    const name = state.myType === USER_TYPE_BASE 
        ? 'BASE' 
        : userNameInput.value.trim();
    
    if (state.myType === USER_TYPE_BASE) {
        const password = basePasswordInput.value;
        if (password !== BASE_PASSWORD) {
            alert('Incorrect password!');
            return;
        }
    } else {
        if (!name) {
            alert('Please enter your name');
            userNameInput.focus();
            return;
        }
    }
    
    // Request location permission
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });
        
        // Generate or reuse user ID (prevent duplicates on refresh)
        if (!state.myId || !state.savedName) {
            // Generate new persistent ID based on device/browser
            const deviceId = getDeviceId();
            state.myId = deviceId;
        }
        // If resuming session, myId already set from loadSession
        
        // Assign color
        const color = state.myType === USER_TYPE_BASE 
            ? baseColor 
            : colors[colorIndex++ % colors.length];
        
        // Initialize battery status
        await updateBatteryStatus();
        
        // Start watching position
        state.watchId = navigator.geolocation.watchPosition(
            (pos) => updatePosition(pos),
            (error) => handleLocationError(error),
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            }
        );
        
        // Request wake lock to keep screen on
        try {
            if ('wakeLock' in navigator) {
                const wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock activated');
            }
        } catch (error) {
            console.log('Wake lock not supported:', error);
        }
        
        // Update UI
        state.isSharing = true;
        shareBtn.style.display = 'none';
        stopBtn.style.display = 'flex';
        statusEl.className = 'status active';
        statusEl.innerHTML = '<span class="status-dot"></span>Active';
        userNameInput.disabled = true;
        basePasswordInput.disabled = true;
        baseTypeBtn.disabled = true;
        userTypeBtn.disabled = true;
        checkInPanel.style.display = 'block';
        userStatsPanel.style.display = 'block';
        myLocationBtn.style.display = 'flex';
        
        // Save session for persistence
        saveSession();
        
        // Initial position update
        updatePosition(position);
        
        // Setup Firebase listeners
        if (firebaseInitialized) {
            setupFirebaseListeners();
        }
        
        // Update stats every second
        setInterval(updateUserStats, 1000);
        
    } catch (error) {
        handleLocationError(error);
    }
});

// Stop sharing location
stopBtn.addEventListener('click', () => {
    if (state.watchId) {
        navigator.geolocation.clearWatch(state.watchId);
        state.watchId = null;
    }
    
    // Remove from Firebase
    if (firebaseInitialized && state.myId) {
        database.ref(`users/${state.myId}`).remove();
    }
    
    // Remove own marker
    removeUserMarker(state.myId);
    
    // Reset state
    state.isSharing = false;
    state.myId = null;
    state.checkInStatus = null;
    state.autoCenter = true; // Re-enable auto-center for next session
    
    // Clear saved session
    clearSession();
    
    // Update UI
    shareBtn.style.display = 'flex';
    stopBtn.style.display = 'none';
    statusEl.className = 'status inactive';
    statusEl.innerHTML = '<span class="status-dot"></span>Inactive';
    userNameInput.disabled = false;
    basePasswordInput.disabled = false;
    baseTypeBtn.disabled = false;
    userTypeBtn.disabled = false;
    userNameInput.value = '';
    basePasswordInput.value = '';
    checkInPanel.style.display = 'none';
    userStatsPanel.style.display = 'none';
    myLocationBtn.style.display = 'none';
});

// Update position
function updatePosition(position) {
    const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
    
    state.currentAccuracy = accuracy;
    state.altitude = altitude;
    state.speed = speed;
    state.heading = heading;
    state.lastPosition = { lat: latitude, lng: longitude };
    
    const userData = {
        name: state.myType === USER_TYPE_BASE ? 'BASE' : userNameInput.value.trim(),
        lat: latitude,
        lng: longitude,
        accuracy: accuracy,
        altitude: altitude,
        speed: speed,
        heading: heading,
        timestamp: Date.now(),
        userType: state.myType,
        color: state.myType === USER_TYPE_BASE ? baseColor : colors[colorIndex % colors.length],
        checkInStatus: state.checkInStatus,
        battery: state.battery
    };
    
    // Update Firebase
    if (firebaseInitialized && state.myId) {
        database.ref(`users/${state.myId}`).set(userData);
    }
    
    // Update local state
    state.users.set(state.myId, userData);
    
    // Update marker
    updateMarker(state.myId, userData);
    
    // Center map on first position only (not on every update)
    if (!state.lastPosition && state.autoCenter) {
        map.setView([latitude, longitude], 15);
        state.autoCenter = false; // Disable after first center
    }
    
    // Check proximity alerts
    checkProximityAlerts();
}

// Handle location errors
function handleLocationError(error) {
    console.error('Location error:', error);
    
    let message = 'Unable to get your location. ';
    
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message += 'Please check your browser permissions.';
            permissionModal.classList.add('show');
            break;
        case error.POSITION_UNAVAILABLE:
            message += 'Location information is unavailable.';
            break;
        case error.TIMEOUT:
            message += 'Location request timed out.';
            break;
        default:
            message += 'An unknown error occurred.';
    }
    
    statusEl.className = 'status warning';
    statusEl.innerHTML = '<span class="status-dot"></span>' + message;
}

// Setup Firebase listeners
function setupFirebaseListeners() {
    // Listen for user updates
    database.ref('users').on('value', (snapshot) => {
        const users = snapshot.val() || {};
        const currentUserIds = new Set(Object.keys(users));
        
        // Update or add users
        Object.entries(users).forEach(([userId, userData]) => {
            if (userId !== state.myId) {
                state.users.set(userId, userData);
                updateMarker(userId, userData);
            }
        });
        
        // Remove users that are no longer present
        state.users.forEach((userData, userId) => {
            if (userId !== state.myId && !currentUserIds.has(userId)) {
                state.users.delete(userId);
                removeUserMarker(userId);
            }
        });
        
        // Update user list
        updateUserList();
    });
    
    // Listen for waypoints
    database.ref('waypoints').on('value', (snapshot) => {
        const waypoints = snapshot.val() || {};
        
        // Clear existing waypoints
        state.waypoints.forEach((marker, id) => {
            if (!waypoints[id]) {
                map.removeLayer(marker);
                state.waypoints.delete(id);
            }
        });
        
        // Add new waypoints
        Object.entries(waypoints).forEach(([id, data]) => {
            if (!state.waypoints.has(id)) {
                const marker = L.marker([data.lat, data.lng], {
                    icon: L.divIcon({
                        html: `
                            <div style="
                                background: #ef4444;
                                color: white;
                                padding: 4px 8px;
                                border-radius: 4px;
                                font-size: 11px;
                                font-weight: bold;
                                white-space: nowrap;
                                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            ">📍 ${data.name}</div>
                        `,
                        className: '',
                        iconSize: [null, null],
                        iconAnchor: [0, 0]
                    })
                }).addTo(map);
                
                marker.bindPopup(`
                    <div class="popup-content">
                        <h3>Waypoint: ${data.name}</h3>
                        <p>Coordinates: ${toMGRS(data.lat, data.lng)}</p>
                        ${data.createdBy === state.myId ? `
                            <button onclick="removeWaypoint('${id}')" style="
                                background: #ef4444;
                                color: white;
                                border: none;
                                padding: 4px 8px;
                                border-radius: 4px;
                                cursor: pointer;
                                margin-top: 4px;
                            ">Remove</button>
                        ` : ''}
                    </div>
                `);
                
                state.waypoints.set(id, marker);
            }
        });
    });
    
    // Listen for emergency alerts
    database.ref('emergencies').on('child_added', (snapshot) => {
        const emergency = snapshot.val();
        
        // Don't show own emergency
        if (emergency.userId === state.myId) return;
        
        // Show emergency alert
        showEmergencyAlert(emergency);
        
        // Remove emergency after showing
        setTimeout(() => {
            database.ref(`emergencies/${snapshot.key}`).remove();
        }, 30000); // Remove after 30 seconds
    });
}

// Update user list in sidebar
function updateUserList() {
    const users = Array.from(state.users.values())
        .filter(user => state.users.get(state.myId) ? true : user.timestamp > Date.now() - 300000) // 5 min timeout
        .sort((a, b) => {
            // Base users first
            if (a.userType === USER_TYPE_BASE && b.userType !== USER_TYPE_BASE) return -1;
            if (a.userType !== USER_TYPE_BASE && b.userType === USER_TYPE_BASE) return 1;
            // Then by name
            return a.name.localeCompare(b.name);
        });
    
    userCountEl.textContent = users.length;
    
    if (users.length === 0) {
        userListEl.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <h3>No Active Users</h3>
                <p>Start sharing your location to see others</p>
            </div>
        `;
        return;
    }
    
    userListEl.innerHTML = users.map(user => {
        const userId = Array.from(state.users.entries())
            .find(([id, data]) => data === user)?.[0];
        
        const isBase = user.userType === USER_TYPE_BASE;
        const isSelf = userId === state.myId;
        
        return `
            <div class="user-card ${isBase ? 'base-user' : ''} ${state.selectedUserId === userId ? 'active' : ''}" 
                 onclick="focusOnUser('${userId}')">
                <div class="user-avatar ${isBase ? 'base-avatar' : ''}" style="background: ${user.color}">
                    ${getInitials(user.name)}
                    ${isBase ? '<div class="base-badge">⭐</div>' : ''}
                </div>
                <div class="user-info">
                    <div class="user-name">${user.name}${isSelf ? ' (You)' : ''}</div>
                    <div class="user-time">${timeAgo(user.timestamp)}</div>
                    <div class="user-accuracy">${formatAccuracy(user.accuracy)}</div>
                    ${user.checkInStatus ? `
                        <div class="user-status ${user.checkInStatus}">${user.checkInStatus.toUpperCase()}</div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Focus on user
window.focusOnUser = function(userId) {
    const userData = state.users.get(userId);
    if (!userData) return;
    
    map.setView([userData.lat, userData.lng], 16);
    
    if (userId !== state.myId) {
        showDistanceToUser(userId);
    }
    
    // Highlight user card
    state.selectedUserId = userId;
    updateUserList();
};

// Check proximity alerts
function checkProximityAlerts() {
    if (!state.myId || state.myType !== USER_TYPE_USER) return;
    
    const myData = state.users.get(state.myId);
    if (!myData) return;
    
    // Find base user
    const baseUser = Array.from(state.users.entries())
        .find(([id, data]) => data.userType === USER_TYPE_BASE);
    
    if (!baseUser) return;
    
    const [baseId, baseData] = baseUser;
    const distance = calculateDistance(
        myData.lat, myData.lng,
        baseData.lat, baseData.lng
    );
    
    // Alert if too far from base (> 1km)
    if (distance > PROXIMITY_ALERT_DISTANCE / 1000) {
        // Only alert once every 5 minutes
        const lastAlert = localStorage.getItem('lastProximityAlert');
        const now = Date.now();
        
        if (!lastAlert || now - parseInt(lastAlert) > 300000) {
            if (confirm(`You are ${formatDistance(distance)} from Base. Continue?`)) {
                localStorage.setItem('lastProximityAlert', now.toString());
            }
        }
    }
}

// Cleanup old users (run periodically)
setInterval(() => {
    if (!state.isSharing) return;
    
    const now = Date.now();
    const timeout = 300000; // 5 minutes
    
    state.users.forEach((userData, userId) => {
        if (userId !== state.myId && now - userData.timestamp > timeout) {
            state.users.delete(userId);
            removeUserMarker(userId);
            
            if (firebaseInitialized) {
                database.ref(`users/${userId}`).remove();
            }
        }
    });
    
    updateUserList();
}, 60000); // Check every minute

// Update distance display for selected user
setInterval(() => {
    if (state.selectedUserId && state.myId) {
        showDistanceToUser(state.selectedUserId);
    }
}, 5000); // Update every 5 seconds

// Auto-clear old localStorage data (24hr)
function clearOldLocalStorageData() {
    try {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        keys.forEach(key => {
            // Skip important keys
            if (key === 'nswfDeviceId' || key === 'darkMode' || key === 'nswfSession') {
                return;
            }
            
            // Check if key has timestamp
            if (key.startsWith('cache_') || key.startsWith('temp_')) {
                const value = localStorage.getItem(key);
                try {
                    const data = JSON.parse(value);
                    if (data.timestamp && (now - data.timestamp) > maxAge) {
                        localStorage.removeItem(key);
                        console.log('[Cleanup] Removed old data:', key);
                    }
                } catch (e) {
                    // Not JSON, skip
                }
            }
        });
        
        console.log('[Cleanup] Old localStorage data cleared');
    } catch (error) {
        console.error('[Cleanup] Error clearing old data:', error);
    }
}

// Clear old cache on startup
clearOldLocalStorageData();

// Send message to service worker to clear old cache
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_OLD_CACHE'
    });
}

// Initialize
console.log('Live NSWF Radar v4.3 initialized');
console.log('Firebase:', firebaseInitialized ? 'Connected' : 'Offline mode');

// Check for stored dark mode preference
const savedDarkMode = localStorage.getItem('darkMode');
if (savedDarkMode === 'true') {
    darkModeToggle.click();
}

// Save dark mode preference
darkModeToggle.addEventListener('click', () => {
    localStorage.setItem('darkMode', state.isDarkMode.toString());
});

// Fullscreen toggle
const fullscreenToggle = document.getElementById('fullscreenToggle');
const mapContainer = document.querySelector('.map-container');
const fullscreenIcon = document.getElementById('fullscreenIcon');

fullscreenToggle.addEventListener('click', () => {
    mapContainer.classList.toggle('fullscreen');
    fullscreenToggle.classList.toggle('active');
    
    // Update icon
    if (mapContainer.classList.contains('fullscreen')) {
        fullscreenIcon.innerHTML = '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>';
    } else {
        fullscreenIcon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>';
    }
    
    // Invalidate map size after transition
    setTimeout(() => {
        map.invalidateSize();
    }, 300);
});

// Load saved session on page load
loadSession();

// Keyboard Shortcuts (Desktop)
document.addEventListener('keydown', (e) => {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    switch(e.key) {
        case ' ': // Space - My Location
            e.preventDefault();
            if (state.isSharing && myLocationBtn.style.display !== 'none') {
                myLocationBtn.click();
            }
            break;
        case 'd': // D - Dark Mode
        case 'D':
            darkModeToggle.click();
            break;
        case 'g': // G - Grid
        case 'G':
            gridToggle.click();
            break;
        case 'l': // L - Layer
        case 'L':
            layerToggle.click();
            break;
        case 'm': // M - Measure
        case 'M':
            measureToggle.click();
            break;
        case 't': // T - Trails
        case 'T':
            trailToggle.click();
            break;
        case 'f': // F - Fullscreen
        case 'F':
            fullscreenToggle.click();
            break;
        case 'Escape': // ESC - Close panels
            if (distanceDisplay.style.display !== 'none') {
                closeDistanceBtn.click();
            }
            if (measurementDisplay.style.display !== 'none') {
                clearMeasurementBtn.click();
            }
            if (emergencyModal.classList.contains('show')) {
                closeEmergencyBtn.click();
            }
            break;
    }
});

// Show keyboard hints on first load (desktop only)
if (window.innerWidth >= 1024) {
    const showKeyboardHints = () => {
        const hint = document.createElement('div');
        hint.className = 'keyboard-hint show';
        hint.innerHTML = `
            <strong>Keyboard Shortcuts:</strong><br>
            <kbd>Space</kbd> My Location &nbsp;
            <kbd>D</kbd> Dark Mode &nbsp;
            <kbd>G</kbd> Grid &nbsp;
            <kbd>L</kbd> Layer &nbsp;
            <kbd>M</kbd> Measure &nbsp;
            <kbd>T</kbd> Trails &nbsp;
            <kbd>F</kbd> Fullscreen &nbsp;
            <kbd>ESC</kbd> Close
        `;
        document.body.appendChild(hint);
        
        setTimeout(() => {
            hint.classList.remove('show');
            setTimeout(() => hint.remove(), 300);
        }, 5000);
    };
    
    // Show hints after 2 seconds
    const hintsShown = localStorage.getItem('keyboardHintsShown');
    if (!hintsShown) {
        setTimeout(showKeyboardHints, 2000);
        localStorage.setItem('keyboardHintsShown', 'true');
    }
}

// Update session periodically while sharing
setInterval(() => {
    if (state.isSharing) {
        saveSession();
    }
}, 30000); // Every 30 seconds
