const CACHE_NAME = "phanyx-v2";

const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icon.png",
  "/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // não intercepta API
  if (url.pathname.startsWith("/api")) return;

  // não intercepta páginas Next internas
  if (url.pathname.startsWith("/_next")) return;

  // só cacheia assets estáticos
  if (
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return (
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });

            return response;
          })
        );
      })
    );
  }
});