(function () {
  const STORAGE_KEYS = Object.freeze({
    stats: "wsc-alpaca-stats",
    rawMastery: "wsc-alpaca-raw-mastery",
    guestName: "wsc-live-guest-name"
  });

  function createProgressStorageController({
    storageService = window.WSC_STORAGE_SERVICE,
    progressService = window.WSC_PROGRESS_SERVICE,
    entryService = window.WSC_APP_ENTRY_SERVICE
  } = {}) {
    function createResult(ok, key, error = "") {
      return { ok, key, error: error ? String(error.message || error) : "" };
    }

    function getDefaultStats() {
      return progressService?.getDefaultStats
        ? progressService.getDefaultStats()
        : {
            sessions: 0,
            totalAnswered: 0,
            totalCorrect: 0,
            bestAccuracy: 0,
            bestStreak: 0,
            bestAlpacapardyScore: 0,
            bestRunStage: -1,
            bestJumpScore: 0,
            bestJumpDistance: 0,
            bestRelayScore: 0,
            bestRaceScore: 0,
            liveRecords: {}
          };
    }

    function normalizeStats(value) {
      return progressService?.normalizeStats
        ? progressService.normalizeStats(value)
        : { ...getDefaultStats(), ...(value && typeof value === "object" ? value : {}) };
    }

    function normalizeRawMastery(value) {
      return progressService?.normalizeRawMastery
        ? progressService.normalizeRawMastery(value)
        : normalizeRawMasteryFallback(value);
    }

    function normalizeRawMasteryFallback(value) {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
      }

      return Object.fromEntries(
        Object.entries(value)
          .filter(([key, entryValue]) => key && entryValue === true)
          .map(([key]) => [key, true])
      );
    }

    function getJson(key, fallback) {
      if (storageService?.getJson) {
        return storageService.getJson(key, fallback);
      }

      return fallback;
    }

    function setJson(key, value) {
      if (storageService?.setJson) {
        return storageService.setJson(key, value);
      }

      return createResult(false, key, "Storage service is unavailable.");
    }

    function getText(key, fallback = "") {
      if (storageService?.getText) {
        return storageService.getText(key, fallback);
      }

      return fallback;
    }

    function setText(key, value) {
      if (storageService?.setText) {
        return storageService.setText(key, value);
      }

      return createResult(false, key, "Storage service is unavailable.");
    }

    function loadStats() {
      return normalizeStats(getJson(STORAGE_KEYS.stats, getDefaultStats()));
    }

    function loadRawMastery() {
      return normalizeRawMastery(getJson(STORAGE_KEYS.rawMastery, {}));
    }

    function loadGuestAlpacaName() {
      const fallback = entryService?.getOnlineAlpacaName
        ? entryService.getOnlineAlpacaName()
        : "Devalpacca";
      const normalizedCurrent = String(getText(STORAGE_KEYS.guestName, "") || "").trim();

      if (normalizedCurrent.length >= 2 && !/^Guest\s+\d{4}$/i.test(normalizedCurrent)) {
        return normalizedCurrent;
      }

      try {
        setText(STORAGE_KEYS.guestName, fallback);
      } catch (_error) {
        return fallback;
      }
      return fallback;
    }

    function saveLocalProgress(appState) {
      const results = [
        setJson(STORAGE_KEYS.stats, appState.stats),
        setJson(STORAGE_KEYS.rawMastery, appState.rawMastery)
      ];
      return {
        ok: results.every((result) => result?.ok),
        results,
        failedKeys: results.filter((result) => !result?.ok).map((result) => result?.key).filter(Boolean)
      };
    }

    async function saveRemoteProgress({
      client,
      user,
      stats,
      rawMastery,
      profileService = null,
      isAnonymousUser = () => false
    } = {}) {
      if (!client || !user || isAnonymousUser(user)) {
        return { ok: false, skipped: true };
      }

      try {
        if (profileService?.upsertProgress) {
          await profileService.upsertProgress(client, user.id, stats, rawMastery);
        } else {
          await client
            .from("alpaca_progress")
            .upsert({
              user_id: user.id,
              game_stats: stats,
              raw_mastered_entries: rawMastery,
              updated_at: new Date().toISOString()
            }, { onConflict: "user_id" });
        }
        return { ok: true, skipped: false };
      } catch (error) {
        // Local progress remains available if the Supabase progress table is not installed yet.
        return { ok: false, skipped: false, error: String(error?.message || error) };
      }
    }

    return Object.freeze({
      STORAGE_KEYS,
      getDefaultStats,
      normalizeStats,
      normalizeRawMastery,
      loadStats,
      loadRawMastery,
      loadGuestAlpacaName,
      saveLocalProgress,
      saveRemoteProgress
    });
  }

  window.WSC_CREATE_PROGRESS_STORAGE_CONTROLLER = createProgressStorageController;
}());
