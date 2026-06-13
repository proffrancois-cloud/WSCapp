(function () {
  const DEFAULT_ALPACA_NAME_PATTERN = /^[a-z0-9][a-z0-9_-]{2,31}$/;

  function createAuthController({
    appState,
    config = {},
    authService = window.WSC_AUTH_SERVICE,
    profileService = window.WSC_SUPABASE_PROFILE_SERVICE,
    supabaseGlobal = window.supabase,
    alpacaNamePattern = DEFAULT_ALPACA_NAME_PATTERN,
    locationObject = window.location,
    callbacks = {}
  } = {}) {
    if (!appState) {
      throw new Error("createAuthController requires appState.");
    }

    function syncAuthChrome() {
      callbacks.syncAuthChrome?.();
    }

    function hasSupabaseConfig() {
      return authService?.hasConfig
        ? authService.hasConfig(config)
        : Boolean(config.url && config.publishableKey);
    }

    function isAnonymousUser(user = appState.auth.session?.user) {
      return Boolean(user?.is_anonymous || user?.app_metadata?.provider === "anonymous");
    }

    function isSignedIn() {
      return Boolean(appState.auth.session && appState.auth.session.user && !isAnonymousUser(appState.auth.session.user));
    }

    function hasAuthSession() {
      return Boolean(appState.auth.session && appState.auth.session.user);
    }

    function getCurrentUserEmail() {
      return String(appState.auth.session?.user?.email || appState.auth.profile?.email || "").trim().toLowerCase();
    }

    function canDismissAuthModal() {
      return appState.ui.authMode !== "reset";
    }

    function clearNotice() {
      appState.auth.error = "";
      appState.auth.message = "";
    }

    function normalizeAlpacaName(value) {
      return authService?.normalizeAlpacaName
        ? authService.normalizeAlpacaName(value)
        : String(value || "").trim().toLowerCase();
    }

    function getCurrentRedirectUrl() {
      return authService?.getCurrentRedirectUrl
        ? authService.getCurrentRedirectUrl(locationObject)
        : String(locationObject.href || "").split("#")[0].split("?")[0];
    }

    function getSupabaseClient() {
      if (appState.auth.client) {
        return appState.auth.client;
      }

      if (!hasSupabaseConfig()) {
        return null;
      }

      appState.auth.client = authService?.createClient
        ? authService.createClient(config, supabaseGlobal)
        : (
            supabaseGlobal && typeof supabaseGlobal.createClient === "function"
              ? supabaseGlobal.createClient(config.url, config.publishableKey, {
                  auth: {
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    persistSession: true
                  }
                })
              : null
          );

      return appState.auth.client;
    }

    function setupSupabaseAuth() {
      if (!hasSupabaseConfig()) {
        appState.auth.status = "missing-config";
        appState.ui.authOpen = false;
        return;
      }

      const client = getSupabaseClient();
      if (!client) {
        appState.auth.status = "missing-client";
        appState.ui.authOpen = false;
        return;
      }

      client.auth.onAuthStateChange((eventName, session) => {
        appState.auth.session = session || null;
        appState.auth.status = "ready";

        if (eventName === "PASSWORD_RECOVERY") {
          appState.ui.authMode = "reset";
          appState.ui.authOpen = true;
          appState.auth.message = "Choose a new password for your Alpaccount.";
        } else if (session && !isAnonymousUser(session.user)) {
          appState.ui.authOpen = false;
          loadProfile();
          loadProgress();
        } else {
          appState.auth.profile = null;
        }

        syncAuthChrome();
      });

      client.auth.getSession().then(({ data: sessionData, error }) => {
        if (error) {
          appState.auth.error = error.message;
        }

        appState.auth.session = sessionData && sessionData.session ? sessionData.session : null;
        appState.auth.status = "ready";
        appState.ui.authOpen = false;

        if (appState.auth.session && !isAnonymousUser(appState.auth.session.user)) {
          loadProfile();
          loadProgress();
        }

        syncAuthChrome();
      });
    }

    async function fetchProfile(client, userId) {
      if (profileService?.fetchProfile) {
        return profileService.fetchProfile(client, userId);
      }

      return client
        .from("alpaca_profiles")
        .select("alpaca_name,country,school_name,wsc_event_count,highest_wsc_round")
        .eq("id", userId)
        .maybeSingle();
    }

    async function fetchProgress(client, userId) {
      if (profileService?.fetchProgress) {
        return profileService.fetchProgress(client, userId);
      }

      return client
        .from("alpaca_progress")
        .select("game_stats,raw_mastered_entries")
        .eq("user_id", userId)
        .maybeSingle();
    }

    async function loadProfile() {
      const client = getSupabaseClient();
      const user = appState.auth.session && appState.auth.session.user;
      if (!client || !user || isAnonymousUser(user)) {
        return;
      }

      const { data: profile, error } = await fetchProfile(client, user.id);
      if (error) {
        appState.auth.error = error.message;
        syncAuthChrome();
        return;
      }

      appState.auth.profile = profile || null;
      syncAuthChrome();
    }

    async function loadProgress() {
      const client = getSupabaseClient();
      const user = appState.auth.session && appState.auth.session.user;
      if (!client || !user || isAnonymousUser(user)) {
        return;
      }

      let data;
      let error;
      try {
        const response = await fetchProgress(client, user.id);
        data = response.data;
        error = response.error;
      } catch (_error) {
        callbacks.saveProgressLocally?.();
        return;
      }

      if (error) {
        callbacks.saveProgressLocally?.();
        return;
      }

      if (data) {
        appState.stats = callbacks.normalizeStats
          ? callbacks.normalizeStats(data.game_stats)
          : data.game_stats;
        appState.rawMastery = callbacks.normalizeRawMastery
          ? callbacks.normalizeRawMastery(data.raw_mastered_entries)
          : data.raw_mastered_entries;
        callbacks.saveProgressLocally?.();
        callbacks.renderStats?.();
        if (appState.experience?.type === "rawcontent") {
          callbacks.renderExperience?.();
        }
        return;
      }

      await callbacks.saveRemoteProgress?.();
    }

    async function submitForm(form) {
      const action = form.dataset.authForm;
      const client = getSupabaseClient();

      clearNotice();

      if (!client) {
        appState.auth.error = "Supabase is not configured yet. Add the publishable key in supabase-config.js.";
        syncAuthChrome();
        return;
      }

      appState.auth.status = "submitting";
      syncAuthChrome();

      try {
        if (action === "signup") {
          await createAccount(new FormData(form), client);
        } else if (action === "forgot") {
          await sendPasswordReset(new FormData(form), client);
        } else if (action === "reset") {
          await updateRecoveredPassword(new FormData(form), client);
        } else {
          await connect(new FormData(form), client);
        }
      } catch (error) {
        appState.auth.error = error.message || "Something went wrong. Please try again.";
      } finally {
        if (appState.auth.status === "submitting") {
          appState.auth.status = "ready";
        }
        syncAuthChrome();
      }
    }

    async function createAccount(formData, client) {
      const email = String(formData.get("email") || "").trim().toLowerCase();
      const alpacaName = normalizeAlpacaName(formData.get("alpaca_name"));
      const password = String(formData.get("password") || "");
      const country = String(formData.get("country") || "").trim();
      const schoolName = String(formData.get("school_name") || "").trim();
      const wscEventCount = Number(formData.get("wsc_event_count") || 0);
      const highestWscRound = String(formData.get("highest_wsc_round") || "").trim();

      if (!email || !alpacaName || !password || !country || !schoolName || !highestWscRound) {
        throw new Error("Please fill in every field to create your Alpaccount.");
      }

      if (!alpacaNamePattern.test(alpacaName)) {
        throw new Error("Your alpaca name needs 3-32 characters: letters, numbers, underscores, or hyphens.");
      }

      if (!Number.isInteger(wscEventCount) || wscEventCount < 0 || wscEventCount > 99) {
        throw new Error("Please enter a valid number of WSC events.");
      }

      const { data: signUpData, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getCurrentRedirectUrl(),
          data: {
            alpaca_name: alpacaName,
            country,
            school_name: schoolName,
            wsc_event_count: wscEventCount,
            highest_wsc_round: highestWscRound
          }
        }
      });

      if (error) {
        throw new Error("That Alpaccount could not be created. Check the email and alpaca name, then try again.");
      }

      appState.auth.session = signUpData.session || appState.auth.session;
      appState.auth.message = signUpData.session
        ? "Alpaccount created. Welcome aboard."
        : "Alpaccount created. Please confirm your email, then come back to connect.";
      appState.ui.authMode = "login";
      appState.ui.authOpen = !signUpData.session;

      if (signUpData.session) {
        await loadProfile();
      }
    }

    async function resolveLoginIdentifier(identifier) {
      const value = String(identifier || "").trim().toLowerCase();
      if (!value) {
        throw new Error("Enter your email address.");
      }

      if (!value.includes("@")) {
        throw new Error("Use the email address for your Alpaccount. Alpaca-name lookup is disabled for privacy.");
      }

      return value;
    }

    async function connect(formData, client) {
      const email = await resolveLoginIdentifier(formData.get("email") || formData.get("identifier"));
      const password = String(formData.get("password") || "");

      if (!password) {
        throw new Error("Enter your password.");
      }

      const { data: signInData, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }

      appState.auth.session = signInData.session;
      appState.ui.authOpen = false;
      appState.auth.message = "";
      await loadProfile();
    }

    async function sendPasswordReset(formData, client) {
      const email = await resolveLoginIdentifier(formData.get("email") || formData.get("identifier"));
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: getCurrentRedirectUrl()
      });

      if (error) {
        throw error;
      }

      appState.auth.message = "Password reset email sent. Check your inbox.";
      appState.ui.authMode = "login";
    }

    async function updateRecoveredPassword(formData, client) {
      const password = String(formData.get("password") || "");
      const confirmPassword = String(formData.get("confirm_password") || "");

      if (!password || password.length < 6) {
        throw new Error("Choose a password with at least 6 characters.");
      }

      if (password !== confirmPassword) {
        throw new Error("The two passwords do not match.");
      }

      const { error } = await client.auth.updateUser({ password });
      if (error) {
        throw error;
      }

      appState.auth.message = "Password updated. You are connected to your Alpaccount.";
      appState.ui.authOpen = false;
      await loadProfile();
    }

    async function signOut() {
      const client = getSupabaseClient();
      if (!client) {
        return;
      }

      clearNotice();
      appState.auth.status = "submitting";
      syncAuthChrome();

      const { error } = await client.auth.signOut();
      appState.auth.status = "ready";

      if (error) {
        appState.auth.error = error.message;
        syncAuthChrome();
        return;
      }

      appState.auth.session = null;
      appState.auth.profile = null;
      callbacks.resetLiveState?.({ keepGuestName: true });
      if (appState.ui.appShellMode === "online") {
        appState.ui.appShellMode = null;
        appState.ui.appEntryGateOpen = true;
        appState.experience = null;
      }
      appState.ui.authMode = "login";
      appState.ui.authOpen = false;
      syncAuthChrome();
    }

    async function ensureLiveAuthSession() {
      const client = getSupabaseClient();
      if (!client) {
        throw new Error("Supabase is not configured yet, so legacy live rooms cannot start.");
      }

      if (appState.auth.session?.user) {
        return appState.auth.session;
      }

      if (!client.auth?.signInAnonymously) {
        throw new Error("Anonymous guest sign-in is not available in this Supabase client.");
      }

      appState.live.status = "joining";
      appState.live.message = "Connecting as guest...";
      appState.live.error = "";
      callbacks.renderExperience?.();

      const { data: authData, error } = await client.auth.signInAnonymously();
      if (error) {
        throw error;
      }

      appState.auth.session = authData.session || appState.auth.session;
      appState.auth.profile = null;
      syncAuthChrome();
      return appState.auth.session;
    }

    return Object.freeze({
      hasSupabaseConfig,
      isSignedIn,
      hasAuthSession,
      isAnonymousUser,
      getCurrentUserEmail,
      canDismissAuthModal,
      clearNotice,
      normalizeAlpacaName,
      getCurrentRedirectUrl,
      getSupabaseClient,
      setupSupabaseAuth,
      loadProfile,
      loadProgress,
      submitForm,
      createAccount,
      resolveLoginIdentifier,
      connect,
      sendPasswordReset,
      updateRecoveredPassword,
      signOut,
      ensureLiveAuthSession
    });
  }

  window.WSC_CREATE_AUTH_CONTROLLER = createAuthController;
}());
