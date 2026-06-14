import { toCampusPublicUrl } from "./public-url";

const SUPABASE_SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.108.1";

const CAMPUS_CONTENT_SCRIPT_PATHS = [
  "generated/current-runtime/data.js",
  "generated/current-runtime/knowledge-bank.js",
  "generated/current-runtime/raw-content-bank.js",
  "generated/current-runtime/content/alpacards.js",
  "generated/current-runtime/alpaca-channel.js",
  "content/debate/debate-lab-data.js",
  "src/app/app-dom-service.js",
  "src/features/campus-shared/data/content-bridge.js"
] as const;

const scriptPromises = new Map<string, Promise<boolean>>();
let campusContentPromise: Promise<boolean> | null = null;
let supabaseRealtimePromise: Promise<boolean> | null = null;

declare global {
  interface Window {
    WSC_CAMPUS_3D_SHELL_VISIBLE?: boolean;
    WSC_CAMPUS_CONTENT_LOADING?: boolean;
    WSC_CAMPUS_CONTENT_READY?: boolean;
    WSC_CAMPUS_SUPABASE_LOADING?: boolean;
    WSC_CAMPUS_SUPABASE_READY?: boolean;
    supabase?: {
      createClient?: (url: string, key: string) => unknown;
    };
  }
}

function loadClassicScript(src: string): Promise<boolean> {
  const existingPromise = scriptPromises.get(src);
  if (existingPromise) {
    return existingPromise;
  }

  const existingScript = Array.from(document.scripts).find((script) => script.src === src);
  if (existingScript?.dataset.wscLoaded === "true") {
    return Promise.resolve(true);
  }

  const promise = new Promise<boolean>((resolve) => {
    const script = existingScript || document.createElement("script");
    script.async = false;
    script.src = src;
    script.dataset.wscCampusRuntime = "true";

    script.addEventListener("load", () => {
      script.dataset.wscLoaded = "true";
      resolve(true);
    }, { once: true });

    script.addEventListener("error", () => {
      resolve(false);
    }, { once: true });

    if (!existingScript) {
      document.body.appendChild(script);
    }
  });

  scriptPromises.set(src, promise);
  return promise;
}

export function ensureSupabaseRealtimeLoaded(): Promise<boolean> {
  if (window.supabase?.createClient) {
    window.WSC_CAMPUS_SUPABASE_READY = true;
    return Promise.resolve(true);
  }

  if (!supabaseRealtimePromise) {
    window.WSC_CAMPUS_SUPABASE_LOADING = true;
    supabaseRealtimePromise = loadClassicScript(SUPABASE_SCRIPT_SRC).then((loaded) => {
      const ready = loaded && Boolean(window.supabase?.createClient);
      window.WSC_CAMPUS_SUPABASE_LOADING = false;
      window.WSC_CAMPUS_SUPABASE_READY = ready;
      return ready;
    });
  }

  return supabaseRealtimePromise;
}

export function ensureCampusContentLoaded(): Promise<boolean> {
  if (window.WSC_ALPACA_CAMPUS_CONTENT) {
    window.WSC_CAMPUS_CONTENT_READY = true;
    return Promise.resolve(true);
  }

  if (!campusContentPromise) {
    window.WSC_CAMPUS_CONTENT_LOADING = true;
    campusContentPromise = CAMPUS_CONTENT_SCRIPT_PATHS.reduce(
      (chain, path) => chain.then((ok) =>
        ok ? loadClassicScript(toCampusPublicUrl(path)) : Promise.resolve(false)
      ),
      Promise.resolve(true)
    ).then((loaded) => {
      const ready = loaded && Boolean(window.WSC_ALPACA_CAMPUS_CONTENT);
      window.WSC_CAMPUS_CONTENT_LOADING = false;
      window.WSC_CAMPUS_CONTENT_READY = ready;
      return ready;
    });
  }

  return campusContentPromise;
}
