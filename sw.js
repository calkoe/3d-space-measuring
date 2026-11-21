const CACHE_NAME = "aruco-3d-measure-v1";
const OPENCV_URL = "https://docs.opencv.org/4.10.0/opencv.js";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/apple-touch-icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // App-Shell zwingend cachen
    await cache.addAll(APP_SHELL);
    // OpenCV.js WASM für echten Offline-Betrieb vorab cachen (inkl. no-cors Fallback für Safari)
    try {
      const resp = await fetch(OPENCV_URL, { mode: "cors" });
      if (resp && resp.ok) await cache.put(OPENCV_URL, resp);
    } catch (_) {
      try {
        const opaque = await fetch(new Request(OPENCV_URL, { mode: "no-cors" }));
        if (opaque) await cache.put(OPENCV_URL, opaque);
      } catch (_) {}
    }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 1. OpenCV.js (~10 MB): Cache-First für blitzschnellen Start & 100 % Offline-Betrieb
  if (url.href === OPENCV_URL || url.hostname === "docs.opencv.org") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req, { ignoreSearch: true }) || await cache.match(OPENCV_URL);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        if (resp && (resp.ok || resp.type === "opaque")) {
          cache.put(req, resp.clone());
        }
        return resp;
      } catch (_) {
        return new Response("OpenCV.js offline nicht im Cache", { status: 503 });
      }
    })());
    return;
  }

  // 2. Gleiche Origin (index.html, manifest, icons, 3D-Modelle): Network-First mit sofortigem Offline-Fallback
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.ok) {
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (_) {
        const cached = await cache.match(req, { ignoreSearch: true });
        if (cached) return cached;
        if (req.mode === "navigate") {
          const fallback = await cache.match("./index.html");
          if (fallback) return fallback;
        }
        return new Response("Offline", { status: 503 });
      }
    })());
  }
});
