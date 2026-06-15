import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const APP_DIR = path.join(ROOT, "app");
const PORT = Number(process.env.WSC_SMOKE_PORT || 4173);
const BASE_URL = `http://localhost:${PORT}`;
const DEFAULT_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

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

  throw new Error("Playwright is not available. Run `npx playwright --version` once or install Playwright to run smoke tests.");
}

async function runModeSmoke(page, sectionName, modeId, expectedText) {
  await page.goto(`${BASE_URL}/index.html`, { waitUntil: "networkidle", timeout: 60000 });
  await chooseLocalRoute(page);
  await page.waitForFunction(() => window.WSC_APP_READY === true && document.querySelector(".mode-choice-board"));

  await ensureSectionAndModeReady(page, sectionName, modeId);

  const modePath = await page.evaluate((targetModeId) => {
    const modeButton = document.querySelector(`[data-pick-mode="${targetModeId}"]`);
    return modeButton?.dataset.pickModePath || modeButton?.closest("[data-mode-choice-path]")?.dataset.modeChoicePath || null;
  }, modeId);
  if (!modePath) {
    throw new Error(`Could not find route-builder path for mode "${modeId}".`);
  }

  await page.evaluate((targetModePath) => {
    const modeMenuButton = document.querySelector(`[data-toggle-mode-menu="${targetModePath}"]`);
    if (!modeMenuButton) {
      throw new Error(`Could not find mode menu button for "${targetModePath}".`);
    }
    modeMenuButton.click();
  }, modePath);
  await page.waitForFunction((targetModePath) => {
    return document.querySelector(`[data-mode-choice-path="${targetModePath}"]`)?.classList.contains("is-open");
  }, modePath);
  await clickEnabledModeCard(page, sectionName, modeId);
  await page.waitForFunction(() => !document.querySelector("#experiencePanel")?.classList.contains("hidden"), null, { timeout: 8000 }).catch(() => {});

  const alpacapardyFlow = modeId === "jeopardy"
    ? await completeLocalAlpacapardyFlow(page)
    : null;
  const quizFlow = modeId === "quiz"
    ? await completeLocalQuizFlow(page)
    : null;
  const raceFlow = modeId === "race"
    ? await completeLocalRaceFlow(page)
    : null;
  const runFlow = modeId === "run"
    ? await completeLocalRunFlow(page)
    : null;
  const relayFlow = modeId === "relay"
    ? await completeLocalRelayFlow(page)
    : null;
  const jumpFlow = modeId === "jump"
    ? await completeLocalJumpFlow(page)
    : null;

  return page.evaluate(({ text, flows }) => {
    const panel = document.querySelector("#experiencePanel");
    const panelText = panel?.textContent?.replace(/\s+/g, " ").trim() || "";
    return {
      experienceHidden: panel?.classList.contains("hidden") ?? true,
      containsExpectedText: panelText.includes(text),
      panelText: panelText.slice(0, 240),
      rawCards: document.querySelectorAll(".raw-content-card, .raw-entry-card, [data-raw-entry]").length,
      alpacardImages: document.querySelectorAll(".alpacard-image").length,
      channelCards: document.querySelectorAll(".channel-card, .alpaca-channel-card, [data-channel-video]").length,
      jeopardyControls: document.querySelectorAll("[data-jeopardy-start], [data-jeopardy-open], [data-jeopardy-toggle-category]").length,
      alpacapardyFlow: flows.alpacapardy,
      quizFlow: flows.quiz,
      raceFlow: flows.race,
      runFlow: flows.run,
      relayFlow: flows.relay,
      jumpFlow: flows.jump
    };
  }, {
    text: expectedText,
    flows: {
      alpacapardy: alpacapardyFlow,
      quiz: quizFlow,
      race: raceFlow,
      run: runFlow,
      relay: relayFlow,
      jump: jumpFlow
    }
  });
}

async function completeLocalAlpacapardyFlow(page) {
  await page.waitForSelector("[data-jeopardy-start]:not([disabled])", { timeout: 8000 });
  await page.evaluate(() => {
    document.querySelector("[data-jeopardy-start]:not([disabled])")?.click();
  });
  await page.waitForFunction(() => document.querySelectorAll("[data-jeopardy-open]").length > 0, null, { timeout: 8000 });

  const boardTilesBefore = await page.evaluate(() => document.querySelectorAll("[data-jeopardy-open]").length);
  await page.evaluate(() => {
    document.querySelector("[data-jeopardy-open]:not([disabled])")?.click();
  });
  await page.waitForSelector("[data-jeopardy-option]:not([disabled])", { timeout: 8000 });
  const focusOpened = await page.evaluate(() => Boolean(document.querySelector("[data-jeopardy-option]:not([disabled])")));

  await page.evaluate(() => {
    document.querySelector("[data-jeopardy-option]:not([disabled])")?.click();
  });
  await page.waitForSelector("[data-jeopardy-back]:not([disabled])", { timeout: 8000 });
  const answered = await page.evaluate(() => Boolean(document.querySelector(".feedback-card")));

  await page.evaluate(() => {
    document.querySelector("[data-jeopardy-back]:not([disabled])")?.click();
  });
  await page.waitForFunction(() => {
    return !document.querySelector("[data-jeopardy-back]")
      && document.querySelectorAll("[data-jeopardy-open]").length > 0
      && document.querySelectorAll("[data-jeopardy-open].done").length > 0;
  }, null, { timeout: 8000 });

  return page.evaluate(({ initialTileCount, focusOpened: didOpenFocus, answered: didAnswer }) => ({
    boardStarted: document.querySelectorAll("[data-jeopardy-open]").length === initialTileCount,
    focusOpened: didOpenFocus,
    answered: didAnswer,
    returnedToBoard: !document.querySelector("[data-jeopardy-back]"),
    doneTiles: document.querySelectorAll("[data-jeopardy-open].done").length,
    openTiles: document.querySelectorAll("[data-jeopardy-open]:not(.done)").length
  }), { initialTileCount: boardTilesBefore, focusOpened, answered });
}

async function completeLocalQuizFlow(page) {
  await page.waitForFunction(() => {
    return document.querySelector("[data-quiz-option]")
      || document.querySelector(".quiz-warning")
      || document.querySelector(".quiz-setup-card");
  }, null, { timeout: 8000 });

  const unavailable = await page.evaluate(() => {
    const panelText = document.querySelector("#experiencePanel")?.textContent?.replace(/\s+/g, " ").trim() || "";
    return {
      controlledUnavailable: Boolean(document.querySelector(".quiz-warning") || document.querySelector(".quiz-setup-card")),
      missingDifficultyMessage: panelText.includes("questions for every difficulty") || panelText.includes("fixed 15-question quiz"),
      panelText: panelText.slice(0, 240)
    };
  });
  if (unavailable.controlledUnavailable || unavailable.missingDifficultyMessage) {
    return {
      controlledUnavailable: true,
      unavailable,
      questionCount: 0,
      answeredCount: 0,
      submitted: false,
      resultsVisible: false,
      resetVisible: false
    };
  }

  const questionIndexes = await page.evaluate(() => {
    return Array.from(new Set([...document.querySelectorAll("[data-quiz-question][data-quiz-option]")]
      .map((button) => Number(button.dataset.quizQuestion))
      .filter(Number.isInteger))).sort((left, right) => left - right);
  });

  for (const questionIndex of questionIndexes) {
    const answered = await page.evaluate((targetQuestionIndex) => {
      const option = document.querySelector(`[data-quiz-question="${targetQuestionIndex}"][data-quiz-option]:not([disabled])`);
      if (!option) {
        return false;
      }
      option.click();
      return true;
    }, questionIndex);
    if (!answered) {
      break;
    }
    await page.waitForTimeout(20);
  }

  await page.waitForSelector('[data-quiz-submit][data-quiz-incomplete="false"]:not([disabled])', { timeout: 8000 });
  const submitted = await clickFirstEnabled(page, '[data-quiz-submit][data-quiz-incomplete="false"]:not([disabled])');
  await page.waitForSelector(".quiz-results-footer", { timeout: 8000 });

  return page.evaluate(({ questionCount, submitted: didSubmit }) => ({
    controlledUnavailable: false,
    questionCount,
    answeredCount: document.querySelectorAll("[data-quiz-option].active").length,
    submitted: didSubmit,
    resultsVisible: Boolean(document.querySelector(".quiz-results-footer")),
    resetVisible: Boolean(document.querySelector("[data-quiz-reset]"))
  }), { questionCount: questionIndexes.length, submitted });
}

async function checkUnavailableTrainModeCards(page) {
  await page.goto(`${BASE_URL}/index.html`, { waitUntil: "networkidle", timeout: 60000 });
  await chooseLocalRoute(page);
  await page.waitForFunction(() => window.WSC_APP_READY === true && document.querySelector(".mode-choice-board"));
  await ensureSectionAndModeReady(page, "We Are All in This to Get There", "quiz");

  await page.evaluate(() => {
    const modeMenuButton = document.querySelector('[data-toggle-mode-menu="train"]');
    if (!modeMenuButton) {
      throw new Error('Could not find train mode menu button.');
    }
    modeMenuButton.click();
  });
  await page.waitForFunction(() => document.querySelector('[data-mode-choice-path="train"]')?.classList.contains("is-open"));

  return page.evaluate(() => {
    const expected = ["writing", "buildcase", "bowl"];
    return Object.fromEntries(expected.map((modeId) => {
      const card = document.querySelector(`[data-pick-mode="${modeId}"][data-pick-mode-path="train"]`);
      return [modeId, {
        present: Boolean(card),
        disabled: Boolean(card?.disabled),
        unavailableClass: Boolean(card?.classList.contains("unavailable")),
        title: card?.getAttribute("title") || "",
        text: card?.textContent?.replace(/\s+/g, " ").trim() || ""
      }];
    }));
  });
}

async function clickFirstEnabled(page, selector, timeout = 8000) {
  await page.waitForSelector(selector, { timeout });
  return page.evaluate((targetSelector) => {
    const element = document.querySelector(targetSelector);
    if (!element || element.disabled) {
      return false;
    }
    element.click();
    return true;
  }, selector);
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
  }, playableSelector, { timeout: 8000 });
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

async function completeLocalRaceFlow(page) {
  await activateAllSetupOptions(page, "[data-race-toggle-category]");
  const started = await clickFirstEnabled(page, "[data-race-start]:not([disabled])");
  await waitForModeStartOutcome(page, "[data-race-option]:not([disabled])");
  const unavailable = await readControlledUnavailableState(page);
  if (unavailable.routeUpdatePending || unavailable.completeLadderMessage) {
    return {
      started,
      controlledUnavailable: true,
      unavailable,
      optionCount: 0,
      answered: false,
      feedbackVisible: false,
      advanced: false,
      nextQuestionReady: false,
      summaryVisible: false
    };
  }

  await page.waitForSelector("[data-race-option]:not([disabled])", { timeout: 8000 });
  const optionCount = await page.evaluate(() => document.querySelectorAll("[data-race-option]:not([disabled])").length);
  const answered = await clickFirstEnabled(page, "[data-race-option]:not([disabled])");
  await page.waitForSelector("[data-race-advance]:not([disabled])", { timeout: 8000 });
  const feedbackVisible = await page.evaluate(() => Boolean(document.querySelector(".feedback-card")));
  const advanced = await clickFirstEnabled(page, "[data-race-advance]:not([disabled])");
  await page.waitForFunction(() => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return document.querySelector("[data-race-option]:not([disabled])") || panelText.includes("Journey Summary");
  }, null, { timeout: 8000 });

  return page.evaluate(({ started: didStart, optionCount: initialOptionCount, answered: didAnswer, feedbackVisible: didShowFeedback, advanced: didAdvance }) => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return {
      started: didStart,
      optionCount: initialOptionCount,
      answered: didAnswer,
      feedbackVisible: didShowFeedback,
      advanced: didAdvance,
      nextQuestionReady: Boolean(document.querySelector("[data-race-option]:not([disabled])")),
      summaryVisible: panelText.includes("Journey Summary")
    };
  }, { started, optionCount, answered, feedbackVisible, advanced });
}

async function completeLocalRunFlow(page) {
  await activateAllSetupOptions(page, "[data-run-toggle-category]");
  const started = await clickFirstEnabled(page, "[data-run-start]:not([disabled])");
  await waitForModeStartOutcome(page, "[data-run-option]:not([disabled])");
  const unavailable = await readControlledUnavailableState(page);
  if (unavailable.routeUpdatePending || unavailable.completeLadderMessage) {
    return {
      started,
      controlledUnavailable: true,
      unavailable,
      optionCount: 0,
      answered: false,
      feedbackVisible: false,
      continued: false,
      nextQuestionReady: false,
      summaryVisible: false
    };
  }

  await page.waitForSelector("[data-run-option]:not([disabled])", { timeout: 8000 });
  const optionCount = await page.evaluate(() => document.querySelectorAll("[data-run-option]:not([disabled])").length);
  const answered = await clickFirstEnabled(page, "[data-run-option]:not([disabled])");
  await page.waitForSelector("[data-run-continue]:not([disabled])", { timeout: 8000 });
  const feedbackVisible = await page.evaluate(() => Boolean(document.querySelector(".feedback-card")));
  const continued = await clickFirstEnabled(page, "[data-run-continue]:not([disabled])");
  await page.waitForFunction(() => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return document.querySelector("[data-run-option]:not([disabled])") || panelText.includes("Journey Summary");
  }, null, { timeout: 8000 });

  return page.evaluate(({ started: didStart, optionCount: initialOptionCount, answered: didAnswer, feedbackVisible: didShowFeedback, continued: didContinue }) => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return {
      started: didStart,
      optionCount: initialOptionCount,
      answered: didAnswer,
      feedbackVisible: didShowFeedback,
      continued: didContinue,
      nextQuestionReady: Boolean(document.querySelector("[data-run-option]:not([disabled])")),
      summaryVisible: panelText.includes("Journey Summary")
    };
  }, { started, optionCount, answered, feedbackVisible, continued });
}

async function completeLocalRelayFlow(page) {
  await activateAllSetupOptions(page, "[data-relay-toggle-category]");
  const started = await clickFirstEnabled(page, "[data-relay-start]:not([disabled])");
  await waitForModeStartOutcome(page, "[data-relay-buzz]:not([disabled])");
  const unavailable = await readControlledUnavailableState(page);
  if (unavailable.routeUpdatePending || unavailable.completeLadderMessage) {
    return {
      started,
      controlledUnavailable: true,
      unavailable,
      buzzed: false,
      optionCount: 0,
      answered: false,
      feedbackVisible: false,
      continued: false,
      nextBuzzReady: false,
      finalStandingVisible: false
    };
  }

  await page.waitForSelector("[data-relay-buzz]:not([disabled])", { timeout: 8000 });
  const buzzed = await clickFirstEnabled(page, "[data-relay-buzz]:not([disabled])");
  await page.waitForSelector("[data-relay-option]:not([disabled])", { timeout: 8000 });
  const optionCount = await page.evaluate(() => document.querySelectorAll("[data-relay-option]:not([disabled])").length);
  const answered = await clickFirstEnabled(page, "[data-relay-option]:not([disabled])");
  await page.waitForSelector("[data-relay-continue]:not([disabled])", { timeout: 8000 });
  const feedbackVisible = await page.evaluate(() => Boolean(document.querySelector(".feedback-card")));
  const continued = await clickFirstEnabled(page, "[data-relay-continue]:not([disabled])");
  await page.waitForFunction(() => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return document.querySelector("[data-relay-buzz]:not([disabled])") || panelText.includes("Final Standing");
  }, null, { timeout: 8000 });

  return page.evaluate(({ started: didStart, buzzed: didBuzz, optionCount: initialOptionCount, answered: didAnswer, feedbackVisible: didShowFeedback, continued: didContinue }) => {
    const panelText = document.querySelector("#experiencePanel")?.textContent || "";
    return {
      started: didStart,
      buzzed: didBuzz,
      optionCount: initialOptionCount,
      answered: didAnswer,
      feedbackVisible: didShowFeedback,
      continued: didContinue,
      nextBuzzReady: Boolean(document.querySelector("[data-relay-buzz]:not([disabled])")),
      finalStandingVisible: panelText.includes("Final Standing")
    };
  }, { started, buzzed, optionCount, answered, feedbackVisible, continued });
}

async function completeLocalJumpFlow(page) {
  await activateAllSetupOptions(page, "[data-jump-toggle-category]");
  const started = await clickFirstEnabled(page, "[data-jump-start]:not([disabled])");
  await waitForModeStartOutcome(page, "[data-jump-stage]");
  const unavailable = await readControlledUnavailableState(page);
  if (unavailable.routeUpdatePending || unavailable.completeLadderMessage) {
    return {
      started,
      controlledUnavailable: true,
      unavailable,
      stageVisible: false,
      actionButtons: 0,
      jumped: false,
      ducked: false,
      runnerPresent: false,
      obstaclePresent: false
    };
  }

  await page.waitForSelector("[data-jump-stage]", { timeout: 8000 });
  const stageVisible = await page.evaluate(() => Boolean(document.querySelector("[data-jump-runner]") && document.querySelector("[data-jump-obstacle]")));
  const jumped = await clickFirstEnabled(page, '[data-jump-action="jump"]:not([disabled])');
  await page.waitForFunction(() => {
    return document.querySelector("[data-jump-runner]")?.dataset.jumpRunnerState === "jumping";
  }, null, { timeout: 3000 }).catch(() => {});
  const jumpedState = await page.evaluate(() => document.querySelector("[data-jump-runner]")?.dataset.jumpRunnerState || "");
  await page.waitForTimeout(700);
  const ducked = await clickFirstEnabled(page, '[data-jump-action="duck"]:not([disabled])');
  await page.waitForFunction(() => {
    return document.querySelector("[data-jump-runner]")?.dataset.jumpRunnerState === "ducking";
  }, null, { timeout: 3000 }).catch(() => {});
  const duckedState = await page.evaluate(() => document.querySelector("[data-jump-runner]")?.dataset.jumpRunnerState || "");

  return page.evaluate(({ started: didStart, stageVisible: didShowStage, jumped: didJump, jumpedState: afterJumpState, ducked: didDuck, duckedState: afterDuckState }) => ({
    started: didStart,
    stageVisible: didShowStage,
    actionButtons: document.querySelectorAll("[data-jump-action]").length,
    jumped: didJump,
    jumpedState: afterJumpState,
    ducked: didDuck,
    duckedState: afterDuckState,
    runnerPresent: Boolean(document.querySelector("[data-jump-runner]")),
    obstaclePresent: Boolean(document.querySelector("[data-jump-obstacle]"))
  }), { started, stageVisible, jumped, jumpedState, ducked, duckedState });
}

async function clickEnabledModeCard(page, sectionName, modeId) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await ensureSectionAndModeReady(page, sectionName, modeId);
    const clicked = await page.evaluate((targetModeId) => {
      const modeButton = document.querySelector(`[data-pick-mode="${targetModeId}"]:not([disabled])`);
      if (!modeButton) {
        return false;
      }
      modeButton.click();
      return true;
    }, modeId);

    if (clicked) {
      return;
    }

    await page.waitForTimeout(350);
  }

  const diagnostics = await page.evaluate((targetModeId) => {
    return [...document.querySelectorAll(`[data-pick-mode="${targetModeId}"]`)]
      .map((button) => ({
        path: button.dataset.pickModePath || button.closest("[data-mode-choice-path]")?.dataset.modeChoicePath || "",
        disabled: button.disabled,
        className: button.className,
        text: button.textContent?.replace(/\s+/g, " ").trim() || ""
      }));
  }, modeId);

  throw new Error(`Could not click enabled mode card for "${modeId}": ${JSON.stringify(diagnostics)}`);
}

async function ensureSectionAndModeReady(page, sectionName, modeId) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
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

    const ready = await page.waitForFunction(
      ({ targetSectionName, targetModeId }) => {
        const sectionSelected = [...document.querySelectorAll("[data-toggle-mode-section]")]
          .some((button) => (
            (button.dataset.sectionTitle || button.textContent || "").includes(targetSectionName)
            && button.getAttribute("aria-pressed") === "true"
          ));
        const boardHasSelection = Boolean(document.querySelector(".mode-choice-board.has-section-selection"));
        const modeButton = document.querySelector(`[data-pick-mode="${targetModeId}"]`);
        return sectionSelected && boardHasSelection && Boolean(modeButton && !modeButton.disabled);
      },
      { targetSectionName: sectionName, targetModeId: modeId },
      { timeout: 4000 }
    ).then(() => true).catch(() => false);

    if (ready) {
      return;
    }
  }

  const diagnostics = await page.evaluate(({ targetSectionName, targetModeId }) => {
    return {
      selectedSections: [...document.querySelectorAll("[data-toggle-mode-section]")]
        .filter((button) => button.getAttribute("aria-pressed") === "true")
        .map((button) => button.dataset.sectionTitle || button.textContent?.replace(/\s+/g, " ").trim() || ""),
      targetSectionButtons: [...document.querySelectorAll("[data-toggle-mode-section]")]
        .filter((button) => (button.dataset.sectionTitle || button.textContent || "").includes(targetSectionName))
        .map((button) => ({
          title: button.dataset.sectionTitle || button.textContent?.replace(/\s+/g, " ").trim() || "",
          pressed: button.getAttribute("aria-pressed"),
          disabled: button.disabled
        })),
      boardClass: document.querySelector(".mode-choice-board")?.className || "",
      modeButtons: [...document.querySelectorAll(`[data-pick-mode="${targetModeId}"]`)]
        .map((button) => ({
          path: button.dataset.pickModePath || button.closest("[data-mode-choice-path]")?.dataset.modeChoicePath || "",
          disabled: button.disabled,
          className: button.className
        }))
    };
  }, { targetSectionName: sectionName, targetModeId: modeId });

  throw new Error(`Route builder did not enable ${modeId}: ${JSON.stringify(diagnostics)}`);
}

async function chooseLocalRoute(page) {
  await page.waitForFunction(() => window.WSC_APP_READY === true, null, { timeout: 60000 });

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

async function main() {
  const { chromium } = loadPlaywright();
  const server = spawn("python3", ["-m", "http.server", String(PORT)], {
    cwd: APP_DIR,
    stdio: "ignore"
  });

  try {
    await waitForServer(`${BASE_URL}/index.html`);

    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROME_PATH || (fs.existsSync(DEFAULT_CHROME_PATH) ? DEFAULT_CHROME_PATH : undefined)
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const messages = [];
    page.on("console", (message) => messages.push({ type: message.type(), text: message.text() }));
    page.on("pageerror", (error) => messages.push({ type: "pageerror", text: error.message }));

    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector("#routeBuilder", { timeout: 30000 });
    const boot = await page.evaluate(() => {
      const raw = window.WSC_RAW_CONTENT_BANK || {};
      let entries = 0;
      let quiz = 0;
      let legacy = 0;
      let v3 = 0;
      for (const section of Object.values(raw.sections || {})) {
        entries += (section.entries || []).length;
        for (const entry of section.entries || []) {
          quiz += (entry.quizQuestions || []).length;
          legacy += (entry.legacyQuizQuestions || []).length;
          v3 += (entry.v3QuestionGroups || []).length;
        }
      }
      return {
        appReady: Boolean(window.WSC_APP_READY),
        dataSections: window.WSC_DATA?.sections?.length || 0,
        rawSections: Object.keys(raw.sections || {}).length,
        entries,
        quiz,
        legacy,
        v3,
        rawEntryOverrides: Object.keys(window.WSC_RAW_CONTENT_OVERRIDES?.entryOverrides || {}).length,
        rawSectionOverrides: Object.keys(window.WSC_RAW_CONTENT_OVERRIDES?.sectionOverrides || {}).length,
        videos: window.WSC_ALPACA_CHANNEL?.videos?.length || 0,
        alpacards: Array.isArray(window.WSC_ALPACARDS) ? window.WSC_ALPACARDS.length : 0,
        engines: {
          alpaquiz: Boolean(window.WSC_ALPAQUIZ_ENGINE?.buildQuestionPlan),
          alpaquizPatternLength: window.WSC_ALPAQUIZ_ENGINE?.getQuestionPattern?.(7, [1, 2, 3]).length || 0,
          alpacapardy: Boolean(window.WSC_ALPACAPARDY_ENGINE?.buildConfiguredBoard),
          alpacapardyStandingsLeader: window.WSC_ALPACAPARDY_ENGINE?.getStandings?.([
            { label: "A", score: 100, correct: 1, wrong: 0 },
            { label: "B", score: 200, correct: 1, wrong: 0 }
          ])?.[0]?.label || "",
          liveSession: Boolean(window.WSC_LIVE_SESSION_SERVICE?.createSession),
          liveSupportedGames: window.WSC_LIVE_SESSION_SERVICE?.supportedGames || [],
          liveSnapshotRevision: (() => {
            const service = window.WSC_LIVE_SESSION_SERVICE;
            if (!service?.createSession) {
              return -1;
            }
            const session = service.appendEvent(
              service.addPlayer(
                service.createSession({ gameType: "alpacapardy", hostPlayerId: "p1" }),
                service.createPlayer({ id: "p1", displayName: "Host Alpaca" })
              ),
              { type: "test.event", playerId: "p1" }
            );
            return service.getPublicSnapshot(session).revision;
          })(),
          alpacapardyRenderer: Boolean(window.WSC_ALPACAPARDY_RENDERER?.renderExperience),
          alpacapardyLiveReducer: (() => {
            const live = window.WSC_ALPACAPARDY_LIVE;
            if (!live?.reduce) {
              return false;
            }
            const state = live.reduce(live.createState(), live.createBoardStartedEvent({
              teams: [{ id: "team-1", label: "Team One", score: 0, correct: 0, wrong: 0 }],
              board: [{
                label: "Test",
                tiles: [{
                  value: 100,
                  done: false,
                  result: null,
                  teamIndex: null,
                  question: {
                    id: "q1",
                    answerIndex: 0,
                    sectionId: "introductory-questions",
                    subjectIds: [],
                    bigIdeaIds: []
                  }
                }]
              }]
            }));
            const opened = live.reduce(state, live.createTileOpenedEvent({
              groupIndex: 0,
              tileIndex: 0,
              teamIndex: 0,
              answerTime: 30
            }));
            const answered = live.reduce(opened, live.createTileAnsweredEvent({ optionIndex: 0 }));
            return answered.board[0].tiles[0].done === true && answered.teams[0].score === 100;
          })(),
          alpacapardySupabaseService: Boolean(window.WSC_ALPACAPARDY_LIVE_SUPABASE_SERVICE?.createRoomCode),
          authRenderer: Boolean(window.WSC_AUTH_MODAL_RENDERER?.renderModal),
          wizardRenderer: Boolean(window.WSC_WIZARD_RENDERER?.renderWizard),
          mindMapMode: Boolean(window.WSC_MINDMAP_MODE?.renderExperience),
          regularGuideMode: Boolean(window.WSC_REGULAR_GUIDE_MODE?.renderExperience)
        }
      };
    });

    const rawContent = await runModeSmoke(page, "We Are All in This to Get There", "rawcontent", "Raw Content");
    const rawOverrideContent = await runModeSmoke(page, "The End is Nearish", "rawcontent", "When Power Is Supposed to Be Temporary");
    const alpacards = await runModeSmoke(page, "We Are All in This to Get There", "alpacard", "Alpacard");
    const channel = await runModeSmoke(page, "We Are All in This to Get There", "channel", "Alpaca Channel");
    const quiz = await runModeSmoke(page, "We Are All in This to Get There", "quiz", "Scholar's Challenge");
    const race = await runModeSmoke(page, "We Are All in This to Get There", "race", "Survivalpaca");
    const run = await runModeSmoke(page, "We Are All in This to Get There", "run", "Alpaca Run");
    const relay = await runModeSmoke(page, "We Are All in This to Get There", "relay", "Alpaquiz");
    const jump = await runModeSmoke(page, "We Are All in This to Get There", "jump", "Alpaca Jump");
    const alpacapardy = await runModeSmoke(page, "We Are All in This to Get There", "jeopardy", "Alpacapardy");
    const unavailableTrainModes = await checkUnavailableTrainModeCards(page);

    await browser.close();

    const severeConsoleMessages = messages.filter((message) =>
      ["error", "pageerror"].includes(message.type) &&
      !message.text.includes("Failed to load resource") &&
      // Chrome can emit this intermittently from browser/iframe internals during
      // headless runs; it is not produced by the WSC app code.
      message.text !== "Permissions policy violation: compute-pressure is not allowed in this document."
    );

    const result = {
      boot,
      modes: {
        rawContent,
        rawOverrideContent,
        alpacards,
        channel,
        quiz,
        race,
        run,
        relay,
        jump,
        alpacapardy
      },
      unavailableTrainModes,
      severeConsoleMessages
    };

    console.log(JSON.stringify(result, null, 2));

    const failures = [];
    if (!boot.appReady || boot.dataSections !== 15 || boot.rawSections !== 15 || boot.entries !== 107 || boot.quiz !== 214) {
      failures.push("boot counts did not match expected generated runtime values");
    }
    if (!boot.engines.alpaquiz || boot.engines.alpaquizPatternLength !== 7) {
      failures.push("Alpaquiz engine did not load or return the expected question pattern");
    }
    if (!boot.engines.alpacapardy || boot.engines.alpacapardyStandingsLeader !== "B") {
      failures.push("Alpacapardy engine did not load or sort standings correctly");
    }
    if (!boot.engines.liveSession || boot.engines.liveSnapshotRevision !== 1) {
      failures.push("live session service did not load or create a valid snapshot");
    }
    const expectedLiveGames = ["alpacapardy", "run", "quiz", "race", "alpaquiz"];
    if (JSON.stringify(boot.engines.liveSupportedGames) !== JSON.stringify(expectedLiveGames)) {
      failures.push(`live session service should support ${expectedLiveGames.join(", ")}`);
    }
    if (!boot.engines.alpacapardyRenderer || !boot.engines.alpacapardyLiveReducer || !boot.engines.alpacapardySupabaseService) {
      failures.push("Alpacapardy renderer/live/Supabase bridge did not load correctly");
    }
    if (!boot.engines.authRenderer || !boot.engines.wizardRenderer || !boot.engines.mindMapMode || !boot.engines.regularGuideMode) {
      failures.push("extracted UI/learn mode modules did not load correctly");
    }
    if (boot.legacy !== 0 || boot.v3 !== 0) {
      failures.push("generated runtime still contains legacy question arrays");
    }
    if (boot.rawEntryOverrides !== 14 || boot.rawSectionOverrides !== 1) {
      failures.push("raw content overrides did not load with expected counts");
    }
    if (rawContent.rawCards < 1) {
      failures.push("raw content smoke check did not render raw cards");
    }
    if (alpacards.alpacardImages < 1) {
      failures.push("alpacards smoke check did not render an alpacard image");
    }
    if (alpacapardy.jeopardyControls < 1) {
      failures.push("Alpacapardy smoke check did not render setup or board controls");
    }
    if (
      !alpacapardy.alpacapardyFlow?.boardStarted ||
      !alpacapardy.alpacapardyFlow?.focusOpened ||
      !alpacapardy.alpacapardyFlow?.answered ||
      !alpacapardy.alpacapardyFlow?.returnedToBoard ||
      alpacapardy.alpacapardyFlow.doneTiles < 1
    ) {
      failures.push("Alpacapardy local flow did not start, open a tile, answer, and return to the board");
    }
    if (
      !quiz.quizFlow?.controlledUnavailable &&
      (
        quiz.quizFlow?.questionCount < 1 ||
        quiz.quizFlow?.answeredCount !== quiz.quizFlow?.questionCount ||
        !quiz.quizFlow?.submitted ||
        !quiz.quizFlow?.resultsVisible ||
        !quiz.quizFlow?.resetVisible
      )
    ) {
      failures.push("Quiz local flow was neither cleanly unavailable nor playable through submit/results");
    }
    if (
      !race.raceFlow?.controlledUnavailable &&
      (
        !race.raceFlow?.started ||
        race.raceFlow.optionCount < 2 ||
        !race.raceFlow?.answered ||
        !race.raceFlow?.feedbackVisible ||
        !race.raceFlow?.advanced ||
        (!race.raceFlow?.nextQuestionReady && !race.raceFlow?.summaryVisible)
      )
    ) {
      failures.push("Race local flow was neither cleanly unavailable nor playable through feedback/advance");
    }
    if (
      !run.runFlow?.controlledUnavailable &&
      (
        !run.runFlow?.started ||
        run.runFlow.optionCount < 2 ||
        !run.runFlow?.answered ||
        !run.runFlow?.feedbackVisible ||
        !run.runFlow?.continued ||
        (!run.runFlow?.nextQuestionReady && !run.runFlow?.summaryVisible)
      )
    ) {
      failures.push("Run local flow was neither cleanly unavailable nor playable through feedback/continue");
    }
    if (
      !relay.relayFlow?.controlledUnavailable &&
      (
        !relay.relayFlow?.started ||
        !relay.relayFlow?.buzzed ||
        relay.relayFlow.optionCount < 2 ||
        !relay.relayFlow?.answered ||
        !relay.relayFlow?.feedbackVisible ||
        !relay.relayFlow?.continued ||
        (!relay.relayFlow?.nextBuzzReady && !relay.relayFlow?.finalStandingVisible)
      )
    ) {
      failures.push("Relay local flow was neither cleanly unavailable nor playable through buzz/feedback/continue");
    }
    if (
      !jump.jumpFlow?.controlledUnavailable &&
      (
        !jump.jumpFlow?.started ||
        !jump.jumpFlow?.stageVisible ||
        jump.jumpFlow.actionButtons < 2 ||
        !jump.jumpFlow?.jumped ||
        !jump.jumpFlow?.ducked ||
        !jump.jumpFlow?.runnerPresent ||
        !jump.jumpFlow?.obstaclePresent
      )
    ) {
      failures.push("Jump local flow was neither cleanly unavailable nor responsive to jump/duck actions");
    }
    for (const [modeId, card] of Object.entries(unavailableTrainModes)) {
      if (!card.present || !card.disabled || !card.unavailableClass || !card.title.includes("available soon")) {
        failures.push(`${modeId} public train card is not clearly disabled/unavailable`);
      }
    }
    for (const [mode, check] of Object.entries(result.modes)) {
      if (check.experienceHidden || !check.containsExpectedText) {
        failures.push(`${mode} smoke check did not render expected text`);
      }
    }
    if (severeConsoleMessages.length) {
      failures.push("browser console had severe messages");
    }

    if (failures.length) {
      console.error(`Smoke test failed:\n- ${failures.join("\n- ")}`);
      process.exit(1);
    }
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
