(function () {
  function createResult(ok, key, error = null) {
    return { ok, key, error: error ? String(error.message || error) : "" };
  }

  function createStorageService({ storageTarget = window.localStorage } = {}) {
    function getJson(key, fallback = null) {
      try {
        const raw = storageTarget.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_error) {
        return fallback;
      }
    }

    function getText(key, fallback = "") {
      try {
        const raw = storageTarget.getItem(key);
        return raw === null ? fallback : raw;
      } catch (_error) {
        return fallback;
      }
    }

    function setJson(key, value) {
      try {
        storageTarget.setItem(key, JSON.stringify(value));
        return createResult(true, key);
      } catch (error) {
        return createResult(false, key, error);
      }
    }

    function setText(key, value) {
      try {
        storageTarget.setItem(key, String(value));
        return createResult(true, key);
      } catch (error) {
        return createResult(false, key, error);
      }
    }

    function remove(key) {
      try {
        storageTarget.removeItem(key);
        return createResult(true, key);
      } catch (error) {
        return createResult(false, key, error);
      }
    }

    return Object.freeze({
      getJson,
      getText,
      setJson,
      setText,
      remove
    });
  }

  window.WSC_CREATE_STORAGE_SERVICE = createStorageService;
  window.WSC_STORAGE_SERVICE = createStorageService();
}());
