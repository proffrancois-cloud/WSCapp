(function () {
  const alpacaNamePattern = /^[a-z0-9][a-z0-9_-]{2,31}$/;
  const oauthProviders = Object.freeze({
    discord: Object.freeze({
      provider: "discord",
      label: "Continue with Discord",
      scopes: "identify email"
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

    return {
      provider: config.provider,
      options: {
        redirectTo,
        scopes: config.scopes
      }
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

  function firstMetadataValue(...values) {
    for (const value of values) {
      const cleanValue = String(value || "").trim();
      if (cleanValue) {
        return cleanValue;
      }
    }
    return "";
  }

  function limitText(value, maxLength) {
    return firstMetadataValue(value).slice(0, maxLength);
  }

  function getUserProviders(user) {
    const appMetadata = user?.app_metadata || {};
    const providers = Array.isArray(appMetadata.providers) ? appMetadata.providers : [];
    const primaryProvider = firstMetadataValue(appMetadata.provider);
    return [primaryProvider, ...providers]
      .map(normalizeOAuthProvider)
      .filter(Boolean);
  }

  function extractAuthIdentity(user, now = new Date()) {
    if (!user || !user.id) {
      return null;
    }

    const userMetadata = user.user_metadata || {};
    const providers = getUserProviders(user);
    const lastAuthProvider = providers[0] || (user.email ? "email" : "unknown");
    const isDiscord = providers.includes("discord")
      || /discord/i.test(firstMetadataValue(userMetadata.iss));
    const providerId = limitText(
      userMetadata.provider_id || userMetadata.sub || userMetadata.id,
      128
    );
    const timestamp = now instanceof Date ? now.toISOString() : String(now || new Date().toISOString());

    const payload = {
      last_auth_provider: limitText(lastAuthProvider, 40),
      auth_provider_id: providerId || null,
      last_sign_in_at: timestamp
    };

    if (!isDiscord) {
      return payload;
    }

    const customClaims = userMetadata.custom_claims && typeof userMetadata.custom_claims === "object"
      ? userMetadata.custom_claims
      : {};

    payload.discord_user_id = limitText(
      userMetadata.provider_id || userMetadata.sub || customClaims.id || userMetadata.id,
      128
    ) || null;
    payload.discord_username = limitText(
      userMetadata.user_name || userMetadata.username || userMetadata.preferred_username || userMetadata.name,
      120
    ) || null;
    payload.discord_global_name = limitText(
      userMetadata.global_name || customClaims.global_name || userMetadata.full_name || userMetadata.name,
      160
    ) || null;
    payload.discord_avatar_url = limitText(
      userMetadata.avatar_url || userMetadata.picture,
      500
    ) || null;
    payload.discord_connected_at = timestamp;

    return payload;
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
    extractAuthIdentity,
    hasConfig,
    createClient
  });
}());
