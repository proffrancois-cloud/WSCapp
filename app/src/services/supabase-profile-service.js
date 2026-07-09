(function () {
  const BASE_PROFILE_COLUMNS = "alpaca_name,country,school_name,wsc_event_count,highest_wsc_round,created_at";
  const AUTH_PROFILE_COLUMNS = "last_auth_provider,auth_provider_id,discord_user_id,discord_username,discord_global_name,discord_avatar_url,discord_connected_at,last_sign_in_at";
  const ID_PROFILE_COLUMNS = `${BASE_PROFILE_COLUMNS},wsc_achievements`;
  const FULL_PROFILE_COLUMNS = `${ID_PROFILE_COLUMNS},${AUTH_PROFILE_COLUMNS}`;

  function isMissingColumnError(error) {
    const message = String(error?.message || "");
    return error?.code === "42703"
      || /wsc_achievements/i.test(message)
      || /last_auth_provider|auth_provider_id|discord_user_id|discord_username|discord_global_name|discord_avatar_url|discord_connected_at|last_sign_in_at/i.test(message);
  }

  async function fetchProfile(client, userId) {
    const response = await client
      .from("alpaca_profiles")
      .select(FULL_PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();
    if (!response.error || !isMissingColumnError(response.error)) {
      return response;
    }

    const idRewardResponse = await client
      .from("alpaca_profiles")
      .select(ID_PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();
    if (!idRewardResponse.error || !isMissingColumnError(idRewardResponse.error)) {
      return idRewardResponse;
    }

    return client
      .from("alpaca_profiles")
      .select(BASE_PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle();
  }

  function fetchProgress(client, userId) {
    return client
      .from("alpaca_progress")
      .select("game_stats,raw_mastered_entries")
      .eq("user_id", userId)
      .maybeSingle();
  }

  function upsertProgress(client, userId, stats, rawMastery) {
    return client
      .from("alpaca_progress")
      .upsert({
        user_id: userId,
        game_stats: stats,
        raw_mastered_entries: rawMastery,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });
  }

  function checkAlpacaNameAvailability(client, alpacaName) {
    return client.rpc("is_alpaca_name_available", { p_alpaca_name: alpacaName });
  }

  function resolveAlpacaLogin(client, alpacaName) {
    return client.rpc("resolve_alpaca_login", { p_alpaca_name: alpacaName });
  }

  async function updateProfile(client, userId, payload) {
    const response = await client
      .from("alpaca_profiles")
      .update(payload)
      .eq("id", userId)
      .select(ID_PROFILE_COLUMNS)
      .maybeSingle();

    if (!response.error || !isMissingColumnError(response.error)) {
      return response;
    }

    const fallbackPayload = { ...payload };
    delete fallbackPayload.wsc_achievements;

    return client
      .from("alpaca_profiles")
      .update(fallbackPayload)
      .eq("id", userId)
      .select(BASE_PROFILE_COLUMNS)
      .maybeSingle();
  }

  async function syncAuthIdentity(client, user) {
    const authService = window.WSC_AUTH_SERVICE || null;
    const payload = authService?.extractAuthIdentity
      ? authService.extractAuthIdentity(user)
      : null;

    if (!payload || !user?.id) {
      return { data: null, error: null, skipped: true };
    }

    const response = await client
      .from("alpaca_profiles")
      .update(payload)
      .eq("id", user.id)
      .select("id")
      .maybeSingle();

    if (isMissingColumnError(response.error)) {
      return { data: null, error: null, skipped: true };
    }

    return response;
  }

  window.WSC_SUPABASE_PROFILE_SERVICE = Object.freeze({
    fetchProfile,
    fetchProgress,
    upsertProgress,
    checkAlpacaNameAvailability,
    resolveAlpacaLogin,
    updateProfile,
    syncAuthIdentity
  });
}());
