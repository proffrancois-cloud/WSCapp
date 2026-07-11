import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const APP_DIR = path.join(ROOT, "app");
const args = process.argv.slice(2);
const artifactIndex = args.indexOf("--artifact");
const artifactArg = artifactIndex >= 0 ? args[artifactIndex + 1] : null;
const artifactEqualsArg = args.find((arg) => arg.startsWith("--artifact="));
const artifactRootArg = artifactEqualsArg ? artifactEqualsArg.slice("--artifact=".length) : artifactArg;
const urlIndex = args.indexOf("--url");
const urlArg = urlIndex >= 0 ? args[urlIndex + 1] : null;
const urlEqualsArg = args.find((arg) => arg.startsWith("--url="));
const externalBaseUrl = normalizeExternalBaseUrl(urlEqualsArg ? urlEqualsArg.slice("--url=".length) : urlArg);
const SERVER_DIR = artifactRootArg
  ? path.resolve(process.cwd(), artifactRootArg)
  : APP_DIR;
const PORT = Number(process.env.WSC_MOBILE_KEYBOARD_PORT || 4198);
const BASE_URL = externalBaseUrl || `http://localhost:${PORT}`;
const MODE = externalBaseUrl ? "remote" : SERVER_DIR === APP_DIR ? "source" : "artifact";
const DEFAULT_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PHONE_LANDSCAPE = { width: 844, height: 390 };
const KEYBOARD_LANDSCAPE = { width: 844, height: 270 };
const SMALL_KEYBOARD_LANDSCAPE = { width: 667, height: 240 };
const OLD_IPHONE_LAYOUT_LANDSCAPE = { width: 667, height: 375 };
const OLD_IPHONE_VISUAL_KEYBOARD = { width: 667, height: 240 };

function normalizeExternalBaseUrl(rawUrl) {
  if (!rawUrl) {
    return "";
  }

  const parsed = new URL(rawUrl);
  parsed.hash = "";
  parsed.search = "";
  parsed.pathname = parsed.pathname.replace(/\/index\.html$/i, "").replace(/\/+$/g, "");
  return parsed.toString().replace(/\/$/g, "");
}

if (!externalBaseUrl && (!fs.existsSync(SERVER_DIR) || !fs.statSync(SERVER_DIR).isDirectory())) {
  throw new Error(`Mobile keyboard smoke root does not exist: ${SERVER_DIR}`);
}

function requestStatus(url) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      response.resume();
      resolve(response.statusCode || 0);
    });
    request.on("error", () => resolve(0));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(0);
    });
  });
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if ((await requestStatus(url)) === 200) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Local server did not respond at ${url}`);
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
  throw new Error("Playwright is not available. Install Playwright to run mobile keyboard tests.");
}

async function activateControl(page, selector, options = {}) {
  const timeout = options.timeout || 12000;
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout });
  if (options.useTap) {
    await locator.tap({ timeout });
  } else {
    await locator.click({ timeout });
  }
}

async function chooseLocalRoute(page) {
  await activateControl(page, '[data-app-entry-choice="local"]', { useTap: true, timeout: 30000 });
  await page.waitForFunction(() => !document.querySelector(".app-entry-gate-overlay"), null, { timeout: 40000 });
  await activateControl(page, "[data-close-cooperation]", { useTap: true }).catch(() => {});
  await page.waitForFunction(() => {
    return !document.querySelector('[role="dialog"][aria-modal="true"]')
      && !document.body.classList.contains("with-popup")
      && !document.querySelector("#routeBuilder")?.inert;
  }, null, { timeout: 40000 });
}

async function openAuthModal(page) {
  await activateControl(page, "[data-toggle-hero-menu]", { useTap: true });
  await page.waitForFunction(() => document.querySelector(".hero-links")?.classList.contains("is-open"), null, { timeout: 10000 });
  await activateControl(page, "[data-open-auth]", { useTap: true });
  await page.waitForFunction(() => {
    return Boolean(
      document.querySelector(".auth-modal-overlay[role='dialog'][aria-modal='true']") &&
      document.querySelector(".auth-modal-window.alpaccount-window") &&
      document.querySelector(".alpaccount-form[data-auth-form='login'] input[name='identifier']")
    );
  }, null, { timeout: 10000 });
}

async function waitForViewportCssHeight(page, maxHeight) {
  await page.waitForFunction((heightLimit) => {
    const rawValue = getComputedStyle(document.documentElement).getPropertyValue("--wsc-viewport-height");
    const parsed = Number.parseFloat(rawValue);
    return Number.isFinite(parsed) && parsed <= heightLimit;
  }, maxHeight, { timeout: 8000 });
}

async function focusWithTap(page, selector) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: 12000 });
  await locator.tap({ timeout: 12000 });
  await page.waitForFunction((targetSelector) => {
    const element = document.querySelector(targetSelector);
    return Boolean(element && document.activeElement === element);
  }, selector, { timeout: 8000 });
}

async function collectKeyboardAudit(page, selectors = []) {
  return page.evaluate((targetSelectors) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      visualWidth: window.visualViewport?.width || window.innerWidth,
      visualHeight: window.visualViewport?.height || window.innerHeight
    };
    const documentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth || 0
    );
    const viewportCssHeight = getComputedStyle(document.documentElement)
      .getPropertyValue("--wsc-viewport-height")
      .trim();
    const activeElement = document.activeElement;
    const activeRect = activeElement?.getBoundingClientRect?.();
    const describeElement = (selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        return { selector, present: false };
      }
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const visibleWidth = Math.max(0, Math.min(rect.right, viewport.visualWidth) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, viewport.visualHeight) - Math.max(rect.top, 0));
      return {
        selector,
        present: true,
        visible: rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden",
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        visibleAreaRatio: rect.width > 0 && rect.height > 0
          ? Number(((visibleWidth * visibleHeight) / (rect.width * rect.height)).toFixed(3))
          : 0,
        centerHitTestable: (() => {
          const centerX = Math.max(0, Math.min(viewport.visualWidth - 1, rect.left + rect.width / 2));
          const centerY = Math.max(0, Math.min(viewport.visualHeight - 1, rect.top + rect.height / 2));
          const topElement = document.elementFromPoint(centerX, centerY);
          return Boolean(topElement && (element === topElement || element.contains(topElement)));
        })()
      };
    };
    return {
      appReady: window.WSC_APP_READY === true,
      bodyClass: document.body.className,
      viewport,
      viewportCssHeight,
      horizontalOverflow: Math.max(0, Math.ceil(documentWidth - viewport.width)),
      overlayScrollTop: document.querySelector(".auth-modal-overlay")?.scrollTop || 0,
      windowScrollTop: document.querySelector(".auth-modal-window")?.scrollTop || 0,
      activeElement: activeElement
        ? {
            tag: activeElement.tagName,
            name: activeElement.getAttribute("name") || "",
            type: activeElement.getAttribute("type") || "",
            top: activeRect ? Math.round(activeRect.top) : null,
            bottom: activeRect ? Math.round(activeRect.bottom) : null,
            visibleAreaRatio: activeRect && activeRect.width > 0 && activeRect.height > 0
              ? Number((
                  (Math.max(0, Math.min(activeRect.right, viewport.visualWidth) - Math.max(activeRect.left, 0)) *
                  Math.max(0, Math.min(activeRect.bottom, viewport.visualHeight) - Math.max(activeRect.top, 0))) /
                  (activeRect.width * activeRect.height)
                ).toFixed(3))
              : 0
          }
        : null,
      elements: targetSelectors.map(describeElement)
    };
  }, selectors);
}

function pushAuditFailures(failures, label, audit, options = {}) {
  if (!audit.appReady) {
    failures.push(`${label}: app did not report WSC_APP_READY`);
  }
  if (!audit.bodyClass.includes("is-touch-landscape") || audit.bodyClass.includes("needs-landscape")) {
    failures.push(`${label}: keyboard-sized landscape viewport lost touch-landscape presentation (${audit.bodyClass})`);
  }
  if (audit.horizontalOverflow > 2) {
    failures.push(`${label}: document has ${audit.horizontalOverflow}px horizontal overflow while keyboard-sized`);
  }
  const cssHeight = Number.parseFloat(audit.viewportCssHeight);
  if (!Number.isFinite(cssHeight) || Math.abs(cssHeight - audit.viewport.visualHeight) > 4) {
    failures.push(`${label}: --wsc-viewport-height did not track the keyboard-sized viewport (${audit.viewportCssHeight} vs ${audit.viewport.visualHeight})`);
  }
  if (options.activeName && audit.activeElement?.name !== options.activeName) {
    failures.push(`${label}: expected active field ${options.activeName}, got ${JSON.stringify(audit.activeElement)}`);
  }
  if (options.requiredBodyClass && !audit.bodyClass.includes(options.requiredBodyClass)) {
    failures.push(`${label}: expected body class ${options.requiredBodyClass}, got ${audit.bodyClass}`);
  }
  if (audit.activeElement && audit.activeElement.visibleAreaRatio < 0.92) {
    failures.push(`${label}: active field is not visible enough while keyboard-sized (${JSON.stringify(audit.activeElement)})`);
  }
  for (const element of audit.elements) {
    if (!element.present || !element.visible) {
      failures.push(`${label}: ${element.selector} was not visible`);
      continue;
    }
    if (element.visibleAreaRatio < (options.minimumVisibleAreaRatio || 0.5)) {
      failures.push(`${label}: ${element.selector} is only ${Math.round(element.visibleAreaRatio * 100)}% visible`);
    }
    if (options.requireHitTest && !element.centerHitTestable) {
      failures.push(`${label}: ${element.selector} center is not hit-testable`);
    }
  }
}

async function installVisualViewportShim(page, initialViewport) {
  await page.addInitScript((viewport) => {
    const state = {
      width: viewport.width,
      height: viewport.height
    };
    const visualViewport = new EventTarget();

    Object.defineProperties(visualViewport, {
      width: { get: () => state.width },
      height: { get: () => state.height },
      offsetLeft: { get: () => 0 },
      offsetTop: { get: () => 0 },
      pageLeft: { get: () => window.scrollX || 0 },
      pageTop: { get: () => window.scrollY || 0 },
      scale: { get: () => 1 }
    });

    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      get: () => visualViewport
    });

    window.__WSC_TEST_SET_VISUAL_VIEWPORT__ = (nextViewport) => {
      state.width = nextViewport.width;
      state.height = nextViewport.height;
      visualViewport.dispatchEvent(new Event("resize"));
    };
  }, initialViewport);
}

async function runAuthKeyboardScenario(browser) {
  const context = await browser.newContext({
    viewport: PHONE_LANDSCAPE,
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
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => window.WSC_APP_READY === true, null, { timeout: 60000 });
    await chooseLocalRoute(page);
    await openAuthModal(page);

    await focusWithTap(page, ".alpaccount-form[data-auth-form='login'] input[name='identifier']");
    await page.setViewportSize(KEYBOARD_LANDSCAPE);
    await waitForViewportCssHeight(page, KEYBOARD_LANDSCAPE.height + 4);
    await page.waitForTimeout(120);
    const loginAudit = await collectKeyboardAudit(page, [
      ".auth-modal-overlay",
      ".auth-modal-window",
      ".alpaccount-form[data-auth-form='login'] input[name='identifier']",
      ".alpaccount-form[data-auth-form='login'] input[name='password']",
      ".alpaccount-form[data-auth-form='login'] button[type='submit']"
    ]);

    await page.setViewportSize(SMALL_KEYBOARD_LANDSCAPE);
    await waitForViewportCssHeight(page, SMALL_KEYBOARD_LANDSCAPE.height + 4);
    await page.waitForTimeout(120);
    const loginSmallAudit = await collectKeyboardAudit(page, [
      ".auth-modal-overlay",
      ".auth-modal-window",
      ".alpaccount-form[data-auth-form='login'] input[name='identifier']",
      ".alpaccount-form[data-auth-form='login'] input[name='password']",
      ".alpaccount-form[data-auth-form='login'] .auth-actions",
      ".alpaccount-form[data-auth-form='login'] button[type='submit']"
    ]);

    await page.setViewportSize(PHONE_LANDSCAPE);
    await page.waitForTimeout(120);
    await activateControl(page, "[data-auth-mode='signup']", { useTap: true });
    await page.waitForFunction(() => Boolean(document.querySelector(".alpaccount-form[data-auth-form='signup'] input[name='email']")), null, { timeout: 10000 });
    await page.setViewportSize(KEYBOARD_LANDSCAPE);
    await waitForViewportCssHeight(page, KEYBOARD_LANDSCAPE.height + 4);
    await focusWithTap(page, ".alpaccount-form[data-auth-form='signup'] input[name='email']");
    await page.waitForTimeout(120);
    const signupTopAudit = await collectKeyboardAudit(page, [
      ".auth-modal-overlay",
      ".auth-modal-window",
      ".alpaccount-form[data-auth-form='signup'] input[name='email']"
    ]);

    await page.evaluate(() => {
      const windowElement = document.querySelector(".auth-modal-window");
      if (windowElement) {
        windowElement.scrollTop = windowElement.scrollHeight;
      }
    });
    await page.waitForTimeout(120);
    await focusWithTap(page, ".alpaccount-form[data-auth-form='signup'] input[name='wsc_id_reward_date']");
    await page.waitForTimeout(120);
    const signupBottomAudit = await collectKeyboardAudit(page, [
      ".auth-modal-overlay",
      ".auth-modal-window",
      ".alpaccount-form[data-auth-form='signup'] input[name='wsc_id_reward_date']",
      ".alpaccount-form[data-auth-form='signup'] .auth-actions"
    ]);

    return {
      loginAudit,
      loginSmallAudit,
      signupTopAudit,
      signupBottomAudit,
      messages
    };
  } finally {
    await context.close();
  }
}

async function runOldIphoneSafariKeyboardScenario(browser) {
  const context = await browser.newContext({
    viewport: OLD_IPHONE_LAYOUT_LANDSCAPE,
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
    serviceWorkers: "block"
  });
  const page = await context.newPage();
  await installVisualViewportShim(page, OLD_IPHONE_LAYOUT_LANDSCAPE);
  const messages = [];
  page.on("console", (message) => messages.push({ type: message.type(), text: message.text() }));
  page.on("pageerror", (error) => messages.push({ type: "pageerror", text: error.message }));

  try {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => window.WSC_APP_READY === true, null, { timeout: 60000 });
    await chooseLocalRoute(page);
    await openAuthModal(page);
    await focusWithTap(page, ".alpaccount-form[data-auth-form='login'] input[name='identifier']");
    await page.evaluate((viewport) => {
      window.__WSC_TEST_SET_VISUAL_VIEWPORT__?.(viewport);
    }, OLD_IPHONE_VISUAL_KEYBOARD);
    await waitForViewportCssHeight(page, OLD_IPHONE_VISUAL_KEYBOARD.height + 4);
    await page.waitForFunction(() => document.body.classList.contains("is-compact-touch-keyboard"), null, { timeout: 8000 });
    await page.waitForTimeout(120);

    return {
      audit: await collectKeyboardAudit(page, [
        ".auth-modal-overlay",
        ".auth-modal-window",
        ".alpaccount-form[data-auth-form='login'] input[name='identifier']",
        ".alpaccount-form[data-auth-form='login'] input[name='password']",
        ".alpaccount-form[data-auth-form='login'] .auth-actions",
        ".alpaccount-form[data-auth-form='login'] button[type='submit']"
      ]),
      messages
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const { chromium } = loadPlaywright();
  const server = externalBaseUrl
    ? null
    : spawn("python3", ["-m", "http.server", String(PORT)], {
      cwd: SERVER_DIR,
      stdio: "ignore"
    });
  let browser = null;

  try {
    if (!externalBaseUrl) {
      await waitForServer(`${BASE_URL}/index.html`);
    }
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || (fs.existsSync(DEFAULT_CHROME_PATH) ? DEFAULT_CHROME_PATH : undefined)
    });
    const result = await runAuthKeyboardScenario(browser);
    const oldIphoneSafari = await runOldIphoneSafariKeyboardScenario(browser);
    await browser.close();
    browser = null;

    const failures = [];
    pushAuditFailures(failures, "Login auth modal keyboard", result.loginAudit, {
      activeName: "identifier",
      minimumVisibleAreaRatio: 0.5,
      requireHitTest: true
    });
    pushAuditFailures(failures, "Small phone login auth modal keyboard", result.loginSmallAudit, {
      activeName: "identifier",
      minimumVisibleAreaRatio: 0.75,
      requireHitTest: true
    });
    pushAuditFailures(failures, "Old iPhone Safari visual keyboard login", oldIphoneSafari.audit, {
      activeName: "identifier",
      requiredBodyClass: "is-compact-touch-keyboard",
      minimumVisibleAreaRatio: 0.75,
      requireHitTest: true
    });
    pushAuditFailures(failures, "Signup top auth modal keyboard", result.signupTopAudit, {
      activeName: "email",
      minimumVisibleAreaRatio: 0.5,
      requireHitTest: true
    });
    pushAuditFailures(failures, "Signup bottom auth modal keyboard", result.signupBottomAudit, {
      activeName: "wsc_id_reward_date",
      minimumVisibleAreaRatio: 0.35,
      requireHitTest: true
    });

    const severeMessages = [...result.messages, ...oldIphoneSafari.messages].filter((message) =>
      ["error", "pageerror"].includes(message.type) &&
      !message.text.includes("Failed to load resource") &&
      message.text !== "Permissions policy violation: compute-pressure is not allowed in this document."
    );
    if (severeMessages.length) {
      failures.push(`severe console messages during mobile keyboard smoke: ${JSON.stringify(severeMessages)}`);
    }

    console.log(JSON.stringify({
      baseUrl: BASE_URL,
      servedRoot: externalBaseUrl ? null : SERVER_DIR,
      mode: MODE,
      keyboardViewport: KEYBOARD_LANDSCAPE,
      ...result,
      oldIphoneSafari,
      failures
    }, null, 2));

    if (failures.length) {
      console.error(`Mobile keyboard smoke failed:\n- ${failures.join("\n- ")}`);
      process.exit(1);
    }
  } finally {
    await browser?.close().catch(() => {});
    server?.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
