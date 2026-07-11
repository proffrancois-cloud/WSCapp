import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const APP_DIR = path.join(ROOT, "app");
const args = process.argv.slice(2);
const artifactIndex = args.indexOf("--artifact");
const artifactArg = artifactIndex >= 0 ? args[artifactIndex + 1] : null;
const artifactEqualsArg = args.find((arg) => arg.startsWith("--artifact="));
const artifactRootArg = artifactEqualsArg ? artifactEqualsArg.slice("--artifact=".length) : artifactArg;
const SERVER_DIR = artifactRootArg
  ? path.resolve(process.cwd(), artifactRootArg)
  : APP_DIR;
const PORT = Number(process.env.WSC_PWA_RETIRE_PORT || 4197);
const BASE_URL = `http://localhost:${PORT}`;
const DEFAULT_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const CACHE_PREFIX = "wsc-routes-";
const LEGACY_CACHE = "wsc-routes-legacy-shell";
const LEGACY_WORKER_CACHE = "wsc-routes-legacy-worker";
const RESET_STORAGE_KEY = "wsc-pwa-reset-version";
const RETIRED_STORAGE_KEY = "wsc-service-worker-retired-version";

if (!fs.existsSync(SERVER_DIR) || !fs.statSync(SERVER_DIR).isDirectory()) {
  throw new Error(`PWA retirement runtime root does not exist: ${SERVER_DIR}`);
}

const indexHtml = fs.readFileSync(path.join(SERVER_DIR, "index.html"), "utf8");
const resetVersion = indexHtml.match(/window\.WSC_PWA_RESET_VERSION\s*=\s*"([^"]+)"/)?.[1] || "";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findCachedPlaywright() {
  const home = process.env.HOME;
  if (!home) {
    return null;
  }
  const npxDir = path.join(home, ".npm/_npx");
  if (!fs.existsSync(npxDir)) {
    return null;
  }
  for (const entry of fs.readdirSync(npxDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const candidate = path.join(npxDir, entry.name, "node_modules/playwright");
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function loadPlaywright() {
  const appRequire = createRequire(path.join(APP_DIR, "package.json"));
  try {
    return appRequire("playwright");
  } catch (_appError) {
    const toolRequire = createRequire(import.meta.url);
    try {
      return toolRequire("playwright");
    } catch (_toolError) {
      const cached = findCachedPlaywright();
      if (cached) {
        return toolRequire(cached);
      }
    }
  }
  throw new Error("Playwright is not available. Install Playwright to run PWA retirement runtime tests.");
}

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
    case ".webmanifest":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".svg":
      return "image/svg+xml";
    case ".ico":
      return "image/x-icon";
    case ".mp3":
      return "audio/mpeg";
    case ".mp4":
      return "video/mp4";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}

function legacyWorkerSource() {
  return `
const LEGACY_CACHE = ${JSON.stringify(LEGACY_WORKER_CACHE)};
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await self.caches.open(LEGACY_CACHE);
    await cache.put(new Request("./legacy-worker-shell.txt"), new Response("legacy worker cache"));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", () => {
  // The old worker is present but intentionally lets network requests pass through.
});
`;
}

function seedPageSource() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>WSC PWA legacy seed</title>
  </head>
  <body>
    <script>
      (async () => {
        try {
          const cache = await window.caches.open(${JSON.stringify(LEGACY_CACHE)});
          await cache.put(new Request("./legacy-shell.txt"), new Response("legacy route shell"));
          const registration = await navigator.serviceWorker.register("./__wsc-old-worker.js?legacy=1", { scope: "./" });
          await navigator.serviceWorker.ready;
          if (!navigator.serviceWorker.controller && window.sessionStorage.getItem("wsc-pwa-seed-reloaded") !== "1") {
            window.sessionStorage.setItem("wsc-pwa-seed-reloaded", "1");
            window.location.reload();
            return;
          }
          window.__WSC_SEED_READY__ = true;
          document.body.dataset.seedReady = "true";
          document.body.dataset.scope = registration.scope || "";
        } catch (error) {
          window.__WSC_SEED_ERROR__ = error && error.message ? error.message : String(error);
          document.body.dataset.seedError = window.__WSC_SEED_ERROR__;
        }
      })();
    </script>
  </body>
</html>`;
}

function createServer() {
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", BASE_URL);
    const pathname = decodeURIComponent(requestUrl.pathname);

    if (pathname === "/__wsc-old-worker.js") {
      response.writeHead(200, {
        "Content-Type": "text/javascript; charset=utf-8",
        "Cache-Control": "no-store",
        "Service-Worker-Allowed": "/"
      });
      response.end(legacyWorkerSource());
      return;
    }

    if (pathname === "/__wsc-seed.html") {
      response.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      });
      response.end(seedPageSource());
      return;
    }

    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const resolvedPath = path.resolve(SERVER_DIR, relativePath);
    if (!resolvedPath.startsWith(SERVER_DIR + path.sep) && resolvedPath !== SERVER_DIR) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.stat(resolvedPath, (statError, stat) => {
      if (statError || !stat.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": contentTypeFor(resolvedPath),
        "Cache-Control": "no-store"
      });
      fs.createReadStream(resolvedPath).pipe(response);
    });
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(PORT, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

async function collectPwaState(page) {
  return page.evaluate(async ({ cachePrefix, resetKey, retiredKey }) => {
    const registrations = "serviceWorker" in navigator && typeof navigator.serviceWorker.getRegistrations === "function"
      ? await navigator.serviceWorker.getRegistrations()
      : [];
    const cachesKeys = "caches" in window ? await window.caches.keys() : [];
    const routeCaches = cachesKeys.filter((cacheName) => cacheName.startsWith(cachePrefix));
    return {
      controllerScriptURL: navigator.serviceWorker?.controller?.scriptURL || "",
      registrationScopes: registrations.map((registration) => registration.scope),
      routeCaches,
      resetVersion: window.localStorage.getItem(resetKey) || "",
      retiredVersion: window.localStorage.getItem(retiredKey) || "",
      retireReload: window.sessionStorage.getItem("wsc-service-worker-retire-reload") || "",
      statusText: document.querySelector("#installStatus")?.textContent?.trim() || "",
      appReady: window.WSC_APP_READY === true,
      bodyClass: document.body.className
    };
  }, { cachePrefix: CACHE_PREFIX, resetKey: RESET_STORAGE_KEY, retiredKey: RETIRED_STORAGE_KEY });
}

async function runRetirementSmoke(browser) {
  const context = await browser.newContext({
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
    serviceWorkers: "allow"
  });
  const page = await context.newPage();
  const messages = [];
  page.on("console", (message) => messages.push({ type: message.type(), text: message.text() }));
  page.on("pageerror", (error) => messages.push({ type: "pageerror", text: error.message }));

  try {
    await page.goto(`${BASE_URL}/__wsc-seed.html`, { waitUntil: "load", timeout: 30000 });
    await page.waitForFunction(() => window.__WSC_SEED_READY__ === true || window.__WSC_SEED_ERROR__, null, { timeout: 30000 });
    const seedError = await page.evaluate(() => window.__WSC_SEED_ERROR__ || "");
    if (seedError) {
      throw new Error(`Legacy PWA seed failed: ${seedError}`);
    }

    const seeded = await collectPwaState(page);

    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("load", { timeout: 60000 });
    await page.waitForFunction(() => window.WSC_APP_READY === true, null, { timeout: 60000 });

    await page.waitForFunction(({ cachePrefix, resetKey, retiredKey, expectedVersion }) => {
      return Promise.all([
        window.caches.keys(),
        navigator.serviceWorker.getRegistrations()
      ]).then(([cacheKeys, registrations]) => {
        const routeCaches = cacheKeys.filter((cacheName) => cacheName.startsWith(cachePrefix));
        const hasRouteRegistration = registrations.some((registration) => {
          const appScope = new URL("./", window.location.href).href;
          return registration.scope === appScope || registration.scope.startsWith(appScope);
        });
        return routeCaches.length === 0 &&
          !hasRouteRegistration &&
          window.localStorage.getItem(resetKey) === expectedVersion &&
          window.localStorage.getItem(retiredKey) === expectedVersion &&
          window.WSC_APP_READY === true;
      });
    }, {
      cachePrefix: CACHE_PREFIX,
      resetKey: RESET_STORAGE_KEY,
      retiredKey: RETIRED_STORAGE_KEY,
      expectedVersion: resetVersion
    }, { timeout: 60000 });

    const retired = await collectPwaState(page);
    return { seeded, retired, messages };
  } finally {
    await context.close();
  }
}

async function main() {
  const failures = [];
  if (!resetVersion) {
    failures.push("index.html must declare WSC_PWA_RESET_VERSION for PWA retirement checks.");
  }

  const server = createServer();
  let browser = null;

  try {
    await listen(server);
    await sleep(100);

    if (!failures.length) {
      const { chromium } = loadPlaywright();
      browser = await chromium.launch({
        headless: true,
        executablePath: process.env.CHROME_PATH || (fs.existsSync(DEFAULT_CHROME_PATH) ? DEFAULT_CHROME_PATH : undefined)
      });
      const result = await runRetirementSmoke(browser);
      await browser.close();
      browser = null;

      if (!result.seeded.routeCaches.includes(LEGACY_CACHE) || !result.seeded.routeCaches.includes(LEGACY_WORKER_CACHE)) {
        failures.push(`legacy PWA seed did not create expected WSC route caches (${JSON.stringify(result.seeded.routeCaches)})`);
      }
      if (!result.seeded.registrationScopes.length || !result.seeded.controllerScriptURL.includes("__wsc-old-worker.js")) {
        failures.push(`legacy PWA seed did not control the page with the old worker (${JSON.stringify(result.seeded)})`);
      }
      if (result.retired.routeCaches.length) {
        failures.push(`PWA retirement left stale route caches behind (${JSON.stringify(result.retired.routeCaches)})`);
      }
      if (result.retired.registrationScopes.length) {
        failures.push(`PWA retirement left service worker registrations behind (${JSON.stringify(result.retired.registrationScopes)})`);
      }
      if (result.retired.resetVersion !== resetVersion || result.retired.retiredVersion !== resetVersion) {
        failures.push(`PWA retirement did not store the current reset version (${JSON.stringify(result.retired)})`);
      }
      if (!result.retired.appReady) {
        failures.push("app was not ready after stale PWA retirement.");
      }

      const severeMessages = result.messages.filter((message) =>
        ["error", "pageerror"].includes(message.type) &&
        !message.text.includes("Failed to load resource") &&
        message.text !== "Permissions policy violation: compute-pressure is not allowed in this document."
      );
      if (severeMessages.length) {
        failures.push(`severe console messages during PWA retirement: ${JSON.stringify(severeMessages)}`);
      }

      console.log(JSON.stringify({
        baseUrl: BASE_URL,
        servedRoot: SERVER_DIR,
        mode: SERVER_DIR === APP_DIR ? "source" : "artifact",
        resetVersion,
        ...result,
        failures
      }, null, 2));
    } else {
      console.log(JSON.stringify({
        baseUrl: BASE_URL,
        servedRoot: SERVER_DIR,
        mode: SERVER_DIR === APP_DIR ? "source" : "artifact",
        resetVersion,
        failures
      }, null, 2));
    }

    if (failures.length) {
      console.error(`PWA retirement runtime smoke failed:\n- ${failures.join("\n- ")}`);
      process.exit(1);
    }
  } finally {
    await browser?.close().catch(() => {});
    await closeServer(server).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
