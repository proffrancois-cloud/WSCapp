// Keep the shell flexible: network-first for files that change often,
// cache-first only for stable media so Vercel deploys show up quickly.
const BUILD_VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const STATIC_CACHE = `wsc-routes-static-${BUILD_VERSION}`;
const RUNTIME_CACHE = `wsc-routes-runtime-${BUILD_VERSION}`;

const STATIC_ASSETS = [
  "./app-icons/icon-32.png",
  "./app-icons/icon-192.png",
  "./app-icons/icon-512.png",
  "./app-icons/apple-touch-icon-180.png",
  "./assets/footer/contact-icon.png",
  "./assets/footer/link-icon.png",
  "./assets/footer/logout-icon.png",
  "./assets/icons/ui/signin.png",
  "./assets/icons/ui/alpaca-bullet-sunglasses.png",
  "./assets/icons/letters/A.png",
  "./assets/icons/letters/B.png",
  "./assets/icons/letters/C.png",
  "./assets/icons/letters/D.png",
  "./assets/screens/hero/alpaca-hero-victory.png",
  "./assets/screens/checkpoints/alpaca-checkpoint-success.png",
  "./assets/screens/checkpoints/alpaca-checkpoint-fail.png",
  "./assets/mascot/core/alpaca-happy-icon.png",
  "./assets/mascot/core/alpaca-sad-icon.png",
  "./assets/mascot/core/alpaca-wise-icon.png",
  "./assets/mascot/core/alpaca-determined-icon.png",
  "./assets/mascot/core/alpaca-neutral-icon.png",
  "./assets/mascot/core/alpaca-excited-icon.png",
  "./assets/mascot/core/alpaca-victory-icon.png",
  "./assets/mascot/library/final-pack/Buzz.png",
  "./assets/mascot/library/final-pack/card-crops/Buzz.png",
  "./assets/mascot/library/final-pack/schalorsbowl.png",
  "./assets/scholars-bowl/stimuli/airport-limbo.svg",
  "./assets/scholars-bowl/stimuli/apocalypse-lyric.svg",
  "./assets/scholars-bowl/stimuli/ranking-storm.svg",
  "./assets/scholars-bowl/stimuli/prototype-demo.svg",
  "./assets/scholars-bowl/stimuli/home-split-screen.svg",
  "./assets/scholars-bowl/stimuli/recalculating-map.svg",
  "./assets/scholars-bowl/stimuli/threshold-line.svg",
  "./assets/scholars-bowl/stimuli/connection-board.svg",
  "./assets/mascot/library/final-pack/Train.png",
  "./assets/mascot/library/final-pack/card-crops/Train.png",
  "./assets/mascot/library/final-pack/Family.png",
  "./assets/mascot/library/final-pack/card-crops/Family.png",
  "./assets/mascot/library/final-pack/section-card-crops/Family.png",
  "./assets/mascot/library/final-pack/alpacachannel.png",
  "./assets/mascot/library/final-pack/card-crops/alpacachannel.png",
  "./assets/mascot/library/final-pack/Backtotop.png",
  "./assets/mascot/library/final-pack/Alpacagroupe.png",
  "./assets/mascot/library/final-pack/DebateLab.png",
  "./assets/mascot/library/final-pack/debate-pro-logo.png",
  "./assets/mascot/library/final-pack/debate-con-logo.png",
  "./content/debate/debate-lab-data.js",
  "./content/debate/debate-judge-instructions.pdf",
  "./assets/Alpacajump/Background.png",
  "./assets/Alpacajump/alpacarunner.png",
  "./assets/Alpacajump/gameicone.png",
  "./assets/Alpacajump/alpacaducking.png",
  "./assets/Alpacajump/alpacahurting.png",
  "./assets/Alpacajump/alpacajumping.png",
  "./assets/Alpacajump/monstertojump.png",
  "./assets/Alpacajump/monstertoduck.png",
  "./assets/Alpacajump/questiongenie.png",
  "./assets/run/alpaca-run-world-map.png",
  "./assets/run/alpaca-run-cursor.png",
  "./assets/run/regional-stop-marker-stateful.svg",
  "./assets/run/global-round-marker.svg",
  "./assets/run/alpaca-run-yale-destination.svg",
  "./assets/boards/jeopardy/alpacapardy-category-header.svg",
  "./assets/boards/jeopardy/alpacapardy-value-tile-skin.svg",
  "./assets/boards/jeopardy/alpacapardy-tile-used.svg",
  "./assets/multiplayer/relay/multiplayer-team-card-skin.svg",
  "./assets/multiplayer/relay/multiplayer-keycap-s.svg",
  "./assets/multiplayer/relay/multiplayer-keycap-f.svg",
  "./assets/multiplayer/relay/multiplayer-keycap-h.svg",
  "./assets/multiplayer/relay/multiplayer-keycap-l.svg",
  "./assets/multiplayer/relay/multiplayer-buzz-winner-highlight.svg",
  "./assets/race/race-timer-widget.svg",
  "./assets/race/race-life-pip-active.svg",
  "./assets/race/race-life-pip-spent.svg",
  "./assets/race/race-life-pip-warning.svg"
];

function isSameOrigin(requestUrl) {
  return requestUrl.origin === self.location.origin;
}

function isVolatilePath(pathname) {
  return (
    pathname.endsWith("/") ||
    pathname.endsWith(".html") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".webmanifest")
  );
}

async function updateCache(cacheName, request, response) {
  if (!response || response.status !== 200 || response.type === "opaque") {
    return response;
  }

  const cache = await caches.open(cacheName);
  await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request, fallbackKey = null) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    return await updateCache(RUNTIME_CACHE, request, response);
  } catch (_error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    if (fallbackKey) {
      const fallback = await caches.match(fallbackKey);
      if (fallback) {
        return fallback;
      }
    }

    throw _error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  return updateCache(STATIC_CACHE, request, response);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(["./", "./index.html", ...STATIC_ASSETS])).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (!isSameOrigin(url)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }

  if (isVolatilePath(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});
