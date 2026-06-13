const CACHE_NAME = 'said-portfolio-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/higgsfield-visuals.css',
    '/higgsfield-visuals.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
    self.clients.claim();
});

// Network-first for HTML/CSS/JS so new deploys always show; fall back to
// cache when offline. Other requests use cache-first for speed.
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    const isAsset = req.mode === 'navigate' ||
        /\.(?:html|css|js)$/.test(url.pathname) ||
        url.pathname === '/';

    if (isAsset) {
        event.respondWith(
            fetch(req)
                .then(response => {
                    if (response && response.status === 200 && response.type === 'basic') {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(req))
        );
        return;
    }

    event.respondWith(
        caches.match(req).then(response => {
            if (response) return response;
            return fetch(req).then(response => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
                return response;
            });
        })
    );
});
