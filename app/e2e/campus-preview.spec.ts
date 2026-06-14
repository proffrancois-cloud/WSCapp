import { expect, test, type Page, type TestInfo } from "@playwright/test";

const campusRoute = "alpaca-campus-3d/?mode=multiplayer";
const localAssetPattern = /\.(?:css|glb|jpe?g|js|png|webp)$/i;
const requiredCoreAssetTypes = new Set([".css", ".glb", ".js"]);
const textureAssetTypes = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function getAssetType(urlString: string) {
  const pathname = new URL(urlString).pathname;
  const match = pathname.match(/\.[^.]+$/);
  return match ? match[0].toLowerCase() : "";
}

async function attachScreenshot(page: Page, testInfo: TestInfo, name: string) {
  try {
    await testInfo.attach(name, {
      body: await page.screenshot({ fullPage: true, timeout: 5_000 }),
      contentType: "image/png"
    });
  } catch (error) {
    await testInfo.attach(`${name}-unavailable`, {
      body: String(error),
      contentType: "text/plain"
    });
  }
}

async function attachFailureScreenshots(page: Page, testInfo: TestInfo) {
  await attachScreenshot(page, testInfo, `${testInfo.project.name}-failure`);

  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(campusRoute, { waitUntil: "domcontentloaded", timeout: 10_000 });
    await page.waitForTimeout(1_000);
    await attachScreenshot(page, testInfo, "mobile-390-failure");
  } catch (error) {
    await testInfo.attach("mobile-390-failure-unavailable", {
      body: String(error),
      contentType: "text/plain"
    });
  }
}

async function getCampusSceneHealth(page: Page) {
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible({ timeout: 30_000 });

  const deadline = Date.now() + 30_000;
  let latestHealth = await page.evaluate(() => {
    const campusWindow = window as Window & {
      WSC_CAMPUS_3D_FRAME_COUNT?: number;
      WSC_CAMPUS_3D_READY?: boolean;
    };
    const element = document.querySelector("canvas");
    const root = document.getElementById("alpaca-campus-3d-root");

    return {
      ready: Boolean(campusWindow.WSC_CAMPUS_3D_READY),
      frameCount: Number(campusWindow.WSC_CAMPUS_3D_FRAME_COUNT || 0),
      rootReady: root?.getAttribute("data-campus-ready") === "true",
      canvasCount: document.querySelectorAll("canvas").length,
      width: element instanceof HTMLCanvasElement ? element.width : 0,
      height: element instanceof HTMLCanvasElement ? element.height : 0
    };
  });

  while (
    (!latestHealth.ready || !latestHealth.rootReady || latestHealth.canvasCount < 1 || latestHealth.width < 1 || latestHealth.height < 1)
    && Date.now() < deadline
  ) {
    await page.waitForTimeout(250);
    latestHealth = await page.evaluate(() => {
      const campusWindow = window as Window & {
        WSC_CAMPUS_3D_FRAME_COUNT?: number;
        WSC_CAMPUS_3D_READY?: boolean;
      };
      const element = document.querySelector("canvas");
      const root = document.getElementById("alpaca-campus-3d-root");

      return {
        ready: Boolean(campusWindow.WSC_CAMPUS_3D_READY),
        frameCount: Number(campusWindow.WSC_CAMPUS_3D_FRAME_COUNT || 0),
        rootReady: root?.getAttribute("data-campus-ready") === "true",
        canvasCount: document.querySelectorAll("canvas").length,
        width: element instanceof HTMLCanvasElement ? element.width : 0,
        height: element instanceof HTMLCanvasElement ? element.height : 0
      };
    });
  }

  return latestHealth;
}

test("3D campus preview loads a rendered canvas and local assets", async ({ page }, testInfo) => {
  test.setTimeout(90_000);

  const failedLocalAssets: string[] = [];
  const loadedAssetTypes = new Set<string>();
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("response", (response) => {
    const url = response.url();
    const parsedUrl = new URL(url);
    if (!parsedUrl.pathname.startsWith("/WSCapp/") || !localAssetPattern.test(parsedUrl.pathname)) {
      return;
    }

    loadedAssetTypes.add(getAssetType(url));
    if (response.status() >= 400) {
      failedLocalAssets.push(`${response.status()} ${parsedUrl.pathname}`);
    }
  });

  try {
    await page.goto(campusRoute, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(2_000);

    const health = await getCampusSceneHealth(page);
    expect(health, JSON.stringify(health)).toMatchObject({ ready: true, rootReady: true, canvasCount: 1 });
    expect(health.width, "canvas backing width").toBeGreaterThan(0);
    expect(health.height, "canvas backing height").toBeGreaterThan(0);
    expect(failedLocalAssets, "local campus assets should load").toEqual([]);
    for (const assetType of requiredCoreAssetTypes) {
      expect(loadedAssetTypes, `expected at least one ${assetType} asset`).toContain(assetType);
    }
    expect(
      [...loadedAssetTypes].some((assetType) => textureAssetTypes.has(assetType)),
      `expected at least one raster texture asset, received ${JSON.stringify([...loadedAssetTypes])}`
    ).toBe(true);
    const severeConsoleErrors = consoleErrors.filter((message) =>
      /failed to load resource|three|uncaught|webgl/i.test(message)
    );
    expect(pageErrors, "page errors").toEqual([]);
    expect(severeConsoleErrors, "severe console errors").toEqual([]);
  } catch (error) {
    await attachFailureScreenshots(page, testInfo);
    throw error;
  }
});
