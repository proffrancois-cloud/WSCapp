(function () {
  if (window.WSC_APP_RUNTIME_READY) {
    return;
  }

  throw new Error("WSC app runtime did not load. Check src/app/app-main.js script order.");
}());
