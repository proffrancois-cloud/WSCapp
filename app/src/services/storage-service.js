(function () {
  function getJson(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function setJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return { ok: true, key };
    } catch (error) {
      return { ok: false, key, error };
    }
  }

  function remove(key) {
    try {
      window.localStorage.removeItem(key);
      return { ok: true, key };
    } catch (error) {
      return { ok: false, key, error };
    }
  }

  window.WSC_STORAGE_SERVICE = Object.freeze({
    getJson,
    setJson,
    remove
  });
}());
