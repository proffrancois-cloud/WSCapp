(function () {
  const alpacaNamePattern = /^[a-z0-9][a-z0-9_-]{2,31}$/;
  const oauthProviders = Object.freeze({
    discord: Object.freeze({
      provider: "discord",
      label: "Continue with Discord",
      iconSrc: "./assets/mascot/library/final-pack/Discordlogo.png?v=20260707directgames",
      scopes: "identify email"
    }),
    google: Object.freeze({
      provider: "google",
      label: "Continue with Google",
      iconSrc: "./assets/mascot/library/final-pack/google%20signup.png?v=20260712googleoauth"
    })
  });

  function normalizeAlpacaName(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizeOAuthProvider(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getOAuthProvider(provider) {
    return oauthProviders[normalizeOAuthProvider(provider)] || null;
  }

  function getOAuthSignInOptions(provider, redirectTo) {
    const config = getOAuthProvider(provider);
    if (!config) {
      throw new Error("That sign-in provider is not available yet.");
    }

    const options = {
      redirectTo
    };
    if (config.scopes) {
      options.scopes = config.scopes;
    }

    return {
      provider: config.provider,
      options
    };
  }

  function getCurrentRedirectUrl(locationObject = window.location) {
    return String(locationObject.href || "").split("#")[0].split("?")[0];
  }

  function hasRecoveryType(params) {
    return String(params.get("type") || "").trim().toLowerCase() === "recovery";
  }

  function getUrlParams(value) {
    const rawValue = String(value || "").trim().replace(/^[?#]/, "");
    return new URLSearchParams(rawValue);
  }

  function isPasswordRecoveryRedirect(locationObject = window.location) {
    return hasRecoveryType(getUrlParams(locationObject.search))
      || hasRecoveryType(getUrlParams(locationObject.hash));
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
    oauthProviders,
    normalizeAlpacaName,
    normalizeOAuthProvider,
    getOAuthProvider,
    getOAuthSignInOptions,
    getCurrentRedirectUrl,
    isPasswordRecoveryRedirect,
    hasConfig,
    createClient
  });
}());
