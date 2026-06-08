(function () {
  const PWA_RESET_VERSION = String(window.WSC_PWA_RESET_VERSION || "dev");
  const PWA_RESET_STORAGE_KEY = "wsc-pwa-reset-version";
  const SERVICE_WORKER_URL = `./service-worker.js?v=${encodeURIComponent(PWA_RESET_VERSION)}`;
  const UPDATE_CHECK_INTERVAL = 15 * 60 * 1000;
  const installButton = document.getElementById("installAppButton");
  const installStatus = document.getElementById("installStatus");
  const desktopContext = typeof window.WSC_DESKTOP_APP === "object" && window.WSC_DESKTOP_APP !== null;
  let deferredInstallPrompt = null;
  let hasRefreshedForUpdate = false;
  let activeRegistration = null;

  function setInstallStatus(message) {
    if (installStatus) {
      installStatus.textContent = message;
    }
  }

  function setInstallButtonVisible(visible) {
    if (installButton) {
      installButton.classList.toggle("hidden", !visible);
    }
  }

  function isInstallableContext() {
    return (
      window.isSecureContext ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    );
  }

  async function resetPwaCachesForNewVersion() {
    try {
      const previousVersion = window.localStorage.getItem(PWA_RESET_STORAGE_KEY);
      if (previousVersion === PWA_RESET_VERSION) {
        return;
      }

      if ("caches" in window) {
        const keys = await window.caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith("wsc-routes-"))
            .map((key) => window.caches.delete(key))
        );
      }

      window.localStorage.setItem(PWA_RESET_STORAGE_KEY, PWA_RESET_VERSION);
    } catch (_error) {
      // Cache reset is best-effort; registration still forces the worker URL to the new version.
    }
  }

  function reloadOnceForUpdatedServiceWorker() {
    if (hasRefreshedForUpdate) {
      return;
    }

    hasRefreshedForUpdate = true;
    window.location.reload();
  }

  function activateWaitingWorker(registration) {
    const waitingWorker = registration && registration.waiting;
    if (!waitingWorker) {
      return false;
    }

    setInstallStatus("Updating the app shell...");
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    return true;
  }

  function requestServiceWorkerUpdate() {
    if (!activeRegistration || typeof activeRegistration.update !== "function") {
      return;
    }

    activeRegistration.update().then(() => {
      activateWaitingWorker(activeRegistration);
    }).catch(() => {});
  }

  function watchServiceWorkerRegistration(registration) {
    if (!registration) {
      return;
    }

    activeRegistration = registration;
    activateWaitingWorker(registration);
    requestServiceWorkerUpdate();

    registration.addEventListener("updatefound", () => {
      const installingWorker = registration.installing;
      if (!installingWorker) {
        return;
      }

      installingWorker.addEventListener("statechange", () => {
        if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
          setInstallStatus("A fresher version of this route is ready. Reloading...");
          activateWaitingWorker(registration);
        }
      });
    });
  }

  function registerServiceWorker() {
    return navigator.serviceWorker
      .register(SERVICE_WORKER_URL, { updateViaCache: "none" })
      .then((registration) => {
        watchServiceWorkerRegistration(registration);
      });
  }

  if (desktopContext) {
    setInstallStatus("Running in desktop app mode. This route is ready to launch.");
    setInstallButtonVisible(false);
    return;
  }

  if ("serviceWorker" in navigator && isInstallableContext()) {
    window.addEventListener("load", () => {
      resetPwaCachesForNewVersion()
        .then(registerServiceWorker)
        .catch(() => {
          setInstallStatus("Open this route from a local server or deployed URL to unlock app install.");
        });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      reloadOnceForUpdatedServiceWorker();
    });

    window.setInterval(requestServiceWorkerUpdate, UPDATE_CHECK_INTERVAL);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        requestServiceWorkerUpdate();
      }
    });
  } else {
    setInstallStatus("Open this route from a local server or deployed URL to unlock app install.");
  }

  if (window.matchMedia("(display-mode: standalone)").matches) {
    setInstallStatus("Running in app mode. The route is ready to launch.");
    setInstallButtonVisible(false);
  } else {
    setInstallStatus("This route is ready in the browser. Install becomes available on supported browsers.");
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    setInstallButtonVisible(true);
    setInstallStatus("Install is ready. Add this route to your device when you are ready.");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    setInstallButtonVisible(false);
    setInstallStatus("App installed. You can launch the route from your apps list.");
  });

  if (installButton) {
    installButton.addEventListener("click", async () => {
      if (!deferredInstallPrompt) {
        setInstallStatus("Install is not available yet in this browser. Try a local server or deployed URL.");
        return;
      }

      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      setInstallButtonVisible(false);

      if (choice && choice.outcome === "accepted") {
        setInstallStatus("Install accepted. Finish the route from your home screen or apps list.");
      } else {
        setInstallStatus("Install dismissed. You can come back to this stop later.");
      }
    });
  }
})();
