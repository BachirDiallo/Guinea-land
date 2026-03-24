// Guinea Land Hub Service Worker
// Provides offline support and caching for Guinea's connectivity challenges

const CACHE_NAME = 'guinea-land-hub-v2';
const MAP_CACHE_NAME = 'guinea-land-hub-maps-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/static/js/main.js',
  '/static/css/main.css',
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  '/api/regions',
  '/api/stats',
  '/api/lands',
];

// Mapbox tile URL patterns to cache
const MAPBOX_PATTERNS = [
  'api.mapbox.com',
  'tiles.mapbox.com',
  'a.tiles.mapbox.com',
  'b.tiles.mapbox.com',
  'c.tiles.mapbox.com',
  'd.tiles.mapbox.com',
];

// Maximum map tiles to cache (prevent storage overflow)
const MAX_MAP_TILES = 500;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS.filter(url => !url.includes('/static/')));
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== MAP_CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle Mapbox tile requests - cache for offline maps
  if (isMapboxRequest(url)) {
    event.respondWith(mapTileCacheStrategy(request));
    return;
  }

  // Skip other cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // API requests - Network first, then cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - Cache first, then network
  if (url.pathname.startsWith('/static/') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg')) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // HTML pages - Network first with offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default - Network first
  event.respondWith(networkFirstStrategy(request));
});

// Check if request is for Mapbox tiles
function isMapboxRequest(url) {
  return MAPBOX_PATTERNS.some(pattern => url.hostname.includes(pattern));
}

// Map tile caching strategy - Cache first with LRU eviction
async function mapTileCacheStrategy(request) {
  const cache = await caches.open(MAP_CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('[SW] Map tile from cache:', request.url.substring(0, 80));
    
    // Update cache in background (stale-while-revalidate)
    fetchAndCacheMapTile(request, cache).catch(() => {});
    
    return cachedResponse;
  }
  
  // Fetch from network
  try {
    return await fetchAndCacheMapTile(request, cache);
  } catch (error) {
    console.log('[SW] Map tile fetch failed:', request.url.substring(0, 80));
    
    // Return a placeholder tile for offline
    return new Response(createPlaceholderTile(), {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
}

// Fetch and cache map tile with LRU eviction
async function fetchAndCacheMapTile(request, cache) {
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    // Clone before caching
    const responseToCache = networkResponse.clone();
    
    // Check cache size and evict old tiles if needed
    await evictOldMapTiles(cache);
    
    // Cache the new tile
    cache.put(request, responseToCache);
    console.log('[SW] Map tile cached:', request.url.substring(0, 80));
  }
  
  return networkResponse;
}

// Evict old map tiles when cache is full (simple LRU)
async function evictOldMapTiles(cache) {
  const keys = await cache.keys();
  
  if (keys.length >= MAX_MAP_TILES) {
    // Delete oldest 20% of tiles
    const toDelete = Math.floor(MAX_MAP_TILES * 0.2);
    console.log(`[SW] Evicting ${toDelete} old map tiles`);
    
    for (let i = 0; i < toDelete && i < keys.length; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Create a placeholder SVG tile for offline
function createPlaceholderTile() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <rect fill="#E8E8E8" width="256" height="256"/>
    <text x="128" y="128" font-family="sans-serif" font-size="12" fill="#999" text-anchor="middle" dominant-baseline="middle">
      Hors ligne
    </text>
  </svg>`;
}

// Network first strategy - try network, fall back to cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline JSON for API requests
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'offline', 
          message: 'Vous êtes hors ligne. Les données peuvent être obsolètes.',
          offline: true 
        }),
        { 
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

// Cache first strategy - try cache, fall back to network
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse);
        });
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url);
    throw error;
  }
}

// Network first with offline page fallback
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for page, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Return basic offline response
    return new Response(
      `<!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hors ligne - Guinea Land Hub</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #F7F7F5; }
          .container { text-align: center; padding: 2rem; }
          h1 { color: #133E26; }
          p { color: #666; }
          button { background: #D95A2B; color: white; border: none; padding: 12px 24px; cursor: pointer; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Vous êtes hors ligne</h1>
          <p>Vérifiez votre connexion internet et réessayez.</p>
          <button onclick="location.reload()">Réessayer</button>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncPendingTransactions());
  }
});

async function syncPendingTransactions() {
  // Get pending transactions from IndexedDB
  // This would be implemented with actual IndexedDB operations
  console.log('[SW] Syncing pending transactions...');
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data?.text() || 'Nouvelle notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      { action: 'view', title: 'Voir' },
      { action: 'close', title: 'Fermer' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Guinea Land Hub', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/transactions')
    );
  }
});
