import { inflateSync } from "node:zlib";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

const campusRoute = "alpaca-campus-3d/?mode=multiplayer";
const localAssetPattern = /\.(?:css|glb|jpe?g|js|png|webp)$/i;
const requiredAssetTypes = new Set([".css", ".glb", ".js", ".webp"]);

function getAssetType(urlString: string) {
  const pathname = new URL(urlString).pathname;
  const match = pathname.match(/\.[^.]+$/);
  return match ? match[0].toLowerCase() : "";
}

async function attachFailureScreenshots(page: Page, testInfo: TestInfo) {
  await testInfo.attach(`${testInfo.project.name}-failure`, {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png"
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(campusRoute, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1_000);
  await testInfo.attach("mobile-390-failure", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png"
  });
}

function paethPredictor(left: number, above: number, upperLeft: number) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left;
  }
  if (aboveDistance <= upperLeftDistance) {
    return above;
  }
  return upperLeft;
}

function decodePngPixels(buffer: Buffer) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let index = 0; index < signature.length; index += 1) {
    if (buffer[index] !== signature[index]) {
      throw new Error("Canvas screenshot is not a PNG.");
    }
  }

  let offset = signature.length;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const compressedChunks: Buffer[] = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    offset += 4;
    const type = buffer.toString("ascii", offset, offset + 4);
    offset += 4;
    const data = buffer.subarray(offset, offset + length);
    offset += length + 4;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      compressedChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}`);
  }

  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const rowLength = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(compressedChunks));
  const pixels = new Uint8Array(height * rowLength);
  let readOffset = 0;

  for (let row = 0; row < height; row += 1) {
    const filter = inflated[readOffset];
    readOffset += 1;
    const rowOffset = row * rowLength;

    for (let column = 0; column < rowLength; column += 1) {
      const current = inflated[readOffset];
      readOffset += 1;
      const left = column >= bytesPerPixel ? pixels[rowOffset + column - bytesPerPixel] : 0;
      const above = row > 0 ? pixels[rowOffset - rowLength + column] : 0;
      const upperLeft =
        row > 0 && column >= bytesPerPixel ? pixels[rowOffset - rowLength + column - bytesPerPixel] : 0;

      let value = current;
      if (filter === 1) {
        value = current + left;
      } else if (filter === 2) {
        value = current + above;
      } else if (filter === 3) {
        value = current + Math.floor((left + above) / 2);
      } else if (filter === 4) {
        value = current + paethPredictor(left, above, upperLeft);
      } else if (filter !== 0) {
        throw new Error(`Unsupported PNG filter: ${filter}`);
      }

      pixels[rowOffset + column] = value & 255;
    }
  }

  return { width, height, bytesPerPixel, pixels };
}

function getPngCanvasHealth(buffer: Buffer) {
  const { width, height, bytesPerPixel, pixels } = decodePngPixels(buffer);
  const totalPixels = width * height;
  const sampleStep = Math.max(1, Math.floor(totalPixels / 25_000));
  const colorBuckets = new Set<string>();
  let nonBlankPixels = 0;
  let sampledPixels = 0;

  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += sampleStep) {
    const offset = pixelIndex * bytesPerPixel;
    const red = pixels[offset];
    const green = pixels[offset + 1];
    const blue = pixels[offset + 2];
    const alpha = bytesPerPixel === 4 ? pixels[offset + 3] : 255;
    sampledPixels += 1;

    if (alpha > 0 && red + green + blue > 45) {
      nonBlankPixels += 1;
      colorBuckets.add(`${red >> 4}-${green >> 4}-${blue >> 4}`);
    }
  }

  const minimumNonBlankPixels = Math.max(16, Math.floor(sampledPixels * 0.01));
  return {
    ok: nonBlankPixels >= minimumNonBlankPixels && colorBuckets.size >= 8,
    nonBlankPixels,
    minimumNonBlankPixels,
    sampledPixels,
    colorBuckets: colorBuckets.size,
    width,
    height
  };
}

async function getCanvasHealth(page: Page) {
  const canvas = page.locator("canvas").first();
  await expect(canvas).toBeVisible({ timeout: 30_000 });
  const screenshot = await canvas.screenshot();
  return getPngCanvasHealth(screenshot);
}

test("3D campus preview loads a nonblank canvas and local assets", async ({ page }, testInfo) => {
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

    const health = await getCanvasHealth(page);
    expect(health, JSON.stringify(health)).toMatchObject({ ok: true });
    expect(failedLocalAssets, "local campus assets should load").toEqual([]);
    for (const assetType of requiredAssetTypes) {
      expect(loadedAssetTypes, `expected at least one ${assetType} asset`).toContain(assetType);
    }
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
