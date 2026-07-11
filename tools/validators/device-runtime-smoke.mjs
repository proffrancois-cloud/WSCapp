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
const DEFAULT_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WINDOWS_CHROME_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36";
const failures = [];

if (!fs.existsSync(SERVER_DIR) || !fs.statSync(SERVER_DIR).isDirectory()) {
  throw new Error(`Device runtime test root does not exist: ${SERVER_DIR}`);
}

const CAMPUS_VIEWPORTS = [
  {
    id: "phone-landscape",
    label: "Phone landscape campus",
    viewport: { width: 844, height: 390 },
    resizeTo: { width: 740, height: 360 },
    hasTouch: true,
    isMobile: true,
    bodyClass: "is-online-mode is-campus2d-view is-touch-device prefers-landscape-device is-touch-landscape"
  },
  {
    id: "ipad-landscape",
    label: "iPad landscape campus",
    viewport: { width: 1180, height: 820 },
    resizeTo: { width: 1024, height: 768 },
    hasTouch: true,
    isMobile: true,
    bodyClass: "is-online-mode is-campus2d-view is-touch-device prefers-landscape-device is-touch-landscape"
  },
  {
    id: "windows-tablet-landscape",
    label: "Windows tablet campus",
    viewport: { width: 1280, height: 800 },
    resizeTo: { width: 1112, height: 744 },
    hasTouch: true,
    isMobile: false,
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { platform: "Win32", maxTouchPoints: 10 },
    bodyClass: "is-online-mode is-campus2d-view is-touch-device prefers-landscape-device is-touch-landscape"
  },
  {
    id: "windows-laptop",
    label: "Windows laptop campus",
    viewport: { width: 1366, height: 768 },
    resizeTo: { width: 1280, height: 720 },
    hasTouch: false,
    isMobile: false,
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { platform: "Win32" },
    bodyClass: "is-online-mode is-campus2d-view"
  }
];

function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml; charset=utf-8",
    ".wav": "audio/wav",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".webp": "image/webp"
  }[extension] || "application/octet-stream";
}

function buildCampusTestHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>WSC Campus 2D Device Runtime Smoke</title>
    <link rel="stylesheet" href="/styles.css" />
    <style>
      html,
      body {
        margin: 0;
        min-height: 100%;
        background: #f3e3bc;
      }
      .device-runtime-shell {
        min-height: 100dvh;
      }
      .campus2d-online-shell {
        height: var(--campus2d-shell-height, 100dvh) !important;
        min-height: 0 !important;
        padding: 0 !important;
      }
    </style>
  </head>
  <body>
    <main class="device-runtime-shell">
      <section class="campus2d-online-shell" data-campus2d-shell>
        <div id="campus2dMount" class="campus2d-mount" data-campus2d-mount></div>
      </section>
    </main>
    <script src="/src/features/campus-2d/manifest.js"></script>
    <script src="/src/features/campus-2d/debate-lab-rules.js"></script>
    <script src="/src/features/campus-2d/debate-lab-audio.js"></script>
    <script src="/src/features/campus-2d/campus-2d.js"></script>
    <script>
      (() => {
        const params = new URLSearchParams(window.location.search);
        document.body.className = params.get("bodyClass") || "";
        window.__WSC_CAMPUS_TEST_EVENTS = [];
        try {
          window.__WSC_CAMPUS_TEST_CONTROLLER = window.WSC_CAMPUS_2D.mount({
            mount: document.querySelector("[data-campus2d-mount]"),
            identity: {
              clientId: "device-runtime-test",
              displayName: "Device Tester",
              alpacaName: "Device Tester",
              schoolName: "Responsive QA",
              country: "Test",
              wscEventCount: 3,
              highestWscRound: "global",
              debugAllowed: true
            },
            onCampusZoneAction(payload) {
              window.__WSC_CAMPUS_TEST_EVENTS.push({ type: "zone", payload });
              return true;
            },
            submitFeedback: async (payload) => {
              window.__WSC_CAMPUS_TEST_EVENTS.push({ type: "feedback", payload });
              return { ok: true };
            }
          });
          window.__WSC_CAMPUS_TEST_READY = true;
        } catch (error) {
          window.__WSC_CAMPUS_TEST_ERROR = error?.message || String(error);
          throw error;
        }
      })();
    </script>
  </body>
</html>`;
}

function createStaticServer() {
  const campusHtml = buildCampusTestHtml();
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/__campus2d-responsive-test.html") {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(campusHtml);
      return;
    }

    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const absolutePath = path.resolve(SERVER_DIR, relativePath);
    if (!absolutePath.startsWith(SERVER_DIR + path.sep) && absolutePath !== SERVER_DIR) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": getMimeType(absolutePath)
    });
    fs.createReadStream(absolutePath).pipe(response);
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      const address = server.address();
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}

function closeServer(server) {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
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

  throw new Error("Playwright is not available. Run `npx playwright --version` once or install Playwright to run device runtime tests.");
}

function viewportOptions(config) {
  const options = {
    viewport: config.viewport,
    hasTouch: config.hasTouch,
    isMobile: config.isMobile,
    deviceScaleFactor: config.isMobile ? 2 : 1,
    serviceWorkers: "block"
  };
  if (config.userAgent) {
    options.userAgent = config.userAgent;
  }
  return options;
}

async function applyNavigatorOverrides(context, overrides = {}) {
  if (!Object.keys(overrides).length) {
    return;
  }
  await context.addInitScript((values) => {
    for (const [property, value] of Object.entries(values)) {
      Object.defineProperty(Navigator.prototype, property, {
        configurable: true,
        get: () => value
      });
    }
  }, overrides);
}

async function waitForVisibleArea(page, selector, minimumRatio, timeout = 8000) {
  await page.waitForFunction(({ targetSelector, ratio }) => {
    const element = document.querySelector(targetSelector);
    if (!element) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return false;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const visibleWidth = Math.max(0, Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
    return (visibleWidth * visibleHeight) / (rect.width * rect.height) >= ratio;
  }, { targetSelector: selector, ratio: minimumRatio }, { timeout });
}

async function chooseLocalRoute(page) {
  await page.waitForSelector('[data-app-entry-choice="local"]', { timeout: 30000 });
  await page.evaluate(() => {
    document.querySelector('[data-app-entry-choice="local"]')?.click();
  });
  await page.waitForFunction(() => !document.querySelector(".app-entry-gate-overlay"), null, { timeout: 40000 });
  await page.evaluate(() => {
    document.querySelector("[data-close-cooperation]")?.click();
  });
  await page.waitForFunction(() => {
    return !document.querySelector('[role="dialog"][aria-modal="true"]')
      && !document.body.classList.contains("with-popup")
      && !document.querySelector("#routeBuilder")?.inert;
  }, null, { timeout: 40000 });
}

async function collectOrientationAudit(page) {
  return page.evaluate(() => {
    const gateMount = document.querySelector("#orientationGateMount");
    const gate = gateMount?.querySelector(".orientation-gate");
    const rootStyle = window.getComputedStyle(document.documentElement);
    const visible = (element) => {
      if (!element) {
        return false;
      }
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    return {
      bodyClass: document.body.className,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        visualHeight: window.visualViewport?.height || window.innerHeight
      },
      viewportCss: {
        width: rootStyle.getPropertyValue("--wsc-viewport-width").trim(),
        height: rootStyle.getPropertyValue("--wsc-viewport-height").trim()
      },
      gate: {
        mountPresent: Boolean(gateMount),
        mountHidden: Boolean(gateMount?.hidden),
        visible: visible(gate),
        focusInside: Boolean(gate && gate.contains(document.activeElement)),
        backgroundInert: Boolean(gate) && [...document.body.children]
          .filter((child) => child !== gateMount)
          .filter((child) => !["SCRIPT", "STYLE", "LINK"].includes(child.tagName))
          .every((child) => child.inert === true && child.getAttribute("aria-hidden") === "true"),
        hiddenDialogPresent: Boolean(document.querySelector("#orientationGateMount[hidden] [role='dialog']"))
      },
      appEntryVisible: visible(document.querySelector(".app-entry-gate-overlay")),
      routeBuilderInert: Boolean(document.querySelector("#routeBuilder")?.inert)
    };
  });
}

function pushOrientationFailures(label, audit, expected) {
  const cssViewportWidth = Number.parseFloat(audit.viewportCss?.width || "");
  const cssViewportHeight = Number.parseFloat(audit.viewportCss?.height || "");
  if (!Number.isFinite(cssViewportWidth) || Math.abs(cssViewportWidth - audit.viewport.width) > 1) {
    failures.push(`${label}: CSS viewport width variable is stale (${JSON.stringify({ css: audit.viewportCss?.width, viewport: audit.viewport.width })})`);
  }
  if (!Number.isFinite(cssViewportHeight) || Math.abs(cssViewportHeight - audit.viewport.visualHeight) > 1) {
    failures.push(`${label}: CSS viewport height variable is stale (${JSON.stringify({ css: audit.viewportCss?.height, visualHeight: audit.viewport.visualHeight })})`);
  }
  if (!audit.gate.mountPresent) {
    failures.push(`${label}: orientation gate mount is missing`);
  }
  if (audit.gate.hiddenDialogPresent) {
    failures.push(`${label}: hidden orientation gate leaves a dialog in the DOM`);
  }
  if (expected.needsLandscape) {
    if (!audit.bodyClass.includes("needs-landscape") || !audit.gate.visible) {
      failures.push(`${label}: portrait touch viewport should show the landscape gate`);
    }
    if (!audit.gate.focusInside) {
      failures.push(`${label}: visible landscape gate should trap focus`);
    }
    if (!audit.gate.backgroundInert) {
      failures.push(`${label}: visible landscape gate should inert background content`);
    }
    return;
  }

  if (audit.bodyClass.includes("needs-landscape") || audit.gate.visible || !audit.gate.mountHidden) {
    failures.push(`${label}: landscape viewport should hide the landscape gate`);
  }
  if (expected.touchLandscape && !audit.bodyClass.includes("is-touch-landscape")) {
    failures.push(`${label}: landscape touch viewport should use is-touch-landscape`);
  }
  if (expected.appEntryVisible && !audit.appEntryVisible) {
    failures.push(`${label}: app entry gate should be restored after leaving portrait gate`);
  }
  if (audit.routeBuilderInert) {
    failures.push(`${label}: route builder should not remain inert after landscape gate hides`);
  }
}

async function runOrientationTransitionSmoke(browser, baseUrl) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
    serviceWorkers: "block"
  });
  const page = await context.newPage();
  const messages = [];
  page.on("console", (message) => messages.push({ type: message.type(), text: message.text() }));
  page.on("pageerror", (error) => messages.push({ type: "pageerror", text: error.message }));

  try {
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => window.WSC_APP_READY === true, null, { timeout: 60000 });

    const portraitBefore = await collectOrientationAudit(page);
    pushOrientationFailures("Orientation transition portrait boot", portraitBefore, { needsLandscape: true });

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForFunction(() => {
      return document.body.classList.contains("is-touch-landscape")
        && !document.body.classList.contains("needs-landscape")
        && document.querySelector("#orientationGateMount")?.hidden === true;
    }, null, { timeout: 10000 });
    const landscapeBeforeEntry = await collectOrientationAudit(page);
    pushOrientationFailures("Orientation transition landscape entry", landscapeBeforeEntry, {
      needsLandscape: false,
      touchLandscape: true,
      appEntryVisible: true
    });

    await chooseLocalRoute(page);
    const landscapeAfterEntry = await collectOrientationAudit(page);
    pushOrientationFailures("Orientation transition landscape local route", landscapeAfterEntry, {
      needsLandscape: false,
      touchLandscape: true,
      appEntryVisible: false
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => {
      return document.body.classList.contains("needs-landscape")
        && !document.querySelector("#orientationGateMount")?.hidden;
    }, null, { timeout: 10000 });
    const portraitAfterRoute = await collectOrientationAudit(page);
    pushOrientationFailures("Orientation transition portrait after route", portraitAfterRoute, { needsLandscape: true });

    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForFunction(() => {
      return document.body.classList.contains("is-touch-landscape")
        && !document.body.classList.contains("needs-landscape")
        && document.querySelector("#orientationGateMount")?.hidden === true;
    }, null, { timeout: 10000 });
    const landscapeAfterReturn = await collectOrientationAudit(page);
    pushOrientationFailures("Orientation transition landscape after return", landscapeAfterReturn, {
      needsLandscape: false,
      touchLandscape: true,
      appEntryVisible: false
    });

    return {
      portraitBefore,
      landscapeBeforeEntry,
      landscapeAfterEntry,
      portraitAfterRoute,
      landscapeAfterReturn,
      messages
    };
  } finally {
    await context.close();
  }
}

async function collectCampusAudit(page) {
  return page.evaluate(() => {
    const localRectInfo = (element) => {
      if (!element) {
        return null;
      }
      const rect = element.getBoundingClientRect();
      let clipLeft = 0;
      let clipTop = 0;
      let clipRight = window.innerWidth;
      let clipBottom = window.visualViewport?.height || window.innerHeight;
      for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
        if (ancestor === document.documentElement) {
          break;
        }
        const style = window.getComputedStyle(ancestor);
        const clips = [style.overflow, style.overflowX, style.overflowY]
          .some((value) => ["auto", "clip", "hidden", "scroll"].includes(value));
        if (!clips) {
          continue;
        }
        const ancestorRect = ancestor.getBoundingClientRect();
        clipLeft = Math.max(clipLeft, ancestorRect.left);
        clipTop = Math.max(clipTop, ancestorRect.top);
        clipRight = Math.min(clipRight, ancestorRect.right);
        clipBottom = Math.min(clipBottom, ancestorRect.bottom);
      }
      const visibleWidth = Math.max(0, Math.min(rect.right, clipRight) - Math.max(rect.left, clipLeft));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, clipBottom) - Math.max(rect.top, clipTop));
      return {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        visibleAreaRatio: rect.width > 0 && rect.height > 0
          ? Number(((visibleWidth * visibleHeight) / (rect.width * rect.height)).toFixed(3))
          : 0
      };
    };

    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0);
    const world = document.querySelector(".campus2d-world");
    const map = document.querySelector(".campus2d-map");
    const visibleTargets = [
      ".campus2d-profile-avatar",
      ".campus2d-mute-button",
      ".campus2d-chat-input",
      ".campus2d-chat-submit",
      ".campus2d-report-button",
      ".campus2d-portal",
      ".campus2d-seat"
    ].flatMap((selector) => {
      return [...document.querySelectorAll(selector)]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        })
        .slice(0, 6)
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const rectSummary = localRectInfo(element);
          const rawCenterX = rect.left + rect.width / 2;
          const rawCenterY = rect.top + rect.height / 2;
          const centerInViewport = rawCenterX >= 0 && rawCenterX <= window.innerWidth && rawCenterY >= 0 && rawCenterY <= window.innerHeight;
          const insetX = Math.min(12, Math.max(1, rect.width * 0.24));
          const insetY = Math.min(12, Math.max(1, rect.height * 0.24));
          const points = [
            [rawCenterX, rawCenterY],
            [rect.left + insetX, rect.top + insetY],
            [rect.right - insetX, rect.top + insetY],
            [rect.left + insetX, rect.bottom - insetY],
            [rect.right - insetX, rect.bottom - insetY]
          ].filter(([x, y]) => x >= 0 && x <= window.innerWidth - 1 && y >= 0 && y <= window.innerHeight - 1);
          const hitTestable = points.some(([x, y]) => {
            const topElement = document.elementFromPoint(x, y);
            return Boolean(topElement && (element === topElement || element.contains(topElement)));
          });
          return {
            selector,
            label: element.getAttribute("aria-label") || element.textContent?.replace(/\s+/g, " ").trim() || "",
            rect: rectSummary,
            centerInViewport,
            centerHitTestable: hitTestable,
            hitTestable,
            sampledPoints: points.length
          };
        });
    });

    return {
      ready: window.__WSC_CAMPUS_TEST_READY === true,
      error: window.__WSC_CAMPUS_TEST_ERROR || "",
      bodyClass: document.body.className,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        visualHeight: window.visualViewport?.height || window.innerHeight
      },
      documentWidth,
      horizontalOverflow: Math.max(0, Math.ceil(documentWidth - window.innerWidth)),
      root: localRectInfo(document.querySelector(".campus2d-root")),
      shell: localRectInfo(document.querySelector(".campus2d-online-shell")),
      viewportRect: localRectInfo(document.querySelector(".campus2d-viewport")),
      world: {
        rect: localRectInfo(world),
        transform: window.getComputedStyle(world).transform
      },
      map: {
        rect: localRectInfo(map),
        complete: Boolean(map?.complete),
        naturalWidth: map?.naturalWidth || 0,
        naturalHeight: map?.naturalHeight || 0
      },
      activityPanel: localRectInfo(document.querySelector(".campus2d-activity-panel")),
      controlsPanel: localRectInfo(document.querySelector(".campus2d-controls-panel")),
      playerCard: localRectInfo(document.querySelector(".campus2d-player-card")),
      counts: {
        portals: document.querySelectorAll(".campus2d-portal").length,
        seats: document.querySelectorAll(".campus2d-seat").length,
        hotspots: document.querySelectorAll(".campus2d-hotspot").length,
        npcs: document.querySelectorAll(".campus2d-player.is-npc").length,
        colorSwatches: document.querySelectorAll(".campus2d-color-swatch").length,
        chatBubbles: document.querySelectorAll(".campus2d-chat-bubble").length,
        events: window.__WSC_CAMPUS_TEST_EVENTS?.length || 0
      },
      targets: visibleTargets
    };
  });
}

function pushCampusFailures(label, audit, viewportConfig) {
  if (!audit.ready || audit.error) {
    failures.push(`${label}: Campus 2D did not mount cleanly (${audit.error || "not ready"})`);
  }
  if (audit.horizontalOverflow > 2) {
    failures.push(`${label}: campus runtime has ${audit.horizontalOverflow}px horizontal overflow`);
  }
  for (const [name, rect] of Object.entries({
    root: audit.root,
    shell: audit.shell,
    viewport: audit.viewportRect,
    activityPanel: audit.activityPanel,
    playerCard: audit.playerCard
  })) {
    if (!rect || rect.width <= 0 || rect.height <= 0 || rect.visibleAreaRatio < 0.55) {
      failures.push(`${label}: ${name} is not sufficiently visible (${JSON.stringify(rect)})`);
    }
  }
  if (!audit.map.complete || audit.map.naturalWidth < 800 || audit.map.naturalHeight < 800) {
    failures.push(`${label}: campus map image did not load (${JSON.stringify(audit.map)})`);
  }
  if (!audit.world.transform || audit.world.transform === "none") {
    failures.push(`${label}: campus camera transform was not applied`);
  }
  if (audit.counts.portals < 1 || audit.counts.seats < 1 || audit.counts.colorSwatches < 3) {
    failures.push(`${label}: campus interactive layers look incomplete (${JSON.stringify(audit.counts)})`);
  }

  if (viewportConfig.hasTouch) {
    const undersizedTargets = audit.targets.filter((target) => {
      const rect = target.rect;
      if (!rect || rect.visibleAreaRatio < 0.5) {
        return false;
      }
      return rect.width < 44 || rect.height < 44 || !target.hitTestable;
    });
    if (undersizedTargets.length) {
      failures.push(`${label}: visible campus touch targets are below 44px or not hit-testable (${JSON.stringify(undersizedTargets)})`);
    }
  }
}

async function runCampusKeyboardProbe(page, viewportConfig) {
  if (viewportConfig.id !== "phone-landscape") {
    return null;
  }

  const keyboardViewport = { width: viewportConfig.viewport.width, height: 270 };
  const chatInput = page.locator(".campus2d-chat-input").first();
  await chatInput.waitFor({ state: "visible", timeout: 8000 });
  await chatInput.tap({ timeout: 8000 });
  await page.waitForFunction(() => document.activeElement?.matches?.(".campus2d-chat-input"), null, { timeout: 8000 });
  await page.setViewportSize(keyboardViewport);
  await page.waitForFunction(({ width, height }) => {
    return Math.abs(window.innerWidth - width) <= 1 && Math.abs(window.innerHeight - height) <= 1;
  }, keyboardViewport, { timeout: 8000 });
  await page.waitForFunction((height) => {
    const rawHeight = getComputedStyle(document.querySelector(".campus2d-online-shell"))
      .getPropertyValue("--campus2d-shell-height");
    const parsed = Number.parseFloat(rawHeight);
    return Number.isFinite(parsed) && parsed <= height + 2;
  }, keyboardViewport.height, { timeout: 8000 });
  await page.waitForTimeout(120);

  return page.evaluate(() => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      visualHeight: window.visualViewport?.height || window.innerHeight
    };
    const rectInfo = (element) => {
      if (!element) {
        return null;
      }
      const rect = element.getBoundingClientRect();
      const visibleWidth = Math.max(0, Math.min(rect.right, viewport.width) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, viewport.visualHeight) - Math.max(rect.top, 0));
      const centerX = Math.max(0, Math.min(viewport.width - 1, rect.left + rect.width / 2));
      const centerY = Math.max(0, Math.min(viewport.visualHeight - 1, rect.top + rect.height / 2));
      const topElement = document.elementFromPoint(centerX, centerY);
      return {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        visibleAreaRatio: rect.width > 0 && rect.height > 0
          ? Number(((visibleWidth * visibleHeight) / (rect.width * rect.height)).toFixed(3))
          : 0,
        centerHitTestable: Boolean(topElement && (element === topElement || element.contains(topElement)))
      };
    };
    const shell = document.querySelector(".campus2d-online-shell");
    const chatInputElement = document.querySelector(".campus2d-chat-input");
    return {
      viewport,
      shellHeightVar: getComputedStyle(shell).getPropertyValue("--campus2d-shell-height").trim(),
      activeElementClass: document.activeElement?.className || "",
      horizontalOverflow: Math.max(0, Math.ceil(Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - viewport.width)),
      shell: rectInfo(shell),
      root: rectInfo(document.querySelector(".campus2d-root")),
      form: rectInfo(document.querySelector(".campus2d-chat-form")),
      input: rectInfo(chatInputElement),
      submit: rectInfo(document.querySelector(".campus2d-chat-submit")),
      inputValue: chatInputElement?.value || ""
    };
  });
}

function pushCampusKeyboardFailures(label, audit) {
  if (!audit) {
    return;
  }
  const shellHeight = Number.parseFloat(audit.shellHeightVar || "");
  if (!Number.isFinite(shellHeight) || shellHeight > audit.viewport.visualHeight + 2) {
    failures.push(`${label}: campus shell height did not shrink for keyboard viewport (${JSON.stringify(audit)})`);
  }
  if (!audit.activeElementClass.includes("campus2d-chat-input")) {
    failures.push(`${label}: chat input did not remain focused in keyboard viewport (${JSON.stringify(audit.activeElementClass)})`);
  }
  if (audit.horizontalOverflow > 2) {
    failures.push(`${label}: campus keyboard viewport has ${audit.horizontalOverflow}px horizontal overflow`);
  }
  for (const [name, rect] of Object.entries({
    shell: audit.shell,
    root: audit.root,
    form: audit.form,
    input: audit.input,
    submit: audit.submit
  })) {
    if (!rect || rect.width <= 0 || rect.height <= 0 || rect.visibleAreaRatio < 0.82 || !rect.centerHitTestable) {
      failures.push(`${label}: ${name} is not usable in keyboard viewport (${JSON.stringify(rect)})`);
    }
  }
}

async function runCampusViewport(browser, baseUrl, viewportConfig) {
  const context = await browser.newContext(viewportOptions(viewportConfig));
  await applyNavigatorOverrides(context, viewportConfig.navigatorOverrides);
  const page = await context.newPage();
  const messages = [];
  page.on("console", (message) => messages.push({ type: message.type(), text: message.text() }));
  page.on("pageerror", (error) => messages.push({ type: "pageerror", text: error.message }));

  try {
    const classParam = encodeURIComponent(viewportConfig.bodyClass);
    await page.goto(`${baseUrl}/__campus2d-responsive-test.html?bodyClass=${classParam}`, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });
    await page.waitForFunction(() => window.__WSC_CAMPUS_TEST_READY === true || window.__WSC_CAMPUS_TEST_ERROR, null, { timeout: 60000 });
    await waitForVisibleArea(page, ".campus2d-root", 0.6);
    await page.waitForFunction(() => {
      const map = document.querySelector(".campus2d-map");
      return map?.complete && map.naturalWidth > 0;
    }, null, { timeout: 20000 });

    const initial = await collectCampusAudit(page);
    pushCampusFailures(`${viewportConfig.label} initial`, initial, viewportConfig);

    await page.evaluate(() => {
      window.dispatchEvent(new Event("wsc-campus-settings-open"));
    });
    await page.waitForFunction(() => {
      const panel = document.querySelector(".campus2d-settings-panel");
      return panel && !panel.hidden;
    }, null, { timeout: 5000 });

    await page.evaluate(() => {
      const input = document.querySelector(".campus2d-chat-input");
      const form = document.querySelector(".campus2d-chat-form");
      if (input && form) {
        input.value = "Hello from runtime smoke";
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
      document.querySelector(".campus2d-portal")?.click();
    });
    await page.waitForFunction(() => {
      return (window.__WSC_CAMPUS_TEST_EVENTS?.length || 0) > 0
        || document.querySelectorAll(".campus2d-chat-bubble").length > 0
        || /Courtyard|Library|Debate/i.test(document.querySelector(".campus2d-room-title")?.textContent || "");
    }, null, { timeout: 5000 });
    await page.waitForFunction(() => {
      const map = document.querySelector(".campus2d-map");
      return map?.complete && map.naturalWidth > 0;
    }, null, { timeout: 20000 });

    const afterInteraction = await collectCampusAudit(page);
    pushCampusFailures(`${viewportConfig.label} interaction`, afterInteraction, viewportConfig);

    const keyboard = await runCampusKeyboardProbe(page, viewportConfig);
    pushCampusKeyboardFailures(`${viewportConfig.label} keyboard`, keyboard);

    await page.setViewportSize(viewportConfig.resizeTo);
    await page.waitForFunction(({ width, height }) => {
      return Math.abs(window.innerWidth - width) <= 1 && Math.abs(window.innerHeight - height) <= 1;
    }, viewportConfig.resizeTo, { timeout: 8000 });
    await waitForVisibleArea(page, ".campus2d-root", 0.6);
    const afterResize = await collectCampusAudit(page);
    pushCampusFailures(`${viewportConfig.label} after resize`, afterResize, {
      ...viewportConfig,
      viewport: viewportConfig.resizeTo
    });

    return {
      id: viewportConfig.id,
      label: viewportConfig.label,
      initial,
      afterInteraction,
      keyboard,
      afterResize,
      messages
    };
  } finally {
    await page.evaluate(() => window.__WSC_CAMPUS_TEST_CONTROLLER?.destroy?.()).catch(() => {});
    await context.close();
  }
}

function pushConsoleFailures(label, messages) {
  const severe = messages.filter((message) =>
    ["error", "pageerror"].includes(message.type) &&
    !message.text.includes("Failed to load resource") &&
    message.text !== "Permissions policy violation: compute-pressure is not allowed in this document."
  );
  if (severe.length) {
    failures.push(`${label}: severe console messages: ${JSON.stringify(severe)}`);
  }
}

async function main() {
  const { chromium } = loadPlaywright();
  const server = createStaticServer();
  const baseUrl = await listen(server);
  let browser = null;

  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || (fs.existsSync(DEFAULT_CHROME_PATH) ? DEFAULT_CHROME_PATH : undefined)
    });

    const orientation = await runOrientationTransitionSmoke(browser, baseUrl);
    pushConsoleFailures("Orientation transition", orientation.messages);

    const campus = [];
    for (const viewportConfig of CAMPUS_VIEWPORTS) {
      const result = await runCampusViewport(browser, baseUrl, viewportConfig);
      pushConsoleFailures(result.label, result.messages);
      campus.push(result);
    }

    await browser.close();
    browser = null;

    console.log(JSON.stringify({
      baseUrl,
      servedRoot: SERVER_DIR,
      mode: SERVER_DIR === APP_DIR ? "source" : "artifact",
      orientation,
      campus,
      failures
    }, null, 2));

    if (failures.length) {
      console.error(`Device runtime smoke failed:\n- ${failures.join("\n- ")}`);
      process.exit(1);
    }
  } finally {
    await browser?.close().catch(() => {});
    await closeServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
