(function () {
  const alpacaNamePattern = /^[a-z0-9][a-z0-9_-]{2,31}$/;

  function normalizeAlpacaName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getCurrentRedirectUrl(locationObject = window.location) {
    return String(locationObject.href || "").split("#")[0].split("?")[0];
  }

  function hasConfig(config) {
    return Boolean(config?.url && config?.publishableKey);
  }

  function createClient(config, supabaseGlobal) {
    if (!hasConfig(config) || !supabaseGlobal || typeof supabaseGlobal.createClient !== "function") {
      return null;
    }

    return supabaseGlobal.createClient(config.url, config.publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true
      }
    });
  }

  window.WSC_AUTH_SERVICE = Object.freeze({
    alpacaNamePattern,
    normalizeAlpacaName,
    getCurrentRedirectUrl,
    hasConfig,
    createClient
  });
}());
