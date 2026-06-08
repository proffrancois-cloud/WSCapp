const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("WSC_DESKTOP_APP", {
  runtime: "electron",
  platform: process.platform,
  packaged: !process.defaultApp
});
