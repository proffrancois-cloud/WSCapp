(function () {
  const SUPABASE_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.1";
  const LOAD_TIMEOUT_MS = 10000;
  let status = window.supabase?.createClient ? "ready" : "loading";
  let timeoutId = null;

  function publish(nextStatus, eventName) {
    status = nextStatus;
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
    window.dispatchEvent(new CustomEvent(eventName));
  }

  const api = {
    get status() {
      return status;
    },
    scriptUrl: SUPABASE_SCRIPT_URL
  };
  window.WSC_SUPABASE_LOADER = Object.freeze(api);

  if (status === "ready") {
    window.queueMicrotask(() => window.dispatchEvent(new CustomEvent("wsc:supabase-ready")));
    return;
  }

  const script = document.createElement("script");
  script.src = SUPABASE_SCRIPT_URL;
  script.async = true;
  script.referrerPolicy = "no-referrer";
  script.addEventListener("load", () => {
    if (window.supabase?.createClient) {
      publish("ready", "wsc:supabase-ready");
    } else {
      publish("unavailable", "wsc:supabase-unavailable");
    }
  }, { once: true });
  script.addEventListener("error", () => publish("unavailable", "wsc:supabase-unavailable"), { once: true });
  document.head.append(script);
  timeoutId = window.setTimeout(() => publish("unavailable", "wsc:supabase-unavailable"), LOAD_TIMEOUT_MS);
}());
