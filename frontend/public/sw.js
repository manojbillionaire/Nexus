const CACHE_VERSION = 'nexus-justice-v3.3';
const STATIC_CACHE  = 'nexus-static-v3.3';
const API_CACHE     = 'nexus-api-v3.3';

const STATIC_ASSETS = [
  '/', '/index.html', '/manifest.json',
  '/icon-192.png', '/icon-512.png', '/icon-maskable-512.png',
  '/icon-72.png', '/icon-96.png', '/icon-144.png', '/icon-180.png'
];

// ─── Install: pre-cache shell ─────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener('activate', e => {
  const keep = [STATIC_CACHE, API_CACHE];
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch strategy ───────────────────────────────────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip: non-GET, cross-origin, devtools, chrome-extension
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.googleapis')) return;

  // API calls: network only (never cache auth/AI responses)
  if (url.pathname.startsWith('/api/')) return;

  // Google Fonts: stale-while-revalidate
  if (url.hostname.includes('fonts.googleapis') || url.hostname.includes('fonts.gstatic')) {
    e.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const fetchPromise = fetch(e.request).then(res => { cache.put(e.request, res.clone()); return res; });
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // App shell + static assets: cache-first, fallback to network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(res => {
          if (res.ok) {
            caches.open(STATIC_CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match('/index.html')); // offline fallback to app shell
    })
  );
});

// ─── Push notifications (future-ready) ───────────────────────────────────────
self.addEventListener('push', e => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || 'Nexus Justice', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: data.tag || 'nexus-notification',
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || '/'));
});
