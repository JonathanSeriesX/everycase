const CACHE_NAME = "offlineCache-v1"; // Increment version for cache invalidation
const OFFLINE_URL = "/offline.html";

// Install event: Cache fallback assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline fallback");
      return cache.addAll([OFFLINE_URL]);
    })
  );
  self.skipWaiting(); // Activate service worker immediately after installation
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log(`[Service Worker] Deleting old cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Start controlling all clients immediately
});

// Fetch event: Respond with cache, network, or fallback
self.addEventListener("fetch", (event) => {
  // Ignore requests to chrome-extension URLs
  if (event.request.url.startsWith("chrome-extension://")) {
    return;
  }

  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If cached response exists, serve it
      if (cachedResponse) {
        // Optionally, update the cache in the background
        event.waitUntil(
          fetch(event.request)
            .then((response) => {
              return caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response.clone());
                return response;
              });
            })
            .catch((err) => {
              console.warn("[Service Worker] Network fetch failed, cache remains stale:", err);
            })
        );
        return cachedResponse;
      }

      // Otherwise, fetch from network
      return fetch(event.request)
        .then((networkResponse) => {
          // Cache the network response
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Fallback to offline.html for navigation requests or other errors
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});