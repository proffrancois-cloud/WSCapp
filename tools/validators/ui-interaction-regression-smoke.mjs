import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const APP_DIR = path.join(ROOT, "app");
const DEFAULT_PORT = Number(process.env.WSC_UI_REGRESSION_PORT || 4199);
const EXTERNAL_BASE_URL = String(process.env.WSC_UI_REGRESSION_BASE_URL || "").replace(/\/$/, "");
const BASE_URL = EXTERNAL_BASE_URL || `http://localhost:${DEFAULT_PORT}`;
const DEFAULT_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const REQUIRE_BROWSER = process.env.WSC_UI_REGRESSION_REQUIRE_BROWSER !== "0";

function readAppFile(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function collectStaticChecks() {
  const indexHtml = readAppFile("app/index.html");
  const appMain = readAppFile("app/src/app/app-main.js");
  const settingsController = readAppFile("app/src/app/app-settings-controller.js");
  const deviceController = readAppFile("app/src/app/device-presentation-controller.js");
  const wizardRenderer = readAppFile("app/src/ui/wizard-renderer.js");
  const responsiveCss = readAppFile("app/styles-responsive-devices.css");
  const entryRendererStart = appMain.indexOf("function renderAppEntryGate()");
  const entryRendererEnd = appMain.indexOf("function renderAppEntryGuestPrompt()", entryRendererStart);
  const entryRenderer = appMain.slice(entryRendererStart, entryRendererEnd);

  return [
    {
      id: "entry-choices-before-auth",
      pass: entryRenderer.indexOf("app-entry-choice-grid") >= 0
        && entryRenderer.indexOf("${renderAppEntryAuthPanel()}") > entryRenderer.indexOf("app-entry-choice-grid"),
      detail: "The entry renderer places Local/Online choices before the account panel."
    },
    {
      id: "closed-hero-items-inert-at-boot",
      pass: /class="hero-link-icon hero-resources-icon"[\s\S]{0,160}\binert\b[\s\S]{0,80}aria-hidden="true"[\s\S]{0,160}data-open-resources/.test(indexHtml)
        && (indexHtml.match(/\binert\b/g) || []).length >= 5,
      detail: "Closed header controls have inert/aria-hidden boot markup."
    },
    {
      id: "hero-menu-inert-sync",
      pass: appMain.includes("item.toggleAttribute(\"inert\", !isOpen)")
        && appMain.includes("item.setAttribute(\"aria-hidden\", isOpen ? \"false\" : \"true\")"),
      detail: "Opening and closing the header menu synchronizes inert and aria-hidden."
    },
    {
      id: "resources-bottom-close-branch",
      pass: appMain.includes("closeResources.tagName === \"BUTTON\""),
      detail: "The Resources event branch accepts the bottom Close button inside the dialog window."
    },
    {
      id: "volume-control-updates-in-place",
      pass: settingsController.includes("function syncRenderedControls()")
        && settingsController.includes("if (options.render === false)")
        && appMain.includes("updateSharedAppSettings({")
        && appMain.includes("}, { render: false })"),
      detail: "Range input updates use the in-place settings path instead of replacing the modal."
    },
    {
      id: "settings-account-action",
      pass: settingsController.includes("data-app-settings-account")
        && settingsController.includes('account.signedIn ? "Log out" : "Log in"')
        && appMain.includes("handleAppSettingsAccountAction()"),
      detail: "The app settings panel exposes the current Alpaccount login or logout action."
    },
    {
      id: "portrait-continue-control",
      pass: deviceController.includes("data-orientation-continue-portrait")
        && deviceController.includes("portraitPresentationAllowed = true")
        && deviceController.includes("is-touch-portrait"),
      detail: "Portrait users can explicitly continue and receive the portrait presentation class."
    },
    {
      id: "closed-mode-grids-inert",
      pass: wizardRenderer.includes('aria-hidden="${isOpen ? "false" : "true"}" ${isOpen ? "" : "inert"}'),
      detail: "Collapsed mode grids are excluded from accessibility and keyboard navigation."
    },
    {
      id: "portrait-mode-card-grid",
      pass: responsiveCss.includes("@media (orientation: portrait) and (max-width: 760px)")
        && responsiveCss.includes("grid-template-columns: repeat(2, minmax(0, 1fr)) !important")
        && responsiveCss.includes("pointer-events: auto !important"),
      detail: "The narrow portrait fallback exposes mode cards in a two-column interactive grid."
    }
  ];
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
  for (let attempt = 0; attempt < 60; attempt += 1) {
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
  throw new Error("Playwright is not available.");
}

function visibleRatio(rect, viewport) {
  if (!rect || rect.width <= 0 || rect.height <= 0) {
    return 0;
  }
  const visibleWidth = Math.max(0, Math.min(rect.x + rect.width, viewport.width) - Math.max(rect.x, 0));
  const visibleHeight = Math.max(0, Math.min(rect.y + rect.height, viewport.height) - Math.max(rect.y, 0));
  return (visibleWidth * visibleHeight) / (rect.width * rect.height);
}

async function waitForAppReady(page) {
  await page.waitForSelector("[data-app-entry-choice='local']", { state: "attached", timeout: 45000 });
  await page.waitForFunction(() => {
    const local = document.querySelector("[data-app-entry-choice='local']");
    const online = document.querySelector("[data-app-entry-choice='online']");
    return Boolean(local && online && local.getBoundingClientRect().width && online.getBoundingClientRect().width);
  }, null, { timeout: 45000 });
}

async function runRuntimeChecks(chromium) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || (fs.existsSync(DEFAULT_CHROME_PATH) ? DEFAULT_CHROME_PATH : undefined)
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    screen: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce"
  });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(String(error?.message || error)));
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  await page.route("**/*", async (route) => {
    const requestUrl = new URL(route.request().url());
    const base = new URL(BASE_URL);
    if (requestUrl.origin !== base.origin) {
      await route.abort();
      return;
    }
    if (["image", "media", "font"].includes(route.request().resourceType())) {
      await route.abort();
      return;
    }
    await route.continue();
  });

  const checks = [];
  const record = (id, pass, detail) => checks.push({ id, pass: Boolean(pass), detail });

  try {
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: "domcontentloaded", timeout: 45000 });
    await waitForAppReady(page);

    const orientationGate = page.locator("[data-orientation-continue-portrait]");
    const orientationGateSeen = await orientationGate.isVisible().catch(() => false);
    if (orientationGateSeen) {
      await orientationGate.click();
      await page.waitForFunction(() => document.getElementById("orientationGateMount")?.hidden === true, null, { timeout: 10000 });
    }
    const portraitState = await page.evaluate(() => ({
      gateHidden: document.getElementById("orientationGateMount")?.hidden === true,
      portraitClass: document.body.classList.contains("is-touch-portrait")
    }));
    record(
      "portrait-gate",
      !orientationGateSeen || (portraitState.gateHidden && portraitState.portraitClass),
      { orientationGateSeen, ...portraitState }
    );

    const entryLayout = await page.evaluate(() => {
      const serialize = (selector) => {
        const element = document.querySelector(selector);
        if (!element) {
          return null;
        }
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          bottom: rect.bottom,
          display: style.display,
          visibility: style.visibility,
          opacity: Number(style.opacity)
        };
      };
      return {
        local: serialize("[data-app-entry-choice='local']"),
        online: serialize("[data-app-entry-choice='online']"),
        auth: serialize(".app-entry-auth-panel"),
        active: document.activeElement?.getAttribute("data-app-entry-choice") || document.activeElement?.tagName || ""
      };
    });
    const localRatio = visibleRatio(entryLayout.local, { width: 390, height: 844 });
    const onlineRatio = visibleRatio(entryLayout.online, { width: 390, height: 844 });
    const choicesBeforeAuth = entryLayout.auth
      && Math.max(entryLayout.local?.bottom || Infinity, entryLayout.online?.bottom || Infinity) <= entryLayout.auth.y + 1;
    record(
      "entry-choice-order-and-visibility",
      localRatio >= 0.9 && onlineRatio >= 0.9 && choicesBeforeAuth,
      { localRatio, onlineRatio, choicesBeforeAuth, layout: entryLayout }
    );

    await page.locator("[data-app-entry-choice='local']").click();
    await page.waitForFunction(() => !document.querySelector(".app-entry-gate-overlay"), null, { timeout: 30000 });
    await page.locator("[data-close-cooperation]").first().click({ timeout: 1500 }).catch(() => {});
    await page.waitForFunction(() => !document.querySelector('[role="dialog"][aria-modal="true"]'), null, { timeout: 15000 });

    const closedMenu = await page.evaluate(() => {
      const menu = document.querySelector(".hero-links");
      const trigger = menu?.querySelector("[data-toggle-hero-menu]");
      const items = [...(menu?.children || [])].filter((item) => item !== trigger);
      return {
        expanded: trigger?.getAttribute("aria-expanded"),
        openClass: menu?.classList.contains("is-open"),
        items: items.map((item) => ({
          tag: item.tagName,
          inert: item.inert,
          ariaHidden: item.getAttribute("aria-hidden")
        }))
      };
    });
    record(
      "closed-hero-menu-is-inert",
      closedMenu.expanded === "false"
        && !closedMenu.openClass
        && closedMenu.items.length >= 5
        && closedMenu.items.every((item) => item.inert && item.ariaHidden === "true"),
      closedMenu
    );

    await page.locator("[data-toggle-hero-menu]").click();
    await page.waitForFunction(() => document.querySelector(".hero-links")?.classList.contains("is-open"));
    const openMenu = await page.evaluate(() => {
      const menu = document.querySelector(".hero-links");
      const trigger = menu?.querySelector("[data-toggle-hero-menu]");
      const items = [...(menu?.children || [])].filter((item) => item !== trigger);
      return {
        expanded: trigger?.getAttribute("aria-expanded"),
        items: items.map((item) => ({ inert: item.inert, ariaHidden: item.getAttribute("aria-hidden") }))
      };
    });
    record(
      "open-hero-menu-is-accessible",
      openMenu.expanded === "true"
        && openMenu.items.length >= 5
        && openMenu.items.every((item) => !item.inert && item.ariaHidden === "false"),
      openMenu
    );

    await page.locator("[data-open-resources]").click();
    await page.waitForSelector("#resourcesModalMount [role='dialog']", { state: "visible" });
    const bottomResourcesClose = page.locator("#resourcesModalMount .panel-actions [data-close-resources]");
    await bottomResourcesClose.click();
    await page.waitForFunction(() => !document.querySelector("#resourcesModalMount [role='dialog']"));
    await page.waitForFunction(() => document.activeElement?.matches?.("[data-toggle-hero-menu]"), null, { timeout: 3000 });
    const resourcesClosed = await page.evaluate(() => ({
      modalPresent: Boolean(document.querySelector("#resourcesModalMount [role='dialog']")),
      triggerFocused: document.activeElement?.matches?.("[data-toggle-hero-menu]") || false
    }));
    record("resources-bottom-close", !resourcesClosed.modalPresent && resourcesClosed.triggerFocused, resourcesClosed);

    await page.locator("[data-toggle-hero-menu]").click();
    await page.locator("[data-open-campus-settings]").click();
    await page.waitForSelector("[data-app-settings-volume]", { state: "visible" });
    const sliderResult = await page.evaluate(async () => {
      const slider = document.querySelector("[data-app-settings-volume]");
      slider.dataset.regressionNode = "stable";
      slider.focus();
      slider.value = "51";
      slider.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const current = document.querySelector("[data-app-settings-volume]");
      return {
        sameNode: current === slider && current?.dataset.regressionNode === "stable",
        focused: document.activeElement === current,
        value: current?.value,
        label: document.querySelector("[data-app-settings-volume-value]")?.textContent?.trim(),
        accountAction: document.querySelector("[data-app-settings-account]")?.textContent?.trim(),
        accountStatus: document.querySelector(".app-settings-account-status")?.textContent?.trim()
      };
    });
    record(
      "volume-slider-node-and-focus",
      sliderResult.sameNode && sliderResult.focused && sliderResult.value === "51" && sliderResult.label === "51%",
      sliderResult
    );
    record(
      "settings-account-action",
      sliderResult.accountAction === "Log in" && sliderResult.accountStatus === "Guest",
      { action: sliderResult.accountAction, status: sliderResult.accountStatus }
    );
    await page.locator("[data-app-settings-account]").click();
    await page.waitForSelector("[data-close-auth]", { state: "visible" });
    const accountLoginResult = await page.evaluate(() => ({
      settingsClosed: !document.querySelector("[data-app-settings-overlay]"),
      authOpen: Boolean(document.querySelector("[data-close-auth]")),
      authMode: document.querySelector("[data-auth-mode='login']")?.getAttribute("aria-pressed") || ""
    }));
    record(
      "settings-login-opens-auth",
      accountLoginResult.settingsClosed && accountLoginResult.authOpen,
      accountLoginResult
    );
    await page.locator("[data-close-auth]").first().click();
    await page.waitForFunction(() => !document.querySelector("[data-close-auth]"));

    const firstSection = page.locator("[data-toggle-mode-section]").first();
    await firstSection.scrollIntoViewIfNeeded();
    await firstSection.click();
    await page.waitForFunction(() => document.querySelector("[data-toggle-mode-section][aria-pressed='true']"));
    await page.locator("[data-toggle-mode-menu='learn']").click();
    await page.waitForFunction(() => {
      const column = document.querySelector(".mode-choice-column-learn");
      const grid = column?.querySelector(".mode-choice-card-grid");
      return Boolean(
        column
        && (column.classList.contains("is-open") || column.classList.contains("is-opening") || column.classList.contains("is-targeting"))
        && grid?.getAttribute("aria-hidden") === "false"
        && !grid.inert
      );
    }, null, { timeout: 10000 });
    await page.locator(".mode-choice-column-learn .mode-choice-card-grid").scrollIntoViewIfNeeded();
    const portraitModes = await page.evaluate(() => {
      const board = document.querySelector(".mode-choice-board");
      const column = document.querySelector(".mode-choice-column-learn");
      const trigger = column?.querySelector("[data-toggle-mode-menu='learn']");
      const grid = column?.querySelector(".mode-choice-card-grid");
      const cards = [...(grid?.querySelectorAll("[data-pick-mode]") || [])];
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const details = cards.map((card) => {
        const rect = card.getBoundingClientRect();
        const style = getComputedStyle(card);
        const x = Math.max(0, Math.min(viewport.width - 1, rect.left + rect.width / 2));
        const y = Math.max(0, Math.min(viewport.height - 1, rect.top + rect.height / 2));
        const hit = document.elementFromPoint(x, y);
        const visibleWidth = Math.max(0, Math.min(rect.right, viewport.width) - Math.max(rect.left, 0));
        const visibleHeight = Math.max(0, Math.min(rect.bottom, viewport.height) - Math.max(rect.top, 0));
        const ratio = rect.width && rect.height ? (visibleWidth * visibleHeight) / (rect.width * rect.height) : 0;
        return {
          mode: card.getAttribute("data-pick-mode"),
          width: rect.width,
          height: rect.height,
          ratio,
          opacity: Number(style.opacity),
          pointerEvents: style.pointerEvents,
          hitTestable: Boolean(hit && (hit === card || card.contains(hit)))
        };
      });
      return {
        portraitClass: document.body.classList.contains("is-touch-portrait"),
        boardWidth: board?.getBoundingClientRect().width || 0,
        viewportWidth: viewport.width,
        triggerLabel: trigger?.getAttribute("aria-label"),
        triggerExpanded: trigger?.getAttribute("aria-expanded"),
        ariaHidden: grid?.getAttribute("aria-hidden"),
        inert: Boolean(grid?.inert),
        details
      };
    });
    const visibleCards = portraitModes.details.filter((card) => (
      card.width > 40
      && card.height > 40
      && card.ratio >= 0.5
      && card.opacity >= 0.9
      && card.pointerEvents !== "none"
      && card.hitTestable
    ));
    const expectedCardMaxWidth = portraitModes.boardWidth / 2 + 10;
    record(
      "portrait-hub-and-mode-cards",
      portraitModes.portraitClass
        && portraitModes.boardWidth <= portraitModes.viewportWidth + 1
        && portraitModes.triggerLabel === "Close Learn menu"
        && portraitModes.triggerExpanded === "true"
        && portraitModes.ariaHidden === "false"
        && !portraitModes.inert
        && portraitModes.details.length >= 5
        && portraitModes.details.every((card) => card.width <= expectedCardMaxWidth)
        && visibleCards.length >= 2,
      { ...portraitModes, expectedCardMaxWidth, visibleCardCount: visibleCards.length }
    );

    const relevantConsoleErrors = consoleErrors.filter((message) => (
      !message.includes("Failed to load resource")
      && !message.includes("ERR_FAILED")
      && !message.includes("net::ERR")
    ));
    record(
      "runtime-errors",
      pageErrors.length === 0 && relevantConsoleErrors.length === 0,
      { pageErrors, consoleErrors: relevantConsoleErrors }
    );

    return checks;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  const staticChecks = collectStaticChecks();
  let server = null;
  let runtimeChecks = [];
  let runtime = { status: "not-run", reason: "" };

  try {
    if (!EXTERNAL_BASE_URL) {
      server = spawn("python3", ["-m", "http.server", String(DEFAULT_PORT)], {
        cwd: APP_DIR,
        stdio: "ignore"
      });
    }
    await waitForServer(`${BASE_URL}/index.html`);
    const { chromium } = loadPlaywright();
    runtimeChecks = await runRuntimeChecks(chromium);
    runtime = { status: "passed", reason: "" };
  } catch (error) {
    runtime = {
      status: "unavailable",
      reason: String(error?.stack || error)
    };
  } finally {
    server?.kill("SIGTERM");
  }

  const failedStaticChecks = staticChecks.filter((check) => !check.pass);
  const failedRuntimeChecks = runtimeChecks.filter((check) => !check.pass);
  const failures = [
    ...failedStaticChecks.map((check) => `static:${check.id}`),
    ...failedRuntimeChecks.map((check) => `runtime:${check.id}`)
  ];
  if (runtime.status !== "passed" && REQUIRE_BROWSER) {
    failures.push("runtime:browser-required-but-unavailable");
  }

  console.log(JSON.stringify({
    baseUrl: BASE_URL,
    serverMode: EXTERNAL_BASE_URL ? "external" : "spawned",
    viewport: { width: 390, height: 844, hasTouch: true, isMobile: true },
    staticChecks,
    runtime,
    runtimeChecks,
    failures
  }, null, 2));

  if (failures.length) {
    process.exitCode = 1;
  }
}

await main();
