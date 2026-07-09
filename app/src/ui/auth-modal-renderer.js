(function () {
  function renderModal(context, helpers) {
    return context.isOpen ? renderGate(context, helpers) : "";
  }

  function renderGate(context, helpers) {
    const mode = context.mode || "login";
    const title = context.requiresProfileCompletion || mode === "complete-profile"
      ? "Complete your Alpaccount"
      : mode === "signup"
      ? "Create an Alpaccount"
      : mode === "forgot"
        ? "Recover your Alpaccount"
        : mode === "reset"
          ? "Choose a new password"
          : "Connect to your Alpaccount";

    return `
      <div class="auth-modal-overlay signin-gate" role="dialog" aria-modal="true" aria-label="${helpers.escapeHtml(title)}">
        <div class="auth-modal-window signup-window alpaccount-window">
          ${context.canDismiss ? `
            <button class="popup-close-button" type="button" data-close-auth aria-label="Close Alpaccount">
              <span aria-hidden="true">×</span>
            </button>
          ` : ""}
          <div class="auth-modal-stack signup-stack alpaccount-stack">
            <div class="alpaccount-brand">
              <img src="./assets/icons/ui/signin.png?v=20260509t" alt="" />
              <div>
                <p class="challenge-label">WSCapp</p>
                <h3>${helpers.escapeHtml(title)}</h3>
                <p>${helpers.escapeHtml(renderIntro(context))}</p>
              </div>
            </div>
            ${renderNotice(context, helpers)}
            ${renderBody(context, helpers)}
          </div>
        </div>
      </div>
    `;
  }

  function renderIntro(context) {
    if (context.requiresProfileCompletion || context.mode === "complete-profile") {
      return "Discord is connected. Choose your alpaca name, school, and WSC details to finish your Alpaccount.";
    }

    if (context.mode === "signup") {
      return "Choose your alpaca name and tell us where your WSC road begins.";
    }

    if (context.mode === "forgot") {
      return "Enter your alpaca name or email and we will send a password reset email.";
    }

    if (context.mode === "reset") {
      return "The reset link worked. Set a new password to continue.";
    }

    if (context.signedIn) {
      const name = context.profile && context.profile.alpaca_name ? context.profile.alpaca_name : "alpaca";
      return `You are connected as ${name}.`;
    }

    return "Optional: connect to save your WSC progress across devices.";
  }

  function renderNotice(context, helpers) {
    if (context.error) {
      return `<p class="auth-notice error">${helpers.escapeHtml(context.error)}</p>`;
    }

    if (context.message) {
      return `<p class="auth-notice success">${helpers.escapeHtml(context.message)}</p>`;
    }

    if (context.status === "missing-config") {
      return `<p class="auth-notice error">Supabase needs the project publishable key in supabase-config.js before logins can work.</p>`;
    }

    if (context.status === "missing-client") {
      return `<p class="auth-notice error">Supabase could not load. Check your network connection and reload the app.</p>`;
    }

    return "";
  }

  function renderBody(context, helpers) {
    if (context.mode === "reset") {
      return renderResetPasswordForm(context);
    }

    if ((context.requiresProfileCompletion || context.mode === "complete-profile") && context.signedIn) {
      return renderCompleteProfileForm(context, helpers);
    }

    if (context.signedIn) {
      return renderConnectedAlpaccount(context, helpers);
    }

    if (context.mode === "signup") {
      return renderSignupForm(context, helpers);
    }

    if (context.mode === "forgot") {
      return renderForgotPasswordForm(context);
    }

    return renderLoginForm(context, helpers);
  }

  function isGeneratedAlpacaName(value) {
    return /^alpaca_[a-f0-9]{24}$/i.test(String(value || "").trim());
  }

  function cleanProfileValue(profile, key, blockedValues = []) {
    const value = String(profile?.[key] || "").trim();
    const normalized = value.toLowerCase();
    return blockedValues.includes(normalized) ? "" : value;
  }

  function getSelectedProfileReward(profile) {
    const idRewards = Array.isArray(profile?.wsc_achievements) ? profile.wsc_achievements : [];
    return idRewards[0] || null;
  }

  function renderOptions(options, selectedValue, helpers) {
    const selected = String(selectedValue || "");
    return (options || []).map((option) => {
      const value = String(option.value || "");
      return `<option value="${helpers.escapeHtml(value)}"${value === selected ? " selected" : ""}>${helpers.escapeHtml(option.label)}</option>`;
    }).join("");
  }

  function getProfileFieldDefaults(profile) {
    const alpacaName = cleanProfileValue(profile, "alpaca_name");
    const reward = getSelectedProfileReward(profile);
    const wscEventCount = Number(profile?.wsc_event_count || 0);

    return {
      alpacaName: isGeneratedAlpacaName(alpacaName) ? "" : alpacaName,
      country: cleanProfileValue(profile, "country", ["unknown"]),
      schoolName: cleanProfileValue(profile, "school_name", ["unknown", "unknown school"]),
      wscEventCount: Number.isInteger(wscEventCount) && wscEventCount >= 0 ? Math.min(wscEventCount, 99) : 0,
      highestWscRound: String(profile?.highest_wsc_round || "none_yet") || "none_yet",
      rewardType: String(reward?.rewardType || reward?.reward_type || "none_yet") || "none_yet",
      rewardCity: String(reward?.city || "").trim(),
      rewardDate: String(reward?.approximateDate || reward?.approximate_date || "").trim()
    };
  }

  function renderConnectedAlpaccount(context, helpers) {
    const profile = context.profile || {};
    const round = (context.roundOptions || []).find((option) => option.value === profile.highest_wsc_round);
    const idRewards = Array.isArray(profile.wsc_achievements) ? profile.wsc_achievements : [];
    const firstReward = idRewards[0] || null;
    const reward = firstReward
      ? (context.rewardOptions || []).find((option) => option.value === (firstReward.rewardType || firstReward.reward_type))
      : null;

    return `
      <div class="alpaccount-profile-card">
        <span>Alpaca name</span>
        <strong>${helpers.escapeHtml(profile.alpaca_name || "Connected")}</strong>
        <p>${helpers.escapeHtml([profile.school_name, profile.country].filter(Boolean).join(" · ") || "Profile loading...")}</p>
        ${round ? `<p>${helpers.escapeHtml(round.label)} · ${Number(profile.wsc_event_count || 0)} WSC event${Number(profile.wsc_event_count || 0) === 1 ? "" : "s"}</p>` : ""}
        ${reward ? `<p>ID reward: ${helpers.escapeHtml([reward.label, firstReward.city, firstReward.approximateDate || firstReward.approximate_date].filter(Boolean).join(" · "))}</p>` : ""}
      </div>
      <div class="panel-actions auth-actions">
        <button class="button secondary" type="button" data-auth-signout ${context.busy ? "disabled" : ""}>Sign out</button>
        <button class="button primary" type="button" data-close-auth>Continue</button>
      </div>
    `;
  }

  function renderOAuthActions(context, helpers) {
    const providers = Array.isArray(context.oauthProviders) ? context.oauthProviders : [];
    if (!providers.length) {
      return "";
    }

    return `
      <div class="auth-provider-stack" aria-label="Social sign-in options">
        ${providers.map((provider) => `
          <button
            class="auth-provider-button auth-provider-${helpers.escapeHtml(provider.provider)}"
            type="button"
            data-auth-oauth="${helpers.escapeHtml(provider.provider)}"
            ${context.busy ? "disabled" : ""}
          >
            <span class="auth-provider-icon-shell" aria-hidden="true"><img class="auth-provider-icon" src="./assets/mascot/library/final-pack/Discordlogo.png?v=20260707directgames" alt="" width="25" height="25" loading="eager" decoding="async" /></span>
            <strong>${helpers.escapeHtml(provider.label || "Continue")}</strong>
          </button>
        `).join("")}
      </div>
      <div class="auth-divider" aria-hidden="true"><span>or</span></div>
    `;
  }

  function renderLoginForm(context, helpers) {
    return `
      <form class="alpaccount-form" data-auth-form="login">
        ${renderOAuthActions(context, helpers)}
        <label class="auth-field">
          <span>Alpaca name or email</span>
          <input name="identifier" type="text" autocomplete="username" required />
        </label>
        <label class="auth-field">
          <span>Password</span>
          <input name="password" type="password" autocomplete="current-password" required />
        </label>
        <div class="panel-actions auth-actions">
          <button class="button primary" type="submit" ${context.busy ? "disabled" : ""}>Connect</button>
          <button class="button secondary" type="button" data-auth-mode="signup">Create an Alpaccount</button>
        </div>
        <button class="auth-text-button" type="button" data-auth-mode="forgot">I forgot my password</button>
      </form>
    `;
  }

  function renderSignupForm(context, helpers) {
    return `
      <form class="alpaccount-form" data-auth-form="signup">
        <div class="auth-form-grid">
          <label class="auth-field">
            <span>Email address</span>
            <input name="email" type="email" autocomplete="email" required />
          </label>
          <label class="auth-field">
            <span>Alpaca name</span>
            <input name="alpaca_name" type="text" autocomplete="username" minlength="3" maxlength="32" pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" required />
          </label>
          <label class="auth-field">
            <span>Password</span>
            <input name="password" type="password" autocomplete="new-password" minlength="6" required />
          </label>
          <label class="auth-field">
            <span>Country</span>
            <input name="country" type="text" autocomplete="country-name" required />
          </label>
          <label class="auth-field">
            <span>School name</span>
            <input name="school_name" type="text" autocomplete="organization" required />
          </label>
          <label class="auth-field">
            <span>WSC events attended</span>
            <input name="wsc_event_count" type="number" min="0" max="99" step="1" value="0" required />
          </label>
        </div>
        <label class="auth-field">
          <span>Highest WSC round reached for your ID</span>
          <select name="highest_wsc_round" required>
            ${(context.roundOptions || []).map((option) => `<option value="${helpers.escapeHtml(option.value)}">${helpers.escapeHtml(option.label)}</option>`).join("")}
          </select>
        </label>
        <div class="auth-form-grid">
          <label class="auth-field">
            <span>Best WSC reward for your ID</span>
            <select name="wsc_id_reward_type" required>
              ${(context.rewardOptions || []).map((option) => `<option value="${helpers.escapeHtml(option.value)}">${helpers.escapeHtml(option.label)}</option>`).join("")}
            </select>
          </label>
          <label class="auth-field">
            <span>City for that reward <em>optional</em></span>
            <input name="wsc_id_reward_city" type="text" autocomplete="address-level2" placeholder="N/A" />
          </label>
          <label class="auth-field">
            <span>Approximate date <em>optional</em></span>
            <input name="wsc_id_reward_date" type="text" placeholder="Not sure" />
          </label>
        </div>
        <p class="auth-helper">If you already have a WSC reward, choose the reward and round. City and date are optional; blank details show as N/A and Not sure. If you have no reward yet, leave No medal or trophy yet selected.</p>
        <div class="panel-actions auth-actions">
          <button class="button primary" type="submit" ${context.busy ? "disabled" : ""}>Create Alpaccount</button>
          <button class="button secondary" type="button" data-auth-mode="login">Back to login</button>
        </div>
      </form>
    `;
  }

  function renderCompleteProfileForm(context, helpers) {
    const defaults = getProfileFieldDefaults(context.profile || {});

    return `
      <form class="alpaccount-form" data-auth-form="complete-profile">
        <div class="auth-form-grid">
          <label class="auth-field">
            <span>Alpaca name</span>
            <input name="alpaca_name" type="text" autocomplete="username" minlength="3" maxlength="32" pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,31}" value="${helpers.escapeHtml(defaults.alpacaName)}" required />
          </label>
          <label class="auth-field">
            <span>Country</span>
            <input name="country" type="text" autocomplete="country-name" value="${helpers.escapeHtml(defaults.country)}" required />
          </label>
          <label class="auth-field">
            <span>School name</span>
            <input name="school_name" type="text" autocomplete="organization" value="${helpers.escapeHtml(defaults.schoolName)}" required />
          </label>
          <label class="auth-field">
            <span>WSC events attended</span>
            <input name="wsc_event_count" type="number" min="0" max="99" step="1" value="${helpers.escapeHtml(defaults.wscEventCount)}" required />
          </label>
        </div>
        <label class="auth-field">
          <span>Highest WSC round reached for your ID</span>
          <select name="highest_wsc_round" required>
            ${renderOptions(context.roundOptions, defaults.highestWscRound, helpers)}
          </select>
        </label>
        <div class="auth-form-grid">
          <label class="auth-field">
            <span>Best WSC reward for your ID</span>
            <select name="wsc_id_reward_type" required>
              ${renderOptions(context.rewardOptions, defaults.rewardType, helpers)}
            </select>
          </label>
          <label class="auth-field">
            <span>City for that reward <em>optional</em></span>
            <input name="wsc_id_reward_city" type="text" autocomplete="address-level2" placeholder="N/A" value="${helpers.escapeHtml(defaults.rewardCity)}" />
          </label>
          <label class="auth-field">
            <span>Approximate date <em>optional</em></span>
            <input name="wsc_id_reward_date" type="text" placeholder="Not sure" value="${helpers.escapeHtml(defaults.rewardDate)}" />
          </label>
        </div>
        <p class="auth-helper">Pick the public alpaca name and school details other scholars will see. Reward city and date are optional; blank reward details show as N/A and Not sure.</p>
        <div class="panel-actions auth-actions">
          <button class="button primary" type="submit" ${context.busy ? "disabled" : ""}>Save Alpaccount</button>
          <button class="button secondary" type="button" data-auth-signout ${context.busy ? "disabled" : ""}>Sign out</button>
        </div>
      </form>
    `;
  }

  function renderForgotPasswordForm(context) {
    return `
      <form class="alpaccount-form" data-auth-form="forgot">
        <label class="auth-field">
          <span>Alpaca name or email</span>
          <input name="identifier" type="text" autocomplete="username" required />
        </label>
        <div class="panel-actions auth-actions">
          <button class="button primary" type="submit" ${context.busy ? "disabled" : ""}>Send reset email</button>
          <button class="button secondary" type="button" data-auth-mode="login">Back to login</button>
        </div>
      </form>
    `;
  }

  function renderResetPasswordForm(context) {
    return `
      <form class="alpaccount-form" data-auth-form="reset">
        <label class="auth-field">
          <span>New password</span>
          <input name="password" type="password" autocomplete="new-password" minlength="6" required />
        </label>
        <label class="auth-field">
          <span>Confirm password</span>
          <input name="confirm_password" type="password" autocomplete="new-password" minlength="6" required />
        </label>
        <div class="panel-actions auth-actions">
          <button class="button primary" type="submit" ${context.busy ? "disabled" : ""}>Update password</button>
        </div>
      </form>
    `;
  }

  window.WSC_AUTH_MODAL_RENDERER = Object.freeze({
    renderModal,
    renderGate,
    renderIntro,
    renderNotice,
    renderBody,
    renderConnectedAlpaccount,
    renderOAuthActions,
    renderLoginForm,
    renderSignupForm,
    renderCompleteProfileForm,
    renderForgotPasswordForm,
    renderResetPasswordForm
  });
}());
