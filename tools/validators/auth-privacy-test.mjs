import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";
import "./oauth-provider-test.mjs";

const repoRoot = resolve(import.meta.dirname, "../..");
const authServicePath = resolve(repoRoot, "app/src/services/auth-service.js");
const profileServicePath = resolve(repoRoot, "app/src/services/supabase-profile-service.js");
const authRendererPath = resolve(repoRoot, "app/src/ui/auth-modal-renderer.js");
const appSourcePath = resolve(repoRoot, "app/src/app/app-main.js");
const stylesPath = resolve(repoRoot, "app/styles-online-overrides.css");
const alpacapardyRendererPath = resolve(repoRoot, "app/src/modes/play/alpacapardy/alpacapardy-renderer.js");
const alpaccountsSqlPath = resolve(repoRoot, "app/supabase/alpaccounts.sql");

const sandbox = {
  console,
  URLSearchParams,
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

const discordOauthConfig = authService.getOAuthSignInOptions("discord", "https://wscapp.app/");
if (discordOauthConfig.provider !== "discord" || discordOauthConfig.options.redirectTo !== "https://wscapp.app/") {
  throw new Error("Discord OAuth provider options are incorrect.");
}
if (!String(discordOauthConfig.options.scopes || "").includes("identify") || !String(discordOauthConfig.options.scopes || "").includes("email")) {
  throw new Error("Discord OAuth scopes should request identify and email.");
}
const googleOauthConfig = authService.getOAuthSignInOptions("google", "https://wscapp.app/");
if (googleOauthConfig.provider !== "google" || googleOauthConfig.options.redirectTo !== "https://wscapp.app/") {
  throw new Error("Google OAuth provider options are incorrect.");
}
if ("scopes" in googleOauthConfig.options) {
  throw new Error("Google OAuth should use Supabase's default Google scopes unless explicitly needed.");
}
if (!authService.oauthProviders.google?.iconSrc?.includes("google%20signup.png")) {
  throw new Error("Google OAuth should use the provided google signup mascot icon.");
}

if (!authService.isPasswordRecoveryRedirect({
  search: "",
  hash: "#access_token=test-token&refresh_token=test-refresh&type=recovery"
})) {
  throw new Error("Password recovery redirects in the URL hash should open the reset-password UI.");
}
if (!authService.isPasswordRecoveryRedirect({
  search: "?code=test-code&type=recovery",
  hash: ""
})) {
  throw new Error("Password recovery redirects in the URL query should open the reset-password UI.");
}
if (authService.isPasswordRecoveryRedirect({
  search: "?type=signup",
  hash: "#access_token=test-token"
})) {
  throw new Error("Non-recovery auth redirects must not open the reset-password UI.");
}

const testUserId = "user-1";
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
            if (column !== "id" || value !== testUserId) {
              throw new Error("updateProfile should update only the signed-in user's profile.");
            }
            return {
              select() {
                return {
                  maybeSingle: async () => ({ data: { id: testUserId }, error: null })
                };
              }
            };
          }
        };
      }
    };
  }
};

await profileService.updateProfile(fakeClient, testUserId, {
  alpaca_name: "realalpaca",
  country: "France",
  school_name: "WSC Test School",
  wsc_event_count: 2,
  highest_wsc_round: "global_round",
  wsc_achievements: []
});
if (!updatePayload || updatePayload.alpaca_name !== "realalpaca" || updatePayload.school_name !== "WSC Test School") {
  throw new Error("updateProfile should update public Alpaccount profile fields.");
}

const loginHtml = renderer.renderLoginForm({
  busy: false,
  oauthProviders: [authService.oauthProviders.discord, authService.oauthProviders.google]
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
if (!loginHtml.includes('data-auth-oauth="google"') || !loginHtml.includes("Continue with Google") || !loginHtml.includes("google%20signup.png")) {
  throw new Error("Login form should render the Google OAuth button with the provided icon.");
}

const recoveryHtml = renderer.renderBody({
  mode: "reset",
  signedIn: true,
  busy: false
}, {
  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});
if (!recoveryHtml.includes('data-auth-form="reset"') || recoveryHtml.includes("alpaccount-profile-card")) {
  throw new Error("Password recovery sessions should show the reset form even though Supabase signs the user in temporarily.");
}

const signupHtml = renderer.renderSignupForm({
  busy: false,
  oauthProviders: [authService.oauthProviders.discord, authService.oauthProviders.google],
  roundOptions: [
    { value: "none_yet", label: "None yet" },
    { value: "regional_round", label: "Regional Round" }
  ],
  rewardOptions: [
    { value: "none_yet", label: "No medal or trophy yet" },
    { value: "gold-medal", label: "Gold medal" }
  ]
}, {
  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});

if (signupHtml.includes('<option value="">Choose a round</option>')) {
  throw new Error("Signup should default the WSC round to None yet for first-time participants.");
}
if (!signupHtml.includes("City for that reward <em>optional</em>") || !signupHtml.includes('placeholder="N/A"')) {
  throw new Error("Signup reward city must be visibly optional with an N/A fallback.");
}
if (!signupHtml.includes("Approximate date <em>optional</em>") || !signupHtml.includes('placeholder="Not sure"')) {
  throw new Error("Signup reward date must be visibly optional with a Not sure fallback.");
}
if (!signupHtml.includes('data-auth-oauth="discord"') || !signupHtml.includes('data-auth-oauth="google"')) {
  throw new Error("Signup form should offer Discord and Google OAuth on the same provider row.");
}

const completeProfileHtml = renderer.renderCompleteProfileForm({
  busy: false,
  profile: {
    alpaca_name: "alpaca_ea97a8c30d184673819e1f9f",
    country: "Unknown",
    school_name: "Unknown school",
    wsc_event_count: 0,
    highest_wsc_round: "none_yet",
    wsc_achievements: []
  },
  roundOptions: [
    { value: "none_yet", label: "None yet" },
    { value: "regional_round", label: "Regional Round" }
  ],
  rewardOptions: [
    { value: "none_yet", label: "No medal or trophy yet" },
    { value: "gold-medal", label: "Gold medal" }
  ]
}, {
  escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});

if (!completeProfileHtml.includes('data-auth-form="complete-profile"')) {
  throw new Error("Discord OAuth users with generated profiles should get a completion form.");
}
if (completeProfileHtml.includes("alpaca_ea97a8c30d184673819e1f9f") || completeProfileHtml.includes("Unknown school")) {
  throw new Error("Profile completion must not prefill generated alpaca IDs or placeholder school values.");
}
if (completeProfileHtml.includes('name="email"') || completeProfileHtml.includes('type="password"')) {
  throw new Error("Profile completion should not ask OAuth users for email or password again.");
}
if (!completeProfileHtml.includes('name="school_name"') || !completeProfileHtml.includes('name="wsc_id_reward_type"')) {
  throw new Error("Profile completion should collect school and WSC reward details.");
}

const appSource = readFileSync(appSourcePath, "utf8");
const stylesSource = readFileSync(stylesPath, "utf8");
const alpacapardyRendererSource = readFileSync(alpacapardyRendererPath, "utf8");
const authRendererSource = readFileSync(authRendererPath, "utf8");
const alpaccountsSqlSource = readFileSync(alpaccountsSqlPath, "utf8");
if (typeof profileService.syncAuthIdentity === "function"
  || typeof authService.extractAuthIdentity === "function"
  || appSource.includes("syncAlpacaAuthIdentity")) {
  throw new Error("OAuth identity metadata must be synchronized by the trusted auth.users trigger, not by client-writable profile updates.");
}
if (!alpaccountsSqlSource.includes("create trigger sync_alpaca_profile_auth_identity")
  || !alpaccountsSqlSource.includes("after insert or update of raw_app_meta_data, raw_user_meta_data, email, last_sign_in_at on auth.users")
  || /grant\s+select\s*,\s*update\s+on\s+public\.alpaca_profiles/i.test(alpaccountsSqlSource)
  || !/grant\s+update\s*\([\s\S]*?alpaca_name[\s\S]*?wsc_achievements[\s\S]*?\)\s+on\s+public\.alpaca_profiles\s+to\s+authenticated/i.test(alpaccountsSqlSource)) {
  throw new Error("Profile identity columns must be trigger-managed while authenticated users can update only public self-service fields.");
}
if (typeof profileService.resolveAlpacaLogin === "function"
  || appSource.includes("resolve_alpaca_login")
  || /alpaca name or email/i.test(authRendererSource)) {
  throw new Error("Alpaccount login and recovery must stay email-only and must not resolve public names to private emails.");
}
if (!alpaccountsSqlSource.includes("drop function if exists public.resolve_alpaca_login(text)")
  || /create\s+or\s+replace\s+function\s+public\.resolve_alpaca_login/i.test(alpaccountsSqlSource)
  || /grant\s+execute\s+on\s+function\s+public\.resolve_alpaca_login/i.test(alpaccountsSqlSource)) {
  throw new Error("The Supabase setup must explicitly drop the legacy alpaca-name email resolver and never recreate or grant it.");
}
if (typeof profileService.checkAlpacaNameAvailability === "function"
  || appSource.includes('rpc("is_alpaca_name_available"')
  || !alpaccountsSqlSource.includes("drop function if exists public.is_alpaca_name_available(text)")
  || /create\s+or\s+replace\s+function\s+public\.is_alpaca_name_available/i.test(alpaccountsSqlSource)
  || /grant\s+execute\s+on\s+function\s+public\.is_alpaca_name_available/i.test(alpaccountsSqlSource)) {
  throw new Error("Alpaca-name uniqueness must be enforced by the write constraint without a public enumeration RPC.");
}
if (!authRendererSource.includes('minlength="8" maxlength="128"')
  || !appSource.includes("password.length < 8 || password.length > 128")) {
  throw new Error("Alpaccount password creation and recovery must enforce the 8-128 character policy in UI and logic.");
}
if (appSource.includes("choose its round, city, and approximate date")) {
  throw new Error("Signup must not require reward city/date when creating an Alpaccount.");
}
if (!appSource.includes('const WSC_ID_REWARD_FALLBACK_CITY = "N/A"') || !appSource.includes('const WSC_ID_REWARD_FALLBACK_DATE = "Not sure"')) {
  throw new Error("Signup reward fallback metadata constants are missing.");
}
if (!/const hasSelectedWscIdReward = wscIdRewardType !== "none_yet"/.test(appSource)) {
  throw new Error("Signup must distinguish no-reward accounts from reward-bearing accounts.");
}
if (appSource.includes("signInAnonymously")) {
  throw new Error("Multiplayer must not silently create anonymous Supabase sessions.");
}
if (!appSource.includes("requiresAlpaccountProfileCompletion") || !appSource.includes("completeAlpaccountProfile")) {
  throw new Error("OAuth-generated profiles should be blocked until users complete their public Alpaccount fields.");
}
if (!appSource.includes("openPasswordRecoveryFlow") || !appSource.includes('eventName === "PASSWORD_RECOVERY"')) {
  throw new Error("Password recovery links should keep the reset-password UI open.");
}
if (!appSource.includes('refs.sessionControls.setAttribute("data-open-auth", "")')
  || !appSource.includes('refs.sessionControls.removeAttribute("data-auth-signout")')) {
  throw new Error("Signed-out header session controls should open the Alpaccount login from the whole menu item.");
}
if (!appSource.includes('refs.sessionControls.removeAttribute("data-open-auth")')
  || !appSource.includes('refs.sessionControls.setAttribute("data-auth-signout", "")')) {
  throw new Error("Signed-in header session controls should not retain the login action.");
}
if (/Discord is connected/.test(`${appSource}\n${readFileSync(authRendererPath, "utf8")}`)) {
  throw new Error("OAuth completion copy must not be Discord-specific now that Google sign-in is available.");
}
if (!/\.auth-provider-stack\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/.test(stylesSource)) {
  throw new Error("Discord and Google OAuth buttons should share one row on normal modal widths.");
}
if (!/\.auth-provider-google/.test(stylesSource)) {
  throw new Error("Google OAuth button styling is missing.");
}
const appSourceWithoutCampusDevName = appSource.replace(/const CAMPUS_DEV_ALPACA_NAME = "devalpaca";/g, "");
if (/Devalpacc?a/i.test(appSourceWithoutCampusDevName)) {
  throw new Error("Multiplayer must not expose the legacy Devalpacca default account.");
}
if (/MULTIPLAYER_ALLOWED_EMAILS|MULTIPLAYER_ALLOWED_EMAIL_DOMAINS/.test(appSource)) {
  throw new Error("Multiplayer must not use legacy email/domain allowlists.");
}
if (/admin test accounts|approved school domains|approved Alpaccount/.test(`${appSource}\n${alpacapardyRendererSource}`)) {
  throw new Error("Multiplayer locked-state copy should not describe a legacy account allowlist.");
}

console.log(JSON.stringify({
  providers: [discordOauthConfig.provider, googleOauthConfig.provider],
  identitySync: "trusted-auth-users-trigger",
  profileUpdateGrant: "public-self-service-columns-only",
  renderer: "discord-google-buttons",
  passwordRecovery: "reset-form",
  headerLoginMenu: "whole-item-opens-auth",
  signupRewardFields: "optional",
  oauthProfileCompletion: "required"
}, null, 2));
