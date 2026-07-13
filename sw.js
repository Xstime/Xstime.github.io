// Site-wide service worker for offline caching.
// Update CACHE_VERSION whenever static assets change.
const CACHE_VERSION = 'site-cache-2026-07-13-1';
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
  './scripts/index.js',
  './links.json',
  './links_CN.json',
  './links.version.json',
  './touxiang.png',
  './icon/default.png'
];

const CACHE_NAME = CACHE_VERSION;
const toAbsolute = (path) => new URL(path, self.location.origin).toString();
const PRECACHE_URLS = PRECACHE_PATHS.map(toAbsolute);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => (key === CACHE_NAME ? Promise.resolve() : caches.delete(key)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  const destination = request.destination;
  const isHtml = request.headers.get('accept')?.includes('text/html');

  if (isHtml) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (destination === 'script' || destination === 'style' || destination === 'image') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    cacheIfSuccess(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    const fallback = await caches.match(toAbsolute('./index.html'));
    return fallback || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      cacheIfSuccess(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const networkResponse = await fetchPromise;
  return networkResponse || Response.error();
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }
  try {
    const response = await fetch(request);
    cacheIfSuccess(request, response.clone());
    return response;
  } catch (error) {
    return Response.error();
  }
}

async function cacheIfSuccess(request, response) {
  if (!response || !response.ok) {
    return;
  }
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
}
