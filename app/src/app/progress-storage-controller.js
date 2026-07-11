(function () {
  const STATS_KEY = "wsc-alpaca-stats";
  const RAW_MASTERY_KEY = "wsc-alpaca-raw-mastery";

  function createProgressStorageController(options = {}) {
    const storageService = options.storageService || null;
    const progressService = options.progressService || null;

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

    function loadLocalProgress() {
      const statsFallback = progressService?.getDefaultStats ? progressService.getDefaultStats() : {};
      const stats = getJson(STATS_KEY, statsFallback);
      const rawMastery = getJson(RAW_MASTERY_KEY, {});

      return {
        stats: progressService?.normalizeStats ? progressService.normalizeStats(stats) : stats,
        rawMastery: progressService?.normalizeRawMastery ? progressService.normalizeRawMastery(rawMastery) : rawMastery
      };
    }

    function saveLocalProgress(progress = {}) {
      const writes = [
        setJson(STATS_KEY, progress.stats || {}),
        setJson(RAW_MASTERY_KEY, progress.rawMastery || {})
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

    return Object.freeze({
      loadLocalProgress,
      saveLocalProgress
    });
  }

  window.WSC_CREATE_PROGRESS_STORAGE_CONTROLLER = createProgressStorageController;
}());
