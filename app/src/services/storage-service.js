(function () {
  function getJson(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function getText(key, fallback = "") {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? fallback : raw;
    } catch (_error) {
      return fallback;
    }
  }

  function setJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function setText(key, value) {
    window.localStorage.setItem(key, String(value));
  }

  function remove(key) {
    window.localStorage.removeItem(key);
  }

  window.WSC_STORAGE_SERVICE = Object.freeze({
    getJson,
    getText,
    setJson,
    setText,
    remove
  });
}());
