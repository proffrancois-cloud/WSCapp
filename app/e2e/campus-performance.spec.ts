import { expect, test } from "@playwright/test";

const campusRoute = "alpaca-campus-3d/?mode=multiplayer";
const localCampusAssetPattern = /\.(?:glb|jpe?g|png|webp)$/i;
const forbiddenHighDetailBeforeReady = [
  "alhambra-study-ii.glb",
  "masjid-al-aqsa-dome-of-the-rock.glb",
  "oriental-fountain.glb",
  "cour-du-chateau-de-chambord.glb",
  "old-wooden-door.glb"
] as const;

const MB = 1024 * 1024;
const COURTYARD_CRITICAL_BUDGET_BYTES = 8 * MB;
const MAX_CRITICAL_GLB_BYTES = 20 * MB;

type AssetRequest = {
  pathname: string;
  bytes: number;
  status: number;
  receivedAtMs: number;
};

test("campus multiplayer route keeps high-detail assets out of the critical path", async ({ page }) => {
  test.setTimeout(90_000);

  const startedAtMs = Date.now();
  const requestedAssets: AssetRequest[] = [];

  page.on("response", (response) => {
    const parsedUrl = new URL(response.url());
    if (!parsedUrl.pathname.startsWith("/WSCapp/") || !localCampusAssetPattern.test(parsedUrl.pathname)) {
      return;
    }

    requestedAssets.push({
      pathname: parsedUrl.pathname,
      bytes: Number(response.headers()["content-length"] || 0),
      status: response.status(),
      receivedAtMs: Date.now() - startedAtMs
    });
  });

  await page.goto(campusRoute, { waitUntil: "domcontentloaded" });

  await page.waitForFunction(() => {
    const campusWindow = window as Window & {
      WSC_CAMPUS_3D_SHELL_VISIBLE?: boolean;
    };
    return Boolean(
      campusWindow.WSC_CAMPUS_3D_SHELL_VISIBLE ||
      document.querySelector(".campus3d-entry-shell") ||
      document.querySelector(".campus3d-shell")
    );
  }, null, { timeout: 3_000 });
  const shellVisibleAtMs = Date.now() - startedAtMs;

  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30_000 });
  const canvasVisibleAtMs = Date.now() - startedAtMs;

  await page.waitForFunction(() => {
    const campusWindow = window as Window & {
      WSC_CAMPUS_3D_READY?: boolean;
    };
    return Boolean(campusWindow.WSC_CAMPUS_3D_READY);
  }, null, { timeout: 45_000 });
  const readyAtMs = Date.now() - startedAtMs;

  const beforeReadyAssets = requestedAssets.filter((asset) => asset.receivedAtMs <= readyAtMs + 50);
  const failedAssets = beforeReadyAssets.filter((asset) => asset.status >= 400);
  const forbiddenAssets = beforeReadyAssets.filter((asset) =>
    forbiddenHighDetailBeforeReady.some((filename) => asset.pathname.includes(filename))
  );
  const oversizedCriticalGlbs = beforeReadyAssets.filter((asset) =>
    asset.pathname.endsWith(".glb") && asset.bytes > MAX_CRITICAL_GLB_BYTES
  );
  const estimatedCriticalBytes = beforeReadyAssets.reduce((total, asset) => total + asset.bytes, 0);

  expect(shellVisibleAtMs, "shell visible time").toBeLessThan(3_000);
  expect(canvasVisibleAtMs, "canvas visible time").toBeLessThan(30_000);
  expect(readyAtMs, "campus ready time").toBeLessThan(45_000);
  expect(failedAssets, "critical local assets should not 404/500").toEqual([]);
  expect(forbiddenAssets, "high-detail GLBs should not load before campus ready").toEqual([]);
  expect(oversizedCriticalGlbs, "no critical GLB should exceed 20 MB before ready").toEqual([]);
  expect(estimatedCriticalBytes, "courtyard critical asset budget").toBeLessThanOrEqual(COURTYARD_CRITICAL_BUDGET_BYTES);

  await test.info().attach("campus-performance-critical-assets", {
    body: JSON.stringify({
      shellVisibleAtMs,
      canvasVisibleAtMs,
      readyAtMs,
      estimatedCriticalBytes,
      beforeReadyAssets
    }, null, 2),
    contentType: "application/json"
  });
});
