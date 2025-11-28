const CACHE_NAME = 'nswf-radar-v4.3';
const TILE_CACHE_NAME = 'nswf-radar-tiles-v4.3';
const MAX_TILE_CACHE_SIZE = 500; // Limit to ~20MB (40KB per tile avg)
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/firebase-config.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install service worker and cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v4.3');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[SW] Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Fetch strategy: Cache first for tiles, network first for app
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle map tiles separately (OpenStreetMap)
  if (url.hostname.includes('tile.openstreetmap.org') || 
      url.hostname.includes('tiles.stadiamaps.com')) {
    event.respondWith(handleTileRequest(event.request));
    return;
  }
  
  // Handle app resources
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Check if cache is expired
          return response.clone().blob().then(blob => {
            const cacheDate = response.headers.get('sw-cache-date');
            if (cacheDate) {
              const age = Date.now() - parseInt(cacheDate);
              if (age > CACHE_EXPIRY) {
                // Cache expired, fetch new
                return fetchAndCache(event.request);
              }
            }
            return response;
          });
        }
        return fetchAndCache(event.request);
      })
      .catch(() => {
        // Return offline fallback
        return caches.match('/index.html');
      })
  );
});

// Handle tile requests with caching
async function handleTileRequest(request) {
  const cache = await caches.open(TILE_CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Check expiry
    const cacheDate = cachedResponse.headers.get('sw-cache-date');
    if (cacheDate) {
      const age = Date.now() - parseInt(cacheDate);
      if (age < CACHE_EXPIRY) {
        return cachedResponse;
      }
    }
  }
  
  // Fetch from network
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      // Add cache date header
      const responseToCache = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
      });
      responseToCache.headers.set('sw-cache-date', Date.now().toString());
      
      // Cache the tile
      await cache.put(request, responseToCache.clone());
      
      // Manage cache size
      await manageTileCacheSize(cache);
      
      return responseToCache;
    }
    return response;
  } catch (error) {
    // Return cached version if available
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Fetch and cache with expiry date
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    if (!response || response.status !== 200 || response.type === 'error') {
      return response;
    }
    
    const responseToCache = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    });
    responseToCache.headers.set('sw-cache-date', Date.now().toString());
    
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, responseToCache.clone());
    
    return responseToCache;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// Manage tile cache size (LRU eviction)
async function manageTileCacheSize(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_TILE_CACHE_SIZE) {
    // Remove oldest 10% of tiles
    const toRemove = Math.floor(MAX_TILE_CACHE_SIZE * 0.1);
    for (let i = 0; i < toRemove; i++) {
      await cache.delete(keys[i]);
    }
    console.log(`[SW] Removed ${toRemove} old tiles from cache`);
  }
}

// Clean up old caches and expired data
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker v4.3');
  const cacheWhitelist = [CACHE_NAME, TILE_CACHE_NAME];
  
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheWhitelist.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Clean expired tiles
      cleanExpiredTiles()
    ])
  );
  
  self.clients.claim();
});

// Clean expired tiles from cache
async function cleanExpiredTiles() {
  try {
    const cache = await caches.open(TILE_CACHE_NAME);
    const keys = await cache.keys();
    let removed = 0;
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const cacheDate = response.headers.get('sw-cache-date');
        if (cacheDate) {
          const age = Date.now() - parseInt(cacheDate);
          if (age > CACHE_EXPIRY) {
            await cache.delete(request);
            removed++;
          }
        }
      }
    }
    
    if (removed > 0) {
      console.log(`[SW] Cleaned ${removed} expired tiles`);
    }
  } catch (error) {
    console.error('[SW] Error cleaning expired tiles:', error);
  }
}

// Background sync for location updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-locations') {
    event.waitUntil(syncLocations());
  }
});

async function syncLocations() {
  console.log('[SW] Syncing locations in background');
  // This can be used to sync location data when connection is restored
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_OLD_CACHE') {
    event.waitUntil(clearOldCache());
  }
});

// Clear cache older than 24 hours
async function clearOldCache() {
  try {
    const cache = await caches.open(TILE_CACHE_NAME);
    await cleanExpiredTiles();
    console.log('[SW] Old cache cleared');
    return { success: true };
  } catch (error) {
    console.error('[SW] Error clearing old cache:', error);
    return { success: false, error: error.message };
  }
}
