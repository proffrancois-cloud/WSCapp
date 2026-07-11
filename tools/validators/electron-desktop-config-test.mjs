import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const APP_DIR = path.join(ROOT, "app");
const requireApp = createRequire(path.join(APP_DIR, "package.json"));
const packageJson = JSON.parse(fs.readFileSync(path.join(APP_DIR, "package.json"), "utf8"));
const appMainSource = fs.readFileSync(path.join(APP_DIR, "src/app/app-main.js"), "utf8");
const { getMainWindowOptions, resolveAppIcon } = requireApp("./desktop/electron/window-config.js");

const failures = [];
const expectedFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "data.js",
  "knowledge-bank.js",
  "desktop/electron/main.js",
  "desktop/electron/preload.js",
  "desktop/electron/window-config.js",
  "desktop/icons/app.ico",
  "desktop/icons/app.icns",
  "desktop/icons/app.png"
];
const syntaxCheckedFiles = [
  "desktop/electron/main.js",
  "desktop/electron/preload.js",
  "desktop/electron/window-config.js"
];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

function hasBuildFilePattern(pattern) {
  return packageJson.build.files.some((entry) => entry === pattern);
}

for (const relativePath of expectedFiles) {
  assert(fs.existsSync(path.join(APP_DIR, relativePath)), `Missing desktop package file: ${relativePath}`);
}

for (const relativePath of syntaxCheckedFiles) {
  try {
    new vm.Script(fs.readFileSync(path.join(APP_DIR, relativePath), "utf8"), {
      filename: relativePath
    });
  } catch (error) {
    failures.push(`${relativePath} has a syntax error: ${error.message}`);
  }
}

assert(packageJson.main === "desktop/electron/main.js", "Electron main entry should point to desktop/electron/main.js");
assert(packageJson.scripts["desktop:dev"] === "electron .", "desktop:dev script should launch Electron from app root");
assert(packageJson.scripts["desktop:pack"]?.includes("electron-builder"), "desktop:pack should use electron-builder");
assert(packageJson.scripts["desktop:win"]?.includes("--win"), "desktop:win should target Windows");
assert(packageJson.scripts["desktop:mac"]?.includes("--mac"), "desktop:mac should target macOS");
assert(packageJson.build.productName === "WSCapp", "Electron productName should remain WSCapp");
assert(packageJson.build.appId === "org.worldscholarscup.study.routes", "Electron appId should remain stable");
assert(packageJson.build.directories.output === "../builds/current", "Electron output should stay outside app source");
assert(hasBuildFilePattern("styles-*.css"), "Electron package should include split CSS chunks");
assert(hasBuildFilePattern("desktop/electron/**/*"), "Electron package should include desktop/electron files");
assert(hasBuildFilePattern("assets/**/*"), "Electron package should include local assets");
assert(hasBuildFilePattern("src/**/*"), "Electron package should include app src modules");
assert(appMainSource.includes("const IS_DESKTOP_APP = Boolean(window.WSC_DESKTOP_APP);"), "app runtime should normalize the Electron desktop bridge once.");
assert(!appMainSource.includes("window.WSC_DESKTOP_APP === true"), "app runtime should not compare the Electron desktop bridge object to true.");

const macTargets = packageJson.build.mac.target || [];
const winTargets = packageJson.build.win.target || [];
assert(packageJson.build.mac.icon === "desktop/icons/app.png", "mac builder icon source should remain desktop/icons/app.png");
assert(packageJson.build.win.icon === "desktop/icons/app.ico", "Windows builder icon should use .ico");
assert(macTargets.includes("dmg") && macTargets.includes("zip"), "mac targets should include dmg and zip");
assert(winTargets.includes("nsis") && winTargets.includes("portable"), "Windows targets should include nsis and portable");

const platformIconExpectations = {
  win32: "desktop/icons/app.ico",
  darwin: "desktop/icons/app.icns",
  linux: "desktop/icons/app.png"
};

for (const [platform, relativePath] of Object.entries(platformIconExpectations)) {
  const iconPath = resolveAppIcon(APP_DIR, platform);
  assert(iconPath === path.join(APP_DIR, relativePath), `${platform} should resolve ${relativePath}, got ${iconPath}`);
  assert(fs.existsSync(iconPath), `${platform} icon does not exist: ${iconPath}`);
}

const optionsByPlatform = Object.fromEntries(
  ["win32", "darwin", "linux"].map((platform) => [platform, getMainWindowOptions({ rootDir: APP_DIR, platform })])
);

for (const [platform, options] of Object.entries(optionsByPlatform)) {
  assert(options.width === 1280, `${platform}: main window width should be 1280 for smaller Windows laptops`);
  assert(options.height === 720, `${platform}: main window height should be 720 for smaller Windows laptops`);
  assert(options.minWidth === 960, `${platform}: minWidth should be 960 for compact laptops`);
  assert(options.minHeight === 560, `${platform}: minHeight should be 560 for short laptop screens`);
  assert(options.useContentSize === false, `${platform}: useContentSize should be false so OS chrome fits on 1366x768 screens`);
  assert(options.autoHideMenuBar === true, `${platform}: autoHideMenuBar should be true`);
  assert(options.show === false, `${platform}: window should wait for ready-to-show`);
  assert(options.title === "WSCapp", `${platform}: title should be WSCapp`);
  assert(options.backgroundColor === "#f3e3bc", `${platform}: backgroundColor should match app shell`);
  assert(path.isAbsolute(options.icon), `${platform}: icon path should be absolute`);
  assert(path.isAbsolute(options.webPreferences.preload), `${platform}: preload path should be absolute`);
  assert(options.webPreferences.contextIsolation === true, `${platform}: contextIsolation should be enabled`);
  assert(options.webPreferences.nodeIntegration === false, `${platform}: nodeIntegration should be disabled`);
  assert(options.webPreferences.navigateOnDragDrop === false, `${platform}: navigateOnDragDrop should be disabled`);
}

const report = {
  checkedPlatforms: Object.keys(optionsByPlatform),
  windowSize: {
    width: optionsByPlatform.win32.width,
    height: optionsByPlatform.win32.height,
    minWidth: optionsByPlatform.win32.minWidth,
    minHeight: optionsByPlatform.win32.minHeight
  },
  targets: {
    mac: macTargets,
    win: winTargets
  },
  syntaxCheckedFiles,
  icons: Object.fromEntries(
    Object.keys(platformIconExpectations).map((platform) => [platform, optionsByPlatform[platform].icon])
  ),
  failures
};

console.log(JSON.stringify(report, null, 2));

if (failures.length) {
  console.error(`Electron desktop config test failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
