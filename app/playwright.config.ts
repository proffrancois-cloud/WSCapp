import { defineConfig } from "@playwright/test";

const port = Number(process.env.WSC_A11Y_PORT || 4176);
const baseURL = process.env.WSC_A11Y_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL,
    browserName: "chromium",
    colorScheme: "light",
    reducedMotion: "reduce",
    trace: "retain-on-failure"
  },
  webServer: process.env.WSC_A11Y_BASE_URL
    ? undefined
    : {
        command: `node ../tools/servers/serve-public-artifact.mjs . --port=${port}`,
        cwd: ".",
        url: `${baseURL}/index.html`,
        reuseExistingServer: true,
        timeout: 30_000
      }
});
