(function () {
  const LEGACY_STATS_KEY = "wsc-alpaca-stats";
  const LEGACY_RAW_MASTERY_KEY = "wsc-alpaca-raw-mastery";
  const STORAGE_PREFIX = "wsc-alpaca-progress:v2";
  const MISSING_VALUE = Object.freeze({ missing: true });

  function createProgressStorageController(options = {}) {
    const storageService = options.storageService || null;
    const progressService = options.progressService || null;
    let activeScope = normalizeScope(options.scope);

    function normalizeScope(value) {
      const normalized = String(value || "guest")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9:_-]+/g, "_")
        .slice(0, 96);
      return normalized || "guest";
    }

    function getScopeKeys(scope = activeScope) {
      const safeScope = normalizeScope(scope);
      return {
        stats: `${STORAGE_PREFIX}:${safeScope}:stats`,
        rawMastery: `${STORAGE_PREFIX}:${safeScope}:raw-mastery`
      };
    }

    function getJson(key, fallback) {
      if (storageService?.getJson) {
        return storageService.getJson(key, fallback);
      }

      try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_error) {
        return fallback;
      }
    }

    function setJson(key, value) {
      if (storageService?.setJson) {
        const result = storageService.setJson(key, value);
        return result && typeof result === "object" ? result : { ok: true, key };
      }

      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return { ok: true, key };
      } catch (error) {
        return { ok: false, key, error };
      }
    }

    function migrateLegacyGuestProgress(keys) {
      if (activeScope !== "guest") {
        return;
      }

      const scopedStats = getJson(keys.stats, MISSING_VALUE);
      const scopedRawMastery = getJson(keys.rawMastery, MISSING_VALUE);
      if (scopedStats !== MISSING_VALUE || scopedRawMastery !== MISSING_VALUE) {
        return;
      }

      const legacyStats = getJson(LEGACY_STATS_KEY, MISSING_VALUE);
      const legacyRawMastery = getJson(LEGACY_RAW_MASTERY_KEY, MISSING_VALUE);
      if (legacyStats !== MISSING_VALUE) {
        setJson(keys.stats, legacyStats);
      }
      if (legacyRawMastery !== MISSING_VALUE) {
        setJson(keys.rawMastery, legacyRawMastery);
      }
    }

    function loadLocalProgress() {
      const statsFallback = progressService?.getDefaultStats ? progressService.getDefaultStats() : {};
      const keys = getScopeKeys();
      migrateLegacyGuestProgress(keys);
      const storedStats = getJson(keys.stats, MISSING_VALUE);
      const storedRawMastery = getJson(keys.rawMastery, MISSING_VALUE);
      const stats = storedStats === MISSING_VALUE ? statsFallback : storedStats;
      const rawMastery = storedRawMastery === MISSING_VALUE ? {} : storedRawMastery;

      return {
        stats: progressService?.normalizeStats ? progressService.normalizeStats(stats) : stats,
        rawMastery: progressService?.normalizeRawMastery ? progressService.normalizeRawMastery(rawMastery) : rawMastery,
        hasStoredProgress: storedStats !== MISSING_VALUE || storedRawMastery !== MISSING_VALUE,
        scope: activeScope
      };
    }

    function saveLocalProgress(progress = {}) {
      const keys = getScopeKeys();
      const writes = [
        setJson(keys.stats, progress.stats || {}),
        setJson(keys.rawMastery, progress.rawMastery || {})
      ];
      const failedKeys = writes
        .filter((result) => !result?.ok)
        .map((result) => result.key);

      return {
        ok: failedKeys.length === 0,
        failedKeys,
        writes
      };
    }

    function setScope(scope) {
      activeScope = normalizeScope(scope);
      return activeScope;
    }

    function getScope() {
      return activeScope;
    }

    return Object.freeze({
      getScope,
      getScopeKeys,
      loadLocalProgress,
      saveLocalProgress,
      setScope
    });
  }

  window.WSC_CREATE_PROGRESS_STORAGE_CONTROLLER = createProgressStorageController;
}());
