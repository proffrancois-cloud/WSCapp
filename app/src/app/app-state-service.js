(function () {
  const DEFAULT_STATS = Object.freeze({
    sessions: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    bestAccuracy: 0,
    bestStreak: 0,
    bestAlpacapardyScore: 0,
    bestRunStage: -1,
    bestJumpScore: 0,
    bestJumpDistance: 0,
    bestRelayScore: 0,
    bestRaceScore: 0,
    liveRecords: {}
  });

  function createDefaultStats(progressService = window.WSC_PROGRESS_SERVICE) {
    return progressService?.getDefaultStats
      ? progressService.getDefaultStats()
      : { ...DEFAULT_STATS, liveRecords: {} };
  }

  function createDefaultSelectionState({ defaultLensId = "section" } = {}) {
    return {
      path: null,
      lens: defaultLensId,
      targetIds: [],
      targetId: null,
      mode: null
    };
  }

  function createDefaultUiState() {
    return {
      wizardTransition: "forward",
      appEntryGateOpen: true,
      appShellMode: null,
      cooperationOpen: false,
      authOpen: false,
      authMode: "login",
      resourcesOpen: false,
      rawAssetSelections: {},
      rawQuizSelections: {},
      rawQuizPages: {},
      openModeChoicePath: null,
      rawMediaLightbox: null,
      rawMediaSwipeStartX: null
    };
  }

  function createDefaultAuthState() {
    return {
      client: null,
      session: null,
      profile: null,
      status: "checking",
      message: "",
      error: ""
    };
  }

  function createDefaultLiveState({
    defaultGameType = "alpacapardy",
    pendingRunColor = "cream",
    guestName = ""
  } = {}) {
    return {
      openSessions: [],
      currentSession: null,
      currentPlayer: null,
      players: [],
      revision: 0,
      status: "idle",
      message: "",
      error: "",
      selectedGameType: defaultGameType,
      onlineView: "hub",
      arcadeState: null,
      lobbyChannel: null,
      sessionChannel: null,
      heartbeatId: null,
      syncId: null,
      syncBusy: false,
      joinCodeDraft: "",
      autoStartBusy: false,
      launchCountdownText: "",
      launchCountdownSessionId: null,
      waitingVideoSessionId: null,
      waitingVideos: [],
      waitingVideoIndex: 0,
      pendingRunColor,
      guestName
    };
  }

  function createInitialState({
    defaultLensId = "section",
    pendingRunColor = "cream",
    guestName = "",
    stats = createDefaultStats(),
    rawMastery = {}
  } = {}) {
    return {
      selection: createDefaultSelectionState({ defaultLensId }),
      ui: createDefaultUiState(),
      auth: createDefaultAuthState(),
      live: createDefaultLiveState({ pendingRunColor, guestName }),
      experience: null,
      stats,
      rawMastery
    };
  }

  function isOnlineMode(appState) {
    return appState?.ui?.appShellMode === "online";
  }

  function isLocalMode(appState) {
    return appState?.ui?.appShellMode === "local";
  }

  function getSelectedLiveGameType(appState, fallback = "alpacapardy") {
    return appState?.live?.currentSession?.game_type || appState?.live?.selectedGameType || fallback;
  }

  function isPopupBlocking(appState, { hasActiveQuestionPopup = false } = {}) {
    const blockingOverlayOpen = Boolean(
      appState?.ui?.appEntryGateOpen ||
      appState?.ui?.resourcesOpen ||
      appState?.ui?.cooperationOpen ||
      appState?.ui?.authOpen ||
      appState?.ui?.rawMediaLightbox ||
      appState?.live?.launchCountdownText ||
      (isOnlineMode(appState) && appState?.live?.currentSession?.status === "lobby")
    );

    return isOnlineMode(appState) ? blockingOverlayOpen : Boolean(hasActiveQuestionPopup);
  }

  window.WSC_APP_STATE_SERVICE = Object.freeze({
    createDefaultStats,
    createDefaultSelectionState,
    createDefaultUiState,
    createDefaultAuthState,
    createDefaultLiveState,
    createInitialState,
    isOnlineMode,
    isLocalMode,
    getSelectedLiveGameType,
    isPopupBlocking
  });
}());
