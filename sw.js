const APP_CACHE = "aruco-3d-app-__BUILD_SHA__";
const OPENCV_CACHE = "aruco-3d-opencv-4.10.0";
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
    // 1. Neue App-Shell immer frisch vom Server laden (cache: "reload")
    const appCache = await caches.open(APP_CACHE);
    await Promise.all(APP_SHELL.map(async url => {
      try {
        const resp = await fetch(url, { cache: "reload" });
        if (resp && resp.ok) await appCache.put(url, resp);
      } catch (_) {}
    }));

    // 2. OpenCV.js nur 1x cachen (bleibt über App-Updates hinweg im eigenen Cache erhalten!)
    const cvCache = await caches.open(OPENCV_CACHE);
    const hasCv = await cvCache.match(OPENCV_URL);
    if (!hasCv) {
      try {
        const resp = await fetch(OPENCV_URL, { mode: "cors" });
        if (resp && resp.ok) await cvCache.put(OPENCV_URL, resp);
      } catch (_) {
        try {
          const opaque = await fetch(new Request(OPENCV_URL, { mode: "no-cors" }));
          if (opaque) await cvCache.put(OPENCV_URL, opaque);
        } catch (_) {}
      }
    }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keep = new Set([APP_CACHE, OPENCV_CACHE]);
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => !keep.has(k)).map(k => caches.delete(k)));
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
      const cvCache = await caches.open(OPENCV_CACHE);
      const cached = await cvCache.match(req, { ignoreSearch: true }) || await cvCache.match(OPENCV_URL);
      if (cached) return cached;
      try {
        const resp = await fetch(req);
        if (resp && (resp.ok || resp.type === "opaque")) {
          cvCache.put(OPENCV_URL, resp.clone());
        }
        return resp;
      } catch (_) {
        return new Response("OpenCV.js offline nicht im Cache", { status: 503 });
      }
    })());
    return;
  }

  // 2. Eigene App-Dateien: Network-First mit sofortigem Offline-Fallback
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const appCache = await caches.open(APP_CACHE);
      try {
        const fresh = await fetch(req, { cache: "no-cache" });
        if (fresh && fresh.ok) {
          appCache.put(req, fresh.clone());
        }
        return fresh;
      } catch (_) {
        const cached = await appCache.match(req, { ignoreSearch: true });
        if (cached) return cached;
        if (req.mode === "navigate") {
          const fallback = await appCache.match("./index.html");
          if (fallback) return fallback;
        }
        return new Response("Offline", { status: 503 });
      }
    })());
  }
});
