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
const PORT = Number(process.env.WSC_FIREFOX_PORT || 4193);
const BASE_URL = externalBaseUrl || `http://localhost:${PORT}`;
const MODE = externalBaseUrl ? "remote" : SERVER_DIR === APP_DIR ? "source" : "artifact";
const TEST_SECTION = "We Are All in This to Get There";
const WINDOWS_FIREFOX_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0";
const WINDOWS_FIREFOX_VIEWPORTS = [
  {
    id: "windows-firefox-desktop",
    label: "Windows Firefox desktop",
    viewport: { width: 1366, height: 768 }
  },
  {
    id: "windows-firefox-compact",
    label: "Windows Firefox compact laptop",
    viewport: { width: 1024, height: 600 }
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
  throw new Error(`Desktop Firefox smoke root does not exist: ${SERVER_DIR}`);
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

function loadPlaywright() {
  const appRequire = createRequire(path.join(APP_DIR, "package.json"));
  try {
    return appRequire("playwright");
  } catch (_appError) {
    return createRequire(import.meta.url)("playwright");
  }
}

async function clickFirst(page, selector, timeout = 12000) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout });
  await locator.click({ timeout });
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
      viewport,
      documentWidth,
      horizontalOverflow: Math.max(0, Math.ceil(documentWidth - viewport.width)),
      media: {
        coarsePointer: window.matchMedia("(pointer: coarse)").matches,
        finePointer: window.matchMedia("(pointer: fine)").matches,
        anyCoarsePointer: window.matchMedia("(any-pointer: coarse)").matches,
        hoverHover: window.matchMedia("(hover: hover)").matches,
        landscape: window.matchMedia("(orientation: landscape)").matches
      },
      navigator: {
        platform: navigator.platform || "",
        maxTouchPoints: navigator.maxTouchPoints || 0,
        userAgent: navigator.userAgent || ""
      },
      elements
    };
  }, selectors);
}

async function chooseLocalRoute(page) {
  await clickFirst(page, '[data-app-entry-choice="local"]', 30000);
  await page.waitForFunction(() => !document.querySelector(".app-entry-gate-overlay"), null, { timeout: 40000 });
  await clickFirst(page, "[data-close-cooperation]").catch(() => {});
  await page.waitForFunction(() => {
    return !document.querySelector('[role="dialog"][aria-modal="true"]')
      && !document.body.classList.contains("with-popup")
      && !document.querySelector("#routeBuilder")?.inert;
  }, null, { timeout: 40000 });
}

async function openHeroMenu(page) {
  await clickFirst(page, "[data-toggle-hero-menu]");
  await page.waitForFunction(() => {
    return document.querySelector("[data-toggle-hero-menu]")?.getAttribute("aria-expanded") === "true" &&
      document.querySelector(".hero-links")?.classList.contains("is-open");
  }, null, { timeout: 10000 });
  await page.waitForTimeout(180);
}

async function openSettingsModal(page) {
  await openHeroMenu(page);
  await clickFirst(page, "[data-open-campus-settings]");
  await page.waitForFunction(() => {
    return Boolean(
      document.querySelector(".app-settings-overlay[role='dialog'][aria-modal='true']") &&
      document.querySelector(".app-settings-window") &&
      document.querySelector("[data-app-settings-volume]") &&
      !document.querySelector(".hero-links")?.classList.contains("is-open")
    );
  }, null, { timeout: 10000 });
}

async function closeSettingsWithKeyboard(page) {
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector(".app-settings-overlay"), null, { timeout: 10000 });
}

async function chooseSection(page, sectionName) {
  await page.waitForSelector("[data-toggle-mode-section]", { timeout: 12000 });
  const index = await page.evaluate((targetSectionName) => {
    return [...document.querySelectorAll("[data-toggle-mode-section]")]
      .findIndex((button) => (button.dataset.sectionTitle || button.textContent || "").includes(targetSectionName));
  }, sectionName);
  if (index < 0) {
    throw new Error(`Could not find section chip for "${sectionName}".`);
  }
  const locator = page.locator("[data-toggle-mode-section]").nth(index);
  await locator.scrollIntoViewIfNeeded();
  await locator.click();
  await page.waitForFunction((targetSectionName) => {
    return [...document.querySelectorAll("[data-toggle-mode-section]")]
      .some((button) => (
        (button.dataset.sectionTitle || button.textContent || "").includes(targetSectionName)
        && button.getAttribute("aria-pressed") === "true"
      )) && document.querySelector(".mode-choice-board.has-section-selection");
  }, sectionName, { timeout: 10000 });
}

async function openModeColumn(page, modePath) {
  await clickFirst(page, `[data-toggle-mode-menu="${modePath}"]`);
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
  await waitForVisibleArea(page, ".mode-choice-column.is-open .mode-choice-card-grid", 0.5);
  await clickFirst(page, `[data-pick-mode="${modeId}"][data-pick-mode-path="${modePath}"]:not([disabled])`);
}

async function completeAlpacapardyRound(page) {
  await chooseMode(page, "jeopardy", "play");
  await clickFirst(page, "[data-jeopardy-start]:not([disabled])");
  await page.waitForFunction(() => document.querySelectorAll("[data-jeopardy-open]").length > 0, null, { timeout: 12000 });
  await waitForVisibleArea(page, ".jeopardy-board-shell", 0.22);
  const initialTileCount = await page.evaluate(() => document.querySelectorAll("[data-jeopardy-open]").length);
  await clickFirst(page, "[data-jeopardy-open]:not([disabled]):not(.done)");
  await page.waitForSelector("[data-jeopardy-option]:not([disabled])", { timeout: 12000 });
  await clickFirst(page, "[data-jeopardy-option]:not([disabled])");
  await page.waitForSelector("[data-jeopardy-back]:not([disabled])", { timeout: 12000 });
  const answered = await page.evaluate(() => Boolean(document.querySelector(".feedback-card")));
  await clickFirst(page, "[data-jeopardy-back]:not([disabled])");
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

function pushAuditFailures(failures, label, audit, options = {}) {
  if (!audit.appReady) {
    failures.push(`${label}: app did not report WSC_APP_READY`);
  }
  if (audit.horizontalOverflow > 2) {
    failures.push(`${label}: document has ${audit.horizontalOverflow}px horizontal overflow`);
  }
  for (const element of audit.elements) {
    if (!element.present || !element.visible) {
      failures.push(`${label}: ${element.selector} was not visible`);
      continue;
    }
    if (options.insideViewport && (!element.insideX || !element.intersectsY)) {
      failures.push(`${label}: ${element.selector} is not fully usable in the viewport (${JSON.stringify(element)})`);
    }
    if (options.minimumVisibleAreaRatio && element.visibleAreaRatio < options.minimumVisibleAreaRatio) {
      failures.push(`${label}: ${element.selector} is only ${Math.round(element.visibleAreaRatio * 100)}% visible`);
    }
  }
}

async function runFirefoxDesktop(browser, viewportConfig) {
  const context = await browser.newContext({
    viewport: viewportConfig.viewport,
    hasTouch: false,
    isMobile: false,
    deviceScaleFactor: 1,
    userAgent: WINDOWS_FIREFOX_USER_AGENT,
    serviceWorkers: "block"
  });
  await context.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "platform", {
      configurable: true,
      get: () => "Win32"
    });
  });
  const page = await context.newPage();
  const messages = [];
  page.on("console", (message) => messages.push({ type: message.type(), text: message.text() }));
  page.on("pageerror", (error) => messages.push({ type: "pageerror", text: error.message }));

  try {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => window.WSC_APP_READY === true, null, { timeout: 60000 });
    const boot = await collectAudit(page, ["#routeBuilder"]);

    await chooseLocalRoute(page);
    const localRoute = await collectAudit(page, ["#routeBuilder", ".mode-choice-board"]);

    await openHeroMenu(page);
    const heroMenu = await collectAudit(page, [
      ".hero-links.is-open",
      ".hero-links.is-open > .hero-discord-link",
      ".hero-links.is-open > .session-controls",
      ".hero-links.is-open > button.hero-link-icon",
      ".hero-links.is-open > a.hero-link-icon"
    ]);
    await clickFirst(page, "[data-toggle-hero-menu][aria-expanded='true']");
    await page.waitForFunction(() => !document.querySelector(".hero-links")?.classList.contains("is-open"), null, { timeout: 10000 });

    await openSettingsModal(page);
    const settingsModal = await collectAudit(page, [
      ".app-settings-overlay",
      ".app-settings-window",
      ".app-settings-control",
      "[data-app-settings-volume]"
    ]);
    await closeSettingsWithKeyboard(page);

    const alpacapardyRound = await completeAlpacapardyRound(page);
    const alpacapardyBoard = await collectAudit(page, ["#experiencePanel", ".jeopardy-board-shell"]);

    return {
      id: viewportConfig.id,
      label: viewportConfig.label,
      viewport: viewportConfig.viewport,
      boot,
      localRoute,
      heroMenu,
      settingsModal,
      alpacapardyRound,
      alpacapardyBoard,
      messages
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const { firefox } = loadPlaywright();
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
    browser = await firefox.launch({ headless: true });
    const results = [];
    for (const viewportConfig of WINDOWS_FIREFOX_VIEWPORTS) {
      results.push(await runFirefoxDesktop(browser, viewportConfig));
    }
    await browser.close();
    browser = null;

    const failures = [];
    for (const result of results) {
      pushAuditFailures(failures, `${result.label} boot`, result.boot);
      pushAuditFailures(failures, `${result.label} local route`, result.localRoute, { insideViewport: true });
      pushAuditFailures(failures, `${result.label} hero menu`, result.heroMenu, { insideViewport: true });
      pushAuditFailures(failures, `${result.label} settings modal`, result.settingsModal, {
        insideViewport: true,
        minimumVisibleAreaRatio: 0.68
      });
      pushAuditFailures(failures, `${result.label} Alpacapardy board`, result.alpacapardyBoard, {
        insideViewport: true,
        minimumVisibleAreaRatio: 0.22
      });

      const desktopClasses = ["needs-landscape", "prefers-landscape-device", "is-touch-device", "is-touch-landscape"]
        .filter((className) => result.localRoute.bodyClass.includes(className));
      if (desktopClasses.length) {
        failures.push(`${result.label} should not use mobile presentation classes (${desktopClasses.join(", ")})`);
      }
      if (!result.localRoute.navigator.userAgent.includes("Firefox") || result.localRoute.navigator.platform !== "Win32") {
        failures.push(`${result.label} did not use the expected Windows-like navigator state (${JSON.stringify(result.localRoute.navigator)})`);
      }
      if (!result.alpacapardyRound.boardStarted || !result.alpacapardyRound.answered || !result.alpacapardyRound.returnedToBoard || result.alpacapardyRound.doneTiles < 1) {
        failures.push(`${result.label} Alpacapardy round did not complete (${JSON.stringify(result.alpacapardyRound)})`);
      }

      const severeMessages = result.messages.filter((message) =>
        ["error", "pageerror"].includes(message.type) &&
        !message.text.includes("Failed to load resource") &&
        message.text !== "Permissions policy violation: compute-pressure is not allowed in this document."
      );
      if (severeMessages.length) {
        failures.push(`${result.label} severe console messages: ${JSON.stringify(severeMessages)}`);
      }
    }

    console.log(JSON.stringify({
      baseUrl: BASE_URL,
      servedRoot: externalBaseUrl ? null : SERVER_DIR,
      mode: MODE,
      browser: "firefox",
      results,
      failures
    }, null, 2));

    if (failures.length) {
      console.error(`Desktop Firefox smoke failed:\n- ${failures.join("\n- ")}`);
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
