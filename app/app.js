(function () {
  const createApp = window.WSC_CREATE_APP;
  if (typeof createApp !== "function") {
    throw new Error("WSC app composition root is not loaded.");
  }

  const app = createApp({
    windowRef: window,
    documentRef: document
  });

  window.WSC_APP = app;
  app.init();
}());
