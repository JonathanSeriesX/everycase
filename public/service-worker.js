self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('offlineCache').then((cache) => {
            return cache.addAll(['/offline.html']); // Specify any fallback assets here
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                return caches.open('offlineCache').then((cache) => {
                    cache.put(event.request, response.clone());
                    return response;
                });
            })
            .catch(() => caches.match(event.request))
    );
});