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
const PORT = Number(process.env.WSC_WEBKIT_PORT || 4191);
const BASE_URL = externalBaseUrl || `http://localhost:${PORT}`;
const MODE = externalBaseUrl ? "remote" : SERVER_DIR === APP_DIR ? "source" : "artifact";
const TEST_SECTION = "We Are All in This to Get There";

const WEBKIT_VIEWPORTS = [
  {
    id: "iphone-safari",
    label: "iPhone WebKit landscape",
    portrait: { width: 390, height: 844 },
    landscape: { width: 844, height: 390 },
    checks: ["hero-menu", "settings-modal", "alpacapardy-round", "learn-mode-rounds"]
  },
  {
    id: "iphone-se-safari",
    label: "iPhone SE WebKit landscape",
    portrait: { width: 375, height: 667 },
    landscape: { width: 667, height: 375 },
    checks: ["hero-menu", "mobile-gameplay-rounds"],
    requireNaturalJumpCheckpoint: true
  },
  {
    id: "android-phone-webkit",
    label: "Android phone WebKit-sized landscape",
    portrait: { width: 412, height: 915 },
    landscape: { width: 915, height: 412 },
    checks: ["hero-menu"]
  },
  {
    id: "foldable-webkit",
    label: "Foldable WebKit-sized landscape",
    portrait: { width: 540, height: 720 },
    landscape: { width: 720, height: 540 },
    checks: ["hero-menu"]
  },
  {
    id: "ipad-safari",
    label: "iPad WebKit landscape",
    portrait: { width: 820, height: 1180 },
    landscape: { width: 1180, height: 820 },
    checks: ["hero-menu", "settings-modal", "alpacapardy-round", "learn-mode-rounds"]
  },
  {
    id: "ipad-split-safari",
    label: "iPad Split View WebKit landscape",
    portrait: { width: 744, height: 1112 },
    landscape: { width: 1112, height: 744 },
    checks: ["hero-menu", "settings-modal", "alpacapardy-round", "mobile-gameplay-rounds", "learn-mode-rounds"]
  },
  {
    id: "android-tablet-webkit",
    label: "Android tablet WebKit-sized landscape",
    portrait: { width: 800, height: 1280 },
    landscape: { width: 1280, height: 800 },
    checks: ["hero-menu"]
  }
];

const MOBILE_GAME_ROUND_SPECS = [
  {
    id: "run",
    label: "Alpaca Run",
    modeId: "run",
    modePath: "play",
    setupSelector: "[data-run-toggle-category]",
    startSelector: "[data-run-start]:not([disabled])",
    readySelector: "[data-run-option]:not([disabled])",
    optionSelector: "[data-run-option]:not([disabled])",
    continueSelector: "[data-run-continue]:not([disabled])",
    nextSelector: "[data-run-option]:not([disabled])",
    summaryText: "Journey Summary",
    questionSelectors: ["#experiencePanel", ".run-map-shell", ".run-inline-shell", ".run-inline-card", "[data-run-option]:not([disabled])"],
    feedbackSelectors: ["#experiencePanel", ".run-inline-shell", ".feedback-card", "[data-run-continue]:not([disabled])"]
  },
  {
    id: "race",
    label: "Survivalpaca",
    modeId: "race",
    modePath: "play",
    setupSelector: "[data-race-toggle-category]",
    startSelector: "[data-race-start]:not([disabled])",
    readySelector: "[data-race-option]:not([disabled])",
    optionSelector: "[data-race-option]:not([disabled])",
    continueSelector: "[data-race-advance]:not([disabled])",
    nextSelector: "[data-race-option]:not([disabled])",
    summaryText: "Journey Summary",
    questionSelectors: [".question-popup-window.race", ".race-question-card", "[data-race-option]:not([disabled])"],
    feedbackSelectors: [".question-popup-window.race", ".feedback-card", "[data-race-advance]:not([disabled])"]
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
  throw new Error(`Mobile WebKit smoke root does not exist: ${SERVER_DIR}`);
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

async function installPlayableArcadeSmokeFixture(page) {
  await page.addInitScript(() => {
    const fixtureMarker = "__wscMobileWebKitFullVoyageFixtureInstalled";
    const sectionIds = ["were-all-in-this", "were-all-in-this-to-get-there"];
    const questions = [
      {
        id: "mobile-webkit-fixture-full-voyage-level-4-were-all-in-this",
        level: 4,
        displayLevel: 400,
        sectionId: "were-all-in-this",
        sectionIds,
        prompt: "Mobile WebKit fixture: why can a journey matter before arrival?",
        correctAnswer: "Because the route can change choices, expectations, and what progress means",
        wrongAnswers: [
          "Because only the destination can create meaning",
          "Because movement removes every delay automatically",
          "Because routes never affect people or systems"
        ],
        explanation: "Smoke-only fixture question used to exercise mobile WebKit local arcade flows.",
        visibleCorrectExplanation: "The route itself can shape the meaning of arrival.",
        visibleConnection: "Connects movement, delay, and progress inside the WSC theme.",
        visibleTakeaway: "A path can be part of the outcome, not only a way to reach it.",
        anchorReference: "Mobile WebKit smoke fixture level 400",
        targetReference: "We Are All in This to Get There",
        guidingSectionPrimary: "We Are All in This to Get There",
        guidingSectionSecondary: "",
        sourceUrl: "",
        sourceNote: "Validator-only smoke fixture"
      },
      {
        id: "mobile-webkit-fixture-full-voyage-level-5-were-all-in-this",
        level: 5,
        displayLevel: 500,
        sectionId: "were-all-in-this",
        sectionIds,
        prompt: "Mobile WebKit fixture: what makes progress hard to judge on this route?",
        correctAnswer: "Visible signs of progress can hide unfinished work, delays, or costs",
        wrongAnswers: [
          "Every visible sign proves the journey is complete",
          "Progress never depends on hidden work or tradeoffs",
          "A route becomes simple once someone names the destination"
        ],
        explanation: "Smoke-only fixture question used to exercise mobile WebKit local arcade flows.",
        visibleCorrectExplanation: "Progress can look complete while important work is still unresolved.",
        visibleConnection: "Connects performed progress with unfinished journeys.",
        visibleTakeaway: "A strong answer checks what is still hidden or unresolved.",
        anchorReference: "Mobile WebKit smoke fixture level 500",
        targetReference: "We Are All in This to Get There",
        guidingSectionPrimary: "We Are All in This to Get There",
        guidingSectionSecondary: "",
        sourceUrl: "",
        sourceNote: "Validator-only smoke fixture"
      }
    ];

    function appendFixture(rawContentBank) {
      if (!rawContentBank || typeof rawContentBank !== "object" || rawContentBank[fixtureMarker]) {
        return rawContentBank;
      }

      const fullVoyageQuestions = Array.isArray(rawContentBank.fullVoyageQuestions)
        ? rawContentBank.fullVoyageQuestions
        : [];
      const existingIds = new Set(fullVoyageQuestions.map((question) => question && question.id));
      const missingQuestions = questions.filter((question) => !existingIds.has(question.id));
      rawContentBank.fullVoyageQuestions = fullVoyageQuestions.concat(missingQuestions);
      Object.defineProperty(rawContentBank, fixtureMarker, {
        value: true,
        enumerable: false,
        configurable: true
      });
      return rawContentBank;
    }

    let rawContentBankValue = appendFixture(window.WSC_RAW_CONTENT_BANK);
    Object.defineProperty(window, "WSC_RAW_CONTENT_BANK", {
      configurable: true,
      get() {
        return rawContentBankValue;
      },
      set(nextValue) {
        rawContentBankValue = appendFixture(nextValue);
      }
    });
  });
}

async function tapFirst(page, selector, timeout = 12000) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout });
  await locator.tap({ timeout });
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
    const elementInfo = targetSelectors.map((selector) => {
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
        visibleAreaRatio: rect.width > 0 && rect.height > 0
          ? Number(((visibleWidth * visibleHeight) / (rect.width * rect.height)).toFixed(3))
          : 0,
        insideX: rect.left >= -2 && rect.right <= viewport.width + 2,
        intersectsY: rect.bottom >= 0 && rect.top <= viewport.visualHeight
      };
    });
    const gateMount = document.querySelector("#orientationGateMount");
    const gate = gateMount?.querySelector(".orientation-gate");

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
        portrait: window.matchMedia("(orientation: portrait)").matches,
        landscape: window.matchMedia("(orientation: landscape)").matches
      },
      gate: {
        mountPresent: Boolean(gateMount),
        mountHidden: Boolean(gateMount?.hidden),
        visible: isVisible(gate),
        focusInside: Boolean(gate && document.activeElement && gate.contains(document.activeElement)),
        hiddenDialogPresent: Boolean(document.querySelector("#orientationGateMount[hidden] [role='dialog']"))
      },
      elements: elementInfo
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

async function centerFirstMatchingElement(page, selector, timeout = 8000) {
  await page.waitForSelector(selector, { timeout });
  await page.evaluate((targetSelector) => {
    const element = [...document.querySelectorAll(targetSelector)].find((node) => {
      const rect = node.getBoundingClientRect();
      const style = window.getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    });
    element?.scrollIntoView({ block: "center", inline: "center", behavior: "auto" });
  }, selector);
  await page.waitForTimeout(80);
}

async function collectTouchTargetSamples(page, selectors, options = {}) {
  const maxPerSelector = options.maxPerSelector || 3;
  return page.evaluate(({ targetSelectors, maxPerSelector: sampleLimit }) => {
    const seen = new Set();
    const viewport = {
      width: window.innerWidth,
      height: window.visualViewport?.height || window.innerHeight
    };
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };
    const intersectsViewport = (element) => {
      const rect = element.getBoundingClientRect();
      const visibleWidth = Math.max(0, Math.min(rect.right, viewport.width) - Math.max(rect.left, 0));
      const visibleHeight = Math.max(0, Math.min(rect.bottom, viewport.height) - Math.max(rect.top, 0));
      return visibleWidth > 0 && visibleHeight > 0;
    };

    return targetSelectors.flatMap((selector) => {
      const elements = [...document.querySelectorAll(selector)]
        .filter((element) => !seen.has(element) && isVisible(element) && intersectsViewport(element))
        .slice(0, sampleLimit);
      elements.forEach((element) => seen.add(element));
      return elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const visibleLeft = Math.max(0, rect.left);
        const visibleRight = Math.min(viewport.width, rect.right);
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewport.height, rect.bottom);
        const centerX = Math.max(0, Math.min(viewport.width - 1, (visibleLeft + visibleRight) / 2));
        const centerY = Math.max(0, Math.min(viewport.height - 1, (visibleTop + visibleBottom) / 2));
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
  }, { targetSelectors: selectors, maxPerSelector });
}

async function chooseLocalRoute(page) {
  await tapFirst(page, '[data-app-entry-choice="local"]', 30000);
  await page.waitForFunction(() => !document.querySelector(".app-entry-gate-overlay"), null, { timeout: 40000 });
  await tapFirst(page, "[data-close-cooperation]").catch(() => {});
  await page.waitForFunction(() => {
    return !document.querySelector('[role="dialog"][aria-modal="true"]')
      && !document.body.classList.contains("with-popup")
      && !document.querySelector("#routeBuilder")?.inert;
  }, null, { timeout: 40000 });
}

async function openHeroMenu(page) {
  await tapFirst(page, "[data-toggle-hero-menu]");
  await page.waitForFunction(() => {
    return document.querySelector("[data-toggle-hero-menu]")?.getAttribute("aria-expanded") === "true" &&
      document.querySelector(".hero-links")?.classList.contains("is-open");
  }, null, { timeout: 10000 });
  await page.waitForTimeout(180);
}

async function openSettingsModal(page) {
  await openHeroMenu(page);
  await tapFirst(page, "[data-open-campus-settings]");
  await page.waitForFunction(() => {
    return Boolean(
      document.querySelector(".app-settings-overlay[role='dialog'][aria-modal='true']") &&
      document.querySelector(".app-settings-window") &&
      document.querySelector("[data-app-settings-volume]") &&
      !document.querySelector(".hero-links")?.classList.contains("is-open")
    );
  }, null, { timeout: 10000 });
}

async function closeSettingsModal(page) {
  await tapFirst(page, "[data-close-app-settings]");
  await page.waitForFunction(() => !document.querySelector(".app-settings-overlay"), null, { timeout: 10000 });
}

async function chooseSection(page, sectionName) {
  await page.waitForSelector("[data-toggle-mode-section]", { timeout: 12000 });
  await page.evaluate((targetSectionName) => {
    const sectionButton = [...document.querySelectorAll("[data-toggle-mode-section]")]
      .find((button) => (button.dataset.sectionTitle || button.textContent || "").includes(targetSectionName));
    if (!sectionButton) {
      throw new Error(`Could not find section chip for "${targetSectionName}".`);
    }
    sectionButton.scrollIntoView({ block: "center", inline: "center" });
  }, sectionName);
  await tapFirst(page, `[data-toggle-mode-section][data-section-title*="${sectionName.replace(/"/g, '\\"')}"]`).catch(async () => {
    await page.evaluate((targetSectionName) => {
      const sectionButton = [...document.querySelectorAll("[data-toggle-mode-section]")]
        .find((button) => (button.dataset.sectionTitle || button.textContent || "").includes(targetSectionName));
      sectionButton?.click();
    }, sectionName);
  });
  await page.waitForFunction((targetSectionName) => {
    return [...document.querySelectorAll("[data-toggle-mode-section]")]
      .some((button) => (
        (button.dataset.sectionTitle || button.textContent || "").includes(targetSectionName)
        && button.getAttribute("aria-pressed") === "true"
      )) && document.querySelector(".mode-choice-board.has-section-selection");
  }, sectionName, { timeout: 10000 });
}

async function openModeColumn(page, modePath) {
  await tapFirst(page, `[data-toggle-mode-menu="${modePath}"]`);
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
  await tapFirst(page, `[data-pick-mode="${modeId}"][data-pick-mode-path="${modePath}"]:not([disabled])`);
}

async function openFreshLandscapeLocalRoute(page) {
  await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => window.WSC_APP_READY === true, null, { timeout: 60000 });
  await page.waitForFunction(() => {
    return document.body.classList.contains("is-touch-landscape") &&
      !document.body.classList.contains("needs-landscape") &&
      document.querySelector("#orientationGateMount")?.hidden === true;
  }, null, { timeout: 12000 });
  await chooseLocalRoute(page);
}

async function activateAllSetupOptions(page, selector) {
  await page.waitForSelector(selector, { timeout: 8000 });
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const clicked = await page.evaluate((targetSelector) => {
      const inactive = [...document.querySelectorAll(targetSelector)]
        .find((button) => button.getAttribute("aria-pressed") !== "true");
      if (!inactive) {
        return false;
      }
      inactive.click();
      return true;
    }, selector);
    if (!clicked) {
      return;
    }
    await page.waitForTimeout(50);
  }
}

async function waitForModeStartOutcome(page, playableSelector) {
  await page.waitForFunction((targetPlayableSelector) => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return Boolean(document.querySelector(targetPlayableSelector))
      || panelText.includes("Route update pending")
      || panelText.includes("complete raw-question ladder")
      || panelText.includes("does not yet have");
  }, playableSelector, { timeout: 10000 });
}

async function readControlledUnavailableState(page) {
  return page.evaluate(() => {
    const panelText = document.querySelector("#experiencePanel")?.textContent?.replace(/\s+/g, " ").trim() || "";
    return {
      routeUpdatePending: panelText.includes("Route update pending"),
      completeLadderMessage: panelText.includes("complete raw-question ladder") || panelText.includes("does not yet have"),
      panelText: panelText.slice(0, 240)
    };
  });
}

async function completeMobileGameRound(page, spec) {
  await chooseMode(page, spec.modeId, spec.modePath);
  await activateAllSetupOptions(page, spec.setupSelector);
  await tapFirst(page, spec.startSelector);
  await waitForModeStartOutcome(page, spec.readySelector);

  const unavailable = await readControlledUnavailableState(page);
  if (unavailable.routeUpdatePending || unavailable.completeLadderMessage) {
    return {
      id: spec.id,
      label: spec.label,
      started: true,
      controlledUnavailable: true,
      unavailable,
      optionCount: 0,
      answered: false,
      feedbackVisible: false,
      continued: false,
      nextReady: false
    };
  }

  await waitForVisibleArea(page, spec.questionSelectors[0], 0.4);
  const questionAudit = await collectAudit(page, spec.questionSelectors);
  const questionTargets = await collectTouchTargets(page, [spec.optionSelector]);
  const optionCount = await page.locator(spec.optionSelector).count();
  await tapFirst(page, spec.optionSelector);

  await page.waitForSelector(spec.continueSelector, { timeout: 10000 });
  await waitForVisibleArea(page, ".feedback-card", 0.45);
  const feedbackVisible = await page.evaluate(() => Boolean(document.querySelector(".feedback-card")));
  const feedbackAudit = await collectAudit(page, spec.feedbackSelectors);
  const feedbackTargets = await collectTouchTargets(page, [spec.continueSelector]);
  await tapFirst(page, spec.continueSelector);

  await page.waitForFunction(({ nextSelector, summaryText }) => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return Boolean(document.querySelector(nextSelector)) || (summaryText && panelText.includes(summaryText));
  }, { nextSelector: spec.nextSelector, summaryText: spec.summaryText }, { timeout: 10000 });

  return page.evaluate(({ modeId, label, initialOptionCount, didShowFeedback, nextSelector, summaryText, questionAudit, feedbackAudit, questionTargets, feedbackTargets }) => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return {
      id: modeId,
      label,
      started: true,
      controlledUnavailable: false,
      optionCount: initialOptionCount,
      answered: true,
      feedbackVisible: didShowFeedback,
      continued: true,
      nextReady: Boolean(document.querySelector(nextSelector)),
      summaryVisible: Boolean(summaryText && panelText.includes(summaryText)),
      questionAudit,
      feedbackAudit,
      questionTargets,
      feedbackTargets
    };
  }, {
    modeId: spec.id,
    label: spec.label,
    initialOptionCount: optionCount,
    didShowFeedback: feedbackVisible,
    nextSelector: spec.nextSelector,
    summaryText: spec.summaryText,
    questionAudit,
    feedbackAudit,
    questionTargets,
    feedbackTargets
  });
}

async function completeMobileRelayRound(page) {
  await chooseMode(page, "relay", "play");
  await activateAllSetupOptions(page, "[data-relay-toggle-category]");
  await tapFirst(page, "[data-relay-start]:not([disabled])");
  await waitForModeStartOutcome(page, "[data-relay-buzz]:not([disabled])");

  const unavailable = await readControlledUnavailableState(page);
  if (unavailable.routeUpdatePending || unavailable.completeLadderMessage) {
    return {
      id: "relay",
      label: "Alpaca Relay",
      started: true,
      controlledUnavailable: true,
      unavailable,
      buzzed: false,
      optionCount: 0,
      answered: false,
      feedbackVisible: false,
      continued: false,
      nextReady: false
    };
  }

  await waitForVisibleArea(page, ".question-popup-window.relay", 0.4);
  const buzzAudit = await collectAudit(page, [
    ".question-popup-window.relay",
    ".relay-team-card.popup",
    "[data-relay-buzz]:not([disabled])"
  ]);
  const buzzTargets = await collectTouchTargets(page, ["[data-relay-buzz]:not([disabled])"]);
  await tapFirst(page, "[data-relay-buzz]:not([disabled])");

  await page.waitForSelector("[data-relay-option]:not([disabled])", { timeout: 10000 });
  await waitForVisibleArea(page, "[data-relay-option]:not([disabled])", 0.85);
  const questionAudit = await collectAudit(page, [
    ".question-popup-window.relay",
    ".challenge-card.relay-no-mascot",
    "[data-relay-option]:not([disabled])"
  ]);
  const questionTargets = await collectTouchTargets(page, ["[data-relay-option]:not([disabled])"]);
  const optionCount = await page.locator("[data-relay-option]:not([disabled])").count();
  await tapFirst(page, "[data-relay-option]:not([disabled])");

  await page.waitForSelector("[data-relay-continue]:not([disabled])", { timeout: 10000 });
  await waitForVisibleArea(page, ".feedback-card", 0.45);
  const feedbackVisible = await page.evaluate(() => Boolean(document.querySelector(".feedback-card")));
  const feedbackAudit = await collectAudit(page, [
    ".question-popup-window.relay",
    ".feedback-card",
    "[data-relay-continue]:not([disabled])"
  ]);
  const feedbackTargets = await collectTouchTargets(page, ["[data-relay-continue]:not([disabled])"]);
  await tapFirst(page, "[data-relay-continue]:not([disabled])");

  await page.waitForFunction(() => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return Boolean(document.querySelector("[data-relay-buzz]:not([disabled])")) || panelText.includes("Final Standing");
  }, null, { timeout: 10000 });

  return page.evaluate(({ optionCount: initialOptionCount, feedbackVisible: didShowFeedback, buzzAudit, questionAudit, feedbackAudit, buzzTargets, questionTargets, feedbackTargets }) => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return {
      id: "relay",
      label: "Alpaca Relay",
      started: true,
      controlledUnavailable: false,
      buzzed: true,
      optionCount: initialOptionCount,
      answered: true,
      feedbackVisible: didShowFeedback,
      continued: true,
      nextReady: Boolean(document.querySelector("[data-relay-buzz]:not([disabled])")),
      summaryVisible: panelText.includes("Final Standing"),
      buzzAudit,
      questionAudit,
      feedbackAudit,
      buzzTargets,
      questionTargets,
      feedbackTargets
    };
  }, {
    optionCount,
    feedbackVisible,
    buzzAudit,
    questionAudit,
    feedbackAudit,
    buzzTargets,
    questionTargets,
    feedbackTargets
  });
}

async function completeMobileJumpRound(page, options = {}) {
  const requireNaturalCheckpoint = options.requireNaturalCheckpoint === true;
  await chooseMode(page, "jump", "play");
  await activateAllSetupOptions(page, "[data-jump-toggle-category]");
  await tapFirst(page, "[data-jump-start]:not([disabled])");
  await waitForModeStartOutcome(page, "[data-jump-stage]");

  const unavailable = await readControlledUnavailableState(page);
  if (unavailable.routeUpdatePending || unavailable.completeLadderMessage) {
    return {
      id: "jump",
      label: "Alpaca Jump",
      started: true,
      controlledUnavailable: true,
      unavailable,
      stageVisible: false,
      actionButtons: 0,
      jumped: false,
      ducked: false,
      optionCount: 0,
      answered: false,
      feedbackVisible: false,
      continued: false,
      nextReady: false
    };
  }

  await page.waitForSelector("[data-jump-stage]", { timeout: 10000 });
  await waitForVisibleArea(page, "[data-jump-stage]", 0.22);
  const stageAudit = await collectAudit(page, [
    "#experiencePanel",
    ".jump-shell",
    "[data-jump-stage]",
    '[data-jump-action="jump"]:not([disabled])',
    '[data-jump-action="duck"]:not([disabled])'
  ]);
  const stageTargets = await collectTouchTargets(page, ["[data-jump-action]:not([disabled])"]);
  const actionButtons = await page.locator("[data-jump-action]:not([disabled])").count();

  await tapFirst(page, '[data-jump-action="jump"]:not([disabled])');
  await page.waitForFunction(() => {
    return document.querySelector("[data-jump-runner]")?.dataset.jumpRunnerState === "jumping";
  }, null, { timeout: 3000 }).catch(() => {});
  const jumpedState = await page.evaluate(() => document.querySelector("[data-jump-runner]")?.dataset.jumpRunnerState || "");

  await page.waitForTimeout(700);
  await tapFirst(page, '[data-jump-action="duck"]:not([disabled])');
  await page.waitForFunction(() => {
    return document.querySelector("[data-jump-runner]")?.dataset.jumpRunnerState === "ducking";
  }, null, { timeout: 3000 }).catch(() => {});
  const duckedState = await page.evaluate(() => document.querySelector("[data-jump-runner]")?.dataset.jumpRunnerState || "");

  const checkpoint = await openJumpCheckpointForSmoke(page, { preferNatural: requireNaturalCheckpoint });
  if (!checkpoint.opened) {
    return {
      id: "jump",
      label: "Alpaca Jump",
      started: true,
      controlledUnavailable: false,
      stageVisible: true,
      actionButtons,
      jumped: jumpedState === "jumping",
      jumpedState,
      ducked: duckedState === "ducking",
      duckedState,
      checkpointOpened: false,
      requireNaturalCheckpoint,
      naturalCheckpointOpened: checkpoint.naturalOpened,
      checkpointFallbackUsed: checkpoint.fallbackUsed,
      optionCount: 0,
      answered: false,
      feedbackVisible: false,
      continued: false,
      nextReady: false,
      stageAudit,
      stageTargets
    };
  }

  await page.waitForSelector("[data-jump-option]:not([disabled])", { timeout: 10000 });
  await waitForVisibleArea(page, "[data-jump-option]:not([disabled])", 0.85);
  const questionAudit = await collectAudit(page, [
    ".question-popup-window.jump",
    ".jump-question-card",
    "[data-jump-option]:not([disabled])"
  ]);
  const questionTargets = await collectTouchTargets(page, ["[data-jump-option]:not([disabled])"]);
  const optionCount = await page.locator("[data-jump-option]:not([disabled])").count();
  await tapFirst(page, "[data-jump-option]:not([disabled])");

  await page.waitForSelector("[data-jump-continue]:not([disabled])", { timeout: 10000 });
  await waitForVisibleArea(page, ".feedback-card", 0.45);
  const feedbackVisible = await page.evaluate(() => Boolean(document.querySelector(".feedback-card")));
  const feedbackAudit = await collectAudit(page, [
    ".question-popup-window.jump",
    ".feedback-card",
    "[data-jump-continue]:not([disabled])"
  ]);
  const feedbackTargets = await collectTouchTargets(page, ["[data-jump-continue]:not([disabled])"]);
  await tapFirst(page, "[data-jump-continue]:not([disabled])");

  await page.waitForFunction(() => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return Boolean(document.querySelector("[data-jump-stage]")) || panelText.includes("Alpaca Jump Summary");
  }, null, { timeout: 10000 });

  return page.evaluate(({ actionButtons, jumpedState, duckedState, checkpoint, requireNaturalCheckpoint, optionCount, feedbackVisible, stageAudit, questionAudit, feedbackAudit, stageTargets, questionTargets, feedbackTargets }) => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return {
      id: "jump",
      label: "Alpaca Jump",
      started: true,
      controlledUnavailable: false,
      stageVisible: Boolean(document.querySelector("[data-jump-stage]")),
      actionButtons,
      jumped: jumpedState === "jumping",
      jumpedState,
      ducked: duckedState === "ducking",
      duckedState,
      checkpointOpened: true,
      requireNaturalCheckpoint,
      naturalCheckpointOpened: checkpoint.naturalOpened,
      checkpointFallbackUsed: checkpoint.fallbackUsed,
      optionCount,
      answered: true,
      feedbackVisible,
      continued: true,
      nextReady: Boolean(document.querySelector("[data-jump-stage]")),
      summaryVisible: panelText.includes("Alpaca Jump Summary"),
      stageAudit,
      questionAudit,
      feedbackAudit,
      stageTargets,
      questionTargets,
      feedbackTargets
    };
  }, {
    actionButtons,
    jumpedState,
    duckedState,
    checkpoint,
    requireNaturalCheckpoint,
    optionCount,
    feedbackVisible,
    stageAudit,
    questionAudit,
    feedbackAudit,
    stageTargets,
    questionTargets,
    feedbackTargets
  });
}

async function openJumpCheckpointForSmoke(page, options = {}) {
  if (options.preferNatural) {
    const checkpoint = await driveJumpUntilCheckpoint(page);
    if (checkpoint.opened) {
      return { opened: true, naturalOpened: true, fallbackUsed: false };
    }
  }

  return forceOpenJumpCheckpointForSmoke(page);
}

async function forceOpenJumpCheckpointForSmoke(page) {
  const fallbackOpened = await page.evaluate(() => {
    try {
      if (typeof state === "undefined" || typeof renderExperience !== "function") {
        return false;
      }
      const experience = state.experience;
      if (!experience || experience.type !== "jump" || !experience.currentQuestion) {
        return false;
      }
      if (typeof clearJumpAnimation === "function") {
        clearJumpAnimation();
      }
      experience.phase = "question";
      experience.ducking = false;
      experience.runnerY = 0;
      experience.runnerVelocity = 0;
      experience.runnerState = "running";
      experience.lastFrameAt = null;
      renderExperience();
      return Boolean(document.querySelector("[data-jump-option]:not([disabled])"));
    } catch (error) {
      console.warn(`Could not open Jump checkpoint for mobile smoke: ${error?.message || error}`);
      return false;
    }
  });

  return { opened: fallbackOpened, naturalOpened: false, fallbackUsed: fallbackOpened };
}

async function driveJumpUntilCheckpoint(page, timeout = 40000) {
  const startedAt = Date.now();
  let lastActionAt = 0;

  while (Date.now() - startedAt < timeout) {
    const stateSnapshot = await page.evaluate(() => {
      const obstacle = document.querySelector("[data-jump-obstacle]");
      const runner = document.querySelector("[data-jump-runner]");
      const runnerRect = runner?.getBoundingClientRect?.();
      const obstacleRect = obstacle?.getBoundingClientRect?.();
      const visualLead = runnerRect && obstacleRect
        ? obstacleRect.left - runnerRect.right
        : null;
      const obstacleStillRelevant = runnerRect && obstacleRect
        ? obstacleRect.right > runnerRect.left
        : false;
      return {
        optionCount: document.querySelectorAll("[data-jump-option]:not([disabled])").length,
        kind: obstacle?.dataset.jumpObstacleKind || "",
        visualLead: Number.isFinite(visualLead) ? visualLead : null,
        obstacleStillRelevant,
        runnerState: runner?.dataset.jumpRunnerState || "",
        stageVisible: Boolean(document.querySelector("[data-jump-stage]"))
      };
    });

    if (stateSnapshot.optionCount > 0) {
      return { opened: true, elapsedMs: Date.now() - startedAt };
    }

    if (!stateSnapshot.stageVisible) {
      break;
    }

    const actionLead = stateSnapshot.kind === "flying" ? 80 : 60;
    const canAct = Number.isFinite(stateSnapshot.visualLead) &&
      stateSnapshot.visualLead <= actionLead &&
      stateSnapshot.obstacleStillRelevant &&
      stateSnapshot.runnerState !== "hurting" &&
      Date.now() - lastActionAt > 240;
    if (canAct && stateSnapshot.kind === "ground" && stateSnapshot.runnerState !== "jumping") {
      await tapFirst(page, '[data-jump-action="jump"]:not([disabled])').catch(() => {});
      lastActionAt = Date.now();
    }
    if (canAct && stateSnapshot.kind === "flying" && stateSnapshot.runnerState !== "ducking") {
      await tapFirst(page, '[data-jump-action="duck"]:not([disabled])').catch(() => {});
      lastActionAt = Date.now();
    }

    await page.waitForTimeout(80);
  }

  return { opened: false, elapsedMs: Date.now() - startedAt };
}

async function completeAlpacapardyRound(page) {
  await chooseMode(page, "jeopardy", "play");
  await tapFirst(page, "[data-jeopardy-start]:not([disabled])");
  await page.waitForFunction(() => document.querySelectorAll("[data-jeopardy-open]").length > 0, null, { timeout: 12000 });
  await waitForVisibleArea(page, ".jeopardy-board-shell", 0.22);
  const initialTileCount = await page.evaluate(() => document.querySelectorAll("[data-jeopardy-open]").length);
  await tapFirst(page, "[data-jeopardy-open]:not([disabled]):not(.done)");
  await page.waitForSelector("[data-jeopardy-option]:not([disabled])", { timeout: 12000 });
  await tapFirst(page, "[data-jeopardy-option]:not([disabled])");
  await page.waitForSelector("[data-jeopardy-back]:not([disabled])", { timeout: 12000 });
  const answered = await page.evaluate(() => Boolean(document.querySelector(".feedback-card")));
  await tapFirst(page, "[data-jeopardy-back]:not([disabled])");
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

async function completeMobileRawContentRound(page) {
  await chooseMode(page, "rawcontent", "learn");
  await page.waitForSelector(".raw-content-shell", { timeout: 12000 });

  const contentAudit = await collectAudit(page, [
    "#experiencePanel",
    ".raw-content-shell",
    ".raw-source-card, .raw-entry-card, .raw-section-group-card"
  ]);
  const contentTargets = await collectTouchTargetSamples(page, [
    ".panel-hub-link",
    ".learn-footer-card-button:not([disabled])"
  ]);
  const initialCounts = await page.evaluate(() => ({
    cards: document.querySelectorAll(".raw-source-card, .raw-entry-card, .raw-section-group-card").length,
    quizOptions: document.querySelectorAll("[data-raw-quiz-option]:not([disabled])").length,
    quizPagers: document.querySelectorAll("[data-raw-quiz-page]").length,
    mediaButtons: document.querySelectorAll("[data-open-raw-media]").length,
    footerButtons: document.querySelectorAll(".learn-footer-card-button").length
  }));

  let quizTargets = [];
  let quizAnswered = initialCounts.quizOptions === 0;
  let quizFeedbackVisible = false;
  if (initialCounts.quizOptions > 0) {
    await centerFirstMatchingElement(page, "[data-raw-quiz-option]:not([disabled])");
    await waitForVisibleArea(page, "[data-raw-quiz-option]:not([disabled])", 0.75);
    quizTargets = await collectTouchTargetSamples(page, ["[data-raw-quiz-option]:not([disabled])"], { maxPerSelector: 4 });
    await tapFirst(page, "[data-raw-quiz-option]:not([disabled])");
    await page.waitForFunction(() => {
      return Boolean(
        document.querySelector("[data-raw-quiz-option][aria-pressed='true']") ||
        document.querySelector(".raw-quiz-feedback")
      );
    }, null, { timeout: 8000 });
    quizAnswered = await page.evaluate(() => Boolean(document.querySelector("[data-raw-quiz-option][aria-pressed='true']")));
    quizFeedbackVisible = await page.evaluate(() => Boolean(document.querySelector(".raw-quiz-feedback")));
  }

  let mediaTriggerTargets = [];
  let mediaTargets = [];
  let mediaAudit = null;
  let mediaOpened = initialCounts.mediaButtons === 0;
  let mediaClosed = initialCounts.mediaButtons === 0;
  if (initialCounts.mediaButtons > 0) {
    await centerFirstMatchingElement(page, "[data-open-raw-media]");
    mediaTriggerTargets = await collectTouchTargetSamples(page, ["[data-open-raw-media]"], { maxPerSelector: 1 });
    await tapFirst(page, "[data-open-raw-media]");
    await page.waitForSelector("[data-raw-media-window]", { timeout: 10000 });
    await waitForVisibleArea(page, "[data-raw-media-window]", 0.65);
    mediaOpened = true;
    mediaAudit = await collectAudit(page, [
      ".raw-media-lightbox-overlay",
      "[data-raw-media-window]",
      ".raw-media-lightbox-frame",
      ".raw-media-lightbox-asset",
      "[data-close-raw-media].popup-close-button"
    ]);
    mediaTargets = await collectTouchTargets(page, [
      "[data-close-raw-media].popup-close-button",
      "[data-raw-media-nav]"
    ]);
    await tapFirst(page, "[data-close-raw-media].popup-close-button");
    await page.waitForFunction(() => !document.querySelector("[data-raw-media-window]"), null, { timeout: 10000 });
    mediaClosed = true;
  }

  return page.evaluate(({ contentAudit, contentTargets, quizTargets, mediaTriggerTargets, mediaTargets, mediaAudit, initialCounts, quizAnswered, quizFeedbackVisible, mediaOpened, mediaClosed }) => ({
    id: "rawcontent",
    label: "Raw Content",
    started: Boolean(document.querySelector(".raw-content-shell")),
    cards: initialCounts.cards,
    quizOptions: initialCounts.quizOptions,
    quizPagers: initialCounts.quizPagers,
    footerButtons: initialCounts.footerButtons,
    mediaButtons: initialCounts.mediaButtons,
    quizAnswered,
    quizFeedbackVisible,
    mediaOpened,
    mediaClosed,
    contentAudit,
    contentTargets,
    quizTargets,
    mediaTriggerTargets,
    mediaTargets,
    mediaAudit
  }), {
    contentAudit,
    contentTargets,
    quizTargets,
    mediaTriggerTargets,
    mediaTargets,
    mediaAudit,
    initialCounts,
    quizAnswered,
    quizFeedbackVisible,
    mediaOpened,
    mediaClosed
  });
}

async function completeMobileMindMapRound(page) {
  await chooseMode(page, "mindmap", "learn");
  await page.waitForSelector(".mindmap-shell", { timeout: 12000 });
  await page.waitForSelector("[data-mindmap-gallery-viewport]", { timeout: 12000 });
  await page.waitForSelector("[data-mindmap-orbit-stage], .map-prompt", { timeout: 12000 });
  await page.waitForTimeout(260);

  const stageAudit = await collectAudit(page, [
    "#experiencePanel",
    ".mindmap-shell",
    "[data-mindmap-gallery-viewport]",
    "[data-mindmap-orbit-stage]",
    "[data-open-mindmap-entry]"
  ]);
  const stageTargets = await collectTouchTargetSamples(page, [
    "[data-open-mindmap-entry]",
    "[data-open-mindmap-guide]",
    "[data-mindmap-gallery-nav]",
    ".learn-footer-card-button:not([disabled])"
  ]);
  const initialCounts = await page.evaluate(() => ({
    stages: document.querySelectorAll("[data-mindmap-orbit-stage]").length,
    entries: document.querySelectorAll("[data-open-mindmap-entry]").length,
    guides: document.querySelectorAll("[data-open-mindmap-guide]:not([disabled])").length,
    navButtons: document.querySelectorAll("[data-mindmap-gallery-nav]").length,
    footerButtons: document.querySelectorAll(".learn-footer-card-button").length
  }));

  let popupAudit = null;
  let popupTargets = [];
  let popupOpened = initialCounts.entries === 0;
  let popupClosed = initialCounts.entries === 0;
  if (initialCounts.entries > 0) {
    await centerFirstMatchingElement(page, "[data-open-mindmap-entry]");
    await tapFirst(page, "[data-open-mindmap-entry]");
    await page.waitForSelector("[data-mindmap-popup-window]", { timeout: 10000 });
    await waitForVisibleArea(page, "[data-mindmap-popup-window]", 0.65);
    popupOpened = true;
    popupAudit = await collectAudit(page, [
      ".auth-modal-overlay",
      "[data-mindmap-popup-window]",
      "[data-close-mindmap-popup].popup-close-button"
    ]);
    popupTargets = await collectTouchTargets(page, ["[data-close-mindmap-popup].popup-close-button"]);
    await tapFirst(page, "[data-close-mindmap-popup].popup-close-button");
    await page.waitForFunction(() => !document.querySelector("[data-mindmap-popup-window]"), null, { timeout: 10000 });
    popupClosed = true;
  }

  return page.evaluate(({ stageAudit, stageTargets, popupAudit, popupTargets, initialCounts, popupOpened, popupClosed }) => ({
    id: "mindmap",
    label: "Mind Map",
    started: Boolean(document.querySelector(".mindmap-shell")),
    stages: initialCounts.stages,
    entries: initialCounts.entries,
    guides: initialCounts.guides,
    navButtons: initialCounts.navButtons,
    footerButtons: initialCounts.footerButtons,
    popupOpened,
    popupClosed,
    stageAudit,
    stageTargets,
    popupAudit,
    popupTargets
  }), {
    stageAudit,
    stageTargets,
    popupAudit,
    popupTargets,
    initialCounts,
    popupOpened,
    popupClosed
  });
}

async function completeMobileAlpacardsRound(page) {
  await chooseMode(page, "alpacard", "learn");
  await page.waitForSelector(".alpacard-shell", { timeout: 12000 });
  await waitForVisibleArea(page, ".alpacard-shell", 0.25);

  const deckAudit = await collectAudit(page, [
    "#experiencePanel",
    ".alpacard-shell",
    "[data-alpacard-carousel]",
    "[data-alpacard-stage]",
    "[data-alpacard-flip]"
  ]);
  const deckTargets = await collectTouchTargetSamples(page, [
    "[data-alpacard-flip]",
    "[data-alpacard-nav]",
    "[data-alpacard-index]"
  ], { maxPerSelector: 4 });
  const initialCounts = await page.evaluate(() => ({
    cards: document.querySelectorAll(".alpacard-image").length,
    stages: document.querySelectorAll("[data-alpacard-stage]").length,
    navButtons: document.querySelectorAll("[data-alpacard-nav]").length,
    thumbnails: document.querySelectorAll("[data-alpacard-index]").length,
    footerButtons: document.querySelectorAll(".learn-footer-card-button").length,
    counterText: document.querySelector("[data-alpacard-counter]")?.textContent?.trim() || ""
  }));

  let flipped = initialCounts.cards === 0;
  let navigated = initialCounts.cards <= 1;
  let counterAfterNav = initialCounts.counterText;
  if (initialCounts.cards > 0) {
    await tapFirst(page, "[data-alpacard-flip]");
    await page.waitForFunction(() => Boolean(document.querySelector("[data-alpacard-stage].is-active.is-flipped, [data-alpacard-slide].is-active [data-alpacard-stage].is-flipped")), null, { timeout: 8000 });
    flipped = await page.evaluate(() => Boolean(document.querySelector("[data-alpacard-slide].is-active [data-alpacard-stage].is-flipped, [data-alpacard-stage].is-flipped")));
    await tapFirst(page, '[data-alpacard-nav="next"]');
    await page.waitForFunction((initialCounterText) => {
      const counterText = document.querySelector("[data-alpacard-counter]")?.textContent?.trim() || "";
      return counterText && counterText !== initialCounterText;
    }, initialCounts.counterText, { timeout: 8000 }).catch(() => {});
    counterAfterNav = await page.evaluate(() => document.querySelector("[data-alpacard-counter]")?.textContent?.trim() || "");
    navigated = initialCounts.cards <= 1 || counterAfterNav !== initialCounts.counterText;
  }

  return page.evaluate(({ deckAudit, deckTargets, initialCounts, flipped, navigated, counterAfterNav }) => ({
    id: "alpacard",
    label: "Alpacards",
    started: Boolean(document.querySelector(".alpacard-shell")),
    cards: initialCounts.cards,
    stages: initialCounts.stages,
    navButtons: initialCounts.navButtons,
    thumbnails: initialCounts.thumbnails,
    footerButtons: initialCounts.footerButtons,
    flipped,
    navigated,
    counterBeforeNav: initialCounts.counterText,
    counterAfterNav,
    deckAudit,
    deckTargets
  }), {
    deckAudit,
    deckTargets,
    initialCounts,
    flipped,
    navigated,
    counterAfterNav
  });
}

function pushAuditFailures(failures, label, audit, options = {}) {
  if (!audit.appReady) {
    failures.push(`${label}: app did not report WSC_APP_READY`);
  }
  if (audit.gate.hiddenDialogPresent) {
    failures.push(`${label}: hidden orientation gate left a dialog in the DOM`);
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

function pushTouchTargetFailures(failures, label, targets) {
  const failing = targets.filter((target) => !target.meetsTouchSize || !target.centerHitTestable);
  if (failing.length) {
    failures.push(`${label}: touch targets are below 44px or not center hit-testable (${JSON.stringify(failing)})`);
  }
}

function pushMobileGameRoundFailures(failures, viewportLabel, gameState) {
  if (!gameState) {
    failures.push(`${viewportLabel}: mobile gameplay round did not return diagnostics`);
    return;
  }

  const label = `${viewportLabel} ${gameState.label || gameState.id}`;
  if (gameState.controlledUnavailable) {
    failures.push(`${label}: smoke fixture did not produce a playable mobile round (${JSON.stringify(gameState.unavailable)})`);
    return;
  }
  if (!gameState.started || !gameState.answered || !gameState.feedbackVisible || !gameState.continued) {
    failures.push(`${label}: mobile WebKit tap flow did not complete (${JSON.stringify(gameState)})`);
  }
  if (gameState.optionCount < 2) {
    failures.push(`${label}: expected at least two answer options, saw ${gameState.optionCount}`);
  }
  if (!gameState.nextReady && !gameState.summaryVisible) {
    failures.push(`${label}: continuing did not return to the next playable state`);
  }
  if (gameState.id === "relay" && !gameState.buzzed) {
    failures.push(`${label}: relay round never accepted a buzz tap`);
  }
  if (gameState.id === "jump") {
    if (!gameState.stageVisible || gameState.actionButtons < 2 || !gameState.jumped || !gameState.ducked || !gameState.checkpointOpened) {
      failures.push(`${label}: Jump launch, touch actions, or checkpoint state did not complete (${JSON.stringify(gameState)})`);
    }
    if (gameState.requireNaturalCheckpoint && gameState.naturalCheckpointOpened === false) {
      failures.push(`${label}: Jump checkpoint did not open through the natural responsive stage path (${JSON.stringify(gameState)})`);
    }
    if (gameState.stageAudit) {
      pushAuditFailures(failures, `${label} stage state`, gameState.stageAudit, {
        insideViewport: true,
        minimumVisibleAreaRatio: 0.22
      });
      pushTouchTargetFailures(failures, `${label} stage state`, gameState.stageTargets || []);
    }
  }

  if (gameState.buzzAudit) {
    pushAuditFailures(failures, `${label} buzz state`, gameState.buzzAudit, {
      insideViewport: true,
      minimumVisibleAreaRatio: 0.35
    });
    pushTouchTargetFailures(failures, `${label} buzz state`, gameState.buzzTargets || []);
  }
  if (gameState.questionAudit) {
    pushAuditFailures(failures, `${label} question state`, gameState.questionAudit, {
      insideViewport: true,
      minimumVisibleAreaRatio: 0.35
    });
    pushTouchTargetFailures(failures, `${label} question state`, gameState.questionTargets || []);
  }
  if (gameState.feedbackAudit) {
    pushAuditFailures(failures, `${label} feedback state`, gameState.feedbackAudit, {
      insideViewport: true,
      minimumVisibleAreaRatio: 0.35
    });
    pushTouchTargetFailures(failures, `${label} feedback state`, gameState.feedbackTargets || []);
  }
}

function pushMobileLearnRoundFailures(failures, viewportLabel, learnState) {
  if (!learnState) {
    failures.push(`${viewportLabel}: mobile Learn round did not return diagnostics`);
    return;
  }

  const label = `${viewportLabel} ${learnState.label || learnState.id}`;
  if (!learnState.started) {
    failures.push(`${label}: Learn mode did not render its shell (${JSON.stringify(learnState)})`);
    return;
  }
  if (learnState.footerButtons < 3) {
    failures.push(`${label}: expected footer navigation to expose sibling Learn modes, saw ${learnState.footerButtons}`);
  }

  if (learnState.id === "rawcontent") {
    if (learnState.cards < 1 || learnState.quizOptions < 2 || !learnState.quizAnswered || !learnState.quizFeedbackVisible) {
      failures.push(`${label}: raw content card or quiz tap flow did not complete (${JSON.stringify(learnState)})`);
    }
    if (!learnState.mediaOpened || !learnState.mediaClosed) {
      failures.push(`${label}: raw content media lightbox did not open and close with WebKit taps (${JSON.stringify(learnState)})`);
    }
    pushAuditFailures(failures, `${label} content`, learnState.contentAudit, { insideViewport: true });
    pushTouchTargetFailures(failures, `${label} content`, learnState.contentTargets || []);
    pushTouchTargetFailures(failures, `${label} quiz`, learnState.quizTargets || []);
    pushMediaTriggerTargetFailures(failures, `${label} media trigger`, learnState.mediaTriggerTargets || [], {
      opened: learnState.mediaOpened
    });
    if (learnState.mediaAudit) {
      pushAuditFailures(failures, `${label} media lightbox`, learnState.mediaAudit, {
        insideViewport: true,
        minimumVisibleAreaRatio: 0.55
      });
      pushTouchTargetFailures(failures, `${label} media lightbox`, learnState.mediaTargets || []);
    }
  }

  if (learnState.id === "mindmap") {
    if (learnState.stages < 1 || learnState.entries < 1 || !learnState.popupOpened || !learnState.popupClosed) {
      failures.push(`${label}: mind map stage or entry popup did not complete (${JSON.stringify(learnState)})`);
    }
    pushAuditFailures(failures, `${label} stage`, learnState.stageAudit, {
      insideViewport: true,
      minimumVisibleAreaRatio: 0.18
    });
    pushTouchTargetFailures(failures, `${label} stage`, learnState.stageTargets || []);
    if (learnState.popupAudit) {
      pushAuditFailures(failures, `${label} popup`, learnState.popupAudit, {
        insideViewport: true,
        minimumVisibleAreaRatio: 0.55
      });
      pushTouchTargetFailures(failures, `${label} popup`, learnState.popupTargets || []);
    }
  }

  if (learnState.id === "alpacard") {
    if (learnState.cards < 1 || learnState.stages < 1 || learnState.navButtons < 2 || learnState.thumbnails < 1) {
      failures.push(`${label}: alpacard deck did not render complete controls (${JSON.stringify(learnState)})`);
    }
    if (!learnState.flipped || !learnState.navigated) {
      failures.push(`${label}: alpacard flip or next-card tap did not complete (${JSON.stringify(learnState)})`);
    }
    pushAuditFailures(failures, `${label} deck`, learnState.deckAudit, {
      insideViewport: true,
      minimumVisibleAreaRatio: 0.22
    });
    pushTouchTargetFailures(failures, `${label} deck`, learnState.deckTargets || []);
  }
}

function pushMediaTriggerTargetFailures(failures, label, targets, options = {}) {
  const failing = targets.filter((target) => {
    if (!target.meetsTouchSize) {
      return true;
    }
    return !target.centerHitTestable && !options.opened;
  });
  if (failing.length) {
    failures.push(`${label}: media trigger touch targets are below 44px or did not open from a WebKit tap (${JSON.stringify(failing)})`);
  }
}

async function runViewport(browser, viewportConfig) {
  const context = await browser.newContext({
    viewport: viewportConfig.portrait,
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 2,
    serviceWorkers: "block"
  });
  const page = await context.newPage();
  await installPlayableArcadeSmokeFixture(page);
  const messages = [];
  page.on("console", (message) => messages.push({ type: message.type(), text: message.text() }));
  page.on("pageerror", (error) => messages.push({ type: "pageerror", text: error.message }));

  try {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => window.WSC_APP_READY === true, null, { timeout: 60000 });
    const portrait = await collectAudit(page, ["#orientationGateMount .orientation-gate"]);

    await page.setViewportSize(viewportConfig.landscape);
    await page.waitForFunction(() => {
      return document.body.classList.contains("is-touch-landscape") &&
        !document.body.classList.contains("needs-landscape") &&
        document.querySelector("#orientationGateMount")?.hidden === true;
    }, null, { timeout: 12000 });
    const landscapeBeforeEntry = await collectAudit(page, ["#routeBuilder"]);

    await chooseLocalRoute(page);
    const localRoute = await collectAudit(page, ["#routeBuilder", ".mode-choice-board"]);

    let heroMenu = null;
    let heroMenuTargets = [];
    if (viewportConfig.checks.includes("hero-menu")) {
      await openHeroMenu(page);
      heroMenu = await collectAudit(page, [
        ".hero-links.is-open",
        ".hero-links.is-open > .hero-discord-link",
        ".hero-links.is-open > .session-controls",
        ".hero-links.is-open > button.hero-link-icon",
        ".hero-links.is-open > a.hero-link-icon"
      ]);
      heroMenuTargets = await collectTouchTargets(page, [
        "[data-toggle-hero-menu]",
        ".hero-links.is-open > a",
        ".hero-links.is-open > button",
        ".hero-links.is-open .session-signout-button"
      ]);
      await tapFirst(page, "[data-toggle-hero-menu][aria-expanded='true']");
      await page.waitForFunction(() => !document.querySelector(".hero-links")?.classList.contains("is-open"), null, { timeout: 10000 });
    }

    let settingsModal = null;
    let settingsTargets = [];
    if (viewportConfig.checks.includes("settings-modal")) {
      await openSettingsModal(page);
      settingsModal = await collectAudit(page, [
        ".app-settings-overlay",
        ".app-settings-window",
        ".app-settings-control",
        "[data-app-settings-volume]"
      ]);
      settingsTargets = await collectTouchTargets(page, [
        ".popup-close-button",
        "[data-close-app-settings]",
        "[data-app-settings-mute]",
        "[data-app-settings-volume]"
      ]);
      await closeSettingsModal(page);
    }

    let alpacapardyRound = null;
    if (viewportConfig.checks.includes("alpacapardy-round")) {
      alpacapardyRound = await completeAlpacapardyRound(page);
    }

    const mobileGameStates = {};
    if (viewportConfig.checks.includes("mobile-gameplay-rounds")) {
      for (const spec of MOBILE_GAME_ROUND_SPECS) {
        await openFreshLandscapeLocalRoute(page);
        mobileGameStates[spec.id] = await completeMobileGameRound(page, spec);
      }
      await openFreshLandscapeLocalRoute(page);
      mobileGameStates.jump = await completeMobileJumpRound(page, {
        requireNaturalCheckpoint: viewportConfig.requireNaturalJumpCheckpoint === true
      });
      await openFreshLandscapeLocalRoute(page);
      mobileGameStates.relay = await completeMobileRelayRound(page);
    }

    const mobileLearnStates = {};
    if (viewportConfig.checks.includes("learn-mode-rounds")) {
      await openFreshLandscapeLocalRoute(page);
      mobileLearnStates.rawcontent = await completeMobileRawContentRound(page);
      await openFreshLandscapeLocalRoute(page);
      mobileLearnStates.mindmap = await completeMobileMindMapRound(page);
      await openFreshLandscapeLocalRoute(page);
      mobileLearnStates.alpacard = await completeMobileAlpacardsRound(page);
    }

    return {
      id: viewportConfig.id,
      label: viewportConfig.label,
      portrait,
      landscapeBeforeEntry,
      localRoute,
      heroMenu,
      heroMenuTargets,
      settingsModal,
      settingsTargets,
      alpacapardyRound,
      mobileGameStates,
      mobileLearnStates,
      messages
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const { webkit } = loadPlaywright();
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
    browser = await webkit.launch({ headless: true });
    const results = [];
    for (const viewportConfig of WEBKIT_VIEWPORTS) {
      results.push(await runViewport(browser, viewportConfig));
    }
    await browser.close();
    browser = null;

    const failures = [];
    for (const result of results) {
      pushAuditFailures(failures, `${result.label} portrait`, result.portrait, {
        insideViewport: true,
        minimumVisibleAreaRatio: 0.95
      });
      if (!result.portrait.bodyClass.includes("needs-landscape") || !result.portrait.gate.visible || !result.portrait.gate.focusInside) {
        failures.push(`${result.label}: portrait WebKit viewport should show and focus the landscape gate`);
      }
      pushAuditFailures(failures, `${result.label} landscape before entry`, result.landscapeBeforeEntry);
      if (!result.landscapeBeforeEntry.bodyClass.includes("is-touch-landscape") || result.landscapeBeforeEntry.gate.visible) {
        failures.push(`${result.label}: landscape WebKit viewport should use touch landscape without the gate`);
      }
      pushAuditFailures(failures, `${result.label} local route`, result.localRoute, { insideViewport: true });
      if (result.heroMenu) {
        pushAuditFailures(failures, `${result.label} hero menu`, result.heroMenu, { insideViewport: true });
        pushTouchTargetFailures(failures, `${result.label} hero menu`, result.heroMenuTargets);
      }
      if (result.settingsModal) {
        pushAuditFailures(failures, `${result.label} settings modal`, result.settingsModal, {
          insideViewport: true,
          minimumVisibleAreaRatio: 0.68
        });
        pushTouchTargetFailures(failures, `${result.label} settings modal`, result.settingsTargets);
      }
      if (result.alpacapardyRound) {
        if (!result.alpacapardyRound.boardStarted || !result.alpacapardyRound.answered || !result.alpacapardyRound.returnedToBoard || result.alpacapardyRound.doneTiles < 1) {
          failures.push(`${result.label}: Alpacapardy round did not complete with WebKit taps (${JSON.stringify(result.alpacapardyRound)})`);
        }
      }
      for (const gameState of Object.values(result.mobileGameStates || {})) {
        pushMobileGameRoundFailures(failures, result.label, gameState);
      }
      for (const learnState of Object.values(result.mobileLearnStates || {})) {
        pushMobileLearnRoundFailures(failures, result.label, learnState);
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
      servedRoot: externalBaseUrl ? null : SERVER_DIR,
      mode: MODE,
      browser: "webkit",
      viewports: results,
      failures
    }, null, 2));

    if (failures.length) {
      console.error(`Mobile WebKit smoke failed:\n- ${failures.join("\n- ")}`);
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
