const CACHE_NAME = 'proteinvalue-v3';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .catch(err => console.log('Cache failed:', err))
    );
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(names => 
            Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
        )
    );
    self.clients.claim();
});
