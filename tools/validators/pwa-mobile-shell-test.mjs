import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const APP_DIR = path.join(ROOT, "app");
const args = process.argv.slice(2);
const artifactIndex = args.indexOf("--artifact");
const artifactArg = artifactIndex >= 0 ? args[artifactIndex + 1] : null;
const artifactEqualsArg = args.find((arg) => arg.startsWith("--artifact="));
const shellRoot = artifactEqualsArg
  ? path.resolve(process.cwd(), artifactEqualsArg.slice("--artifact=".length))
  : artifactArg
    ? path.resolve(process.cwd(), artifactArg)
    : APP_DIR;
const failures = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(shellRoot, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(path.join(shellRoot, relativePath));
}

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

assert(fs.existsSync(shellRoot) && fs.statSync(shellRoot).isDirectory(), `PWA shell root does not exist: ${shellRoot}`);

const requiredFiles = [
  "index.html",
  "styles.css",
  "styles-responsive-devices.css",
  "manifest.webmanifest",
  "service-worker.js",
  "pwa.js",
  "app-icons/icon-192.png",
  "app-icons/icon-512.png",
  "app-icons/apple-touch-icon-180.png"
];

for (const relativePath of requiredFiles) {
  assert(exists(relativePath), `Missing PWA/mobile shell file: ${relativePath}`);
}

if (!failures.length) {
  const indexHtml = readText("index.html");
  const stylesCss = readText("styles.css");
  const responsiveCss = readText("styles-responsive-devices.css");
  const manifest = readJson("manifest.webmanifest");
  const serviceWorker = readText("service-worker.js");
  const pwaRuntime = readText("pwa.js");
  const resetVersion = indexHtml.match(/window\.WSC_PWA_RESET_VERSION\s*=\s*"([^"]+)"/)?.[1] || "";

  assert(indexHtml.includes('name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"'), "index.html must use viewport-fit=cover for mobile safe areas.");
  assert(indexHtml.includes('<div id="orientationGateMount" hidden></div>'), "index.html must include the orientation gate mount.");
  assert(indexHtml.includes("apple-mobile-web-app-capable"), "index.html should retain iOS standalone metadata.");
  assert(indexHtml.includes("apple-mobile-web-app-title"), "index.html should retain the iOS app title.");
  assert(Boolean(resetVersion), "index.html must declare WSC_PWA_RESET_VERSION.");
  assert(resetVersion && indexHtml.includes(`./styles.css?v=${resetVersion}`), "styles.css should use the current PWA reset version token.");
  assert(resetVersion && indexHtml.includes(`./manifest.webmanifest?v=${resetVersion}`), "manifest href should use the current PWA reset version token.");

  const importIndex = stylesCss.indexOf('url("./styles-responsive-devices.css")');
  assert(importIndex >= 0, "styles.css must import styles-responsive-devices.css.");
  assert(importIndex > stylesCss.indexOf('url("./styles-online-overrides.css")'), "responsive device CSS should be imported after existing app overrides.");
  assert(responsiveCss.includes("--wsc-safe-top: env(safe-area-inset-top"), "responsive CSS must define safe-area inset variables.");
  assert(responsiveCss.includes("--wsc-viewport-height: 100vh"), "responsive CSS must define a viewport-height fallback variable.");
  assert(responsiveCss.includes(".orientation-gate"), "responsive CSS must style the landscape orientation gate.");
  assert(responsiveCss.includes("body.is-touch-landscape"), "responsive CSS must include touch-landscape layout rules.");
  assert(responsiveCss.includes(".hero-links.is-open"), "responsive CSS must include the touch header menu popover rules.");
  assert(responsiveCss.includes(".auth-modal-overlay"), "responsive CSS must harden modal overlays for touch landscape.");
  assert(responsiveCss.includes(".app-settings-slider"), "responsive CSS must enlarge settings slider touch handling.");
  assert(responsiveCss.includes("overscroll-behavior: contain"), "responsive CSS must contain modal/overlay overscroll on touch devices.");
  assert(responsiveCss.includes("@media (hover: hover) and (pointer: fine) and (min-width: 1501px)"), "responsive CSS must cap large desktop layouts.");
  assert(responsiveCss.includes(".experience-panel--rawcontent"), "responsive CSS should not rely only on :has() for long raw-content panels.");
  assert(responsiveCss.includes(".experience-panel--regularguide"), "responsive CSS should not rely only on :has() for long regular-guide panels.");
  assert(responsiveCss.includes(".has-open-mode-column"), "responsive CSS should not rely only on :has() for open mode-choice boards.");
  assert(responsiveCss.includes(".has-active-mode-column"), "responsive CSS should include explicit active mode-choice board fallback classes.");
  assert(responsiveCss.includes(".is-mode-path-play"), "responsive CSS should include explicit mode path fallback classes.");
  assert(/max-height:\s*calc\(100vh/.test(responsiveCss), "responsive CSS should include a 100vh fallback before 100dvh sizing.");
  assert(/max-height:\s*calc\(100dvh/.test(responsiveCss), "responsive CSS should include modern 100dvh sizing for mobile browser chrome.");
  assert(/var\(--wsc-viewport-height\)/.test(responsiveCss), "responsive CSS should use the JS-synced viewport-height variable for WebView-safe sizing.");

  assert(manifest.display === "standalone", "manifest display should be standalone.");
  assert(manifest.orientation === "landscape", "manifest orientation should be landscape.");
  assert(manifest.start_url === "./", "manifest start_url should stay relative.");
  assert(manifest.scope === "./", "manifest scope should stay relative.");
  assert(manifest.background_color === "#f3e3bc", "manifest background color should match app shell.");
  assert(manifest.theme_color === "#8a6338", "manifest theme color should match app shell.");
  assert((manifest.icons || []).some((icon) => icon.src === "./app-icons/icon-192.png" && icon.sizes === "192x192"), "manifest must include the 192px icon.");
  assert((manifest.icons || []).some((icon) => icon.src === "./app-icons/icon-512.png" && icon.sizes === "512x512"), "manifest must include the 512px icon.");

  assert(serviceWorker.includes("self.registration.unregister()"), "service-worker.js must unregister itself.");
  assert(serviceWorker.includes("WSC_SERVICE_WORKER_RETIRED"), "service-worker.js should notify clients about retirement.");
  assert(serviceWorker.includes("deleteRouteCaches"), "service-worker.js should delete old WSC caches.");
  assert(!serviceWorker.includes("cache.addAll"), "service-worker.js must not precache app shell files.");
  assert(!serviceWorker.includes("STATIC_ASSETS"), "service-worker.js must not define stale static asset precaches.");
  assert(!/addEventListener\((?:\"|')fetch(?:\"|')/.test(serviceWorker), "service-worker.js must not intercept fetches.");

  assert(pwaRuntime.includes("unregisterRouteServiceWorkers"), "pwa.js must unregister existing route service workers.");
  assert(pwaRuntime.includes("deleteRouteCaches"), "pwa.js must delete old WSC caches.");
  assert(pwaRuntime.includes("beforeinstallprompt"), "pwa.js must handle install prompts.");
  assert(pwaRuntime.includes("event.preventDefault()"), "pwa.js must prevent stale-cache browser install prompts.");
  assert(!pwaRuntime.includes(".register("), "pwa.js must not register a new service worker.");
}

const report = {
  shellRoot,
  mode: shellRoot === APP_DIR ? "source" : "artifact",
  checkedFiles: requiredFiles,
  failures
};

console.log(JSON.stringify(report, null, 2));

if (failures.length) {
  console.error(`PWA mobile shell test failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
