(function () {
  function fetchProfile(client, userId) {
    return client
      .from("alpaca_profiles")
      .select("alpaca_name,country,school_name,wsc_event_count,highest_wsc_round")
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

  window.WSC_SUPABASE_PROFILE_SERVICE = Object.freeze({
    fetchProfile,
    fetchProgress,
    upsertProgress
  });
}());
