const CACHE_NAME = 'nexo-v1';
const STATIC_ASSETS = ['/', '/login', '/dashboard', '/style.css', '/login.css',
    '/js/config.js', '/js/model.js', '/js/view.js', '/js/controller.js',
    '/js/auth.js', '/js/protect.js', '/js/favicon.js'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
    if (e.request.url.includes('/api/')) return;
    e.respondWith(caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
        return res;
    }).catch(() => cached)));
});
