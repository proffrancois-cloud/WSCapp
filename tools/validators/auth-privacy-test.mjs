import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const repoRoot = resolve(import.meta.dirname, "../..");
const authServicePath = resolve(repoRoot, "app/src/services/auth-service.js");
const profileServicePath = resolve(repoRoot, "app/src/services/supabase-profile-service.js");
const authRendererPath = resolve(repoRoot, "app/src/ui/auth-modal-renderer.js");
const appSourcePath = resolve(repoRoot, "app/app.js");
const alpacapardyRendererPath = resolve(repoRoot, "app/src/modes/play/alpacapardy/alpacapardy-renderer.js");

const sandbox = {
  console,
  window: {
    location: {
      href: "https://wscapp.app/?from=test#hash"
    }
  }
};
sandbox.window.window = sandbox.window;
vm.createContext(sandbox);
vm.runInContext(readFileSync(authServicePath, "utf8"), sandbox, { filename: authServicePath });
vm.runInContext(readFileSync(profileServicePath, "utf8"), sandbox, { filename: profileServicePath });
vm.runInContext(readFileSync(authRendererPath, "utf8"), sandbox, { filename: authRendererPath });

const authService = sandbox.window.WSC_AUTH_SERVICE;
const profileService = sandbox.window.WSC_SUPABASE_PROFILE_SERVICE;
const renderer = sandbox.window.WSC_AUTH_MODAL_RENDERER;

if (!authService || !profileService || !renderer) {
  throw new Error("Auth modules were not registered.");
}

const oauthConfig = authService.getOAuthSignInOptions("discord", "https://wscapp.app/");
if (oauthConfig.provider !== "discord" || oauthConfig.options.redirectTo !== "https://wscapp.app/") {
  throw new Error("Discord OAuth provider options are incorrect.");
}
if (!String(oauthConfig.options.scopes || "").includes("identify") || !String(oauthConfig.options.scopes || "").includes("email")) {
  throw new Error("Discord OAuth scopes should request identify and email.");
}

const discordUser = {
  id: "user-1",
  email: "private@example.test",
  app_metadata: {
    provider: "discord",
    providers: ["discord"]
  },
  user_metadata: {
    provider_id: "123456789",
    user_name: "alpaca_scholar",
    global_name: "Alpaca Scholar",
    avatar_url: "https://cdn.discordapp.com/avatars/123/avatar.png",
    email: "private@example.test"
  }
};
const identity = authService.extractAuthIdentity(discordUser, new Date("2026-07-08T00:00:00.000Z"));

if (identity.last_auth_provider !== "discord") {
  throw new Error("Discord identity should record the provider.");
}
if (identity.discord_user_id !== "123456789" || identity.discord_username !== "alpaca_scholar") {
  throw new Error("Discord identity fields were not extracted.");
}
if ("email" in identity || "user_metadata" in identity) {
  throw new Error("Auth identity payload must not include raw email or raw metadata.");
}

let updatePayload = null;
const fakeClient = {
  from(tableName) {
    if (tableName !== "alpaca_profiles") {
      throw new Error(`Unexpected table ${tableName}.`);
    }
    return {
      update(payload) {
        updatePayload = payload;
        return {
          eq(column, value) {
            if (column !== "id" || value !== discordUser.id) {
              throw new Error("syncAuthIdentity should update the signed-in user's profile.");
            }
            return {
              select() {
                return {
                  maybeSingle: async () => ({ data: { id: discordUser.id }, error: null })
                };
              }
            };
          }
        };
      }
    };
  }
};

await profileService.syncAuthIdentity(fakeClient, discordUser);
if (!updatePayload || updatePayload.discord_user_id !== "123456789" || updatePayload.email) {
  throw new Error("syncAuthIdentity should send a minimal Discord analytics payload.");
}

const loginHtml = renderer.renderLoginForm({
  busy: false,
  oauthProviders: [authService.oauthProviders.discord]
}, {
  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});

if (!loginHtml.includes('data-auth-oauth="discord"') || !loginHtml.includes("Continue with Discord")) {
  throw new Error("Login form should render the Discord OAuth button.");
}

const appSource = readFileSync(appSourcePath, "utf8");
const alpacapardyRendererSource = readFileSync(alpacapardyRendererPath, "utf8");
if (appSource.includes("signInAnonymously")) {
  throw new Error("Multiplayer must not silently create anonymous Supabase sessions.");
}
if (/Devalpacc?a/i.test(appSource)) {
  throw new Error("Multiplayer must not expose the legacy Devalpacca default account.");
}
if (/MULTIPLAYER_ALLOWED_EMAILS|MULTIPLAYER_ALLOWED_EMAIL_DOMAINS/.test(appSource)) {
  throw new Error("Multiplayer must not use legacy email/domain allowlists.");
}
if (/admin test accounts|approved school domains|approved Alpaccount/.test(`${appSource}\n${alpacapardyRendererSource}`)) {
  throw new Error("Multiplayer locked-state copy should not describe a legacy account allowlist.");
}

console.log(JSON.stringify({
  provider: oauthConfig.provider,
  fields: Object.keys(identity).sort(),
  renderer: "discord-button"
}, null, 2));
