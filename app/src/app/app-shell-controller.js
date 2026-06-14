(function initAppShellController(global) {
  "use strict";

  const RESOURCE_LINKS = Object.freeze([
    {
      label: "Official website",
      url: "https://www.scholarscup.org/"
    },
    {
      label: "PwaaPwaa Revolution!",
      url: "https://pwaapwaarevolution.pwaaapwaarevolution.workers.dev/#"
    },
    {
      label: "PwaaPwaa Discord",
      url: "https://discord.gg/CK93VwNST8"
    },
    {
      label: "Pwaalpaca",
      url: "https://discord.gg/gRhgxKd7Q"
    },
    {
      label: "WSC reddit",
      url: "https://www.reddit.com/r/WorldScholars/"
    },
    {
      label: "ReadyScholarOne Discord",
      url: "https://discord.gg/93nMSrMG"
    },
    {
      label: "HongKong regional round slides",
      url: "https://docs.google.com/presentation/d/1xzByNi68oPn36sQyyJQt8cv4rnuTCacyLrNet8VXnDU/edit?slide=id.g3d1146daefb_0_4#slide=id.g3d1146daefb_0_4"
    },
    {
      label: "Pwaaprep",
      url: "https://pwaaprep.com/Are-We-There-Yet.html"
    }
  ]);

  function requireObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error("WSC app shell controller requires " + name + ".");
    }
    return value;
  }

  function requireFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC app shell controller missing callback: " + name);
    }
    return value;
  }

  function createAppShellController(options = {}) {
    const state = requireObject(options.appState, "appState");
    const refs = requireObject(options.refs, "refs");
    const appStateService = requireObject(options.appStateService, "appStateService");
    const appShellRenderer = requireObject(options.appShellRenderer, "appShellRenderer");
    const onlineModeController = requireObject(options.onlineModeController, "onlineModeController");
    const modalFocusService = options.modalFocusService || null;
    const documentRef = options.documentRef || global.document;
    const constants = options.constants || {};
    const callbacks = options.callbacks || {};

    const DEFAULT_LENS_ID = constants.DEFAULT_LENS_ID || "section";
    const renderSummary = requireFunction(callbacks, "renderSummary");
    const renderWizard = requireFunction(callbacks, "renderWizard");
    const renderLiveOverlayMount = requireFunction(callbacks, "renderLiveOverlayMount");
    const renderExperience = requireFunction(callbacks, "renderExperience");
    const resetAlpacapardyLiveState = requireFunction(callbacks, "resetAlpacapardyLiveState");
    const canAccessLegacyLiveRooms = requireFunction(callbacks, "canAccessLegacyLiveRooms");
    const getLegacyLiveRoomsDisabledMessage = requireFunction(callbacks, "getLegacyLiveRoomsDisabledMessage");
    const buildJeopardyExperience = requireFunction(callbacks, "buildJeopardyExperience");
    const refreshAlpacapardyLiveLobby = requireFunction(callbacks, "refreshAlpacapardyLiveLobby");

    function render() {
      appShellRenderer.syncAppModeClasses();
      renderStats();
      renderSessionControls();
      renderAppEntryGate();
      renderSummary();
      renderWizard();
      renderLiveOverlayMount();
      renderExperience();
      renderCooperationModal();
      renderResourcesModal();
      renderAuthModal();
      syncPopupScrollLock();
      syncActiveModalFocus();
    }

    function syncActiveModalFocus() {
      modalFocusService?.syncActiveDialog({ documentRef });
    }

    function renderInsights() {
      return appShellRenderer.renderInsights();
    }

    function renderStats() {
      return appShellRenderer.renderStats();
    }

    function renderSessionControls() {
      return appShellRenderer.renderSessionControls();
    }

    function renderAppEntryGate() {
      return appShellRenderer.renderAppEntryGate();
    }

    function renderAppEntryAuthPanel() {
      return appShellRenderer.renderAppEntryAuthPanel();
    }

    function renderAuthModal() {
      return appShellRenderer.renderAuthModal();
    }

    function renderResourcesModal() {
      return appShellRenderer.renderResourcesModal();
    }

    function renderCooperationModal() {
      return appShellRenderer.renderCooperationModal();
    }

    function toggleHeroMenu(button) {
      const links = button.closest(".hero-links");
      if (!links) {
        return;
      }

      const isOpen = links.classList.toggle("is-open");
      button.setAttribute("aria-expanded", isOpen ? "true" : "false");
      button.setAttribute("aria-label", isOpen ? "Close header menu" : "Open header menu");
    }

    function closeHeroMenu() {
      const links = documentRef.querySelector(".hero-links.is-open");
      if (!links) {
        return;
      }
      links.classList.remove("is-open");
      links.querySelector("[data-toggle-hero-menu]")?.setAttribute("aria-expanded", "false");
    }

    function chooseAppEntryMode(mode) {
      if (mode === "online") {
        openAlpacaOnlineCampus();
        return;
      }

      switchToLocalMode();
    }

    function openAlpacaOnlineCampus() {
      state.ui.appEntryGateOpen = false;
      onlineModeController.openCampusMultiplayer();
    }

    function switchToLocalMode() {
      state.ui.appEntryGateOpen = false;
      state.ui.appShellMode = "local";
      state.ui.cooperationOpen = true;
      resetAlpacapardyLiveState();
      state.experience = null;
      state.selection.path = null;
      state.selection.lens = DEFAULT_LENS_ID;
      state.selection.targetIds = [];
      state.selection.targetId = null;
      state.selection.mode = null;
      render();
      refs.routeBuilder?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function openAlpacaOnlineHub() {
      if (!canAccessLegacyLiveRooms()) {
        state.ui.appEntryGateOpen = true;
        state.live.error = getLegacyLiveRoomsDisabledMessage();
        render();
        return;
      }

      state.ui.appEntryGateOpen = false;
      state.ui.appShellMode = "online";
      state.ui.cooperationOpen = false;
      state.ui.wizardTransition = "forward";
      state.live.onlineView = "hub";
      state.selection.path = "play";
      state.selection.lens = DEFAULT_LENS_ID;
      state.selection.targetIds = [];
      state.selection.targetId = null;
      state.selection.mode = "jeopardy";
      state.experience = buildJeopardyExperience();
      state.experience.playMode = "multiplayer";
      render();
      refreshAlpacapardyLiveLobby();
      refs.routeBuilder?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function hasActiveQuestionPopup() {
      if (
        state.ui.appEntryGateOpen ||
        state.ui.resourcesOpen ||
        state.ui.cooperationOpen ||
        state.ui.authOpen ||
        state.ui.rawMediaLightbox
      ) {
        return true;
      }

      const experience = state.experience;
      if (!experience || experience.finished) {
        return false;
      }

      if (experience.type === "jeopardy") {
        if (state.ui.appShellMode === "online" && !experience.started) {
          return false;
        }
        return !experience.started || Boolean(experience.active);
      }

      if (experience.type === "relay") {
        return Boolean(experience.started);
      }

      if (experience.type === "buildcase") {
        return experience.phase === "topic";
      }

      if (experience.type === "mindmap") {
        return Boolean(experience.activeEntryKey || experience.activeGuideSectionId);
      }

      if (experience.type === "race") {
        return Boolean(experience.started);
      }

      if (experience.type === "jump") {
        return experience.phase === "question" || experience.phase === "feedback";
      }

      return false;
    }

    function syncPopupScrollLock() {
      const shouldLock = appStateService.isPopupBlocking(state, {
        hasActiveQuestionPopup: hasActiveQuestionPopup()
      });
      documentRef.body.classList.toggle("with-popup", shouldLock);
    }

    function syncAuthChrome() {
      renderSessionControls();
      renderAppEntryGate();
      renderAuthModal();
      if (state.experience?.type === "jeopardy") {
        renderExperience();
      }
      syncPopupScrollLock();
    }

    return {
      render,
      syncActiveModalFocus,
      renderInsights,
      renderStats,
      renderSessionControls,
      renderAppEntryGate,
      renderAppEntryAuthPanel,
      renderAuthModal,
      renderResourcesModal,
      renderCooperationModal,
      toggleHeroMenu,
      closeHeroMenu,
      chooseAppEntryMode,
      openAlpacaOnlineCampus,
      switchToLocalMode,
      openAlpacaOnlineHub,
      hasActiveQuestionPopup,
      syncPopupScrollLock,
      syncAuthChrome
    };
  }

  global.WSC_APP_SHELL_RESOURCE_LINKS = RESOURCE_LINKS;
  global.WSC_CREATE_APP_SHELL_CONTROLLER = createAppShellController;
})(window);
