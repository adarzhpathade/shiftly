/* shiftly service worker (hand-written, no build step). */
const VERSION = "v1";
const STATIC_CACHE = `shiftly-static-${VERSION}`;
const KEEP = [STATIC_CACHE];

const OFFLINE_URL = "/offline";
const PRECACHE = [
  OFFLINE_URL,
  "/icons/icon-192",
  "/icons/icon-512",
  "/icons/maskable-512",
  "/icons/apple-180",
  "/icons/favicon-32",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("shiftly-") && !KEEP.includes(k))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

// Network-first for pages; fall back to the precached /offline page.
async function navigate(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    return (
      (await cache.match(OFFLINE_URL)) ||
      new Response("Offline", { status: 503, statusText: "Offline" })
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(navigate(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    request.destination === "font"
  ) {
    event.respondWith(cacheFirst(request));
  }
});

/* ---- TODO(B6): web push. Stubs only; wire up in task B6. ---- */
self.addEventListener("push", (event) => {
  // const data = event.data ? event.data.json() : {};
  // event.waitUntil(
  //   self.registration.showNotification(data.title, {
  //     body: data.body,
  //     icon: "/icons/icon-192",
  //   }),
  // );
  void event;
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  // event.waitUntil(self.clients.openWindow(event.notification.data?.url || "/"));
});
