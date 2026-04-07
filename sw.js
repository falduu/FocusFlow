const CACHE_NAME = 'focusflow-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/storage.js',
    './js/app.js',
    './manifest.json'
];

// 1️⃣ Install: salva i file in cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Assets cachati');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2️⃣ Activate: pulisce cache vecchie
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
});

// 3️⃣ Fetch: serve dalla cache, fallback a rete
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});