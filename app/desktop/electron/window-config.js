const fs = require("node:fs");
const path = require("node:path");

function resolveAppIcon(rootDir, platform = process.platform, hasFile = fs.existsSync) {
  if (platform === "win32") {
    return path.join(rootDir, "desktop", "icons", "app.ico");
  }

  if (platform === "darwin") {
    const icnsPath = path.join(rootDir, "desktop", "icons", "app.icns");
    return hasFile(icnsPath)
      ? icnsPath
      : path.join(rootDir, "desktop", "icons", "app.png");
  }

  return path.join(rootDir, "desktop", "icons", "app.png");
}

function getMainWindowOptions({ rootDir, platform = process.platform, hasFile = fs.existsSync } = {}) {
  if (!rootDir) {
    throw new Error("getMainWindowOptions requires a rootDir.");
  }

  return {
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 560,
    useContentSize: false,
    autoHideMenuBar: true,
    show: false,
    title: "WSCapp",
    backgroundColor: "#f3e3bc",
    icon: resolveAppIcon(rootDir, platform, hasFile),
    webPreferences: {
      preload: path.join(rootDir, "desktop", "electron", "preload.js"),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false,
      navigateOnDragDrop: false
    }
  };
}

module.exports = {
  getMainWindowOptions,
  resolveAppIcon
};
