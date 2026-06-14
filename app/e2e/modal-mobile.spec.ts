import { expect, test, type Page } from "@playwright/test";

const modalSelector = '[role="dialog"][aria-modal="true"]';
const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

async function waitForAppReady(page: Page) {
  await page.goto("", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean(window.WSC_APP_READY));
}

async function chooseLocalEntry(page: Page) {
  const localEntryButton = page.locator('[data-app-entry-choice="local"]');
  await expect(localEntryButton).toBeVisible();
  await expect(localEntryButton).toBeEnabled();
  await page.evaluate(() => {
    document.querySelector<HTMLElement>('[data-app-entry-choice="local"]')?.click();
  });
}

async function getFocusedIndex(page: Page, dialogCss: string) {
  return page.evaluate(
    ({ dialogCss: selector, focusableCss }) => {
      const dialog = document.querySelector(selector);
      if (!dialog) {
        return -1;
      }
      const focusable = Array.from(dialog.querySelectorAll(focusableCss)).filter((element) => {
        const htmlElement = element as HTMLElement;
        return !htmlElement.hasAttribute("disabled") && htmlElement.getClientRects().length > 0;
      });
      return focusable.indexOf(document.activeElement as Element);
    },
    { dialogCss, focusableCss: focusableSelector }
  );
}

async function focusByIndex(page: Page, dialogCss: string, index: number) {
  await page.evaluate(
    ({ dialogCss: selector, focusableCss, index: targetIndex }) => {
      const dialog = document.querySelector(selector);
      const focusable = dialog
        ? Array.from(dialog.querySelectorAll(focusableCss)).filter((element) => {
            const htmlElement = element as HTMLElement;
            return !htmlElement.hasAttribute("disabled") && htmlElement.getClientRects().length > 0;
          })
        : [];
      (focusable.at(targetIndex) as HTMLElement | undefined)?.focus();
      return focusable.length;
    },
    { dialogCss, focusableCss: focusableSelector, index }
  );
}

async function expectFocusInside(page: Page, dialogCss: string) {
  await expect
    .poll(() =>
      page.evaluate((selector) => {
        const dialog = document.querySelector(selector);
        return Boolean(dialog && dialog.contains(document.activeElement));
      }, dialogCss)
    )
    .toBe(true);
}

async function getHorizontalOverflow(page: Page, selectors: string[]) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await page.evaluate((checkedSelectors) => {
        const scrollingElement = document.scrollingElement || document.documentElement;
        const viewportWidth = document.documentElement.clientWidth;
        const documentOverflow = Math.max(0, scrollingElement.scrollWidth - viewportWidth);
        const offenders = checkedSelectors.flatMap((selector) =>
          Array.from(document.querySelectorAll(selector)).flatMap((element) => {
            const rect = element.getBoundingClientRect();
            const leftOverflow = Math.max(0, -rect.left);
            const rightOverflow = Math.max(0, rect.right - viewportWidth);
            const elementOverflow = Math.max(leftOverflow, rightOverflow);
            return elementOverflow > 1
              ? [{
                  selector,
                  className: (element as HTMLElement).className,
                  left: Math.round(rect.left),
                  right: Math.round(rect.right),
                  overflow: Math.round(elementOverflow)
                }]
              : [];
          })
        );

        return { viewportWidth, documentOverflow, offenders };
      }, selectors);
    } catch (error) {
      if (!String(error).includes("Execution context was destroyed") || attempt === 2) {
        throw error;
      }
      await page.waitForLoadState("domcontentloaded").catch(() => {});
    }
  }

  throw new Error("Horizontal overflow check did not complete.");
}

test("modal focus stays trapped and Escape closes dismissible dialogs", async ({ page }) => {
  await waitForAppReady(page);
  const entryGate = page.locator(".app-entry-gate-overlay");
  await expect(entryGate).toBeVisible();
  await expectFocusInside(page, ".app-entry-gate-overlay");

  await focusByIndex(page, ".app-entry-gate-overlay", -1);
  await page.keyboard.press("Tab");
  await expect.poll(() => getFocusedIndex(page, ".app-entry-gate-overlay")).toBe(0);

  await page.keyboard.press("Shift+Tab");
  await expect
    .poll(() => getFocusedIndex(page, ".app-entry-gate-overlay"))
    .toBeGreaterThanOrEqual(1);

  await chooseLocalEntry(page);
  const cooperationModal = page.locator(".cooperation-modal-overlay");
  await expect(cooperationModal).toBeVisible({ timeout: 10_000 });
  await expectFocusInside(page, ".cooperation-modal-overlay");

  await page.keyboard.press("Escape");
  await expect(cooperationModal).toHaveCount(0);
  await expect(page.locator("#routeBuilder")).toBeVisible();
});

test("entry gate and route builder avoid horizontal overflow at 390px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await waitForAppReady(page);

  const entryOverflow = await getHorizontalOverflow(page, [
    ".app-entry-gate-overlay",
    ".app-entry-gate-window",
    ".app-entry-auth-panel",
    ".app-entry-choice-grid"
  ]);
  expect(entryOverflow, JSON.stringify(entryOverflow)).toMatchObject({
    documentOverflow: 0,
    offenders: []
  });

  await page.evaluate(() => {
    document.querySelector<HTMLElement>('[data-app-entry-choice="local"]')?.click();
  });
  await expect(page.locator(".app-entry-gate-overlay")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.locator(".cooperation-modal-overlay")).toHaveCount(0);
  await expect(page.locator("#routeBuilder")).toBeVisible();

  const routeBuilderOverflow = await getHorizontalOverflow(page, [
    ".page-shell",
    ".layout",
    "#routeBuilder",
    ".wizard-steps",
    ".mode-choice-shell",
    ".mode-choice-board",
    ".selected-section-chip-strip"
  ]);
  expect(routeBuilderOverflow, JSON.stringify(routeBuilderOverflow)).toMatchObject({
    documentOverflow: 0,
    offenders: []
  });
});
