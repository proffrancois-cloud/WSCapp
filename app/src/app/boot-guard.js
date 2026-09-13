(function () {
  const FAILURE_ID = "wscBootFailure";
  const BOOT_TIMEOUT_MS = 15000;
  let timeoutId = null;

  function isAppReady() {
    return Boolean(window["WSC_APP_READY"]);
  }

  function removeFailure() {
    document.getElementById(FAILURE_ID)?.remove();
  }

  function showFailure() {
    if (isAppReady() || document.getElementById(FAILURE_ID) || !document.body) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = FAILURE_ID;
    overlay.className = "boot-failure-overlay";
    overlay.setAttribute("role", "alertdialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "wscBootFailureTitle");

    const panel = document.createElement("div");
    panel.className = "boot-failure-panel";
    const title = document.createElement("h1");
    title.id = "wscBootFailureTitle";
    title.textContent = "WSCapp could not finish loading";
    const message = document.createElement("p");
    message.textContent = "Check your connection, then reload. Your locally saved progress has not been removed.";
    const retry = document.createElement("button");
    retry.className = "button primary";
    retry.type = "button";
    retry.textContent = "Reload WSCapp";
    retry.addEventListener("click", () => window.location.reload());
    panel.append(title, message, retry);
    overlay.append(panel);
    document.body.append(overlay);
    retry.focus();
  }

  function isNonCriticalResourceFailure(event) {
    const target = event?.target;
    if (!target || target === window || typeof target.matches !== "function") {
      return false;
    }
    if (target.matches("img, picture, source, video, audio, track")) {
      return true;
    }
    if (!target.matches("script[src], link[href]")) {
      return false;
    }
    try {
      const resourceUrl = new URL(target.src || target.href, window.location.href);
      return resourceUrl.origin !== window.location.origin;
    } catch (_error) {
      return false;
    }
  }

  function reportBootError(event) {
    if (isAppReady() || isNonCriticalResourceFailure(event)) {
      return;
    }
    console.error("WSCapp boot failed before the runtime became ready.", event?.error || event?.reason || event);
    window.setTimeout(showFailure, 0);
  }

  window.addEventListener("error", reportBootError, true);
  window.addEventListener("unhandledrejection", reportBootError);
  window.addEventListener("wsc:app-ready", () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
    removeFailure();
  }, { once: true });

  timeoutId = window.setTimeout(showFailure, BOOT_TIMEOUT_MS);
  window.WSC_BOOT_GUARD = Object.freeze({ showFailure, removeFailure });
}());
