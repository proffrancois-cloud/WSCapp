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
const outputIndex = args.indexOf("--output");
const outputArg = outputIndex >= 0 ? args[outputIndex + 1] : null;
const outputEqualsArg = args.find((arg) => arg.startsWith("--output="));
const outputRootArg = outputEqualsArg ? outputEqualsArg.slice("--output=".length) : outputArg;
const SERVER_DIR = artifactRootArg
  ? path.resolve(process.cwd(), artifactRootArg)
  : APP_DIR;
const OUTPUT_DIR = outputRootArg
  ? path.resolve(process.cwd(), outputRootArg)
  : path.join(ROOT, "tmp/device-visual-smoke");
const PORT = Number(process.env.WSC_DEVICE_VISUAL_PORT || 4196);
const BASE_URL = externalBaseUrl || `http://localhost:${PORT}`;
const MODE = externalBaseUrl ? "remote" : SERVER_DIR === APP_DIR ? "source" : "artifact";
const DEFAULT_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TEST_SECTION = "We Are All in This to Get There";
const WINDOWS_CHROME_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36";

const SNAPSHOTS = [
  {
    id: "iphone-portrait-gate",
    label: "iPhone portrait orientation gate",
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    state: "portrait-gate",
    expectGate: true,
    requiredSelectors: [".orientation-gate", ".orientation-gate-card", ".orientation-gate-button"]
  },
  {
    id: "iphone-landscape-route",
    label: "iPhone landscape route picker",
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
    state: "local-route",
    requiredSelectors: ["#routeBuilder", ".mode-choice-board", ".mode-choice-column-learn"]
  },
  {
    id: "iphone-se-landscape-play-menu",
    label: "iPhone SE landscape play menu",
    viewport: { width: 667, height: 375 },
    hasTouch: true,
    isMobile: true,
    state: "play-menu",
    requiredSelectors: ["#routeBuilder", '[data-mode-choice-path="play"]', ".mode-choice-column.is-open .mode-choice-card-grid"],
    requiredAllSelectors: [".mode-choice-column.is-open .mode-choice-card-grid .wizard-choice-card"],
    requiredAllMinimumVisibleAreaRatio: 0.9
  },
  {
    id: "android-landscape-play-menu",
    label: "Android phone landscape play menu",
    viewport: { width: 915, height: 412 },
    hasTouch: true,
    isMobile: true,
    state: "play-menu",
    requiredSelectors: ["#routeBuilder", '[data-mode-choice-path="play"]', ".mode-choice-column.is-open .mode-choice-card-grid"],
    requiredAllSelectors: [".mode-choice-column.is-open .mode-choice-card-grid .wizard-choice-card"],
    requiredAllMinimumVisibleAreaRatio: 0.9
  },
  {
    id: "foldable-landscape-play-menu",
    label: "Foldable phone landscape play menu",
    viewport: { width: 720, height: 540 },
    hasTouch: true,
    isMobile: true,
    state: "play-menu",
    requiredSelectors: ["#routeBuilder", '[data-mode-choice-path="play"]', ".mode-choice-column.is-open .mode-choice-card-grid"],
    requiredAllSelectors: [".mode-choice-column.is-open .mode-choice-card-grid .wizard-choice-card"],
    requiredAllMinimumVisibleAreaRatio: 0.9
  },
  {
    id: "iphone-landscape-alpacapardy",
    label: "iPhone landscape Alpacapardy board",
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
    state: "alpacapardy-board",
    requiredSelectors: ["#experiencePanel", ".jeopardy-board-shell", "[data-jeopardy-open]"],
    requiredAllSelectors: ["[data-jeopardy-open]"],
    requiredAllMinimumVisibleAreaRatio: 0.82
  },
  {
    id: "android-landscape-alpacapardy",
    label: "Android phone landscape Alpacapardy board",
    viewport: { width: 915, height: 412 },
    hasTouch: true,
    isMobile: true,
    state: "alpacapardy-board",
    requiredSelectors: ["#experiencePanel", ".jeopardy-board-shell", "[data-jeopardy-open]"],
    requiredAllSelectors: ["[data-jeopardy-open]"],
    requiredAllMinimumVisibleAreaRatio: 0.82
  },
  {
    id: "foldable-landscape-alpacapardy",
    label: "Foldable phone landscape Alpacapardy board",
    viewport: { width: 720, height: 540 },
    hasTouch: true,
    isMobile: true,
    state: "alpacapardy-board",
    requiredSelectors: ["#experiencePanel", ".jeopardy-board-shell", "[data-jeopardy-open]"],
    requiredAllSelectors: ["[data-jeopardy-open]"],
    requiredAllMinimumVisibleAreaRatio: 0.82
  },
  {
    id: "iphone-landscape-alpacapardy-question",
    label: "iPhone landscape Alpacapardy question",
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
    state: "alpacapardy-question",
    requiredSelectors: ["#experiencePanel", ".question-popup-overlay.jeopardy", ".question-popup-window.jeopardy", ".challenge-card", "[data-jeopardy-option]"],
    requiredAllSelectors: ["[data-jeopardy-option]:not([disabled])"],
    requiredAllMinimumVisibleAreaRatio: 0.82
  },
  {
    id: "iphone-landscape-alpacapardy-feedback",
    label: "iPhone landscape Alpacapardy feedback",
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
    state: "alpacapardy-feedback",
    requiredSelectors: ["#experiencePanel", ".question-popup-overlay.jeopardy", ".question-popup-window.jeopardy", ".feedback-card", "[data-jeopardy-back]"]
  },
  {
    id: "foldable-landscape-alpacapardy-question",
    label: "Foldable phone landscape Alpacapardy question",
    viewport: { width: 720, height: 540 },
    hasTouch: true,
    isMobile: true,
    state: "alpacapardy-question",
    requiredSelectors: ["#experiencePanel", ".question-popup-overlay.jeopardy", ".question-popup-window.jeopardy", ".challenge-card", "[data-jeopardy-option]"],
    requiredAllSelectors: ["[data-jeopardy-option]:not([disabled])"],
    requiredAllMinimumVisibleAreaRatio: 0.82
  },
  {
    id: "foldable-landscape-alpacapardy-feedback",
    label: "Foldable phone landscape Alpacapardy feedback",
    viewport: { width: 720, height: 540 },
    hasTouch: true,
    isMobile: true,
    state: "alpacapardy-feedback",
    requiredSelectors: ["#experiencePanel", ".question-popup-overlay.jeopardy", ".question-popup-window.jeopardy", ".feedback-card", "[data-jeopardy-back]"]
  },
  {
    id: "ipad-landscape-settings",
    label: "iPad landscape settings modal",
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
    isMobile: true,
    state: "settings-modal",
    requiredSelectors: [".app-settings-overlay", ".app-settings-window", "[data-app-settings-volume]"]
  },
  {
    id: "windows-minimum-alpacapardy",
    label: "Windows minimum laptop Alpacapardy board",
    viewport: { width: 1024, height: 600 },
    hasTouch: false,
    isMobile: false,
    state: "alpacapardy-board",
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { platform: "Win32" },
    requiredSelectors: ["#experiencePanel", ".jeopardy-board-shell", "[data-jeopardy-open]"],
    requiredAllSelectors: ["[data-jeopardy-open]"],
    requiredAllMinimumVisibleAreaRatio: 0.74
  },
  {
    id: "windows-compact-play-menu",
    label: "Windows compact zoomed play menu",
    viewport: { width: 900, height: 500 },
    hasTouch: false,
    isMobile: false,
    state: "play-menu",
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { platform: "Win32" },
    requiredSelectors: ["#routeBuilder", '[data-mode-choice-path="play"]', ".mode-choice-column.is-open .mode-choice-card-grid"],
    requiredAllSelectors: [".mode-choice-column.is-open .mode-choice-card-grid .wizard-choice-card"],
    requiredAllMinimumVisibleAreaRatio: 0.6
  },
  {
    id: "desktop-ultrawide-route",
    label: "Ultrawide desktop route picker",
    viewport: { width: 2560, height: 1080 },
    hasTouch: false,
    isMobile: false,
    state: "local-route",
    requiredSelectors: ["#routeBuilder", ".mode-choice-board", ".hero"]
  }
];

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
  throw new Error(`Visual snapshot test root does not exist: ${SERVER_DIR}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    await sleep(250);
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
  throw new Error("Playwright is not available. Install Playwright to run visual snapshot tests.");
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

async function chooseLocalRoute(page, useTap) {
  await activateControl(page, '[data-app-entry-choice="local"]', { useTap, timeout: 30000 });
  await page.waitForFunction(() => !document.querySelector(".app-entry-gate-overlay"), null, { timeout: 40000 });
  await activateControl(page, "[data-close-cooperation]", { useTap }).catch(() => {});
  await page.waitForFunction(() => {
    return !document.querySelector('[role="dialog"][aria-modal="true"]')
      && !document.body.classList.contains("with-popup")
      && !document.querySelector("#routeBuilder")?.inert;
  }, null, { timeout: 40000 });
}

async function chooseSection(page, sectionName) {
  await page.evaluate((targetSectionName) => {
    const sectionButton = [...document.querySelectorAll("[data-toggle-mode-section]")]
      .find((button) => (button.dataset.sectionTitle || button.textContent || "").includes(targetSectionName));
    if (!sectionButton) {
      throw new Error(`Could not find section chip for "${targetSectionName}".`);
    }
    sectionButton.scrollIntoView({ block: "center", inline: "center" });
    if (sectionButton.getAttribute("aria-pressed") !== "true") {
      sectionButton.click();
    }
  }, sectionName);
  await page.waitForFunction((targetSectionName) => {
    return [...document.querySelectorAll("[data-toggle-mode-section]")]
      .some((button) => (
        (button.dataset.sectionTitle || button.textContent || "").includes(targetSectionName)
        && button.getAttribute("aria-pressed") === "true"
      )) && document.querySelector(".mode-choice-board.has-section-selection");
  }, sectionName, { timeout: 10000 });
}

async function openModeColumn(page, modePath) {
  await page.evaluate((targetModePath) => {
    const modeMenuButton = document.querySelector(`[data-toggle-mode-menu="${targetModePath}"]`);
    if (!modeMenuButton) {
      throw new Error(`Could not find mode menu button for "${targetModePath}".`);
    }
    modeMenuButton.click();
  }, modePath);
  await page.waitForFunction((targetModePath) => {
    const column = document.querySelector(`[data-mode-choice-path="${targetModePath}"]`);
    const board = column?.closest(".mode-choice-board");
    return Boolean(
      column?.classList.contains("is-open") &&
      !column.classList.contains("is-opening") &&
      !column.classList.contains("is-targeting") &&
      !board?.classList.contains("is-menu-switching")
    );
  }, modePath, { timeout: 10000 });
}

async function chooseMode(page, modeId, modePath) {
  await chooseSection(page, TEST_SECTION);
  await openModeColumn(page, modePath);
  await waitForVisibleArea(page, ".mode-choice-column.is-open .mode-choice-card-grid", 0.32);
  await page.evaluate(({ targetModeId, targetModePath }) => {
    const modeButton = document.querySelector(
      `[data-pick-mode="${targetModeId}"][data-pick-mode-path="${targetModePath}"]:not([disabled])`
    ) || document.querySelector(`[data-pick-mode="${targetModeId}"]:not([disabled])`);
    if (!modeButton) {
      throw new Error(`Could not find enabled mode card for "${targetModeId}".`);
    }
    modeButton.click();
  }, { targetModeId: modeId, targetModePath: modePath });
}

async function openSettingsModal(page, useTap) {
  await activateControl(page, "[data-toggle-hero-menu]", { useTap });
  await page.waitForFunction(() => document.querySelector(".hero-links")?.classList.contains("is-open"), null, { timeout: 10000 });
  await activateControl(page, "[data-open-campus-settings]", { useTap });
  await page.waitForFunction(() => {
    return Boolean(
      document.querySelector(".app-settings-overlay[role='dialog'][aria-modal='true']") &&
      document.querySelector(".app-settings-window") &&
      document.querySelector("[data-app-settings-volume]")
    );
  }, null, { timeout: 10000 });
}

async function startAlpacapardyBoard(page, useTap) {
  await chooseMode(page, "jeopardy", "play");
  await activateControl(page, "[data-jeopardy-start]:not([disabled])", { useTap });
  await page.waitForFunction(() => document.querySelectorAll("[data-jeopardy-open]").length > 0, null, { timeout: 12000 });
  await waitForVisibleArea(page, ".jeopardy-board-shell", 0.22);
}

async function openAlpacapardyQuestion(page, useTap) {
  await startAlpacapardyBoard(page, useTap);
  await activateControl(page, "[data-jeopardy-open]:not([disabled]):not(.done)", { useTap });
  await page.waitForSelector("[data-jeopardy-option]:not([disabled])", { timeout: 12000 });
  await waitForVisibleArea(page, ".question-popup-window.jeopardy", 0.72);
}

async function answerAlpacapardyQuestion(page, useTap) {
  await openAlpacapardyQuestion(page, useTap);
  await activateControl(page, "[data-jeopardy-option]:not([disabled])", { useTap });
  await page.waitForSelector(".feedback-card", { timeout: 12000 });
  await page.waitForSelector("[data-jeopardy-back]:not([disabled])", { timeout: 12000 });
  await waitForVisibleArea(page, ".feedback-card", 0.44);
}

async function prepareState(page, snapshot) {
  if (snapshot.state === "portrait-gate") {
    await waitForVisibleArea(page, ".orientation-gate", 0.9);
    return;
  }

  await chooseLocalRoute(page, snapshot.hasTouch);

  if (snapshot.state === "local-route") {
    await waitForVisibleArea(page, "#routeBuilder", 0.5);
    return;
  }

  if (snapshot.state === "play-menu") {
    await chooseSection(page, TEST_SECTION);
    await openModeColumn(page, "play");
    await waitForVisibleArea(page, ".mode-choice-column.is-open .mode-choice-card-grid", 0.45);
    return;
  }

  if (snapshot.state === "settings-modal") {
    await openSettingsModal(page, snapshot.hasTouch);
    await waitForVisibleArea(page, ".app-settings-window", 0.68);
    return;
  }

  if (snapshot.state === "alpacapardy-board") {
    await startAlpacapardyBoard(page, snapshot.hasTouch);
    return;
  }

  if (snapshot.state === "alpacapardy-question") {
    await openAlpacapardyQuestion(page, snapshot.hasTouch);
    return;
  }

  if (snapshot.state === "alpacapardy-feedback") {
    await answerAlpacapardyQuestion(page, snapshot.hasTouch);
  }
}

async function collectAudit(page, selectors, allSelectors = []) {
  return page.evaluate(({ targetSelectors, allTargetSelectors }) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      visualHeight: window.visualViewport?.height || window.innerHeight
    };
    const documentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth || 0
    );
    const gate = document.querySelector("#orientationGateMount .orientation-gate");
    const visibleElementCount = [...document.body.querySelectorAll("*")].filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    }).length;

    const inspectElement = (selector, element, index = 0) => {
      if (!element) {
        return { selector, index, present: false };
      }
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const visibleWidth = Math.max(0, Math.min(rect.right, viewport.width) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, viewport.visualHeight) - Math.max(rect.top, 0));
      return {
        selector,
        index,
        present: true,
        visible: rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden",
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        insideViewportX: rect.left >= -2 && rect.right <= viewport.width + 2,
        visibleAreaRatio: rect.width > 0 && rect.height > 0
          ? Number(((visibleWidth * visibleHeight) / (rect.width * rect.height)).toFixed(3))
          : 0
      };
    };

    const elements = targetSelectors.map((selector) => inspectElement(selector, document.querySelector(selector)));
    const elementGroups = allTargetSelectors.map((selector) => ({
      selector,
      count: document.querySelectorAll(selector).length,
      elements: [...document.querySelectorAll(selector)].map((element, index) => inspectElement(selector, element, index))
    }));

    return {
      appReady: window.WSC_APP_READY === true,
      title: document.title,
      bodyClass: document.body.className,
      viewport,
      documentWidth,
      horizontalOverflow: Math.max(0, Math.ceil(documentWidth - viewport.width)),
      gateVisible: Boolean(gate && gate.getBoundingClientRect().width > 0 && gate.getBoundingClientRect().height > 0),
      visibleElementCount,
      elements,
      elementGroups
    };
  }, { targetSelectors: selectors, allTargetSelectors: allSelectors });
}

function pushAuditFailures(failures, snapshot, audit, screenshotBytes) {
  if (!audit.appReady) {
    failures.push(`${snapshot.label}: app did not report WSC_APP_READY`);
  }
  if (audit.horizontalOverflow > 2) {
    failures.push(`${snapshot.label}: document has ${audit.horizontalOverflow}px horizontal overflow`);
  }
  if (snapshot.expectGate && !audit.gateVisible) {
    failures.push(`${snapshot.label}: expected the portrait orientation gate to be visible`);
  }
  if (!snapshot.expectGate && (audit.gateVisible || audit.bodyClass.includes("needs-landscape"))) {
    failures.push(`${snapshot.label}: landscape/desktop snapshot should not show the portrait gate`);
  }
  if (audit.visibleElementCount < 8) {
    failures.push(`${snapshot.label}: page looks blank or nearly blank (${audit.visibleElementCount} visible elements)`);
  }
  if (screenshotBytes < 16000) {
    failures.push(`${snapshot.label}: screenshot file is unexpectedly tiny (${screenshotBytes} bytes)`);
  }
  for (const element of audit.elements) {
    if (!element.present || !element.visible) {
      failures.push(`${snapshot.label}: ${element.selector} was not visible`);
      continue;
    }
    if (element.visibleAreaRatio < 0.18) {
      failures.push(`${snapshot.label}: ${element.selector} is only ${Math.round(element.visibleAreaRatio * 100)}% visible`);
    }
  }
  for (const group of audit.elementGroups || []) {
    if (group.count < 1) {
      failures.push(`${snapshot.label}: ${group.selector} had no matching elements`);
      continue;
    }
    for (const element of group.elements) {
      if (!element.present || !element.visible) {
        failures.push(`${snapshot.label}: ${element.selector} #${element.index + 1} was not visible`);
        continue;
      }
      if (!element.insideViewportX) {
        failures.push(
          `${snapshot.label}: ${element.selector} #${element.index + 1} is clipped horizontally ` +
          `(${element.left}-${element.right} outside 0-${audit.viewport.width})`
        );
      }
      if (
        typeof snapshot.requiredAllMinimumVisibleAreaRatio === "number" &&
        element.visibleAreaRatio < snapshot.requiredAllMinimumVisibleAreaRatio
      ) {
        failures.push(
          `${snapshot.label}: ${element.selector} #${element.index + 1} is only ` +
          `${Math.round(element.visibleAreaRatio * 100)}% visible`
        );
      }
    }
  }
}

async function runSnapshot(browser, snapshot) {
  const contextOptions = {
    viewport: snapshot.viewport,
    hasTouch: snapshot.hasTouch,
    isMobile: snapshot.isMobile,
    deviceScaleFactor: snapshot.isMobile ? 2 : 1,
    serviceWorkers: "block"
  };
  if (snapshot.userAgent) {
    contextOptions.userAgent = snapshot.userAgent;
  }

  const context = await browser.newContext(contextOptions);
  await context.addInitScript(() => {
    const applyStableAnimations = () => {
      const style = document.createElement("style");
      style.id = "wsc-visual-smoke-stable-style";
      style.textContent = [
        "*, *::before, *::after {",
        "  animation-duration: 1ms !important;",
        "  animation-delay: 0ms !important;",
        "  transition-duration: 1ms !important;",
        "  transition-delay: 0ms !important;",
        "  scroll-behavior: auto !important;",
        "}"
      ].join("\n");
      document.documentElement.appendChild(style);
    };
    if (document.documentElement) {
      applyStableAnimations();
    } else {
      document.addEventListener("DOMContentLoaded", applyStableAnimations, { once: true });
    }
  });
  if (snapshot.navigatorOverrides) {
    await context.addInitScript((overrides) => {
      for (const [property, value] of Object.entries(overrides)) {
        Object.defineProperty(Navigator.prototype, property, {
          configurable: true,
          get: () => value
        });
      }
    }, snapshot.navigatorOverrides);
  }

  const page = await context.newPage();
  const messages = [];
  page.on("console", (message) => messages.push({ type: message.type(), text: message.text() }));
  page.on("pageerror", (error) => messages.push({ type: "pageerror", text: error.message }));

  try {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => window.WSC_APP_READY === true, null, { timeout: 60000 });
    await prepareState(page, snapshot);
    await page.waitForTimeout(160);

    const screenshotPath = path.join(OUTPUT_DIR, `${snapshot.id}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const screenshotBytes = fs.statSync(screenshotPath).size;
    const audit = await collectAudit(page, snapshot.requiredSelectors, snapshot.requiredAllSelectors);
    return {
      id: snapshot.id,
      label: snapshot.label,
      state: snapshot.state,
      viewport: snapshot.viewport,
      screenshotPath,
      screenshotBytes,
      audit,
      messages
    };
  } finally {
    await context.close();
  }
}

async function main() {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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

    const results = [];
    for (const snapshot of SNAPSHOTS) {
      results.push(await runSnapshot(browser, snapshot));
    }
    await browser.close();
    browser = null;

    const failures = [];
    for (const result of results) {
      const snapshot = SNAPSHOTS.find((candidate) => candidate.id === result.id);
      pushAuditFailures(failures, snapshot, result.audit, result.screenshotBytes);
      const severeMessages = result.messages.filter((message) =>
        ["error", "pageerror"].includes(message.type) &&
        !message.text.includes("Failed to load resource") &&
        message.text !== "Permissions policy violation: compute-pressure is not allowed in this document."
      );
      if (severeMessages.length) {
        failures.push(`${result.label}: severe console messages: ${JSON.stringify(severeMessages)}`);
      }
    }

    console.log(JSON.stringify({
      baseUrl: BASE_URL,
      servedRoot: externalBaseUrl ? null : SERVER_DIR,
      mode: MODE,
      outputDir: OUTPUT_DIR,
      snapshots: results,
      failures
    }, null, 2));

    if (failures.length) {
      console.error(`Device visual snapshot smoke failed:\n- ${failures.join("\n- ")}`);
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
