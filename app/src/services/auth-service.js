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

  async function assertOAuthProviderEnabled(provider, config, fetchImpl = window.fetch.bind(window)) {
    const providerName = normalizeOAuthProvider(provider);
    if (!Object.prototype.hasOwnProperty.call(oauthProviders, providerName)) {
      throw new Error("That sign-in provider is not available yet.");
    }

    const providerLabel = oauthProviders[providerName].label.replace(/^Continue with /, "");
    const unavailableMessage = `We couldn't check ${providerLabel} sign-in. Please try again or sign in with your email.`;
    let settingsUrl;
    try {
      if (typeof config?.url !== "string" || typeof config?.publishableKey !== "string"
        || !config.publishableKey.trim() || typeof fetchImpl !== "function") {
        throw new Error(unavailableMessage);
      }
      const projectUrl = new URL(config.url);
      if (!["https:", "http:"].includes(projectUrl.protocol)
        || projectUrl.username || projectUrl.password || projectUrl.search || projectUrl.hash) {
        throw new Error(unavailableMessage);
      }
      settingsUrl = `${projectUrl.href.replace(/\/+$/, "")}/auth/v1/settings`;
    } catch (_error) {
      throw new Error(unavailableMessage);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let enabled;
    try {
      const response = await fetchImpl(settingsUrl, {
        method: "GET",
        headers: { apikey: config.publishableKey },
        credentials: "omit",
        cache: "no-store",
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(unavailableMessage);
      }
      const settings = await response.json();
      enabled = settings?.external?.[providerName];
      if (typeof enabled !== "boolean") {
        throw new Error(unavailableMessage);
      }
    } catch (_error) {
      throw new Error(unavailableMessage);
    } finally {
      clearTimeout(timeout);
    }

    if (enabled !== true) {
      throw new Error(`${providerLabel} sign-in is not available right now. Please sign in with your email instead.`);
    }
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
    assertOAuthProviderEnabled,
    getCurrentRedirectUrl,
    isPasswordRecoveryRedirect,
    hasConfig,
    createClient
  });
}());
