import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const repoRoot = resolve(import.meta.dirname, "../..");
const readApp = (path) => readFileSync(resolve(repoRoot, "app", path), "utf8");
const serviceSource = readApp("src/services/auth-service.js");
const rendererSource = readApp("src/ui/auth-modal-renderer.js");
const appSource = readApp("src/app/app-main.js");
const handlerStart = appSource.indexOf("async function connectWithOAuthProvider(provider) {");
const handlerEnd = appSource.indexOf("\nasync function sendPasswordReset(", handlerStart);
assert.ok(handlerStart >= 0 && handlerEnd > handlerStart, "OAuth handler boundaries must exist.");
const handlerSource = appSource.slice(handlerStart, handlerEnd);
const config = { url: "https://project.supabase.co/", publishableKey: "test-publishable-key" };
const settingsResponse = (body = { external: { google: true, discord: true } }) => ({
  ok: true,
  json: async () => body
});
const deferred = () => {
  let resolvePromise;
  const promise = new Promise((resolve) => { resolvePromise = resolve; });
  return { promise, resolve: resolvePromise };
};

function makeHarness(fetchResponse = () => settingsResponse(), signIn = async () => ({ error: null })) {
  const requests = [];
  const sdkCalls = [];
  const renders = [];
  const timers = new Map();
  const scheduled = [];
  const cleared = [];
  const state = { auth: { status: "ready", error: "Previous error", message: "Previous notice" }, ui: { authOpen: true } };
  const window = {
    location: { href: "https://wscapp.app/?from=test#private-fragment" },
    fetch(url, options) {
      requests.push({ url, options, receiver: this });
      return fetchResponse(url, options);
    }
  };
  const sandbox = vm.createContext({
    window, URL, URLSearchParams, AbortController,
    setTimeout(callback, delay) {
      const id = scheduled.length + 1;
      scheduled.push({ id, delay });
      timers.set(id, callback);
      return id;
    },
    clearTimeout(id) { cleared.push(id); timers.delete(id); },
    state,
    SUPABASE_URL: config.url,
    SUPABASE_PUBLISHABLE_KEY: config.publishableKey,
    clearAuthNotice() { state.auth.error = ""; state.auth.message = ""; },
    getSupabaseClient: () => ({ auth: { signInWithOAuth: async (options) => {
      sdkCalls.push(JSON.parse(JSON.stringify(options)));
      return signIn(options);
    } } }),
    syncAuthChrome() {
      const html = window.WSC_AUTH_MODAL_RENDERER.renderModal({
        ...state.auth, isOpen: state.ui.authOpen, mode: "login",
        busy: state.auth.status === "submitting",
        oauthProviders: Object.values(window.WSC_AUTH_SERVICE.oauthProviders)
      }, { escapeHtml: (value) => String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`) });
      renders.push({ status: state.auth.status, html });
    }
  });
  vm.runInContext(serviceSource, sandbox, { filename: "auth-service.js" });
  vm.runInContext(rendererSource, sandbox, { filename: "auth-modal-renderer.js" });
  const service = window.WSC_AUTH_SERVICE;
  sandbox.appAuthService = service;
  sandbox.getCurrentRedirectUrl = () => service.getCurrentRedirectUrl();
  vm.runInContext(handlerSource, sandbox, { filename: "connectWithOAuthProvider.js" });
  return { service, sandbox, state, requests, sdkCalls, renders, timers, scheduled, cleared, window,
    connect: sandbox.connectWithOAuthProvider };
}

function assertTimerCleaned(harness) {
  assert.equal(harness.timers.size, 0, "No OAuth preflight timer may survive completion.");
  assert.deepEqual(harness.cleared, harness.scheduled.map(({ id }) => id));
  assert.ok(harness.scheduled.every(({ delay }) => delay === 8000), "Preflight must time out after 8 seconds.");
}

for (const provider of [" Google ", "DISCORD"]) {
  const h = makeHarness();
  await h.service.assertOAuthProviderEnabled(provider, config);
  assert.equal(h.requests.length, 1);
  const { url, options, receiver } = h.requests[0];
  assert.equal(url, "https://project.supabase.co/auth/v1/settings");
  assert.equal(receiver, h.window, "Default fetch must stay bound to window.");
  assert.equal(options.method, "GET");
  assert.deepEqual({ ...options.headers }, { apikey: config.publishableKey });
  assert.equal(options.credentials, "omit");
  assert.equal(options.cache, "no-store");
  assert.ok(options.signal instanceof AbortSignal);
  assert.equal(options.signal.aborted, false);
  assertTimerCleaned(h);
}

const failures = [
  ["disabled", () => settingsResponse({ external: { google: false } })],
  ["missing provider", () => settingsResponse({ external: { discord: true } })],
  ["missing settings", () => settingsResponse(null)],
  ["missing external", () => settingsResponse({})],
  ["null external", () => settingsResponse({ external: null })],
  ["array external", () => settingsResponse({ external: [] })],
  ["string enabled", () => settingsResponse({ external: { google: "true" } })],
  ["numeric enabled", () => settingsResponse({ external: { google: 1 } })],
  ["null enabled", () => settingsResponse({ external: { google: null } })],
  ["HTTP failure", () => ({ ...settingsResponse(), ok: false, status: 400 })],
  ["invalid JSON", () => ({ ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } })],
  ["network rejection", () => Promise.reject(new Error("Network unavailable"))]
];
for (const [name, fetchResponse] of failures) {
  const h = makeHarness(fetchResponse);
  await assert.rejects(h.service.assertOAuthProviderEnabled("google", config), /Google.*email/i, name);
  assert.equal(h.requests.length, 1, name);
  assertTimerCleaned(h);
}

for (const provider of ["github", "", null, "constructor", "__proto__"]) {
  const h = makeHarness();
  await assert.rejects(h.service.assertOAuthProviderEnabled(provider, config), /provider/i);
  assert.equal(h.requests.length, 0, "Unknown providers must not make a settings request.");
  assert.equal(h.scheduled.length, 0);
}
for (const invalidConfig of [
  undefined, null, {}, { ...config, url: "not-a-url" }, { ...config, url: "ftp://project.test" },
  { ...config, url: "https://user:password@project.test" }, { ...config, url: `${config.url}?private=value` },
  { ...config, url: `${config.url}#fragment` }, { ...config, publishableKey: " " },
  { ...config, publishableKey: 123 }
]) {
  const h = makeHarness();
  await assert.rejects(h.service.assertOAuthProviderEnabled("google", invalidConfig), /email/i);
  assert.equal(h.requests.length, 0, "Invalid configuration must not make a settings request.");
  assert.equal(h.scheduled.length, 0);
}
{
  const h = makeHarness();
  await assert.rejects(h.service.assertOAuthProviderEnabled("google", config, null), /email/i);
  assert.equal(h.requests.length, 0);
  assert.equal(h.scheduled.length, 0);
  let injectedCalls = 0;
  await h.service.assertOAuthProviderEnabled("google", config, async () => {
    injectedCalls += 1;
    return settingsResponse();
  });
  assert.equal(injectedCalls, 1, "An injected fetch must be used instead of the browser fetch.");
  assert.equal(h.requests.length, 0);
  assertTimerCleaned(h);
}
for (const target of ["service", "handler"]) {
  const h = makeHarness((_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(new Error("Aborted")), { once: true });
  }));
  const completed = target === "service"
    ? assert.rejects(h.service.assertOAuthProviderEnabled("google", config), /Google.*email/i)
    : h.connect("google");
  assert.equal(h.timers.size, 1);
  [...h.timers.values()][0]();
  await completed;
  assert.equal(h.requests[0].options.signal.aborted, true);
  if (target === "handler") {
    assert.equal(h.state.auth.status, "ready", "A timed-out preflight must restore the login form.");
    assert.match(h.state.auth.error, /Google.*email/i);
    assert.equal(h.sdkCalls.length, 0);
  }
  assertTimerCleaned(h);
}

for (const provider of [" Google ", "DISCORD"]) {
  const h = makeHarness();
  await h.connect(provider);
  const normalized = provider.trim().toLowerCase();
  assert.deepEqual(h.sdkCalls, [{ provider: normalized, options: {
    redirectTo: "https://wscapp.app/", ...(normalized === "discord" ? { scopes: "identify email" } : {})
  } }], "Enabled providers must preserve OAuth options and the clean redirect URL.");
  assert.equal(h.state.auth.status, "submitting", "Keep redirecting sign-in busy.");
  assert.equal(h.state.auth.error, "");
  assert.equal(h.state.auth.message, "");
  assertTimerCleaned(h);
}

for (const [name, fetchResponse] of failures) {
  const h = makeHarness(fetchResponse);
  await h.connect("google");
  assert.equal(h.sdkCalls.length, 0, `${name}: failed preflight must never reach the OAuth SDK.`);
  assert.equal(h.state.auth.status, "ready", name);
  assert.equal(h.state.ui.authOpen, true, name);
  assert.match(h.state.auth.error, /Google.*email/i, name);
  assert.match(h.renders.at(-1).html, /class="auth-notice error"[^>]*>[^<]*email/i, name);
  assert.match(h.renders.at(-1).html, /name="identifier"/, "Email login must remain available.");
  assert.doesNotMatch(h.renders.at(-1).html, /\sdisabled\b/, "Login controls must become usable again.");
  assert.deepEqual(h.renders.map(({ status }) => status), ["submitting", "ready"]);
  assertTimerCleaned(h);
}

for (const failureMode of ["returned error", "thrown error"]) {
  let attempts = 0;
  const h = makeHarness(undefined, async () => {
    if (++attempts > 1) return { error: null };
    const error = new Error("OAuth SDK unavailable");
    if (failureMode === "thrown error") throw error;
    return { error };
  });
  await h.connect("google");
  assert.equal(h.state.auth.status, "ready", failureMode);
  assert.match(h.state.auth.error, /OAuth SDK unavailable/);
  await h.connect("google");
  assert.equal(h.sdkCalls.length, 2, "The user must be able to retry after an SDK failure.");
  assert.equal(h.state.auth.status, "submitting");
  assert.equal(h.state.auth.error, "");
  assertTimerCleaned(h);
}

for (const missingDependency of ["client", "service", "preflight"]) {
  const h = makeHarness();
  if (missingDependency === "client") h.sandbox.getSupabaseClient = () => null;
  if (missingDependency === "service") h.sandbox.appAuthService = null;
  if (missingDependency === "preflight") h.sandbox.appAuthService = {};
  await h.connect("google");
  assert.equal(h.state.auth.status, "ready", `${missingDependency}: restore the login form.`);
  assert.match(h.state.auth.error, /sign-in service is unavailable/i);
  assert.equal(h.requests.length, 0);
  assert.equal(h.sdkCalls.length, 0);
  assert.doesNotMatch(h.renders.at(-1).html, /\sdisabled\b/);
  assertTimerCleaned(h);
}

{
  const preflight = deferred();
  const sdkStarted = deferred();
  const sdkResult = deferred();
  const h = makeHarness(() => preflight.promise, () => {
    sdkStarted.resolve();
    return sdkResult.promise;
  });
  const firstClick = h.connect("google");
  await h.connect("discord");
  assert.equal(h.requests.length, 1, "Double clicks must share one in-flight preflight.");
  assert.equal(h.sdkCalls.length, 0, "The SDK must wait for successful preflight.");
  preflight.resolve(settingsResponse());
  await sdkStarted.promise;
  await h.connect("google");
  assert.equal(h.sdkCalls.length, 1, "Double clicks during SDK sign-in must not start another flow.");
  assert.equal(h.requests.length, 1);
  sdkResult.resolve({ error: null });
  await firstClick;
  assert.equal(h.sdkCalls[0].provider, "google");
  assert.equal(h.renders.length, 1);
  assertTimerCleaned(h);
}

console.log("OAuth provider preflight: enabled providers, safe failures, timeout cleanup, modal recovery and double-click protection passed.");
