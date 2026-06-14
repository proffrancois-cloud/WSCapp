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
  const require = createRequire(import.meta.url);
  try {
    return require("playwright");
  } catch (_error) {
    const cached = findCachedPlaywright();
    if (cached) {
      return require(cached);
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

  return page.evaluate((text) => {
    const panel = document.querySelector("#experiencePanel");
    const panelText = panel?.textContent?.replace(/\s+/g, " ").trim() || "";
    return {
      experienceHidden: panel?.classList.contains("hidden") ?? true,
      containsExpectedText: panelText.includes(text),
      panelText: panelText.slice(0, 240),
      rawCards: document.querySelectorAll(".raw-content-card, .raw-entry-card, [data-raw-entry]").length,
      alpacardImages: document.querySelectorAll(".alpacard-image").length,
      channelCards: document.querySelectorAll(".channel-card, .alpaca-channel-card, [data-channel-video]").length,
      jeopardyControls: document.querySelectorAll("[data-jeopardy-start], [data-jeopardy-open], [data-jeopardy-toggle-category]").length
    };
  }, expectedText);
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
    const alpacards = await runModeSmoke(page, "We Are All in This to Get There", "alpacard", "Alpacard");
    const channel = await runModeSmoke(page, "We Are All in This to Get There", "channel", "Alpaca Channel");
    const quiz = await runModeSmoke(page, "We Are All in This to Get There", "quiz", "Scholar's Challenge");
    const alpacapardy = await runModeSmoke(page, "We Are All in This to Get There", "jeopardy", "Alpacapardy");

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
        alpacards,
        channel,
        quiz,
        alpacapardy
      },
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
    if (rawContent.rawCards < 1) {
      failures.push("raw content smoke check did not render raw cards");
    }
    if (alpacards.alpacardImages < 1) {
      failures.push("alpacards smoke check did not render an alpacard image");
    }
    if (alpacapardy.jeopardyControls < 1) {
      failures.push("Alpacapardy smoke check did not render setup or board controls");
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
