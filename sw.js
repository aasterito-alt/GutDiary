const CACHE = 'gutdiary-v2';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', e => {
  // Always fetch fresh copies on install, never serve from old cache
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(url =>
        fetch(url, { cache: 'no-store' }).then(res => c.put(url, res))
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete ALL old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Network first for HTML — always try to get fresh, fall back to cache
  if (e.request.url.endsWith('.html') || e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match('/index.html'))
    );
  } else {
    // Cache first for everything else (icons, fonts)
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
  }
});

// Tell all open tabs to reload when a new service worker takes over
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
