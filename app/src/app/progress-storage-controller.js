(function () {
  const STORAGE_KEYS = Object.freeze({
    stats: "wsc-alpaca-stats",
    rawMastery: "wsc-alpaca-raw-mastery",
    guestName: "wsc-live-guest-name"
  });

  function createProgressStorageController({
    storageService = window.WSC_STORAGE_SERVICE,
    progressService = window.WSC_PROGRESS_SERVICE,
    entryService = window.WSC_APP_ENTRY_SERVICE,
    localStorageTarget = window.localStorage
  } = {}) {
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

      try {
        const raw = localStorageTarget.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_error) {
        return fallback;
      }
    }

    function setJson(key, value) {
      if (storageService?.setJson) {
        storageService.setJson(key, value);
        return;
      }

      localStorageTarget.setItem(key, JSON.stringify(value));
    }

    function getText(key, fallback = "") {
      if (storageService?.getText) {
        return storageService.getText(key, fallback);
      }

      try {
        const raw = localStorageTarget.getItem(key);
        return raw === null ? fallback : raw;
      } catch (_error) {
        return fallback;
      }
    }

    function setText(key, value) {
      if (storageService?.setText) {
        storageService.setText(key, value);
        return;
      }

      localStorageTarget.setItem(key, String(value));
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
      setJson(STORAGE_KEYS.stats, appState.stats);
      setJson(STORAGE_KEYS.rawMastery, appState.rawMastery);
    }

    return Object.freeze({
      STORAGE_KEYS,
      getDefaultStats,
      normalizeStats,
      normalizeRawMastery,
      loadStats,
      loadRawMastery,
      loadGuestAlpacaName,
      saveLocalProgress
    });
  }

  window.WSC_CREATE_PROGRESS_STORAGE_CONTROLLER = createProgressStorageController;
}());
