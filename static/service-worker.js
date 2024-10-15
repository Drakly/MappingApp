const CACHE_NAME = 'v2'; // Обновен кеш
const urlsToCache = [
    '/',
    '/index.html',
    '/static/styles.css',
    '/static/script.js',
    '/static/parking.png',
    '/static/car.png',
    '/static/location.png',
    '/static/clock.png',
    '/static/offline.html' // Добавяме офлайн страницата
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Връща кеширания ресурс, ако е наличен, иначе изпълнява заявката
                return response || fetch(event.request)
                    .catch(() => caches.match('/static/offline.html'));
            })
    );
});

self.addEventListener('activate', (event) => {
    // Премахва стари кешове
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
