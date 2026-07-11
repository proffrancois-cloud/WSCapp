import path from "node:path";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const APP_DIR = path.join(ROOT, "app");
const TEST_SECTION = "We Are All in This to Get There";

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
      protocol: window.location.protocol,
      bodyClass: document.body.className,
      viewport,
      documentWidth,
      horizontalOverflow: Math.max(0, Math.ceil(documentWidth - viewport.width)),
      media: {
        coarsePointer: window.matchMedia("(pointer: coarse)").matches,
        finePointer: window.matchMedia("(pointer: fine)").matches,
        hoverHover: window.matchMedia("(hover: hover)").matches,
        landscape: window.matchMedia("(orientation: landscape)").matches
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

async function openSettingsModal(page) {
  await clickFirst(page, "[data-toggle-hero-menu]");
  await page.waitForFunction(() => document.querySelector(".hero-links")?.classList.contains("is-open"), null, { timeout: 10000 });
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

async function main() {
  const { _electron } = loadPlaywright();
  const failures = [];
  if (!_electron) {
    throw new Error("Playwright _electron launcher is not available.");
  }

  let electronApp = null;
  try {
    electronApp = await _electron.launch({
      args: [APP_DIR],
      cwd: APP_DIR,
      timeout: 30000
    });
    const window = await electronApp.firstWindow({ timeout: 30000 });
    const messages = [];
    window.on("console", (message) => messages.push({ type: message.type(), text: message.text() }));
    window.on("pageerror", (error) => messages.push({ type: "pageerror", text: error.message }));
    await window.waitForFunction(() => window.WSC_APP_READY === true, null, { timeout: 60000 });

    const appPath = await electronApp.evaluate(({ app }) => app.getAppPath());
    const platform = await electronApp.evaluate(() => process.platform);
    const desktopBridge = await window.evaluate(() => ({
      type: typeof window.WSC_DESKTOP_APP,
      runtime: window.WSC_DESKTOP_APP?.runtime || "",
      platform: window.WSC_DESKTOP_APP?.platform || "",
      packaged: Boolean(window.WSC_DESKTOP_APP?.packaged)
    }));
    const boot = await collectAudit(window, ["#routeBuilder"]);

    await chooseLocalRoute(window);
    const localRoute = await collectAudit(window, ["#routeBuilder", ".mode-choice-board"]);

    await openSettingsModal(window);
    const settingsModal = await collectAudit(window, [
      ".app-settings-overlay",
      ".app-settings-window",
      ".app-settings-control",
      "[data-app-settings-volume]"
    ]);
    await closeSettingsWithKeyboard(window);

    const alpacapardyRound = await completeAlpacapardyRound(window);
    const alpacapardyBoard = await collectAudit(window, ["#experiencePanel", ".jeopardy-board-shell"]);

    pushAuditFailures(failures, "Electron boot", boot);
    pushAuditFailures(failures, "Electron local route", localRoute, { insideViewport: true });
    pushAuditFailures(failures, "Electron settings modal", settingsModal, {
      insideViewport: true,
      minimumVisibleAreaRatio: 0.68
    });
    pushAuditFailures(failures, "Electron Alpacapardy board", alpacapardyBoard, {
      insideViewport: true,
      minimumVisibleAreaRatio: 0.22
    });

    if (appPath !== APP_DIR) {
      failures.push(`Electron app path should be app directory (${APP_DIR}), got ${appPath}`);
    }
    if (boot.protocol !== "file:") {
      failures.push(`Electron should load the app over file:, got ${boot.protocol}`);
    }
    if (desktopBridge.type !== "object" || desktopBridge.runtime !== "electron") {
      failures.push(`Electron desktop bridge was not exposed correctly (${JSON.stringify(desktopBridge)})`);
    }
    const desktopClasses = ["needs-landscape", "prefers-landscape-device", "is-touch-device", "is-touch-landscape"]
      .filter((className) => localRoute.bodyClass.includes(className));
    if (desktopClasses.length) {
      failures.push(`Electron desktop should not use mobile presentation classes (${desktopClasses.join(", ")})`);
    }
    if (!alpacapardyRound.boardStarted || !alpacapardyRound.answered || !alpacapardyRound.returnedToBoard || alpacapardyRound.doneTiles < 1) {
      failures.push(`Electron Alpacapardy round did not complete (${JSON.stringify(alpacapardyRound)})`);
    }

    const severeMessages = messages.filter((message) =>
      ["error", "pageerror"].includes(message.type) &&
      !message.text.includes("Failed to load resource") &&
      message.text !== "Permissions policy violation: compute-pressure is not allowed in this document."
    );
    if (severeMessages.length) {
      failures.push(`Electron severe console messages: ${JSON.stringify(severeMessages)}`);
    }

    console.log(JSON.stringify({
      appPath,
      platform,
      desktopBridge,
      boot,
      localRoute,
      settingsModal,
      alpacapardyRound,
      alpacapardyBoard,
      messages,
      failures
    }, null, 2));

    if (failures.length) {
      console.error(`Electron runtime smoke failed:\n- ${failures.join("\n- ")}`);
      process.exit(1);
    }
  } finally {
    await electronApp?.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
