(function () {
  const PWA_RESET_VERSION = String(window.WSC_PWA_RESET_VERSION || "dev");
  const PWA_RESET_STORAGE_KEY = "wsc-pwa-reset-version";
  const SERVICE_WORKER_RETIRED_KEY = "wsc-service-worker-retired-version";
  const RETIRE_RELOAD_KEY = "wsc-service-worker-retire-reload";
  const CACHE_PREFIX = "wsc-routes-";
  const installButton = document.getElementById("installAppButton");
  const installStatus = document.getElementById("installStatus");
  const desktopContext = typeof window.WSC_DESKTOP_APP === "object" && window.WSC_DESKTOP_APP !== null;

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

  function isServiceWorkerContext() {
    return (
      "serviceWorker" in navigator &&
      (window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1")
    );
  }

  function isRouteCache(cacheName) {
    return typeof cacheName === "string" && cacheName.startsWith(CACHE_PREFIX);
  }

  async function deleteRouteCaches() {
    if (!("caches" in window)) {
      return 0;
    }

    const keys = await window.caches.keys();
    const routeKeys = keys.filter(isRouteCache);
    await Promise.all(routeKeys.map((key) => window.caches.delete(key)));
    return routeKeys.length;
  }

  function registrationMatchesThisApp(registration) {
    if (!registration || !registration.scope) {
      return false;
    }

    const appScope = new URL("./", window.location.href).href;
    return registration.scope === appScope || registration.scope.startsWith(appScope);
  }

  async function unregisterRouteServiceWorkers() {
    if (!isServiceWorkerContext() || typeof navigator.serviceWorker.getRegistrations !== "function") {
      return 0;
    }

    const registrations = await navigator.serviceWorker.getRegistrations();
    const routeRegistrations = registrations.filter(registrationMatchesThisApp);
    await Promise.all(routeRegistrations.map((registration) => registration.unregister()));
    return routeRegistrations.length;
  }

  function reloadOnceAfterRetire() {
    try {
      if (window.sessionStorage.getItem(RETIRE_RELOAD_KEY) === PWA_RESET_VERSION) {
        return false;
      }

      window.sessionStorage.setItem(RETIRE_RELOAD_KEY, PWA_RESET_VERSION);
    } catch (_error) {
      if (window.__WSC_SERVICE_WORKER_RETIRE_RELOADED__) {
        return false;
      }
      window.__WSC_SERVICE_WORKER_RETIRE_RELOADED__ = true;
    }

    window.location.reload();
    return true;
  }

  async function retireServiceWorkerRuntime() {
    const hadController = Boolean(navigator.serviceWorker && navigator.serviceWorker.controller);
    const removedCaches = await deleteRouteCaches();
    const removedWorkers = await unregisterRouteServiceWorkers();

    try {
      window.localStorage.setItem(PWA_RESET_STORAGE_KEY, PWA_RESET_VERSION);
      window.localStorage.setItem(SERVICE_WORKER_RETIRED_KEY, PWA_RESET_VERSION);
    } catch (_error) {}

    if ((hadController || removedWorkers > 0 || removedCaches > 0) && reloadOnceAfterRetire()) {
      setInstallStatus("Cleared an old cached app shell. Reloading the fresh site...");
      return;
    }

    setInstallStatus("Updates now load directly from the hosted site.");
  }

  if (desktopContext) {
    setInstallStatus("Running in desktop app mode. This route is ready to launch.");
    setInstallButtonVisible(false);
    return;
  }

  setInstallButtonVisible(false);

  if (isServiceWorkerContext()) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "WSC_SERVICE_WORKER_RETIRED") {
        setInstallStatus("Cleared an old cached app shell. Reloading the fresh site...");
        reloadOnceAfterRetire();
      }
    });

    window.addEventListener("load", () => {
      retireServiceWorkerRuntime().catch(() => {
        setInstallStatus("Updates now load directly from the hosted site.");
      });
    });
  } else {
    setInstallStatus("Updates now load directly from the hosted site.");
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    setInstallButtonVisible(false);
    setInstallStatus("Browser install is disabled so updates cannot get stuck behind an old app cache.");
  });
})();
