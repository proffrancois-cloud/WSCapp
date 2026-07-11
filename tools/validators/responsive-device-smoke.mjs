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
const PORT = Number(process.env.WSC_RESPONSIVE_PORT || 4175);
const BASE_URL = externalBaseUrl || `http://localhost:${PORT}`;
const MODE = externalBaseUrl ? "remote" : SERVER_DIR === APP_DIR ? "source" : "artifact";
const DEFAULT_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TEST_SECTION = "We Are All in This to Get There";
const WINDOWS_CHROME_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36";
const PHONE_PLAY_MENU_MIN_VISIBLE_RATIO = 0.62;
const PHONE_PLAY_CARD_MIN_VISIBLE_RATIO = 0.9;
const TOUCH_TARGET_SELECTORS = [
  "[data-toggle-hero-menu]",
  ".hero-links.is-open > a",
  ".hero-links.is-open > button",
  ".hero-links.is-open .session-mode-button",
  ".hero-links.is-open .session-signout-button",
  ".selected-section-chip",
  "[data-toggle-mode-menu]",
  "[data-pick-mode]",
  "[data-jump-action]",
  ".campus2d-debate-button",
  ".campus2d-mute-button",
  ".campus2d-color-swatch",
  ".campus2d-chat-input",
  ".campus2d-chat-submit",
  ".campus2d-report-button",
  ".learn-footer-card-button",
  ".panel-hub-link",
  ".raw-entry-channel-link",
  ".raw-question-gallery-nav"
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
  throw new Error(`Responsive device test root does not exist: ${SERVER_DIR}`);
}

const VIEWPORTS = [
  {
    id: "iphone-portrait",
    label: "iPhone portrait",
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: true
  },
  {
    id: "iphone-se-landscape",
    label: "iPhone SE landscape",
    viewport: { width: 667, height: 375 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: false,
    checks: ["hero-menu", "local-route", "play-menu"]
  },
  {
    id: "iphone-landscape",
    label: "iPhone landscape",
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: false,
    checks: ["hero-menu", "settings-modal", "local-route", "learn-content", "alpacapardy-board"]
  },
  {
    id: "pixel-portrait",
    label: "Android phone portrait",
    viewport: { width: 412, height: 915 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: true
  },
  {
    id: "pixel-landscape",
    label: "Android phone landscape",
    viewport: { width: 915, height: 412 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: false,
    checks: ["hero-menu", "local-route", "play-menu"]
  },
  {
    id: "surface-duo-landscape",
    label: "Foldable phone landscape",
    viewport: { width: 720, height: 540 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: false,
    checks: ["hero-menu", "local-route", "play-menu", "alpacapardy-board"]
  },
  {
    id: "android-tablet-portrait",
    label: "Android tablet portrait",
    viewport: { width: 800, height: 1280 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: true
  },
  {
    id: "windows-tablet-portrait",
    label: "Windows tablet portrait",
    viewport: { width: 800, height: 1280 },
    hasTouch: true,
    isMobile: false,
    expectLandscapeGate: true,
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { platform: "Win32", maxTouchPoints: 10 }
  },
  {
    id: "ipad-landscape",
    label: "iPad landscape",
    viewport: { width: 1024, height: 768 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: false,
    checks: ["hero-menu", "local-route", "jump-stage"]
  },
  {
    id: "ipad-air-landscape",
    label: "iPad Air landscape",
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: false,
    expectTouchLandscape: true,
    checks: ["hero-menu", "settings-modal", "local-route", "learn-content", "play-menu", "jump-stage"]
  },
  {
    id: "android-tablet-landscape",
    label: "Android tablet landscape",
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: false,
    checks: ["hero-menu", "local-route", "play-menu", "jump-stage"]
  },
  {
    id: "ipad-pro-landscape",
    label: "iPad Pro landscape",
    viewport: { width: 1366, height: 1024 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: false,
    expectTouchLandscape: true,
    checks: ["hero-menu", "local-route", "play-menu", "alpacapardy-board"]
  },
  {
    id: "large-android-tablet-landscape",
    label: "Large Android tablet landscape",
    viewport: { width: 1440, height: 900 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: false,
    expectTouchLandscape: true,
    checks: ["hero-menu", "local-route", "play-menu"]
  },
  {
    id: "ipad-split-landscape",
    label: "iPad split view landscape",
    viewport: { width: 1112, height: 744 },
    hasTouch: true,
    isMobile: true,
    expectLandscapeGate: false,
    expectTouchLandscape: true,
    checks: ["hero-menu", "local-route", "play-menu"]
  },
  {
    id: "windows-minimum",
    label: "Windows minimum laptop",
    viewport: { width: 1024, height: 600 },
    hasTouch: false,
    isMobile: false,
    expectLandscapeGate: false,
    expectDesktopPresentation: true,
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { platform: "Win32" },
    checks: ["hero-menu", "local-route", "play-menu", "alpacapardy-board"]
  },
  {
    id: "windows-compact-zoomed",
    label: "Windows compact zoomed desktop",
    viewport: { width: 900, height: 500 },
    hasTouch: false,
    isMobile: false,
    expectLandscapeGate: false,
    expectDesktopPresentation: true,
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { platform: "Win32" },
    checks: ["hero-menu", "settings-modal", "local-route", "play-menu"]
  },
  {
    id: "windows-laptop",
    label: "Windows laptop",
    viewport: { width: 1366, height: 768 },
    hasTouch: false,
    isMobile: false,
    expectLandscapeGate: false,
    expectDesktopPresentation: true,
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { platform: "Win32" },
    checks: ["hero-menu", "local-route", "play-menu"]
  },
  {
    id: "windows-touch-laptop",
    label: "Windows touch laptop",
    viewport: { width: 1366, height: 768 },
    hasTouch: false,
    isMobile: false,
    expectLandscapeGate: false,
    expectDesktopPresentation: true,
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { maxTouchPoints: 10, platform: "Win32" },
    matchMediaOverrides: {
      "(pointer: coarse)": false,
      "(pointer: fine)": true,
      "(any-pointer: coarse)": true,
      "(any-pointer: fine)": true,
      "(hover: none)": false,
      "(hover: hover)": true
    },
    checks: ["hero-menu", "local-route", "play-menu"]
  },
  {
    id: "windows-hybrid-css-laptop",
    label: "Windows hybrid CSS laptop",
    viewport: { width: 1366, height: 768 },
    hasTouch: true,
    isMobile: false,
    expectLandscapeGate: false,
    expectDesktopPresentation: true,
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { maxTouchPoints: 10, platform: "Win32" },
    matchMediaOverrides: {
      "(pointer: coarse)": false,
      "(pointer: fine)": true,
      "(any-pointer: coarse)": true,
      "(any-pointer: fine)": true,
      "(hover: none)": false,
      "(hover: hover)": true
    },
    checks: ["hero-menu", "local-route", "play-menu"]
  },
  {
    id: "windows-tablet-landscape",
    label: "Windows tablet landscape",
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
    isMobile: false,
    expectLandscapeGate: false,
    expectTouchLandscape: true,
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { platform: "Win32" },
    checks: ["hero-menu", "settings-modal", "local-route", "learn-content", "play-menu", "jump-stage"]
  },
  {
    id: "windows-tablet-pen-landscape",
    label: "Windows tablet with pen landscape",
    viewport: { width: 1280, height: 800 },
    hasTouch: true,
    isMobile: false,
    expectLandscapeGate: false,
    expectTouchLandscape: true,
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { maxTouchPoints: 10, platform: "Win32" },
    matchMediaOverrides: {
      "(pointer: coarse)": true,
      "(pointer: fine)": false,
      "(any-pointer: coarse)": true,
      "(any-pointer: fine)": true,
      "(hover: none)": true,
      "(hover: hover)": false,
      "(any-hover: none)": false,
      "(any-hover: hover)": true
    },
    checks: ["hero-menu", "settings-modal", "local-route", "learn-content", "play-menu", "jump-stage"]
  },
  {
    id: "desktop-hd",
    label: "HD desktop",
    viewport: { width: 1920, height: 1080 },
    hasTouch: false,
    isMobile: false,
    expectLandscapeGate: false,
    expectDesktopPresentation: true,
    checks: ["hero-menu", "local-route", "play-menu"]
  },
  {
    id: "desktop-ultrawide",
    label: "Ultrawide desktop",
    viewport: { width: 2560, height: 1080 },
    hasTouch: false,
    isMobile: false,
    expectLandscapeGate: false,
    expectDesktopPresentation: true,
    checks: ["hero-menu", "local-route", "play-menu"]
  }
];

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

  throw new Error("Playwright is not available. Run `npx playwright --version` once or install Playwright to run responsive device tests.");
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

async function waitForVisibleArea(page, selector, minimumRatio, timeout = 6000) {
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

async function activateControl(page, selector, options = {}) {
  const timeout = options.timeout || 10000;
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout });
  if (options.useTap) {
    await locator.tap({ timeout });
  } else {
    await locator.click({ timeout });
  }
}

async function chooseSection(page, sectionName) {
  await page.evaluate((targetSectionName) => {
    const sectionButton = [...document.querySelectorAll("[data-toggle-mode-section]")]
      .find((button) => (button.dataset.sectionTitle || button.textContent || "").includes(targetSectionName));
    if (!sectionButton) {
      throw new Error(`Could not find section chip for "${targetSectionName}".`);
    }
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
  }, sectionName, { timeout: 8000 });
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
    return document.querySelector(`[data-mode-choice-path="${targetModePath}"]`)?.classList.contains("is-open");
  }, modePath, { timeout: 8000 });

  await page.waitForFunction((targetModePath) => {
    const column = document.querySelector(`[data-mode-choice-path="${targetModePath}"]`);
    const board = column?.closest(".mode-choice-board");
    return Boolean(
      column?.classList.contains("is-open") &&
      !column.classList.contains("is-opening") &&
      !column.classList.contains("is-targeting") &&
      !board?.classList.contains("is-menu-switching")
    );
  }, modePath, { timeout: 3000 });
}

async function chooseMode(page, sectionName, modeId, modePath) {
  await chooseSection(page, sectionName);
  await openModeColumn(page, modePath);
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

async function startAlpacapardyBoard(page, useTap = false) {
  await chooseMode(page, TEST_SECTION, "jeopardy", "play");
  await page.waitForSelector("[data-jeopardy-start]:not([disabled])", { timeout: 10000 });
  await activateControl(page, "[data-jeopardy-start]:not([disabled])", { useTap });
  await page.waitForFunction(() => document.querySelectorAll("[data-jeopardy-open]").length > 0, null, { timeout: 10000 });
  await waitForVisibleArea(page, ".jeopardy-board-shell", 0.22);
  await page.waitForTimeout(120);
}

async function startJumpStage(page, useTap = false) {
  await chooseMode(page, TEST_SECTION, "jump", "play");
  await page.waitForSelector("[data-jump-start]:not([disabled])", { timeout: 10000 });
  await activateControl(page, "[data-jump-start]:not([disabled])", { useTap });
  await page.waitForSelector("[data-jump-stage]", { timeout: 10000 });
  await waitForVisibleArea(page, "[data-jump-stage]", 0.22);
  await page.waitForTimeout(120);
}

async function startLearnContent(page) {
  await chooseMode(page, TEST_SECTION, "rawcontent", "learn");
  await page.waitForFunction(() => {
    const panel = document.querySelector("#experiencePanel");
    return Boolean(
      panel &&
      !panel.classList.contains("hidden") &&
      document.querySelector(".raw-content-shell") &&
      document.querySelector(".raw-source-card, .raw-entry-card, .raw-section-group-card")
    );
  }, null, { timeout: 10000 });
  await page.waitForTimeout(240);
}

async function openHeroMenu(page, useTap = false) {
  await page.waitForSelector("[data-toggle-hero-menu]", { timeout: 10000 });
  await activateControl(page, "[data-toggle-hero-menu]", { useTap });
  await page.waitForFunction(() => {
    return document.querySelector("[data-toggle-hero-menu]")?.getAttribute("aria-expanded") === "true" &&
      document.querySelector(".hero-links")?.classList.contains("is-open");
  }, null, { timeout: 8000 });
  await page.waitForTimeout(240);
}

async function closeHeroMenu(page, useTap = false) {
  if (await page.locator("[data-toggle-hero-menu][aria-expanded='true']").count()) {
    await activateControl(page, "[data-toggle-hero-menu][aria-expanded='true']", { useTap });
  }
}

async function openSettingsModal(page, useTap = false) {
  await openHeroMenu(page, useTap);
  await activateControl(page, "[data-open-campus-settings]", { useTap });
  await page.waitForFunction(() => {
    return Boolean(
      document.querySelector(".app-settings-overlay[role='dialog'][aria-modal='true']") &&
      document.querySelector(".app-settings-window") &&
      document.querySelector("[data-app-settings-volume]") &&
      !document.querySelector(".hero-links")?.classList.contains("is-open")
    );
  }, null, { timeout: 8000 });
  await page.waitForTimeout(180);
}

async function closeSettingsModal(page, useTap = false) {
  await activateControl(page, "[data-close-app-settings]", { useTap });
  await page.waitForFunction(() => !document.querySelector(".app-settings-overlay"), null, { timeout: 8000 });
}

async function completeAlpacapardyTouchRound(page) {
  const initialTileCount = await page.evaluate(() => document.querySelectorAll("[data-jeopardy-open]").length);
  await activateControl(page, "[data-jeopardy-open]:not([disabled]):not(.done)", { useTap: true });
  await page.waitForSelector("[data-jeopardy-option]:not([disabled])", { timeout: 10000 });
  const focusOpened = await page.evaluate(() => Boolean(document.querySelector("[data-jeopardy-option]:not([disabled])")));

  await activateControl(page, "[data-jeopardy-option]:not([disabled])", { useTap: true });
  await page.waitForSelector("[data-jeopardy-back]:not([disabled])", { timeout: 10000 });
  const answered = await page.evaluate(() => Boolean(document.querySelector(".feedback-card")));

  await activateControl(page, "[data-jeopardy-back]:not([disabled])", { useTap: true });
  await page.waitForFunction(() => {
    return !document.querySelector("[data-jeopardy-back]")
      && document.querySelectorAll("[data-jeopardy-open]").length > 0
      && document.querySelectorAll("[data-jeopardy-open].done").length > 0;
  }, null, { timeout: 10000 });

  return page.evaluate(({ tileCount, didOpenFocus, didAnswer }) => ({
    boardStarted: document.querySelectorAll("[data-jeopardy-open]").length === tileCount,
    focusOpened: didOpenFocus,
    answered: didAnswer,
    returnedToBoard: !document.querySelector("[data-jeopardy-back]"),
    doneTiles: document.querySelectorAll("[data-jeopardy-open].done").length
  }), { tileCount: initialTileCount, didOpenFocus: focusOpened, didAnswer: answered });
}

async function exerciseJumpTouchActions(page) {
  await page.waitForSelector("[data-jump-stage]", { timeout: 10000 });
  const actionButtons = await page.evaluate(() => document.querySelectorAll("[data-jump-action]").length);

  await activateControl(page, '[data-jump-action="jump"]:not([disabled])', { useTap: true });
  await page.waitForFunction(() => {
    return document.querySelector("[data-jump-runner]")?.dataset.jumpRunnerState === "jumping";
  }, null, { timeout: 3000 }).catch(() => {});
  const jumpedState = await page.evaluate(() => document.querySelector("[data-jump-runner]")?.dataset.jumpRunnerState || "");

  await page.waitForTimeout(700);
  await activateControl(page, '[data-jump-action="duck"]:not([disabled])', { useTap: true });
  await page.waitForFunction(() => {
    return document.querySelector("[data-jump-runner]")?.dataset.jumpRunnerState === "ducking";
  }, null, { timeout: 3000 }).catch(() => {});
  const duckedState = await page.evaluate(() => document.querySelector("[data-jump-runner]")?.dataset.jumpRunnerState || "");

  return {
    actionButtons,
    jumped: jumpedState === "jumping",
    jumpedState,
    ducked: duckedState === "ducking",
    duckedState
  };
}

async function returnToHub(page) {
  await page.evaluate(() => {
    document.querySelector("[data-change-mode]")?.click();
  });
  await page.waitForFunction(() => {
    return !document.querySelector("#experiencePanel")?.classList.contains("hidden")
      ? false
      : Boolean(document.querySelector("#routeBuilder") && !document.querySelector("#routeBuilder")?.inert);
  }, null, { timeout: 8000 });
}

async function collectAudit(page, selectors = []) {
  return page.evaluate((targetSelectors) => {
    const isVisible = (element) => {
      if (!element) {
        return false;
      }
      const style = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };

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
    const gateMount = document.querySelector("#orientationGateMount");
    const gate = gateMount?.querySelector(".orientation-gate");
    const elementAudits = targetSelectors.map((selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        return { selector, present: false };
      }
      const rect = element.getBoundingClientRect();
      const visibleWidth = Math.max(0, Math.min(rect.right, viewport.width) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, viewport.visualHeight) - Math.max(rect.top, 0));
      return {
        selector,
        present: true,
        visible: isVisible(element),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        horizontallyInsideViewport: rect.left >= -2 && rect.right <= viewport.width + 2,
        verticallyIntersectsViewport: rect.bottom >= 0 && rect.top <= viewport.visualHeight,
        visibleWidth: Math.round(visibleWidth),
        visibleHeight: Math.round(visibleHeight),
        visibleAreaRatio: rect.width > 0 && rect.height > 0
          ? Number(((visibleWidth * visibleHeight) / (rect.width * rect.height)).toFixed(3))
          : 0
      };
    });
    const activeElement = document.activeElement;

    return {
      title: document.title,
      appReady: window.WSC_APP_READY === true,
      bodyClass: document.body.className,
      viewport,
      documentWidth,
      horizontalOverflow: Math.max(0, Math.ceil(documentWidth - viewport.width)),
      media: {
        coarsePointer: window.matchMedia("(pointer: coarse)").matches,
        finePointer: window.matchMedia("(pointer: fine)").matches,
        anyCoarsePointer: window.matchMedia("(any-pointer: coarse)").matches,
        anyFinePointer: window.matchMedia("(any-pointer: fine)").matches,
        hoverNone: window.matchMedia("(hover: none)").matches,
        hoverHover: window.matchMedia("(hover: hover)").matches,
        portrait: window.matchMedia("(orientation: portrait)").matches,
        landscape: window.matchMedia("(orientation: landscape)").matches
      },
      navigator: {
        maxTouchPoints: navigator.maxTouchPoints || 0,
        platform: navigator.platform || "",
        userAgent: navigator.userAgent || ""
      },
      gate: {
        mountPresent: Boolean(gateMount),
        mountHidden: Boolean(gateMount?.hidden),
        present: Boolean(gate),
        visible: isVisible(gate),
        hiddenDialogPresent: Boolean(document.querySelector("#orientationGateMount[hidden] [role='dialog']")),
        focusInside: Boolean(gate && activeElement && gate.contains(activeElement)),
        helpText: gate?.querySelector(".orientation-gate-help")?.textContent?.replace(/\s+/g, " ").trim() || "",
        backgroundInert: Boolean(gate) && [...document.body.children]
          .filter((child) => child !== gateMount)
          .filter((child) => !["SCRIPT", "STYLE", "LINK"].includes(child.tagName))
          .every((child) => child.inert === true && child.getAttribute("aria-hidden") === "true")
      },
      routeBuilderHidden: Boolean(document.querySelector("#routeBuilder")?.classList.contains("hidden")),
      routeBuilderInert: Boolean(document.querySelector("#routeBuilder")?.inert),
      elements: elementAudits
    };
  }, selectors);
}

async function collectJumpTargets(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll("[data-jump-action]")]
      .filter((button) => {
        const rect = button.getBoundingClientRect();
        const style = window.getComputedStyle(button);
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      })
      .map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          label: button.textContent?.replace(/\s+/g, " ").trim() || "",
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          meetsTouchSize: rect.width >= 44 && rect.height >= 44
        };
      });
  });
}

async function collectTouchTargets(page, selectors = TOUCH_TARGET_SELECTORS) {
  return page.evaluate((targetSelectors) => {
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };

    const seen = new Set();
    return targetSelectors.flatMap((selector) => {
      return [...document.querySelectorAll(selector)]
        .filter((element) => {
          if (seen.has(element) || !isVisible(element)) {
            return false;
          }
          seen.add(element);
          return true;
        })
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const centerX = Math.max(0, Math.min(window.innerWidth - 1, rect.left + rect.width / 2));
          const centerY = Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height / 2));
          const rawCenterX = rect.left + rect.width / 2;
          const rawCenterY = rect.top + rect.height / 2;
          const centerInViewport = rawCenterX >= 0 && rawCenterX <= window.innerWidth && rawCenterY >= 0 && rawCenterY <= window.innerHeight;
          const topElement = document.elementFromPoint(centerX, centerY);
          const centerHitTestable = Boolean(topElement && (element === topElement || element.contains(topElement)));
          const requiresCenterHit = !element.matches(".selected-section-chip");
          return {
            selector,
            label: element.getAttribute("aria-label") || element.textContent?.replace(/\s+/g, " ").trim() || element.getAttribute("title") || "",
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            centerInViewport,
            centerHitTestable,
            requiresCenterHit,
            meetsTouchSize: rect.width >= 44 && rect.height >= 44 && (!requiresCenterHit || !centerInViewport || centerHitTestable)
          };
        });
    });
  }, selectors);
}

async function collectModeCardLayout(page, modePath) {
  return page.evaluate((targetModePath) => {
    const modeColumn = document.querySelector(`[data-mode-choice-path="${targetModePath}"]`);
    const grid = modeColumn?.querySelector(".mode-choice-card-grid");
    const board = modeColumn?.closest(".mode-choice-board");
    const rectInfo = (element) => {
      if (!element) {
        return null;
      }
      const rect = element.getBoundingClientRect();
      const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      return {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        visibleWidth: Math.round(visibleWidth),
        visibleHeight: Math.round(visibleHeight),
        visibleAreaRatio: rect.width > 0 && rect.height > 0
          ? Number(((visibleWidth * visibleHeight) / (rect.width * rect.height)).toFixed(3))
          : 0
      };
    };

    const cards = [...(modeColumn?.querySelectorAll("[data-pick-mode]") || [])].map((card) => {
      const slot = card.querySelector(".wizard-choice-slot");
      const copy = card.querySelector(".wizard-choice-copy");
      const label = card.querySelector("h3");
      return {
        label: label?.textContent?.replace(/\s+/g, " ").trim() || "",
        card: rectInfo(card),
        slot: rectInfo(slot),
        copy: rectInfo(copy),
        labelBox: rectInfo(label)
      };
    });

    const gridColumns = window.getComputedStyle(grid).gridTemplateColumns
      .split(/\s+/)
      .filter(Boolean);

    return {
      modePath: targetModePath,
      present: Boolean(modeColumn && grid),
      boardClass: board?.className || "",
      activePath: board?.dataset.activePath || "",
      grid: rectInfo(grid),
      columnCount: gridColumns.length,
      cards
    };
  }, modePath);
}

async function collectLearnContentRuntime(page) {
  return page.evaluate(() => {
    const rectInfo = (selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        return null;
      }
      const rect = element.getBoundingClientRect();
      const visibleWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0));
      return {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        visibleWidth: Math.round(visibleWidth),
        visibleHeight: Math.round(visibleHeight),
        visibleAreaRatio: rect.width > 0 && rect.height > 0
          ? Number(((visibleWidth * visibleHeight) / (rect.width * rect.height)).toFixed(3))
          : 0
      };
    };

    const panel = document.querySelector("#experiencePanel");
    const scrollRoot = document.scrollingElement || document.documentElement;
    const beforeScroll = scrollRoot.scrollTop;
    const maxScroll = Math.max(0, scrollRoot.scrollHeight - window.innerHeight);
    scrollRoot.scrollTop = Math.min(maxScroll, beforeScroll + 220);
    const afterScroll = scrollRoot.scrollTop;
    scrollRoot.scrollTop = beforeScroll;
    const panelBeforeScroll = panel?.scrollTop || 0;
    const maxPanelScroll = panel
      ? Math.max(0, panel.scrollHeight - panel.clientHeight)
      : 0;
    if (panel) {
      panel.scrollTop = Math.min(maxPanelScroll, panelBeforeScroll + 220);
    }
    const panelAfterScroll = panel?.scrollTop || 0;
    if (panel) {
      panel.scrollTop = panelBeforeScroll;
    }

    return {
      panelClass: panel?.className || "",
      panel: rectInfo("#experiencePanel"),
      shell: rectInfo(".raw-content-shell"),
      firstCard: rectInfo(".raw-source-card, .raw-entry-card, .raw-section-group-card"),
      footerNav: rectInfo(".learn-card-footer-nav"),
      counts: {
        cards: document.querySelectorAll(".raw-source-card, .raw-entry-card, .raw-section-group-card").length,
        quizOptions: document.querySelectorAll(".raw-quiz-option").length,
        galleryNavs: document.querySelectorAll(".raw-question-gallery-nav").length,
        footerButtons: document.querySelectorAll(".learn-footer-card-button").length
      },
      scroll: {
        documentHeight: Math.round(document.documentElement.scrollHeight),
        viewportHeight: window.innerHeight,
        maxScroll: Math.round(maxScroll),
        beforeScroll: Math.round(beforeScroll),
        afterScroll: Math.round(afterScroll),
        moved: afterScroll > beforeScroll + 8
      },
      panelOverflow: panel
        ? {
            scrollHeight: panel.scrollHeight,
            clientHeight: panel.clientHeight,
            maxScroll: Math.round(maxPanelScroll),
            beforeScroll: Math.round(panelBeforeScroll),
            afterScroll: Math.round(panelAfterScroll),
            scrollable: panel.scrollHeight > panel.clientHeight + 8,
            moved: panelAfterScroll > panelBeforeScroll + 8
          }
        : null
    };
  });
}

function pushAuditFailures(failures, viewportConfig, audit, options = {}) {
  const prefix = viewportConfig.label;

  if (!audit.appReady) {
    failures.push(`${prefix}: app did not report WSC_APP_READY`);
  }
  if (!audit.title.includes("WSCapp") && !audit.title.includes("World Scholar")) {
    failures.push(`${prefix}: page title did not identify the WSC app`);
  }
  if (audit.gate.hiddenDialogPresent) {
    failures.push(`${prefix}: hidden orientation gate must not leave a dialog in the DOM`);
  }
  if (audit.horizontalOverflow > 2) {
    failures.push(`${prefix}: document has ${audit.horizontalOverflow}px horizontal overflow`);
  }

  if (viewportConfig.expectLandscapeGate) {
    if (!audit.gate.visible || !audit.bodyClass.includes("needs-landscape")) {
      failures.push(`${prefix}: portrait touch viewport should show the landscape gate`);
    }
    if (!audit.gate.focusInside) {
      failures.push(`${prefix}: landscape gate should contain focus while visible`);
    }
    if (!audit.gate.backgroundInert) {
      failures.push(`${prefix}: landscape gate should inert and aria-hide background content`);
    }
    if (!/rotation|rotate|sideways/i.test(audit.gate.helpText)) {
      failures.push(`${prefix}: landscape gate should include rotation-lock recovery copy`);
    }
    if (!audit.media.portrait || !audit.media.coarsePointer) {
      failures.push(`${prefix}: expected portrait coarse-pointer media state`);
    }
    return;
  }

  if (audit.gate.visible || audit.bodyClass.includes("needs-landscape")) {
    failures.push(`${prefix}: landscape/desktop viewport should not show the landscape gate`);
  }
  if (viewportConfig.expectTouchLandscape && !audit.bodyClass.includes("is-touch-landscape")) {
    failures.push(`${prefix}: touch landscape viewport should use the touch landscape presentation`);
  }
  if (viewportConfig.expectDesktopPresentation) {
    const desktopOnlyClasses = ["needs-landscape", "prefers-landscape-device", "is-touch-landscape"]
      .filter((className) => audit.bodyClass.includes(className));
    if (desktopOnlyClasses.length) {
      failures.push(`${prefix}: desktop presentation should not use mobile/tablet classes (${desktopOnlyClasses.join(", ")})`);
    }
  }
  if (options.expectRouteBuilder && (audit.routeBuilderHidden || audit.routeBuilderInert)) {
    failures.push(`${prefix}: route builder should be visible and interactive after local entry`);
  }

  for (const element of audit.elements) {
    if (!element.present || !element.visible) {
      failures.push(`${prefix}: ${element.selector} was not visible`);
      continue;
    }
    if (options.requireElementsInsideViewport && !element.horizontallyInsideViewport) {
      failures.push(`${prefix}: ${element.selector} extends outside the viewport (${element.left}-${element.right} of ${audit.viewport.width})`);
    }
    if (options.requireVerticalVisibility && !element.verticallyIntersectsViewport) {
      failures.push(`${prefix}: ${element.selector} is outside the visible viewport vertically (${element.top}-${element.bottom} of ${audit.viewport.visualHeight})`);
    }
    if (options.minimumVisibleAreaRatio && element.visibleAreaRatio < options.minimumVisibleAreaRatio) {
      failures.push(`${prefix}: ${element.selector} is only ${Math.round(element.visibleAreaRatio * 100)}% visible in the viewport`);
    }
  }
}

function pushTouchTargetFailures(failures, result, viewportConfig, groupName, targets = []) {
  if (!viewportConfig.hasTouch) {
    return;
  }

  const undersizedTargets = targets.filter((target) => !target.meetsTouchSize);
  if (undersizedTargets.length) {
    failures.push(`${result.label}: ${groupName} touch controls are below 44px (${JSON.stringify(undersizedTargets)})`);
  }
}

function pushModeCardLayoutFailures(failures, result, viewportConfig, layout) {
  if (!viewportConfig.hasTouch || !layout) {
    return;
  }
  if (!layout.present) {
    failures.push(`${result.label}: play mode card grid was not present`);
    return;
  }
  if (viewportConfig.expectDesktopPresentation) {
    return;
  }
  if (!layout.boardClass.includes("has-active-mode-column") || !layout.boardClass.includes("has-open-mode-column")) {
    failures.push(`${result.label}: play menu board is missing explicit open-state fallback classes (${layout.boardClass})`);
  }
  if (!layout.boardClass.includes("is-mode-path-play") || layout.activePath !== "play") {
    failures.push(`${result.label}: play menu board is missing explicit play-path fallback state (${JSON.stringify({
      boardClass: layout.boardClass,
      activePath: layout.activePath
    })})`);
  }

  const visibleCards = layout.cards.filter((card) => card.card?.visibleAreaRatio >= 0.35);
  const compressedCards = visibleCards.filter((card) =>
    (card.slot?.width || 0) > 56 ||
    (card.copy?.width || 0) < 64 ||
    (card.card?.height || 0) < 44 ||
    (card.card?.width || 0) < 120
  );
  if (compressedCards.length) {
    failures.push(`${result.label}: play mode cards are visually compressed (${JSON.stringify(compressedCards)})`);
  }

  if (viewportConfig.viewport.width <= 980 && viewportConfig.viewport.height <= 540) {
    const expectedColumns = viewportConfig.viewport.width < 620 ? 1 : 2;
    if (layout.columnCount !== expectedColumns) {
      failures.push(`${result.label}: phone landscape play menu should use ${expectedColumns} column${expectedColumns === 1 ? "" : "s"}, got ${layout.columnCount}`);
    }

    if (layout.cards.length < 5) {
      failures.push(`${result.label}: phone landscape play menu should expose all five play cards, got ${layout.cards.length}`);
    }

    const clippedCards = layout.cards.filter((card) => (card.card?.visibleAreaRatio || 0) < PHONE_PLAY_CARD_MIN_VISIBLE_RATIO);
    if (clippedCards.length) {
      failures.push(`${result.label}: phone landscape play cards are clipped (${JSON.stringify(clippedCards)})`);
    }
  }
  if (viewportConfig.viewport.width <= 980 && viewportConfig.viewport.height <= 540 && (layout.grid?.visibleAreaRatio || 0) < PHONE_PLAY_MENU_MIN_VISIBLE_RATIO) {
    failures.push(`${result.label}: phone landscape play menu grid is only ${Math.round((layout.grid?.visibleAreaRatio || 0) * 100)}% visible`);
  }
  if (viewportConfig.viewport.width >= 1180 && layout.columnCount < 3) {
    failures.push(`${result.label}: large tablet play menu should expose at least three columns, got ${layout.columnCount}`);
  }
}

function pushLearnContentFailures(failures, result, viewportConfig, runtime) {
  if (!runtime) {
    return;
  }
  if (!runtime.panel || runtime.panel.visibleAreaRatio < 0.22) {
    failures.push(`${result.label}: learn content panel is not sufficiently visible (${JSON.stringify(runtime.panel)})`);
  }
  if (!runtime.panelClass.includes("experience-panel--rawcontent")) {
    failures.push(`${result.label}: learn content panel is missing the rawcontent type class (${runtime.panelClass})`);
  }
  if (!runtime.shell || runtime.shell.width <= 0 || runtime.shell.visibleWidth <= 0 || runtime.shell.visibleHeight < 80) {
    failures.push(`${result.label}: learn content shell is not visible enough (${JSON.stringify(runtime.shell)})`);
  }
  if (runtime.counts.cards < 1) {
    failures.push(`${result.label}: learn content did not render raw content cards (${JSON.stringify(runtime.counts)})`);
  }
  if (viewportConfig.hasTouch && runtime.counts.footerButtons < 3) {
    failures.push(`${result.label}: learn content footer navigation is incomplete on touch viewport (${JSON.stringify(runtime.counts)})`);
  }
  if (viewportConfig.viewport.height <= 430 && !runtime.scroll.moved && !runtime.panelOverflow?.moved) {
    failures.push(`${result.label}: learn content long page is not scrollable in phone landscape (${JSON.stringify({
      documentScroll: runtime.scroll,
      panelOverflow: runtime.panelOverflow
    })})`);
  }
}

function pushInteractionFailures(failures, result) {
  const alpacapardy = result.interactions?.alpacapardyTouchRound;
  if (alpacapardy) {
    if (!alpacapardy.boardStarted || !alpacapardy.focusOpened || !alpacapardy.answered || !alpacapardy.returnedToBoard || alpacapardy.doneTiles < 1) {
      failures.push(`${result.label}: Alpacapardy touch tap round did not complete (${JSON.stringify(alpacapardy)})`);
    }
  }

  const jump = result.interactions?.jumpTouchActions;
  if (jump) {
    if (jump.actionButtons < 2 || !jump.jumped || !jump.ducked) {
      failures.push(`${result.label}: Jump touch actions did not respond to taps (${JSON.stringify(jump)})`);
    }
  }
}

async function runViewport(browser, viewportConfig) {
  const contextOptions = {
    viewport: viewportConfig.viewport,
    hasTouch: viewportConfig.hasTouch,
    isMobile: viewportConfig.isMobile,
    deviceScaleFactor: viewportConfig.isMobile ? 2 : 1,
    serviceWorkers: "block"
  };
  if (viewportConfig.userAgent) {
    contextOptions.userAgent = viewportConfig.userAgent;
  }

  const context = await browser.newContext(contextOptions);
  if (viewportConfig.matchMediaOverrides) {
    await context.addInitScript((overrides) => {
      const nativeMatchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query) => {
        const mediaQueryList = nativeMatchMedia(query);
        if (!Object.prototype.hasOwnProperty.call(overrides, query)) {
          return mediaQueryList;
        }
        return new Proxy(mediaQueryList, {
          get(target, property) {
            if (property === "matches") {
              return Boolean(overrides[query]);
            }
            const value = target[property];
            return typeof value === "function" ? value.bind(target) : value;
          }
        });
      };
    }, viewportConfig.matchMediaOverrides);
  }
  if (viewportConfig.navigatorOverrides) {
    await context.addInitScript((overrides) => {
      for (const [property, value] of Object.entries(overrides)) {
        Object.defineProperty(Navigator.prototype, property, {
          configurable: true,
          get: () => value
        });
      }
    }, viewportConfig.navigatorOverrides);
  }
  const page = await context.newPage();
  const messages = [];
  page.on("console", (message) => messages.push({ type: message.type(), text: message.text() }));
  page.on("pageerror", (error) => messages.push({ type: "pageerror", text: error.message }));

  const result = {
    id: viewportConfig.id,
    label: viewportConfig.label,
    viewport: viewportConfig.viewport,
    audits: {},
    touchTargets: {},
    modeCardLayouts: {},
    interactions: {},
    learnContent: null,
    messages
  };

  try {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => window.WSC_APP_READY === true, null, { timeout: 60000 });

    result.audits.boot = await collectAudit(page, ["#routeBuilder"]);

    if (viewportConfig.expectLandscapeGate) {
      result.touchTargets.gate = await collectTouchTargets(page, [".orientation-gate-button"]);
      return result;
    }

    await chooseLocalRoute(page);

    if (viewportConfig.checks?.includes("hero-menu")) {
      await openHeroMenu(page, viewportConfig.hasTouch);
      result.audits.heroMenu = await collectAudit(page, [
        ".hero-links.is-open",
        ".hero-links.is-open > .hero-discord-link",
        ".hero-links.is-open > .session-controls",
        ".hero-links.is-open > .hero-resources-icon",
        ".hero-links.is-open > a.hero-link-icon"
      ]);
      result.touchTargets.heroMenu = await collectTouchTargets(page, [
        "[data-toggle-hero-menu]",
        ".hero-links.is-open > a",
        ".hero-links.is-open > button",
        ".hero-links.is-open .session-mode-button",
        ".hero-links.is-open .session-signout-button"
      ]);
      await closeHeroMenu(page, viewportConfig.hasTouch);
    }

    if (viewportConfig.checks?.includes("settings-modal")) {
      await openSettingsModal(page, viewportConfig.hasTouch);
      result.audits.settingsModal = await collectAudit(page, [
        ".app-settings-overlay",
        ".app-settings-window",
        ".app-settings-control",
        "[data-app-settings-volume]"
      ]);
      result.touchTargets.settingsModal = await collectTouchTargets(page, [
        ".popup-close-button",
        "[data-close-app-settings]",
        "[data-app-settings-mute]",
        "[data-app-settings-volume]"
      ]);
      await closeSettingsModal(page, viewportConfig.hasTouch);
    }

    result.audits.localRoute = await collectAudit(page, ["#routeBuilder", ".mode-choice-board"]);
    result.touchTargets.localRoute = await collectTouchTargets(page, [
      ".selected-section-chip"
    ]);

    if (viewportConfig.checks?.includes("play-menu")) {
      await chooseSection(page, TEST_SECTION);
      result.touchTargets.sectionMenu = await collectTouchTargets(page, [
        "[data-toggle-mode-menu]"
      ]);
      await openModeColumn(page, "play");
      if (viewportConfig.hasTouch) {
        await waitForVisibleArea(page, ".mode-choice-column.is-open .mode-choice-card-grid", PHONE_PLAY_MENU_MIN_VISIBLE_RATIO);
      }
      result.audits.playMenu = await collectAudit(page, ["#routeBuilder", ".mode-choice-board", '[data-mode-choice-path="play"]', ".mode-choice-column.is-open .mode-choice-card-grid"]);
      result.touchTargets.playMenu = await collectTouchTargets(page, [
        ".selected-section-chip",
        ".mode-choice-column.is-open .mode-choice-card-grid [data-pick-mode]"
      ]);
      result.modeCardLayouts.playMenu = await collectModeCardLayout(page, "play");
    }

    if (viewportConfig.checks?.includes("learn-content")) {
      await startLearnContent(page);
      result.audits.learnContent = await collectAudit(page, [
        "#experiencePanel",
        ".raw-content-shell",
        ".raw-source-card, .raw-entry-card, .raw-section-group-card",
        ".learn-card-footer-nav"
      ]);
      result.touchTargets.learnContent = await collectTouchTargets(page, [
        ".panel-hub-link",
        ".raw-quiz-option",
        ".raw-question-gallery-nav",
        ".learn-footer-card-button"
      ]);
      result.learnContent = await collectLearnContentRuntime(page);
      await returnToHub(page);
    }

    if (viewportConfig.checks?.includes("alpacapardy-board")) {
      await startAlpacapardyBoard(page, viewportConfig.hasTouch);
      result.audits.alpacapardyBoard = await collectAudit(page, ["#experiencePanel", ".jeopardy-board-shell"]);
      result.touchTargets.alpacapardyBoard = await collectTouchTargets(page, [
        "[data-jeopardy-open]",
        ".jeopardy-tile",
        ".button"
      ]);
      if (viewportConfig.hasTouch) {
        result.interactions.alpacapardyTouchRound = await completeAlpacapardyTouchRound(page);
      }
    }

    if (viewportConfig.checks?.includes("jump-stage")) {
      await startJumpStage(page, viewportConfig.hasTouch);
      result.audits.jumpStage = await collectAudit(page, ["#experiencePanel", ".jump-shell", "[data-jump-stage]"]);
      result.jumpTargets = await collectJumpTargets(page);
      result.touchTargets.jumpStage = await collectTouchTargets(page, ["[data-jump-action]", ".button"]);
      if (viewportConfig.hasTouch) {
        result.interactions.jumpTouchActions = await exerciseJumpTouchActions(page);
      }
    }

    return result;
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

    const results = [];
    for (const viewportConfig of VIEWPORTS) {
      results.push(await runViewport(browser, viewportConfig));
    }
    await browser.close();
    browser = null;

    const failures = [];
    for (const result of results) {
      const viewportConfig = VIEWPORTS.find((candidate) => candidate.id === result.id);
      pushAuditFailures(failures, viewportConfig, result.audits.boot);
      pushTouchTargetFailures(failures, result, viewportConfig, "orientation gate", result.touchTargets.gate);

      if (result.audits.heroMenu) {
        pushAuditFailures(failures, viewportConfig, result.audits.heroMenu, {
          requireElementsInsideViewport: true,
          requireVerticalVisibility: true
        });
        pushTouchTargetFailures(failures, result, viewportConfig, "hero menu", result.touchTargets.heroMenu);
      }

      if (result.audits.settingsModal) {
        pushAuditFailures(failures, viewportConfig, result.audits.settingsModal, {
          requireElementsInsideViewport: true,
          requireVerticalVisibility: true,
          minimumVisibleAreaRatio: 0.68
        });
        pushTouchTargetFailures(failures, result, viewportConfig, "settings modal", result.touchTargets.settingsModal);
      }

      if (result.audits.localRoute) {
        pushAuditFailures(failures, viewportConfig, result.audits.localRoute, {
          expectRouteBuilder: true,
          requireElementsInsideViewport: true
        });
        pushTouchTargetFailures(failures, result, viewportConfig, "local route", result.touchTargets.localRoute);
      }
      if (result.touchTargets.sectionMenu) {
        pushTouchTargetFailures(failures, result, viewportConfig, "section mode menu", result.touchTargets.sectionMenu);
      }
      if (result.audits.playMenu) {
        pushAuditFailures(failures, viewportConfig, result.audits.playMenu, {
          expectRouteBuilder: true,
          requireElementsInsideViewport: true
        });
        pushTouchTargetFailures(failures, result, viewportConfig, "play menu", result.touchTargets.playMenu);
        pushModeCardLayoutFailures(failures, result, viewportConfig, result.modeCardLayouts.playMenu);
      }
      if (result.audits.learnContent) {
        pushAuditFailures(failures, viewportConfig, result.audits.learnContent, {
          requireElementsInsideViewport: true
        });
        pushTouchTargetFailures(failures, result, viewportConfig, "learn content", result.touchTargets.learnContent);
        pushLearnContentFailures(failures, result, viewportConfig, result.learnContent);
      }
      if (result.audits.alpacapardyBoard) {
        pushAuditFailures(failures, viewportConfig, result.audits.alpacapardyBoard, {
          requireElementsInsideViewport: true,
          requireVerticalVisibility: true,
          minimumVisibleAreaRatio: 0.22
        });
        pushTouchTargetFailures(failures, result, viewportConfig, "Alpacapardy", result.touchTargets.alpacapardyBoard);
      }
      if (result.audits.jumpStage) {
        pushAuditFailures(failures, viewportConfig, result.audits.jumpStage, {
          requireElementsInsideViewport: true,
          requireVerticalVisibility: true,
          minimumVisibleAreaRatio: 0.22
        });
        const undersizedTargets = (result.jumpTargets || []).filter((target) => !target.meetsTouchSize);
        if (undersizedTargets.length) {
          failures.push(`${result.label}: jump touch controls are below 44px (${JSON.stringify(undersizedTargets)})`);
        }
        pushTouchTargetFailures(failures, result, viewportConfig, "jump stage", result.touchTargets.jumpStage);
      }
      pushInteractionFailures(failures, result);

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
      viewports: results.map((result) => ({
        id: result.id,
        label: result.label,
        viewport: result.viewport,
        audits: result.audits,
        touchTargets: result.touchTargets,
        modeCardLayouts: result.modeCardLayouts,
        interactions: result.interactions,
        learnContent: result.learnContent,
        jumpTargets: result.jumpTargets || []
      })),
      failures
    }, null, 2));

    if (failures.length) {
      console.error(`Responsive device smoke failed:\n- ${failures.join("\n- ")}`);
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
