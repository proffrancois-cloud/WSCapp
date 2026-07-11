const { app, BrowserWindow, shell } = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { getMainWindowOptions } = require("./window-config");

const ROOT_DIR = path.join(__dirname, "..", "..");
const INDEX_PATH = path.join(ROOT_DIR, "index.html");
const INDEX_URL = pathToFileURL(INDEX_PATH).toString();

function isAppIndexUrl(url) {
  try {
    const target = new URL(url);
    const expected = new URL(INDEX_URL);
    return target.protocol === "file:" && target.pathname === expected.pathname;
  } catch {
    return false;
  }
}

function createMainWindow() {
  const window = new BrowserWindow(getMainWindowOptions({ rootDir: ROOT_DIR }));

  window.once("ready-to-show", () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppIndexUrl(url)) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (isAppIndexUrl(url)) {
      return;
    }

    event.preventDefault();

    if (!url.startsWith("file://")) {
      shell.openExternal(url);
      return;
    }

    const currentUrl = window.webContents.getURL();
    if (!isAppIndexUrl(currentUrl)) {
      window.loadFile(INDEX_PATH);
    }
  });

  window.webContents.on("did-fail-load", () => {
    const currentUrl = window.webContents.getURL();
    if (!isAppIndexUrl(currentUrl)) {
      window.loadFile(INDEX_PATH);
    }
  });

  window.webContents.on("did-finish-load", () => {
    const currentUrl = window.webContents.getURL();
    if (!isAppIndexUrl(currentUrl)) {
      window.loadFile(INDEX_PATH);
    }
  });

  window.loadFile(INDEX_PATH);
}

function startApp() {
  app.whenReady().then(() => {
    createMainWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      }
    });
  });
}

startApp();

module.exports = {
  createMainWindow,
  isAppIndexUrl,
  startApp
};

app.on("open-file", (event) => {
  event.preventDefault();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
