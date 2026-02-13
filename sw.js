// Simple site-wide service worker for offline caching
// Cache version string should be updated when static assets change
const CACHE_VERSION = 'site-cache-2026-02-13-1';
const PRECACHE_PATHS = [
  './',
  './index.html',
  './link.html',
  './styles/variables.css',
  './styles/base.css',
  './styles/safe-area.css',
  './styles/components.css',
  './styles/layout.css',
  './styles/animations.css',
  './styles/index.css',
  './styles/link.css',
  './styles/loading.css',
  './styles/safe-area.css',
  './links.json',
  './links_CN.json',
  './links.version.json',
  './touxiang.png',
  './icon/default.png'
];

const toAbsolute = (path) => new URL(path, self.location.origin).toString();
const PRECACHE_URLS = PRECACHE_PATHS.map(toAbsolute);
const CACHE_NAME = `${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
        return Promise.resolve();
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // HTML: network-first with cache fallback for offline
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Other static assets: cache-first with network fallback
  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Fallback to root if available
    const fallback = await caches.match(toAbsolute('./index.html'));
    return fallback || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    return cached || Response.error();
  }
}
