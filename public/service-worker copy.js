const CACHE_NAME = "my-cache-v3"; // Update the cache version whenever the service worker code changes
const STATIC_ASSETS = [
  // "/",
  // "/index.html",
  "/styles.css",
  "/jquery-3.6.4.min.js",
  "/socket.io/socket.io.js",
  // Add other static assets here
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});







self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Add custom handling for notification click
  // For example, you can open a specific URL or focus on a particular tab
  clients.openWindow("/path/to/destination");
});

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  const options = {
    body: event.data.text(),
    icon: '/path/to/icon.png',
    badge: '/path/to/badge.png',
  };

  event.waitUntil(
    self.registration.showNotification('Notification Title', options)
  );
});
