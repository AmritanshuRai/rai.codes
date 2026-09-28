const CACHE = "rai-portfolio-v18";
const SHELL = [
  "/",
  "/index.html",
  "/404.html",
  "/assets/styles.css",
  "/assets/app.js",
  "/assets/intro.js",
  "/assets/fluid.js",
  "/assets/fonts/fonts.css",
  "/assets/fonts/cinzel-400.woff2",
  "/assets/fonts/roboto-400.woff2",
  "/assets/fonts/roboto-700.woff2",
  "/assets/fonts/noto-sans-400.woff2",
  "/assets/fonts/noto-sans-700.woff2",
  "/assets/images/dithering.png",
  "/assets/images/portrait.png",
  "/assets/images/icon.png",
  "/assets/resume.pdf",
  "/favicon.ico",
  "/manifest.webmanifest",
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key !== CACHE &&
                (key.startsWith("rai-portfolio-") ||
                  key.startsWith("gatsby-") ||
                  key.startsWith("workbox-"))
            )
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !SHELL.includes(url.pathname)
  )
    return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE).then((cache) => cache.put(event.request, copy))
          );
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || Response.error())
      )
  );
});
