// Retired service worker.
//
// GitHub Pages already serves this app as static files. Keeping an app-shell
// service worker on top of Pages made old deployments too easy to pin in
// browsers that had previously installed the PWA. This worker exists only so
// older registered workers update to this file, clear WSC caches, and unregister.

const RETIRE_VERSION = new URL(self.location.href).searchParams.get("v") || "retired";
const CACHE_PREFIX = "wsc-routes-";

function isRouteCache(cacheName) {
  return typeof cacheName === "string" && cacheName.startsWith(CACHE_PREFIX);
}

async function deleteRouteCaches() {
  if (!self.caches) {
    return;
  }

  const keys = await self.caches.keys();
  await Promise.all(keys.filter(isRouteCache).map((key) => self.caches.delete(key)));
}

async function notifyClients() {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  await Promise.all(
    clients.map(async (client) => {
      try {
        client.postMessage({ type: "WSC_SERVICE_WORKER_RETIRED", version: RETIRE_VERSION });
      } catch (_error) {}

      try {
        if (typeof client.navigate === "function" && client.url) {
          await client.navigate(client.url);
        }
      } catch (_error) {}
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    deleteRouteCaches()
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
      .then(notifyClients)
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  }
});

// Intentionally no fetch handler: all requests go straight to the network/CDN.
