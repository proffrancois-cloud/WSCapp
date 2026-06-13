(function () {
  function renderModal(context, helpers) {
    return context.isOpen ? renderGate(context, helpers) : "";
  }

  function renderGate(context, helpers) {
    const mode = context.mode || "login";
    const title = mode === "signup"
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
                <p class="challenge-label">WSC Routes</p>
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
    if (context.signedIn) {
      const name = context.profile && context.profile.alpaca_name ? context.profile.alpaca_name : "alpaca";
      return `You are connected as ${name}.`;
    }

    if (context.mode === "signup") {
      return "Choose your alpaca name and tell us where your WSC road begins.";
    }

    if (context.mode === "forgot") {
      return "Enter your email and we will send a password reset link.";
    }

    if (context.mode === "reset") {
      return "The reset link worked. Set a new password to continue.";
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
    if (context.signedIn) {
      return renderConnectedAlpaccount(context, helpers);
    }

    if (context.mode === "signup") {
      return renderSignupForm(context, helpers);
    }

    if (context.mode === "forgot") {
      return renderForgotPasswordForm(context);
    }

    if (context.mode === "reset") {
      return renderResetPasswordForm(context);
    }

    return renderLoginForm(context);
  }

  function renderConnectedAlpaccount(context, helpers) {
    const profile = context.profile || {};
    const round = (context.roundOptions || []).find((option) => option.value === profile.highest_wsc_round);

    return `
      <div class="alpaccount-profile-card">
        <span>Alpaca name</span>
        <strong>${helpers.escapeHtml(profile.alpaca_name || "Connected")}</strong>
        <p>${helpers.escapeHtml([profile.school_name, profile.country].filter(Boolean).join(" · ") || "Profile loading...")}</p>
        ${round ? `<p>${helpers.escapeHtml(round.label)} · ${Number(profile.wsc_event_count || 0)} WSC event${Number(profile.wsc_event_count || 0) === 1 ? "" : "s"}</p>` : ""}
      </div>
      <div class="panel-actions auth-actions">
        <button class="button secondary" type="button" data-auth-signout ${context.busy ? "disabled" : ""}>Sign out</button>
        <button class="button primary" type="button" data-close-auth>Continue</button>
      </div>
    `;
  }

  function renderLoginForm(context) {
    return `
      <form class="alpaccount-form" data-auth-form="login">
        <label class="auth-field">
          <span>Email address</span>
          <input name="email" type="email" autocomplete="email" required />
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
        <p class="auth-helper auth-trust-copy">Use your email to connect. Alpaca names are not looked up during sign-in, so the app does not reveal whether a name exists.</p>
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
          <span>Highest WSC round reached</span>
          <select name="highest_wsc_round" required>
            <option value="">Choose a round</option>
            ${(context.roundOptions || []).map((option) => `<option value="${helpers.escapeHtml(option.value)}">${helpers.escapeHtml(option.label)}</option>`).join("")}
          </select>
        </label>
        <p class="auth-helper">Examples: None yet, Regional Round, Global Round, or Tournament of Champions.</p>
        <p class="auth-helper auth-trust-copy">Email is used for sign-in, password reset links, and syncing progress. Profile fields personalize WSCapp screens; avoid private details you would not want visible inside the app.</p>
        <div class="panel-actions auth-actions">
          <button class="button primary" type="submit" ${context.busy ? "disabled" : ""}>Create Alpaccount</button>
          <button class="button secondary" type="button" data-auth-mode="login">Back to login</button>
        </div>
      </form>
    `;
  }

  function renderForgotPasswordForm(context) {
    return `
      <form class="alpaccount-form" data-auth-form="forgot">
        <label class="auth-field">
          <span>Email address</span>
          <input name="email" type="email" autocomplete="email" required />
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
    renderLoginForm,
    renderSignupForm,
    renderForgotPasswordForm,
    renderResetPasswordForm
  });
}());
