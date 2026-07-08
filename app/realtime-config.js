(function () {
  const STORAGE_MODE_KEY = "wscCampus2dRealtimeTransport";
  const cloudflareHosts = ["wscapp.app", "www.wscapp.app"];

  function readModeOverride() {
    try {
      const value = window.localStorage.getItem(STORAGE_MODE_KEY);
      return ["auto", "cloudflare", "supabase"].includes(value) ? value : "";
    } catch (_error) {
      return "";
    }
  }

  window.WSC_CAMPUS_2D_REALTIME_CONFIG = Object.freeze({
    mode: readModeOverride() || "auto",
    cloudflareEndpoint: "wss://realtime.wscapp.app/room",
    cloudflareHosts,
    fallbackToSupabase: true
  });
}());
