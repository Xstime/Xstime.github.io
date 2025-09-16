// Service Worker for FitTracker PWA
const CACHE_NAME = 'fittracker-v1';
const urlsToCache = [
    '/fitness.html',
    '/styles/fitness.css',
    '/scripts/fitness.js',
    '/icon/default.png',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                return fetch(event.request).then(
                    response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for data synchronization (if needed in future)
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Background sync triggered');
        // Here you could sync workout data to a server
    }
});

// Push notifications (for workout reminders in future)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : '是时候开始训练了！',
        icon: '/icon/default.png',
        badge: '/icon/default.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: '开始训练',
                icon: '/icon/default.png'
            },
            {
                action: 'close',
                title: '稍后提醒',
                icon: '/icon/default.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('FitTracker', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/fitness.html')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        console.log('Notification dismissed');
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/fitness.html')
        );
    }
});