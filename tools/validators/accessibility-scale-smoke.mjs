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
const SERVER_DIR = artifactRootArg
  ? path.resolve(process.cwd(), artifactRootArg)
  : APP_DIR;
const PORT = Number(process.env.WSC_A11Y_SCALE_PORT || 4195);
const BASE_URL = `http://localhost:${PORT}`;
const DEFAULT_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TEST_SECTION = "We Are All in This to Get There";
const WINDOWS_CHROME_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36";

const SCALE_VIEWPORTS = [
  {
    id: "iphone-landscape-large-text",
    label: "iPhone landscape 125% text",
    viewport: { width: 844, height: 390 },
    hasTouch: true,
    isMobile: true,
    textScale: 1.25,
    checks: ["hero-menu", "settings-modal", "learn-content"]
  },
  {
    id: "ipad-landscape-large-text",
    label: "iPad landscape 125% text",
    viewport: { width: 1180, height: 820 },
    hasTouch: true,
    isMobile: true,
    textScale: 1.25,
    checks: ["hero-menu", "settings-modal", "play-menu"]
  },
  {
    id: "windows-minimum-large-text",
    label: "Windows minimum laptop 125% text",
    viewport: { width: 1024, height: 600 },
    hasTouch: false,
    isMobile: false,
    textScale: 1.25,
    userAgent: WINDOWS_CHROME_USER_AGENT,
    navigatorOverrides: { platform: "Win32" },
    checks: ["hero-menu", "settings-modal", "play-menu", "alpacapardy-round"]
  }
];

if (!fs.existsSync(SERVER_DIR) || !fs.statSync(SERVER_DIR).isDirectory()) {
  throw new Error(`Accessibility scale test root does not exist: ${SERVER_DIR}`);
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
  throw new Error("Playwright is not available. Install Playwright to run accessibility scale tests.");
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
  await waitForVisibleArea(page, ".mode-choice-column.is-open .mode-choice-card-grid", 0.45);
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

async function openHeroMenu(page, useTap) {
  await activateControl(page, "[data-toggle-hero-menu]", { useTap });
  await page.waitForFunction(() => {
    return document.querySelector("[data-toggle-hero-menu]")?.getAttribute("aria-expanded") === "true" &&
      document.querySelector(".hero-links")?.classList.contains("is-open");
  }, null, { timeout: 10000 });
  await page.waitForTimeout(180);
}

async function closeHeroMenu(page, useTap) {
  if (await page.locator("[data-toggle-hero-menu][aria-expanded='true']").count()) {
    await activateControl(page, "[data-toggle-hero-menu][aria-expanded='true']", { useTap });
    await page.waitForFunction(() => !document.querySelector(".hero-links")?.classList.contains("is-open"), null, { timeout: 10000 });
  }
}

async function openSettingsModal(page, useTap) {
  await openHeroMenu(page, useTap);
  await activateControl(page, "[data-open-campus-settings]", { useTap });
  await page.waitForFunction(() => {
    return Boolean(
      document.querySelector(".app-settings-overlay[role='dialog'][aria-modal='true']") &&
      document.querySelector(".app-settings-window") &&
      document.querySelector("[data-app-settings-volume]") &&
      !document.querySelector(".hero-links")?.classList.contains("is-open")
    );
  }, null, { timeout: 10000 });
}

async function closeSettingsModal(page, useTap) {
  await activateControl(page, "[data-close-app-settings]", { useTap });
  await page.waitForFunction(() => !document.querySelector(".app-settings-overlay"), null, { timeout: 10000 });
}

async function startLearnContent(page) {
  await chooseMode(page, "rawcontent", "learn");
  await page.waitForFunction(() => {
    return Boolean(
      document.querySelector("#experiencePanel:not(.hidden)") &&
      document.querySelector(".raw-content-shell") &&
      document.querySelector(".raw-source-card, .raw-entry-card, .raw-section-group-card")
    );
  }, null, { timeout: 12000 });
  await page.waitForTimeout(180);
}

async function completeAlpacapardyRound(page) {
  await chooseMode(page, "jeopardy", "play");
  await activateControl(page, "[data-jeopardy-start]:not([disabled])");
  await page.waitForFunction(() => document.querySelectorAll("[data-jeopardy-open]").length > 0, null, { timeout: 12000 });
  await waitForVisibleArea(page, ".jeopardy-board-shell", 0.22);
  const initialTileCount = await page.evaluate(() => document.querySelectorAll("[data-jeopardy-open]").length);
  await activateControl(page, "[data-jeopardy-open]:not([disabled]):not(.done)");
  await page.waitForSelector("[data-jeopardy-option]:not([disabled])", { timeout: 12000 });
  await activateControl(page, "[data-jeopardy-option]:not([disabled])");
  await page.waitForSelector("[data-jeopardy-back]:not([disabled])", { timeout: 12000 });
  const answered = await page.evaluate(() => Boolean(document.querySelector(".feedback-card")));
  await activateControl(page, "[data-jeopardy-back]:not([disabled])");
  await page.waitForFunction(() => {
    return !document.querySelector("[data-jeopardy-back]")
      && document.querySelectorAll("[data-jeopardy-open].done").length > 0;
  }, null, { timeout: 12000 });
  return page.evaluate(({ tileCount, didAnswer }) => ({
    boardStarted: document.querySelectorAll("[data-jeopardy-open]").length === tileCount,
    answered: didAnswer,
    returnedToBoard: !document.querySelector("[data-jeopardy-back]"),
    doneTiles: document.querySelectorAll("[data-jeopardy-open].done").length
  }), { tileCount: initialTileCount, didAnswer: answered });
}

async function collectAudit(page, selectors = []) {
  return page.evaluate((targetSelectors) => {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      visualHeight: window.visualViewport?.height || window.innerHeight
    };
    const documentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth || 0
    );
    const isVisible = (element) => {
      if (!element) {
        return false;
      }
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const elements = targetSelectors.map((selector) => {
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
        insideX: rect.left >= -2 && rect.right <= viewport.width + 2,
        intersectsY: rect.bottom >= 0 && rect.top <= viewport.visualHeight,
        visibleAreaRatio: rect.width > 0 && rect.height > 0
          ? Number(((visibleWidth * visibleHeight) / (rect.width * rect.height)).toFixed(3))
          : 0
      };
    });
    return {
      appReady: window.WSC_APP_READY === true,
      title: document.title,
      bodyClass: document.body.className,
      rootFontSize: window.getComputedStyle(document.documentElement).fontSize,
      viewport,
      documentWidth,
      horizontalOverflow: Math.max(0, Math.ceil(documentWidth - viewport.width)),
      elements
    };
  }, selectors);
}

async function collectTouchTargets(page, selectors) {
  return page.evaluate((targetSelectors) => {
    const seen = new Set();
    return targetSelectors.flatMap((selector) => {
      return [...document.querySelectorAll(selector)]
        .filter((element) => {
          if (seen.has(element)) {
            return false;
          }
          seen.add(element);
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
        })
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const centerX = Math.max(0, Math.min(window.innerWidth - 1, rect.left + rect.width / 2));
          const centerY = Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height / 2));
          const topElement = document.elementFromPoint(centerX, centerY);
          return {
            selector,
            label: element.getAttribute("aria-label") || element.textContent?.replace(/\s+/g, " ").trim() || "",
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            centerHitTestable: Boolean(topElement && (element === topElement || element.contains(topElement))),
            meetsTouchSize: rect.width >= 44 && rect.height >= 44
          };
        });
    });
  }, selectors);
}

async function collectHorizontalTextClips(page, selectors) {
  return page.evaluate((targetSelectors) => {
    return targetSelectors.flatMap((selector) => {
      return [...document.querySelectorAll(selector)]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
        })
        .filter((element) => element.scrollWidth > element.clientWidth + 2)
        .map((element) => ({
          selector,
          label: element.getAttribute("aria-label") || element.textContent?.replace(/\s+/g, " ").trim() || "",
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth
        }));
    });
  }, selectors);
}

async function collectLearnScrollRuntime(page) {
  return page.evaluate(() => {
    const panel = document.querySelector("#experiencePanel");
    const beforeScroll = panel?.scrollTop || 0;
    const maxPanelScroll = panel ? Math.max(0, panel.scrollHeight - panel.clientHeight) : 0;
    if (panel) {
      panel.scrollTop = Math.min(maxPanelScroll, beforeScroll + 220);
    }
    const afterScroll = panel?.scrollTop || 0;
    if (panel) {
      panel.scrollTop = beforeScroll;
    }
    return {
      panelClass: panel?.className || "",
      scrollHeight: panel?.scrollHeight || 0,
      clientHeight: panel?.clientHeight || 0,
      moved: afterScroll > beforeScroll + 8,
      maxPanelScroll
    };
  });
}

function pushAuditFailures(failures, result, audit, options = {}) {
  if (!audit.appReady) {
    failures.push(`${result.label}: app did not report WSC_APP_READY`);
  }
  if (audit.horizontalOverflow > 2) {
    failures.push(`${result.label}: document has ${audit.horizontalOverflow}px horizontal overflow at ${audit.rootFontSize}`);
  }
  for (const element of audit.elements) {
    if (!element.present || !element.visible) {
      failures.push(`${result.label}: ${element.selector} was not visible at ${audit.rootFontSize}`);
      continue;
    }
    if (options.insideViewport && (!element.insideX || !element.intersectsY)) {
      failures.push(`${result.label}: ${element.selector} is not fully usable in the viewport at ${audit.rootFontSize} (${JSON.stringify(element)})`);
    }
    if (options.minimumVisibleAreaRatio && element.visibleAreaRatio < options.minimumVisibleAreaRatio) {
      failures.push(`${result.label}: ${element.selector} is only ${Math.round(element.visibleAreaRatio * 100)}% visible at ${audit.rootFontSize}`);
    }
  }
}

function pushTouchTargetFailures(failures, result, groupName, targets = []) {
  if (!result.hasTouch) {
    return;
  }
  const failing = targets.filter((target) => !target.meetsTouchSize || !target.centerHitTestable);
  if (failing.length) {
    failures.push(`${result.label}: ${groupName} touch targets fail at scaled text (${JSON.stringify(failing)})`);
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
  await context.addInitScript((scale) => {
    const applyScale = () => {
      const style = document.createElement("style");
      style.id = "wsc-accessibility-scale-test-style";
      style.textContent = `html { font-size: ${Math.round(scale * 100)}% !important; }`;
      document.documentElement.appendChild(style);
    };
    if (document.documentElement) {
      applyScale();
    } else {
      document.addEventListener("DOMContentLoaded", applyScale, { once: true });
    }
  }, viewportConfig.textScale);
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
    hasTouch: viewportConfig.hasTouch,
    viewport: viewportConfig.viewport,
    textScale: viewportConfig.textScale,
    audits: {},
    touchTargets: {},
    textClips: {},
    interactions: {},
    learnScroll: null,
    messages
  };

  try {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => window.WSC_APP_READY === true, null, { timeout: 60000 });
    result.audits.boot = await collectAudit(page, ["#routeBuilder"]);

    await chooseLocalRoute(page, viewportConfig.hasTouch);
    result.audits.localRoute = await collectAudit(page, ["#routeBuilder", ".mode-choice-board"]);

    if (viewportConfig.checks.includes("hero-menu")) {
      await openHeroMenu(page, viewportConfig.hasTouch);
      result.audits.heroMenu = await collectAudit(page, [
        ".hero-links.is-open",
        ".hero-links.is-open > .hero-discord-link",
        ".hero-links.is-open > .session-controls",
        ".hero-links.is-open > button.hero-link-icon",
        ".hero-links.is-open > a.hero-link-icon"
      ]);
      result.touchTargets.heroMenu = await collectTouchTargets(page, [
        "[data-toggle-hero-menu]",
        ".hero-links.is-open > a",
        ".hero-links.is-open > button",
        ".hero-links.is-open .session-signout-button"
      ]);
      result.textClips.heroMenu = await collectHorizontalTextClips(page, [
        ".hero-links.is-open > a",
        ".hero-links.is-open > button",
        ".hero-links.is-open .session-signout-button"
      ]);
      await closeHeroMenu(page, viewportConfig.hasTouch);
    }

    if (viewportConfig.checks.includes("settings-modal")) {
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
      result.textClips.settingsModal = await collectHorizontalTextClips(page, [
        ".app-settings-window button",
        ".app-settings-row",
        ".app-settings-volume-label"
      ]);
      await closeSettingsModal(page, viewportConfig.hasTouch);
    }

    if (viewportConfig.checks.includes("play-menu")) {
      await chooseSection(page, TEST_SECTION);
      await openModeColumn(page, "play");
      await waitForVisibleArea(page, ".mode-choice-column.is-open .mode-choice-card-grid", 0.45);
      result.audits.playMenu = await collectAudit(page, [
        "#routeBuilder",
        ".mode-choice-board",
        '[data-mode-choice-path="play"]',
        ".mode-choice-column.is-open .mode-choice-card-grid"
      ]);
      result.textClips.playMenu = await collectHorizontalTextClips(page, [
        ".mode-choice-column.is-open .mode-choice-card-grid [data-pick-mode]",
        ".mode-choice-column.is-open .mode-choice-card-grid h3"
      ]);
    }

    if (viewportConfig.checks.includes("learn-content")) {
      await startLearnContent(page);
      result.audits.learnContent = await collectAudit(page, [
        "#experiencePanel",
        ".raw-source-card, .raw-entry-card, .raw-section-group-card"
      ]);
      result.learnScroll = await collectLearnScrollRuntime(page);
    }

    if (viewportConfig.checks.includes("alpacapardy-round")) {
      result.interactions.alpacapardyRound = await completeAlpacapardyRound(page);
      result.audits.alpacapardyBoard = await collectAudit(page, ["#experiencePanel", ".jeopardy-board-shell"]);
    }

    return result;
  } finally {
    await context.close();
  }
}

async function main() {
  const { chromium } = loadPlaywright();
  const server = spawn("python3", ["-m", "http.server", String(PORT)], {
    cwd: SERVER_DIR,
    stdio: "ignore"
  });
  let browser = null;

  try {
    await waitForServer(`${BASE_URL}/index.html`);
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || (fs.existsSync(DEFAULT_CHROME_PATH) ? DEFAULT_CHROME_PATH : undefined)
    });
    const results = [];
    for (const viewportConfig of SCALE_VIEWPORTS) {
      results.push(await runViewport(browser, viewportConfig));
    }
    await browser.close();
    browser = null;

    const failures = [];
    for (const result of results) {
      pushAuditFailures(failures, result, result.audits.boot);
      pushAuditFailures(failures, result, result.audits.localRoute, { insideViewport: true });
      if (result.audits.heroMenu) {
        pushAuditFailures(failures, result, result.audits.heroMenu, { insideViewport: true });
        pushTouchTargetFailures(failures, result, "hero menu", result.touchTargets.heroMenu);
      }
      if (result.audits.settingsModal) {
        pushAuditFailures(failures, result, result.audits.settingsModal, {
          insideViewport: true,
          minimumVisibleAreaRatio: 0.68
        });
        pushTouchTargetFailures(failures, result, "settings modal", result.touchTargets.settingsModal);
      }
      if (result.audits.playMenu) {
        pushAuditFailures(failures, result, result.audits.playMenu, {
          insideViewport: true,
          minimumVisibleAreaRatio: 0.45
        });
      }
      if (result.audits.learnContent) {
        pushAuditFailures(failures, result, result.audits.learnContent, {
          insideViewport: true,
          minimumVisibleAreaRatio: 0.08
        });
        if (!result.learnScroll?.moved && result.learnScroll?.maxPanelScroll > 8) {
          failures.push(`${result.label}: scaled learn content did not scroll (${JSON.stringify(result.learnScroll)})`);
        }
      }
      if (result.audits.alpacapardyBoard) {
        pushAuditFailures(failures, result, result.audits.alpacapardyBoard, {
          insideViewport: true,
          minimumVisibleAreaRatio: 0.22
        });
      }
      if (result.interactions.alpacapardyRound) {
        const round = result.interactions.alpacapardyRound;
        if (!round.boardStarted || !round.answered || !round.returnedToBoard || round.doneTiles < 1) {
          failures.push(`${result.label}: scaled Alpacapardy round did not complete (${JSON.stringify(round)})`);
        }
      }
      for (const [groupName, clips] of Object.entries(result.textClips)) {
        if (clips.length) {
          failures.push(`${result.label}: ${groupName} has horizontally clipped text at ${result.textScale * 100}% (${JSON.stringify(clips)})`);
        }
      }
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
      servedRoot: SERVER_DIR,
      mode: SERVER_DIR === APP_DIR ? "source" : "artifact",
      viewports: results,
      failures
    }, null, 2));

    if (failures.length) {
      console.error(`Accessibility scale smoke failed:\n- ${failures.join("\n- ")}`);
      process.exit(1);
    }
  } finally {
    await browser?.close().catch(() => {});
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
