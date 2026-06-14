(function initAppShellRenderer(global) {
  "use strict";

  function requireObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error(`WSC app shell renderer requires ${name}.`);
    }
    return value;
  }

  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC app shell renderer requires ${name}().`);
    }
    return value;
  }

  function createAppShellRenderer(options = {}) {
    const state = requireObject(options.appState, "appState");
    const refs = requireObject(options.refs, "refs");
    const appDomService = requireObject(options.appDomService, "appDomService");
    const appStateService = requireObject(options.appStateService, "appStateService");
    const appEntryService = requireObject(options.appEntryService, "appEntryService");
    const onlineModeController = requireObject(options.onlineModeController, "onlineModeController");
    const authModalRenderer = requireObject(options.authModalRenderer, "authModalRenderer");
    const constants = options.constants || {};
    const helpers = options.helpers || {};
    const callbacks = options.callbacks || {};

    const ASSET_CACHE_VERSION = constants.ASSET_CACHE_VERSION || "";
    const DISCORD_INVITE_URL = constants.DISCORD_INVITE_URL || "";
    const CONTACT_EMAIL_URL = constants.CONTACT_EMAIL_URL || "";
    const WSC_ROUND_OPTIONS = Array.isArray(constants.WSC_ROUND_OPTIONS) ? constants.WSC_ROUND_OPTIONS : [];
    const LIVE_GAME_ORDER = Array.isArray(constants.LIVE_GAME_ORDER) ? constants.LIVE_GAME_ORDER : [];
    const ALPACA_RUN_ROUTE = Array.isArray(constants.ALPACA_RUN_ROUTE) ? constants.ALPACA_RUN_ROUTE : [];
    const RESOURCE_LINKS = Array.isArray(constants.RESOURCE_LINKS) ? constants.RESOURCE_LINKS : [];
    const insights = Array.isArray(constants.insights) ? constants.insights : [];

    const escapeHtml = requireFunction(helpers, "escapeHtml");
    const getPathOption = requireFunction(helpers, "getPathOption");
    const getModeOption = requireFunction(helpers, "getModeOption");
    const normalizeLiveGameType = requireFunction(helpers, "normalizeLiveGameType");

    const syncActiveModalFocus = requireFunction(callbacks, "syncActiveModalFocus");
    const isSignedIn = requireFunction(callbacks, "isSignedIn");
    const canDismissAuthModal = requireFunction(callbacks, "canDismissAuthModal");
    const canAccessCampusPreview = requireFunction(callbacks, "canAccessCampusPreview");
    const getCurrentUserEmail = requireFunction(callbacks, "getCurrentUserEmail");
    const getTotalRawMasterableEntries = requireFunction(callbacks, "getTotalRawMasterableEntries");
    const getMasteredRawEntryCount = requireFunction(callbacks, "getMasteredRawEntryCount");
    const getDefaultStats = requireFunction(callbacks, "getDefaultStats");
    const getLiveGameLabel = requireFunction(callbacks, "getLiveGameLabel");
    const getSelectedSectionIds = requireFunction(callbacks, "getSelectedSectionIds");
    const getTargetLabel = requireFunction(callbacks, "getTargetLabel");

    function syncAppModeClasses() {
      global.document.body.classList.toggle("is-online-mode", appStateService.isOnlineMode(state));
      global.document.body.classList.toggle("is-local-mode", appStateService.isLocalMode(state));
    }

    function renderInsights() {
      if (!refs.insightGrid) {
        return;
      }
      appDomService.setHtml(
        refs.insightGrid,
        insights
          .map(
            (insight) => `
        <article class="insight-card">
          <strong>${escapeHtml(insight.title)}</strong>
          <span>${escapeHtml(insight.body)}</span>
        </article>
      `
          )
          .join("")
      );
    }

    function renderStats() {
      if (!refs.statsStrip) {
        return;
      }

      if (appStateService.isOnlineMode(state)) {
        appDomService.setHtml(refs.statsStrip, renderOnlineScoreStrip());
        return;
      }

      const totalAnswered = Number(state.stats.totalAnswered) || 0;
      const totalCorrect = Number(state.stats.totalCorrect) || 0;
      const accuracy = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
      const totalMasterable = getTotalRawMasterableEntries();
      const mastered = getMasteredRawEntryCount();
      const masteredPercent = totalMasterable ? Math.round((mastered / totalMasterable) * 100) : 0;

      appDomService.setHtml(refs.statsStrip, `
    <div class="hero-progress-circles" aria-label="Progress circles">
      ${renderProgressCircleStatCard(
        "Questions answered",
        `${totalAnswered} answered`,
        `${accuracy}% accuracy`,
        accuracy
      )}
      ${renderProgressCircleStatCard(
        "Knowledge mastered",
        `${mastered}/${totalMasterable} entries`,
        `${masteredPercent}% mastered`,
        masteredPercent
      )}
    </div>
    ${renderBestScoreStrip()}
  `);
    }

    function renderSessionControls() {
      if (!refs.sessionControls) {
        return;
      }

      const isOnline = appStateService.isOnlineMode(state);
      const shellLabel = isOnline
        ? appEntryService.getLocalStudyActionLabel()
        : appEntryService.getCampusPreviewActionLabel();
      const shellIcon = isOnline
        ? "./app-icons/icon-local-transparent.png?v=20260520train"
        : "./assets/mascot/library/final-pack/Multiplayer.png?v=20260520train";
      const modeSwitchAction = appEntryService.getModeSwitchAction(isOnline);
      const soonLabel = appEntryService.getModeSwitchTitle(isOnline);
      const modeButton = `
    <button
      class="session-mode-button session-mode-icon-button hero-online-button ${isOnline ? "switch-local" : "switch-online"}"
      type="button"
      ${modeSwitchAction}
      aria-label="${escapeHtml(shellLabel)}. Open Local or 3D Campus Preview menu"
      title="${escapeHtml(soonLabel)}"
    >
      <img src="${shellIcon}" alt="" aria-hidden="true" />
      <span>${escapeHtml(shellLabel)}</span>
    </button>
  `;
      if (refs.heroOnlineMount) {
        appDomService.setHtml(refs.heroOnlineMount, modeButton);
      }

      if (!isSignedIn()) {
        refs.sessionControls.classList.remove("hidden");
        appDomService.setHtml(refs.sessionControls, `
      <div class="session-control-stack">
        <button
          class="hero-link-icon session-signout-button"
          type="button"
          data-open-auth
          aria-label="Open Alpaccount login"
          title="Alpaccount"
        >
          <img src="./assets/icons/ui/signin.png?v=20260509t" alt="Alpaccount icon" />
        </button>
      </div>
    `);
        return;
      }

      refs.sessionControls.classList.remove("hidden");
      appDomService.setHtml(refs.sessionControls, `
    <div class="session-control-stack">
      <button
        class="hero-link-icon session-signout-button"
        type="button"
        data-auth-signout
        aria-label="Log out of your Alpaccount"
        title="Log out"
      >
        <img src="./assets/footer/logout-icon.png?v=20260429b" alt="Log out icon" />
      </button>
    </div>
  `);
    }

    function renderAppEntryGate() {
      if (!refs.appEntryGateMount) {
        return;
      }

      if (!state.ui.appEntryGateOpen) {
        appDomService.clearHtml(refs.appEntryGateMount);
        syncActiveModalFocus();
        return;
      }

      const onlineAllowed = canAccessCampusPreview();
      const productSummary = appEntryService.getAppEntryProductSummary();
      const localActionLabel = appEntryService.getLocalStudyActionLabel();
      const campusPreviewLabel = onlineModeController.getCampusMultiplayerLabel();
      const campusPreviewActionLabel = onlineModeController.getCampusPreviewActionLabel();
      const campusPreviewStatus = onlineModeController.getCampusPreviewStatus();
      const defaultCampusAlpacaName = onlineModeController.getDefaultCampusAlpacaName();

      appDomService.setHtml(refs.appEntryGateMount, `
    <div class="app-entry-gate-overlay" role="dialog" aria-modal="true" aria-label="App mode">
      <article class="app-entry-gate-window">
        <section class="app-entry-intro">
          <p>${escapeHtml(productSummary)}</p>
        </section>
        ${renderAppEntryAuthPanel()}
        <div class="app-entry-choice-grid">
          <button class="app-entry-choice-card primary-choice" type="button" data-app-entry-choice="local">
            <span>LOCAL</span>
            <img
              class="app-entry-choice-logo"
              src="./app-icons/icon-local-transparent.png?v=20260520train"
              alt=""
              aria-hidden="true"
            />
            <strong>${escapeHtml(localActionLabel)}</strong>
          </button>
          <button class="app-entry-choice-card online-choice" type="button" data-app-entry-choice="online" ${onlineAllowed ? "" : "disabled"}>
            <span>${escapeHtml(campusPreviewLabel)}</span>
            <img
              class="app-entry-choice-logo"
              src="./assets/mascot/library/final-pack/Multiplayer.png?v=20260520train"
              alt=""
              aria-hidden="true"
            />
            <strong>${escapeHtml(campusPreviewActionLabel)}</strong>
            ${onlineAllowed
              ? `<small>${escapeHtml(campusPreviewStatus)} Default alpaca: ${escapeHtml(defaultCampusAlpacaName)}.</small>`
              : "<small>Preview unavailable</small>"}
          </button>
        </div>
      </article>
    </div>
  `);
      syncActiveModalFocus();
    }

    function renderAppEntryAuthPanel() {
      const context = getAuthRenderContext();
      const mode = context.mode || "login";
      const title = context.signedIn
        ? "Alpaccount"
        : mode === "signup"
          ? "Create Alpaccount"
          : mode === "forgot"
            ? "Recover Alpaccount"
            : mode === "reset"
              ? "New password"
              : "Connect Alpaccount";

      if (context.signedIn) {
        const profile = context.profile || {};
        return `
      <section class="app-entry-auth-panel signed-in">
        <div>
          <p class="challenge-label">Alpaccount</p>
          <h3>${escapeHtml(profile.alpaca_name || "Connected")}</h3>
          <p>${escapeHtml([profile.school_name, profile.country].filter(Boolean).join(" · ") || getCurrentUserEmail() || "Ready")}</p>
        </div>
      </section>
    `;
      }

      return `
    <section class="app-entry-auth-panel">
      <div class="app-entry-auth-heading">
        <p class="challenge-label">Alpaccount</p>
        <h3>${escapeHtml(title)}</h3>
      </div>
      ${state.ui.localProgressSaveError ? `<p class="auth-notice error">${escapeHtml(state.ui.localProgressSaveError)}</p>` : ""}
      ${authModalRenderer.renderNotice(context, { escapeHtml })}
      ${authModalRenderer.renderBody(context, { escapeHtml })}
    </section>
  `;
    }

    function renderProgressCircleStatCard(label, primary, secondary, percent) {
      const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
      return `
    <div class="stat-card progress-circle-card">
      <div
        class="stat-progress-ring"
        style="--percent:${safePercent};"
        aria-label="${escapeHtml(label)}: ${escapeHtml(primary)}, ${escapeHtml(secondary)}"
      >
        <div class="stat-progress-ring-inner">
          <strong>${safePercent}%</strong>
        </div>
      </div>
      <div class="stat-progress-circle-copy">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(primary)}</strong>
        <em>${escapeHtml(secondary)}</em>
      </div>
    </div>
  `;
    }

    function renderBestScoreStrip() {
      const stats = state.stats || getDefaultStats();
      const cards = [
        {
          label: "Alpacapardy",
          value: formatBestNumberStat(stats.bestAlpacapardyScore),
          note: "Best team score"
        },
        {
          label: "Alpaca Run",
          value: getBestRunDestinationLabel(stats.bestRunStage),
          note: "Best destination"
        },
        {
          label: "Alpaca Jump",
          value: `${Math.round(Number(stats.bestJumpDistance) || 0)}m`,
          note: "Longest distance"
        },
        {
          label: "Alpaquiz",
          value: formatBestNumberStat(stats.bestRelayScore),
          note: "Best team score"
        },
        {
          label: "Survivalpaca",
          value: formatBestNumberStat(stats.bestRaceScore),
          note: "Best score"
        }
      ];

      return `
    <div class="hero-best-strip" aria-label="Best game scores">
      ${cards.map((card) => renderBestScoreCard(card)).join("")}
    </div>
  `;
    }

    function renderBestScoreCard(card) {
      return `
    <article class="hero-best-card">
      <span>${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.value)}</strong>
      <em>${escapeHtml(card.note)}</em>
    </article>
  `;
    }

    function renderOnlineScoreStrip() {
      const cards = LIVE_GAME_ORDER.map((gameType) => {
        const record = getOnlineGameRecord(gameType);
        return {
          label: getLiveGameLabel(gameType),
          value: `${record.wins}/${record.games} games`,
          note: record.bestGames >= 5 && record.bestName
            ? `${record.bestName} · ${record.bestWinPercent}% wins`
            : "Best alpaca unlocks after 5 games"
        };
      });

      return `
    <div class="hero-best-strip hero-best-strip-online" aria-label="Online game records">
      ${cards.map((card) => renderBestScoreCard(card)).join("")}
    </div>
  `;
    }

    function getOnlineGameRecord(gameType) {
      const liveRecords = state.stats.liveRecords || {};
      const record = liveRecords[normalizeLiveGameType(gameType)] || {};
      const games = Math.max(0, Number(record.games) || 0);
      const wins = Math.max(0, Number(record.wins) || 0);
      const bestGames = Math.max(0, Number(record.bestGames) || 0);
      const bestWins = Math.max(0, Number(record.bestWins) || 0);
      const bestWinPercent = bestGames ? Math.round((bestWins / bestGames) * 100) : 0;
      return {
        games,
        wins,
        bestGames,
        bestName: record.bestName || "",
        bestWinPercent
      };
    }

    function formatBestNumberStat(value) {
      return String(Math.max(0, Number(value) || 0));
    }

    function getBestRunDestinationLabel(stageValue) {
      const stage = Number(stageValue);
      if (!Number.isFinite(stage) || stage < 0) {
        return "Not started";
      }

      const stop = ALPACA_RUN_ROUTE[Math.min(Math.max(0, Math.round(stage)), ALPACA_RUN_ROUTE.length - 1)];
      return stop ? stop.label : "Not started";
    }

    function renderSummary() {
      if (!refs.choiceSummary) {
        return;
      }

      if (state.ui.appShellMode === "online") {
        appDomService.clearHtml(refs.choiceSummary);
        refs.choiceSummary.classList.add("hidden");
        return;
      }

      const chips = [];
      const { path, mode } = state.selection;
      const selectedIds = getSelectedSectionIds();

      if (path) {
        chips.push(renderSummaryChip("Route", getPathOption(path).label));
      }
      if (selectedIds.length) {
        chips.push(renderSummaryChip("Guiding Sections", getTargetLabel()));
      }
      if (mode) {
        chips.push(renderSummaryChip("Next Stop", getModeOption(mode).title));
      }

      appDomService.setHtml(refs.choiceSummary, chips.join(""));
      refs.choiceSummary.classList.toggle("hidden", chips.length === 0);
    }

    function renderSummaryChip(label, value) {
      return `
    <div class="summary-chip">
      <span>${escapeHtml(label)}:</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
    }

    function renderAuthModal() {
      if (!refs.authModalMount) {
        return;
      }

      appDomService.setHtml(refs.authModalMount, authModalRenderer.renderModal(getAuthRenderContext(), { escapeHtml }));
      syncActiveModalFocus();
    }

    function renderAuthGate() {
      return authModalRenderer.renderGate(getAuthRenderContext(), { escapeHtml });
    }

    function renderAuthIntro(mode, signedIn) {
      return authModalRenderer.renderIntro({
        ...getAuthRenderContext(),
        mode,
        signedIn
      });
    }

    function renderAuthNotice() {
      return authModalRenderer.renderNotice(getAuthRenderContext(), { escapeHtml });
    }

    function renderAuthBody(mode, busy) {
      return authModalRenderer.renderBody({
        ...getAuthRenderContext(),
        mode,
        busy
      }, { escapeHtml });
    }

    function renderConnectedAlpaccount(busy) {
      return authModalRenderer.renderConnectedAlpaccount({
        ...getAuthRenderContext(),
        busy
      }, { escapeHtml });
    }

    function renderLoginForm(busy) {
      return authModalRenderer.renderLoginForm({ ...getAuthRenderContext(), busy });
    }

    function renderSignupForm(busy) {
      return authModalRenderer.renderSignupForm({ ...getAuthRenderContext(), busy }, { escapeHtml });
    }

    function renderForgotPasswordForm(busy) {
      return authModalRenderer.renderForgotPasswordForm({ ...getAuthRenderContext(), busy });
    }

    function renderResetPasswordForm(busy) {
      return authModalRenderer.renderResetPasswordForm({ ...getAuthRenderContext(), busy });
    }

    function getAuthRenderContext() {
      return {
        isOpen: state.ui.authOpen,
        mode: state.ui.authMode || "login",
        signedIn: isSignedIn(),
        busy: state.auth.status === "checking" || state.auth.status === "submitting",
        status: state.auth.status,
        error: state.auth.error,
        message: state.auth.message,
        profile: state.auth.profile,
        roundOptions: WSC_ROUND_OPTIONS,
        canDismiss: canDismissAuthModal()
      };
    }

    function renderResourcesModal() {
      if (!refs.resourcesModalMount) {
        return;
      }

      appDomService.setHtml(refs.resourcesModalMount, state.ui.resourcesOpen ? `
    <div class="auth-modal-overlay" data-close-resources role="dialog" aria-modal="true" aria-label="Route resources">
      <div class="auth-modal-window resources-modal-window" data-resources-window>
        <button class="popup-close-button" type="button" data-close-resources aria-label="Close route resources">
          <span aria-hidden="true">×</span>
        </button>
        <div class="auth-modal-stack resources-modal-stack">
          <div class="resources-modal-hero" aria-hidden="true">
            <img src="./assets/footer/link-icon.png?v=${ASSET_CACHE_VERSION}" alt="" />
          </div>
          <div class="resource-link-list">
            ${RESOURCE_LINKS.map((item) => `
              <a class="resource-link-item" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
                <span class="resource-link-label">${escapeHtml(item.label)}</span>
                <span class="resource-link-url">${escapeHtml(item.url)}</span>
              </a>
            `).join("")}
          </div>
          <div class="panel-actions">
            <button class="button primary" type="button" data-close-resources>Close</button>
          </div>
        </div>
      </div>
    </div>
  ` : "");
      syncActiveModalFocus();
    }

    function renderCooperationModal() {
      if (!refs.cooperationModalMount) {
        return;
      }

      appDomService.setHtml(refs.cooperationModalMount, state.ui.cooperationOpen ? `
    <div class="auth-modal-overlay cooperation-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cooperationModalTitle">
      <div class="auth-modal-window cooperation-modal-window">
        <button class="popup-close-button" type="button" data-close-cooperation aria-label="Close call to cooperation">
          <span aria-hidden="true">×</span>
        </button>
        <div class="auth-modal-stack cooperation-modal-stack">
          <h3 id="cooperationModalTitle">Call to cooperation</h3>
          <div class="cooperation-copy">
            <p>
              Since we released the app a little over a month ago, more than <strong>850 people</strong> from over <strong>35 countries</strong> have visited it.
              Many alpacas have contacted us with suggestions, corrections, and ideas for improvement. We have also heard from people who wanted to build similar tools or create their own WSC resources.
            </p>

            <p>
              That is exactly the spirit we want to encourage.
            </p>

            <p>
              We want Alpacapp to become a useful space for everyone: a place where alpacas can train, learn while having fun, share resources, and stay connected beyond their own school club.
            </p>

            <p>
              Our ultimate goal is for this app to become <strong>one central place</strong> for everything connected to WSC: useful information, guides, mocks, contests, questions, events, weekly challenges, forums, and anything else the community can imagine.
            </p>

            <p>
              WSC should not only be something we think about during ASA, during our school club, or one month before a round. When we started preparing, we had to join more than eight Discord servers, find documents scattered around the internet, and answer Google Forms pretending to be Scholar’s Challenge rounds.
            </p>

            <p class="big-question">
              Why not bring everything together in <strong>ONE PLACE</strong>?
            </p>

            <p>
              We encourage everyone to create their own resources and share them with the community. But we also believe those resources should be easier to find, easier to use, and easier to improve together.
            </p>

            <p class="promise">
              <strong>Our promise is to always keep this app free. We do not want it to become a business, and we do not want to make money from it. We simply want to help WSC reach as many alpacas as possible.</strong>
            </p>

            <div class="community-call">
              <p><strong>Cornucopia</strong>, let us use your incredible guides and questionnaires!</p>
              <p><strong>Ignition</strong> and <strong>Kumqwatt</strong>, use the app to organize events!</p>
              <p><strong>Pwaa Pwaa Revolution</strong>, come improve the app with your IT skills!</p>
              <p><strong>Beijing Alpacas</strong>, <strong>Pwaaparation</strong>, <strong>Pwaprep</strong>, <strong>Pwapwa Revolution</strong>: share your knowledge here!</p>
            </div>

            <p class="final-call">
              <strong>Join the team.</strong>
            </p>
          </div>
          <div class="panel-actions cooperation-actions">
            <a class="cooperation-action-card" href="${escapeHtml(DISCORD_INVITE_URL)}" target="_blank" rel="noopener noreferrer" aria-label="Join on discord">
              <img src="./assets/mascot/library/final-pack/Discordlogo.png?v=${ASSET_CACHE_VERSION}" alt="" aria-hidden="true" />
              <strong>Join on discord</strong>
            </a>
            <a class="cooperation-action-card" href="${escapeHtml(CONTACT_EMAIL_URL)}" aria-label="Send an email">
              <img src="./assets/footer/contact-icon.png?v=${ASSET_CACHE_VERSION}" alt="" aria-hidden="true" />
              <strong>Send an email</strong>
            </a>
          </div>
        </div>
      </div>
    </div>
  ` : "");
      syncActiveModalFocus();
    }

    return Object.freeze({
      syncAppModeClasses,
      renderInsights,
      renderStats,
      renderSessionControls,
      renderAppEntryGate,
      renderAppEntryAuthPanel,
      renderProgressCircleStatCard,
      renderBestScoreStrip,
      renderBestScoreCard,
      renderOnlineScoreStrip,
      getOnlineGameRecord,
      formatBestNumberStat,
      getBestRunDestinationLabel,
      renderSummary,
      renderSummaryChip,
      renderAuthModal,
      renderAuthGate,
      renderAuthIntro,
      renderAuthNotice,
      renderAuthBody,
      renderConnectedAlpaccount,
      renderLoginForm,
      renderSignupForm,
      renderForgotPasswordForm,
      renderResetPasswordForm,
      getAuthRenderContext,
      renderResourcesModal,
      renderCooperationModal
    });
  }

  global.WSC_CREATE_APP_SHELL_RENDERER = createAppShellRenderer;
}(window));
