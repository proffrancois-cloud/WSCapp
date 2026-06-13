import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const repoRoot = resolve(import.meta.dirname, "../..");
const authControllerPath = resolve(repoRoot, "app/src/app/auth-controller.js");
const source = readFileSync(authControllerPath, "utf8");

const sandbox = {
  console,
  window: {}
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: authControllerPath });

const createAuthController = sandbox.WSC_CREATE_AUTH_CONTROLLER;
if (typeof createAuthController !== "function") {
  throw new Error("WSC_CREATE_AUTH_CONTROLLER was not registered.");
}

function createFormData(entries) {
  const values = new Map(Object.entries(entries));
  return {
    get(name) {
      return values.get(name) ?? null;
    }
  };
}

function createAppState() {
  return {
    auth: {
      client: null,
      error: "",
      message: "",
      profile: null,
      session: null,
      status: "ready"
    },
    ui: {
      appShellMode: null,
      authMode: "login",
      authOpen: true
    },
    live: {}
  };
}

function createController({ client, profileService = {} }) {
  const appState = createAppState();
  const controller = createAuthController({
    appState,
    config: { url: "https://example.supabase.co", publishableKey: "publishable" },
    authService: {
      hasConfig: () => true,
      normalizeAlpacaName: (value) => String(value || "").trim().toLowerCase(),
      getCurrentRedirectUrl: () => "https://example.test/",
      createClient: () => client
    },
    profileService: {
      fetchProfile: async () => ({ data: null, error: null }),
      fetchProgress: async () => ({ data: null, error: null }),
      upsertProgress: async () => ({ error: null }),
      ...profileService
    },
    supabaseGlobal: {},
    callbacks: {
      syncAuthChrome: () => {},
      resetLiveState: () => {},
      renderExperience: () => {}
    }
  });

  return { appState, controller };
}

async function assertRejectsWith(label, action, expectedMessage) {
  try {
    await action();
  } catch (error) {
    if (!String(error.message || "").includes(expectedMessage)) {
      throw new Error(`${label} rejected with unexpected message: ${error.message}`);
    }
    return;
  }

  throw new Error(`${label} should have rejected.`);
}

let signInCalls = 0;
let resetCalls = 0;
let signUpCalls = 0;
let availabilityCalls = 0;

const fakeClient = {
  auth: {
    signInWithPassword: async () => {
      signInCalls += 1;
      return { data: { session: { user: { email: "alpaca@example.test" } } }, error: null };
    },
    resetPasswordForEmail: async () => {
      resetCalls += 1;
      return { error: null };
    },
    signUp: async () => {
      signUpCalls += 1;
      return { data: { session: null }, error: null };
    }
  }
};

const profileService = {
  checkAlpacaNameAvailability: async () => {
    availabilityCalls += 1;
    throw new Error("Name availability should not be checked by signup.");
  },
  resolveAlpacaLogin: async () => {
    throw new Error("Alpaca-name login lookup should not be called.");
  }
};

const { controller } = createController({ client: fakeClient, profileService });

await assertRejectsWith(
  "alpaca-name sign-in",
  () => controller.connect(createFormData({ email: "devalpacca", password: "secret" }), fakeClient),
  "email address"
);

await assertRejectsWith(
  "alpaca-name reset",
  () => controller.sendPasswordReset(createFormData({ email: "devalpacca" }), fakeClient),
  "email address"
);

await controller.connect(createFormData({ email: "alpaca@example.test", password: "secret" }), fakeClient);
await controller.sendPasswordReset(createFormData({ email: "alpaca@example.test" }), fakeClient);
await controller.createAccount(createFormData({
  email: "new@example.test",
  alpaca_name: "new_alpaca",
  password: "secret1",
  country: "France",
  school_name: "WSC School",
  wsc_event_count: "1",
  highest_wsc_round: "regional_round"
}), fakeClient);

const report = {
  signInCalls,
  resetCalls,
  signUpCalls,
  availabilityCalls
};

console.log(JSON.stringify(report, null, 2));

if (signInCalls !== 1 || resetCalls !== 1 || signUpCalls !== 1 || availabilityCalls !== 0) {
  process.exitCode = 1;
}
