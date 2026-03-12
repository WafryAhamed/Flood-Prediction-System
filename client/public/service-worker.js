// Service Worker for FloodWeb PWA
// Implements offline-first strategy with background sync and push notifications

const CACHE_NAME = 'floodweb-v1';
const ASSET_CACHE = 'floodweb-assets-v1';
const API_CACHE = 'floodweb-api-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/index.css',
  '/src/index.tsx',
];

// On install: cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(ASSETS_TO_CACHE);
        console.log('Service Worker: Assets cached on install');
      } catch (error) {
        console.error('Service Worker: Cache install failed', error);
      }
    })(),
  );
  self.skipWaiting();
});

// On activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && !cacheName.includes('floodweb')) {
            return caches.delete(cacheName);
          }
        }),
      );
      console.log('Service Worker: Old caches cleaned up');
    })(),
  );
  self.clients.claim();
});

// Network first strategy for API calls, cache fallback for offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API calls: network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  // Static assets: cache first
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML: network first for fresh content
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: network first
  event.respondWith(networkFirst(request));
});

// Network first strategy for API
async function networkFirstAPI(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      console.log('Service Worker: Serving cached API response');
      return cached;
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        offline: true,
        message: 'You are offline. Some data may not be up to date.',
        data: null,
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
}

// Network first (try network, fallback to cache)
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline - content not cached', { status: 503 });
  }
}

// Cache first (use cache, fall back to network)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(ASSET_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Resource not available offline', { status: 503 });
  }
}

// Background sync: sync data when connection restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-alerts') {
    event.waitUntil(syncAlerts());
  }
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncReports());
  }
});

async function syncAlerts() {
  try {
    const response = await fetch('/api/v1/alerts');
    const data = await response.json();
    
    // Notify all clients of synced alerts
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'ALERTS_SYNCED',
        alerts: data.alerts,
      });
    });
  } catch (error) {
    console.error('Background sync: Alerts sync failed', error);
  }
}

async function syncReports() {
  try {
    const cache = await caches.open(API_CACHE);
    const response = await fetch('/api/v1/reports');
    const data = await response.json();
    
    cache.put('/api/v1/reports', response.clone());
    
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'REPORTS_SYNCED',
        reports: data.reports,
      });
    });
  } catch (error) {
    console.error('Background sync: Reports sync failed', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const options = {
    body: event.data.text(),
    icon: '/assets/flood-icon-192.png',
    badge: '/assets/badge-72.png',
    tag: 'flood-alert',
    requireInteraction: true,
  };

  // Parse JSON if available
  try {
    const data = event.data.json();
    options.body = data.message || event.data.text();
    options.tag = data.type || 'flood-alert';
    options.data = data;
  } catch (e) {
    // Data is not JSON, use as plain text
  }

  event.waitUntil(self.registration.showNotification('FloodWeb Alert', options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const urlToOpen = data.url || '/';

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window' });

      // Check if window already open
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })(),
  );
});

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-alerts') {
    event.waitUntil(updateAlerts());
  }
});

async function updateAlerts() {
  try {
    const response = await fetch('/api/v1/alerts?limit=10');
    const data = await response.json();
    
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_ALERTS',
        alerts: data.alerts,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    console.error('Periodic sync failed', error);
  }
}

// Message handler for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(API_CACHE).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// User offline/online status notification
self.addEventListener('online', () => {
  self.clients.matchAll().then((c) => {
    c.forEach((client) => {
      client.postMessage({
        type: 'ONLINE_STATUS',
        online: true,
      });
    });
  });
});

self.addEventListener('offline', () => {
  self.clients.matchAll().then((c) => {
    c.forEach((client) => {
      client.postMessage({
        type: 'ONLINE_STATUS',
        online: false,
      });
    });
  });
});

console.log('FloodWeb Service Worker initialized');
