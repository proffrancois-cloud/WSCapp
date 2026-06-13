(function initAppEventRouter(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC app event router missing action dependency: " + name);
    }
    return value;
  }

  function createAppEventRouter(options = {}) {
    const {
      appState: state,
      refs,
      alpacapardyLiveSupabaseService,
      windowRef = global,
      documentRef = global.document,
      actions = {}
    } = options;

    if (!state) {
      throw new Error("WSC app event router missing app state.");
    }
    if (!refs) {
      throw new Error("WSC app event router missing DOM refs.");
    }

    const window = windowRef;
    const document = documentRef;
    const FormData = window.FormData || global.FormData;
    const closeHeroMenu = requiredFunction(actions, "closeHeroMenu");
    const syncAuthChrome = requiredFunction(actions, "syncAuthChrome");
    const syncPopupScrollLock = requiredFunction(actions, "syncPopupScrollLock");
    const renderAuthModal = requiredFunction(actions, "renderAuthModal");
    const clearAuthNotice = requiredFunction(actions, "clearAuthNotice");
    const signOutOfAlpaccount = requiredFunction(actions, "signOutOfAlpaccount");
    const openAlpacaOnlineCampus = requiredFunction(actions, "openAlpacaOnlineCampus");
    const chooseAppEntryMode = requiredFunction(actions, "chooseAppEntryMode");
    const renderCooperationModal = requiredFunction(actions, "renderCooperationModal");
    const switchToLocalMode = requiredFunction(actions, "switchToLocalMode");
    const refreshAlpacapardyLiveLobby = requiredFunction(actions, "refreshAlpacapardyLiveLobby");
    const returnToAlpacaOnlineHub = requiredFunction(actions, "returnToAlpacaOnlineHub");
    const chooseOnlineGameType = requiredFunction(actions, "chooseOnlineGameType");
    const createSelectedLiveGameRoom = requiredFunction(actions, "createSelectedLiveGameRoom");
    const selectLiveRunSetupColor = requiredFunction(actions, "selectLiveRunSetupColor");
    const startSelectedLiveGame = requiredFunction(actions, "startSelectedLiveGame");
    const selectLiveAlpacaColor = requiredFunction(actions, "selectLiveAlpacaColor");
    const answerSelectedLiveGame = requiredFunction(actions, "answerSelectedLiveGame");
    const advanceSelectedLiveGame = requiredFunction(actions, "advanceSelectedLiveGame");
    const buzzSelectedLiveGame = requiredFunction(actions, "buzzSelectedLiveGame");
    const navigateLiveWaitingVideo = requiredFunction(actions, "navigateLiveWaitingVideo");
    const renderResourcesModal = requiredFunction(actions, "renderResourcesModal");
    const toggleHeroMenu = requiredFunction(actions, "toggleHeroMenu");
    const canDismissAuthModal = requiredFunction(actions, "canDismissAuthModal");
    const choosePath = requiredFunction(actions, "choosePath");
    const chooseLens = requiredFunction(actions, "chooseLens");
    const chooseTarget = requiredFunction(actions, "chooseTarget");
    const toggleModeChoiceSection = requiredFunction(actions, "toggleModeChoiceSection");
    const toggleModeChoiceMenu = requiredFunction(actions, "toggleModeChoiceMenu");
    const continueTargetSelection = requiredFunction(actions, "continueTargetSelection");
    const chooseMode = requiredFunction(actions, "chooseMode");
    const closeTrainTip = requiredFunction(actions, "closeTrainTip");
    const clearFrom = requiredFunction(actions, "clearFrom");
    const goToWizardStep = requiredFunction(actions, "goToWizardStep");
    const openRawConnection = requiredFunction(actions, "openRawConnection");
    const openGuideSection = requiredFunction(actions, "openGuideSection");
    const openSectionChannel = requiredFunction(actions, "openSectionChannel");
    const rememberRawQuestionGallerySlide = requiredFunction(actions, "rememberRawQuestionGallerySlide");
    const selectRawQuizOption = requiredFunction(actions, "selectRawQuizOption");
    const shiftRawQuizPage = requiredFunction(actions, "shiftRawQuizPage");
    const toggleRawMastery = requiredFunction(actions, "toggleRawMastery");
    const selectRawAssetPoint = requiredFunction(actions, "selectRawAssetPoint");
    const openRawMediaLightboxFromTrigger = requiredFunction(actions, "openRawMediaLightboxFromTrigger");
    const shiftRawMediaLightbox = requiredFunction(actions, "shiftRawMediaLightbox");
    const closeRawMediaLightbox = requiredFunction(actions, "closeRawMediaLightbox");
    const openMindMapEntry = requiredFunction(actions, "openMindMapEntry");
    const navigateMindMapGallery = requiredFunction(actions, "navigateMindMapGallery");
    const openMindMapGuide = requiredFunction(actions, "openMindMapGuide");
    const closeMindMapEntry = requiredFunction(actions, "closeMindMapEntry");
    const closeMindMapGuide = requiredFunction(actions, "closeMindMapGuide");
    const launchExperience = requiredFunction(actions, "launchExperience");
    const navigateSlide = requiredFunction(actions, "navigateSlide");
    const navigateAlpacaChannel = requiredFunction(actions, "navigateAlpacaChannel");
    const navigateAlpacard = requiredFunction(actions, "navigateAlpacard");
    const setAlpacardIndex = requiredFunction(actions, "setAlpacardIndex");
    const flipAlpacard = requiredFunction(actions, "flipAlpacard");
    const shuffleAlpacard = requiredFunction(actions, "shuffleAlpacard");
    const toggleQuizSection = requiredFunction(actions, "toggleQuizSection");
    const selectAllQuizSections = requiredFunction(actions, "selectAllQuizSections");
    const setQuizQuestionCount = requiredFunction(actions, "setQuizQuestionCount");
    const toggleQuizDifficulty = requiredFunction(actions, "toggleQuizDifficulty");
    const startQuizRoute = requiredFunction(actions, "startQuizRoute");
    const answerQuizQuestion = requiredFunction(actions, "answerQuizQuestion");
    const submitQuizRoute = requiredFunction(actions, "submitQuizRoute");
    const resetQuizRoute = requiredFunction(actions, "resetQuizRoute");
    const nextWritingPrompt = requiredFunction(actions, "nextWritingPrompt");
    const setWritingPhase = requiredFunction(actions, "setWritingPhase");
    const startBowlPractice = requiredFunction(actions, "startBowlPractice");
    const answerBowlQuestion = requiredFunction(actions, "answerBowlQuestion");
    const advanceBowlQuestion = requiredFunction(actions, "advanceBowlQuestion");
    const resetBowlPractice = requiredFunction(actions, "resetBowlPractice");
    const answerRaceQuestion = requiredFunction(actions, "answerRaceQuestion");
    const startRaceRoute = requiredFunction(actions, "startRaceRoute");
    const toggleRaceSetupCategory = requiredFunction(actions, "toggleRaceSetupCategory");
    const advanceRace = requiredFunction(actions, "advanceRace");
    const startJumpRoute = requiredFunction(actions, "startJumpRoute");
    const toggleJumpSetupCategory = requiredFunction(actions, "toggleJumpSetupCategory");
    const performJumpAction = requiredFunction(actions, "performJumpAction");
    const answerJumpQuestion = requiredFunction(actions, "answerJumpQuestion");
    const continueJumpRoute = requiredFunction(actions, "continueJumpRoute");
    const startBuildCaseRoute = requiredFunction(actions, "startBuildCaseRoute");
    const showNextDebateTopic = requiredFunction(actions, "showNextDebateTopic");
    const startDebateConversation = requiredFunction(actions, "startDebateConversation");
    const toggleDebateSideSpin = requiredFunction(actions, "toggleDebateSideSpin");
    const returnToDebateTopic = requiredFunction(actions, "returnToDebateTopic");
    const resetDebateSpinForCurrentTopic = requiredFunction(actions, "resetDebateSpinForCurrentTopic");
    const renderExperience = requiredFunction(actions, "renderExperience");
    const toggleDebateSuggestion = requiredFunction(actions, "toggleDebateSuggestion");
    const submitDebateRound = requiredFunction(actions, "submitDebateRound");
    const advanceDebateRound = requiredFunction(actions, "advanceDebateRound");
    const chooseBuildCaseCamp = requiredFunction(actions, "chooseBuildCaseCamp");
    const toggleBuildCaseSupport = requiredFunction(actions, "toggleBuildCaseSupport");
    const confirmBuildCaseSupports = requiredFunction(actions, "confirmBuildCaseSupports");
    const chooseBuildCaseRebuttal = requiredFunction(actions, "chooseBuildCaseRebuttal");
    const advanceBuildCaseRound = requiredFunction(actions, "advanceBuildCaseRound");
    const setJeopardyPlayMode = requiredFunction(actions, "setJeopardyPlayMode");
    const createAlpacapardyLiveRoom = requiredFunction(actions, "createAlpacapardyLiveRoom");
    const joinAlpacapardyLiveRoom = requiredFunction(actions, "joinAlpacapardyLiveRoom");
    const leaveAlpacapardyLiveRoom = requiredFunction(actions, "leaveAlpacapardyLiveRoom");
    const startAlpacapardyLiveGame = requiredFunction(actions, "startAlpacapardyLiveGame");
    const openJeopardyTile = requiredFunction(actions, "openJeopardyTile");
    const answerJeopardyQuestion = requiredFunction(actions, "answerJeopardyQuestion");
    const setJeopardyTeamCount = requiredFunction(actions, "setJeopardyTeamCount");
    const toggleJeopardySetupCategory = requiredFunction(actions, "toggleJeopardySetupCategory");
    const startJeopardyGame = requiredFunction(actions, "startJeopardyGame");
    const closeJeopardyFocus = requiredFunction(actions, "closeJeopardyFocus");
    const chooseJeopardyTeam = requiredFunction(actions, "chooseJeopardyTeam");
    const addJeopardyTeam = requiredFunction(actions, "addJeopardyTeam");
    const removeJeopardyTeam = requiredFunction(actions, "removeJeopardyTeam");
    const advanceJeopardyTeam = requiredFunction(actions, "advanceJeopardyTeam");
    const answerRelayQuestion = requiredFunction(actions, "answerRelayQuestion");
    const startRelayRoute = requiredFunction(actions, "startRelayRoute");
    const toggleRelaySetupCategory = requiredFunction(actions, "toggleRelaySetupCategory");
    const setRelayTeamCount = requiredFunction(actions, "setRelayTeamCount");
    const setRelayQuestionCount = requiredFunction(actions, "setRelayQuestionCount");
    const advanceRelayQuestion = requiredFunction(actions, "advanceRelayQuestion");
    const addRelayTeam = requiredFunction(actions, "addRelayTeam");
    const removeRelayTeam = requiredFunction(actions, "removeRelayTeam");
    const buzzRelayTeam = requiredFunction(actions, "buzzRelayTeam");
    const answerRunQuestion = requiredFunction(actions, "answerRunQuestion");
    const toggleRunSetupCategory = requiredFunction(actions, "toggleRunSetupCategory");
    const startRunRoute = requiredFunction(actions, "startRunRoute");
    const continueRun = requiredFunction(actions, "continueRun");
    const resetCurrentRouteAttempts = requiredFunction(actions, "resetCurrentRouteAttempts");
    const changeGuidingSections = requiredFunction(actions, "changeGuidingSections");
    const changeModeSelection = requiredFunction(actions, "changeModeSelection");
    const closeCurrentExperience = requiredFunction(actions, "closeCurrentExperience");
    const joinAlpacapardyLiveRoomByCode = requiredFunction(actions, "joinAlpacapardyLiveRoomByCode");
    const sendAlpacapardyLiveChat = requiredFunction(actions, "sendAlpacapardyLiveChat");
    const submitAuthForm = requiredFunction(actions, "submitAuthForm");
    const getActiveMindMapEntryBundle = requiredFunction(actions, "getActiveMindMapEntryBundle");

function handleClick(event) {
  const backToTop = event.target.closest("[data-back-to-top]");
  if (backToTop) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    return;
  }

  const openAuth = event.target.closest("[data-open-auth]");
  if (openAuth) {
    closeHeroMenu();
    if (state.ui.appEntryGateOpen) {
      state.ui.authMode = "login";
      syncAuthChrome();
      return;
    }
    state.ui.authOpen = true;
    syncPopupScrollLock();
    renderAuthModal();
    return;
  }

  const authModeButton = event.target.closest("[data-auth-mode]");
  if (authModeButton) {
    state.ui.authMode = authModeButton.dataset.authMode;
    clearAuthNotice();
    syncAuthChrome();
    return;
  }

  const signOutButton = event.target.closest("[data-auth-signout]");
  if (signOutButton) {
    signOutOfAlpaccount();
    return;
  }

  const openAlpacaOnlineCampusButton = event.target.closest("[data-open-alpaca-online-campus]");
  if (openAlpacaOnlineCampusButton) {
    openAlpacaOnlineCampus();
    return;
  }

  const openAppEntryGate = event.target.closest("[data-open-app-entry-gate]");
  if (openAppEntryGate) {
    state.ui.appEntryGateOpen = true;
    state.ui.authOpen = false;
    state.ui.authMode = "login";
    syncAuthChrome();
    return;
  }

  const appEntryChoice = event.target.closest("[data-app-entry-choice]");
  if (appEntryChoice) {
    chooseAppEntryMode(appEntryChoice.dataset.appEntryChoice);
    return;
  }

  const closeCooperation = event.target.closest("[data-close-cooperation]");
  if (closeCooperation) {
    state.ui.cooperationOpen = false;
    syncPopupScrollLock();
    renderCooperationModal();
    return;
  }

  const appEntryLogin = event.target.closest("[data-app-entry-login]");
  if (appEntryLogin) {
    state.ui.authMode = "login";
    syncAuthChrome();
    return;
  }

  const onlineBackLocal = event.target.closest("[data-online-back-local]");
  if (onlineBackLocal) {
    switchToLocalMode();
    return;
  }

  const onlineRefresh = event.target.closest("[data-online-refresh]");
  if (onlineRefresh) {
    refreshAlpacapardyLiveLobby();
    return;
  }

  const onlineReturnHub = event.target.closest("[data-online-return-hub]");
  if (onlineReturnHub) {
    returnToAlpacaOnlineHub();
    return;
  }

  const onlineGameChoice = event.target.closest("[data-online-game-choice]");
  if (onlineGameChoice) {
    chooseOnlineGameType(onlineGameChoice.dataset.onlineGameChoice);
    return;
  }

  const liveCreateGame = event.target.closest("[data-live-create-game]");
  if (liveCreateGame) {
    createSelectedLiveGameRoom();
    return;
  }

  const liveRunSetupColor = event.target.closest("[data-live-run-setup-color]");
  if (liveRunSetupColor) {
    selectLiveRunSetupColor(liveRunSetupColor.dataset.liveRunSetupColor);
    return;
  }

  const liveStartGame = event.target.closest("[data-live-start-game]");
  if (liveStartGame) {
    startSelectedLiveGame();
    return;
  }

  const liveColorSelect = event.target.closest("[data-live-color-select]");
  if (liveColorSelect) {
    selectLiveAlpacaColor(liveColorSelect.dataset.liveColorSelect);
    return;
  }

  const liveAnswer = event.target.closest("[data-live-answer]");
  if (liveAnswer) {
    answerSelectedLiveGame(Number(liveAnswer.dataset.liveAnswer));
    return;
  }

  const liveNext = event.target.closest("[data-live-next]");
  if (liveNext) {
    advanceSelectedLiveGame();
    return;
  }

  const liveBuzz = event.target.closest("[data-live-buzz]");
  if (liveBuzz) {
    buzzSelectedLiveGame();
    return;
  }

  const liveWaitingVideoNav = event.target.closest("[data-live-waiting-video-nav]");
  if (liveWaitingVideoNav) {
    navigateLiveWaitingVideo(liveWaitingVideoNav.dataset.liveWaitingVideoNav);
    return;
  }

  const openResources = event.target.closest("[data-open-resources]");
  if (openResources) {
    state.ui.resourcesOpen = true;
    closeHeroMenu();
    syncPopupScrollLock();
    renderResourcesModal();
    return;
  }

  const heroMenuButton = event.target.closest("[data-toggle-hero-menu]");
  if (heroMenuButton) {
    toggleHeroMenu(heroMenuButton);
    return;
  }

  const closeAuth = event.target.closest("[data-close-auth]");
  if (closeAuth) {
    if (!canDismissAuthModal()) {
      return;
    }
    state.ui.authOpen = false;
    syncPopupScrollLock();
    renderAuthModal();
    return;
  }

  const closeResources = event.target.closest("[data-close-resources]");
  if (closeResources && (!event.target.closest("[data-resources-window]") || event.target.closest(".popup-close-button"))) {
    state.ui.resourcesOpen = false;
    syncPopupScrollLock();
    renderResourcesModal();
    return;
  }

  const scrollButton = event.target.closest("[data-scroll-route-builder]");
  if (scrollButton) {
    refs.routeBuilder && refs.routeBuilder.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const pathButton = event.target.closest("[data-pick-path]");
  if (pathButton) {
    choosePath(pathButton.dataset.pickPath);
    return;
  }

  const lensButton = event.target.closest("[data-pick-lens]");
  if (lensButton) {
    chooseLens(lensButton.dataset.pickLens);
    return;
  }

  const targetButton = event.target.closest("[data-pick-target]");
  if (targetButton) {
    chooseTarget(targetButton.dataset.pickTarget);
    return;
  }

  const modeSectionButton = event.target.closest("[data-toggle-mode-section]");
  if (modeSectionButton) {
    toggleModeChoiceSection(modeSectionButton.dataset.toggleModeSection);
    return;
  }

  const modeMenuButton = event.target.closest("[data-toggle-mode-menu]");
  if (modeMenuButton) {
    toggleModeChoiceMenu(modeMenuButton);
    return;
  }

  const targetNextButton = event.target.closest("[data-target-next]");
  if (targetNextButton) {
    continueTargetSelection();
    return;
  }

  const modeButton = event.target.closest("[data-pick-mode]");
  if (modeButton) {
    chooseMode(modeButton.dataset.pickMode, modeButton.dataset.pickModePath || null);
    return;
  }

  const trainTipClose = event.target.closest("[data-train-tip-close]");
  if (trainTipClose) {
    closeTrainTip();
    return;
  }

  const clearButton = event.target.closest("[data-clear-from]");
  if (clearButton) {
    clearFrom(clearButton.dataset.clearFrom);
    return;
  }

  const goStepButton = event.target.closest("[data-go-step]");
  if (goStepButton) {
    goToWizardStep(Number(goStepButton.dataset.goStep));
    return;
  }

  const rawConnectionButton = event.target.closest("[data-open-raw-connection]");
  if (rawConnectionButton) {
    openRawConnection(
      rawConnectionButton.dataset.openRawConnectionLens,
      rawConnectionButton.dataset.openRawConnectionTarget
    );
    return;
  }

  const guideSectionButton = event.target.closest("[data-open-guide-section]");
  if (guideSectionButton) {
    openGuideSection(guideSectionButton.dataset.openGuideSection);
    return;
  }

  const sectionChannelButton = event.target.closest("[data-open-section-channel]");
  if (sectionChannelButton) {
    openSectionChannel(sectionChannelButton.dataset.openSectionChannel);
    return;
  }

  const rawQuizOptionButton = event.target.closest("[data-raw-quiz-option]");
  if (rawQuizOptionButton) {
    rememberRawQuestionGallerySlide(rawQuizOptionButton);
    selectRawQuizOption(
      rawQuizOptionButton.dataset.rawQuizKey,
      Number(rawQuizOptionButton.dataset.rawQuizOption)
    );
    return;
  }

  const rawQuizPageButton = event.target.closest("[data-raw-quiz-page]");
  if (rawQuizPageButton) {
    shiftRawQuizPage(
      rawQuizPageButton.dataset.rawQuizPage,
      Number(rawQuizPageButton.dataset.rawQuizDirection),
      Number(rawQuizPageButton.dataset.rawQuizTotal)
    );
    return;
  }

  const rawMasteryToggle = event.target.closest("[data-raw-mastery-toggle]");
  if (rawMasteryToggle) {
    toggleRawMastery(rawMasteryToggle.dataset.rawMasteryToggle);
    return;
  }

  const rawAssetPointButton = event.target.closest("[data-raw-asset-point]");
  if (rawAssetPointButton) {
    selectRawAssetPoint(
      Number(rawAssetPointButton.dataset.rawAssetEntryIndex),
      Number(rawAssetPointButton.dataset.rawAssetIndex),
      Number(rawAssetPointButton.dataset.rawAssetPoint)
    );
    return;
  }

  const rawMediaTrigger = event.target.closest("[data-open-raw-media]");
  if (rawMediaTrigger) {
    openRawMediaLightboxFromTrigger(rawMediaTrigger);
    return;
  }

  const rawMediaNav = event.target.closest("[data-raw-media-nav]");
  if (rawMediaNav) {
    shiftRawMediaLightbox(rawMediaNav.dataset.rawMediaNav === "next" ? 1 : -1);
    return;
  }

  const closeRawMedia = event.target.closest("[data-close-raw-media]");
  if (closeRawMedia && (!event.target.closest("[data-raw-media-window]") || event.target.closest(".popup-close-button"))) {
    closeRawMediaLightbox();
    return;
  }

  const openMindMapEntryButton = event.target.closest("[data-open-mindmap-entry]");
  if (openMindMapEntryButton) {
    openMindMapEntry(openMindMapEntryButton.dataset.openMindmapEntry);
    return;
  }

  const mindMapGalleryNavButton = event.target.closest("[data-mindmap-gallery-nav]");
  if (mindMapGalleryNavButton) {
    navigateMindMapGallery(mindMapGalleryNavButton.dataset.mindmapGalleryNav);
    return;
  }

  const openMindMapGuideButton = event.target.closest("[data-open-mindmap-guide]");
  if (openMindMapGuideButton) {
    openMindMapGuide(openMindMapGuideButton.dataset.openMindmapGuide);
    return;
  }

  const closeMindMapPopup = event.target.closest("[data-close-mindmap-popup]");
  if (closeMindMapPopup && (!event.target.closest("[data-mindmap-popup-window]") || closeMindMapPopup.tagName === "BUTTON")) {
    closeMindMapEntry();
    return;
  }

  const closeMindMapGuidePopup = event.target.closest("[data-close-mindmap-guide-popup]");
  if (closeMindMapGuidePopup && (!event.target.closest("[data-mindmap-guide-popup-window]") || closeMindMapGuidePopup.tagName === "BUTTON")) {
    closeMindMapGuide();
    return;
  }

  const launchButton = event.target.closest("[data-launch-experience]");
  if (launchButton) {
    launchExperience();
    return;
  }

  const slideNavButton = event.target.closest("[data-slide-nav]");
  if (slideNavButton) {
    navigateSlide(slideNavButton.dataset.slideNav);
    return;
  }

  const channelNavButton = event.target.closest("[data-channel-nav]");
  if (channelNavButton) {
    navigateAlpacaChannel(channelNavButton.dataset.channelNav);
    return;
  }

  const alpacardNavButton = event.target.closest("[data-alpacard-nav]");
  if (alpacardNavButton) {
    navigateAlpacard(alpacardNavButton.dataset.alpacardNav);
    return;
  }

  const alpacardThumbButton = event.target.closest("[data-alpacard-index]");
  if (alpacardThumbButton) {
    setAlpacardIndex(Number(alpacardThumbButton.dataset.alpacardIndex));
    return;
  }

  const alpacardFlipButton = event.target.closest("[data-alpacard-flip]");
  if (alpacardFlipButton) {
    flipAlpacard();
    return;
  }

  const alpacardShuffleButton = event.target.closest("[data-alpacard-shuffle]");
  if (alpacardShuffleButton) {
    shuffleAlpacard();
    return;
  }

  const quizToggleSection = event.target.closest("[data-quiz-toggle-section]");
  if (quizToggleSection) {
    toggleQuizSection(quizToggleSection.dataset.quizToggleSection);
    return;
  }

  const quizSelectAll = event.target.closest("[data-quiz-select-all]");
  if (quizSelectAll) {
    selectAllQuizSections();
    return;
  }

  const quizSetCount = event.target.closest("[data-quiz-set-count]");
  if (quizSetCount) {
    setQuizQuestionCount(Number(quizSetCount.dataset.quizSetCount));
    return;
  }

  const quizToggleDifficulty = event.target.closest("[data-quiz-toggle-difficulty]");
  if (quizToggleDifficulty) {
    toggleQuizDifficulty(Number(quizToggleDifficulty.dataset.quizToggleDifficulty));
    return;
  }

  const quizStart = event.target.closest("[data-quiz-start]");
  if (quizStart) {
    startQuizRoute();
    return;
  }

  const quizOption = event.target.closest("[data-quiz-option]");
  if (quizOption) {
    answerQuizQuestion(
      Number(quizOption.dataset.quizQuestion),
      Number(quizOption.dataset.quizOption)
    );
    return;
  }

  const quizSubmit = event.target.closest("[data-quiz-submit]");
  if (quizSubmit) {
    submitQuizRoute();
    return;
  }

  const quizReset = event.target.closest("[data-quiz-reset]");
  if (quizReset) {
    resetQuizRoute();
    return;
  }

  const writingPromptButton = event.target.closest("[data-writing-next-prompt]");
  if (writingPromptButton) {
    nextWritingPrompt();
    return;
  }

  const writingPhaseButton = event.target.closest("[data-writing-phase]");
  if (writingPhaseButton) {
    setWritingPhase(writingPhaseButton.dataset.writingPhase);
    return;
  }

  const bowlStart = event.target.closest("[data-bowl-start]");
  if (bowlStart) {
    startBowlPractice();
    return;
  }

  const bowlOption = event.target.closest("[data-bowl-option]");
  if (bowlOption) {
    answerBowlQuestion(Number(bowlOption.dataset.bowlOption));
    return;
  }

  const bowlNext = event.target.closest("[data-bowl-next]");
  if (bowlNext) {
    advanceBowlQuestion();
    return;
  }

  const bowlReset = event.target.closest("[data-bowl-reset]");
  if (bowlReset) {
    resetBowlPractice();
    return;
  }

  const raceOptionButton = event.target.closest("[data-race-option]");
  if (raceOptionButton) {
    answerRaceQuestion(Number(raceOptionButton.dataset.raceOption));
    return;
  }

  const raceStartButton = event.target.closest("[data-race-start]");
  if (raceStartButton) {
    startRaceRoute();
    return;
  }

  const raceToggleCategory = event.target.closest("[data-race-toggle-category]");
  if (raceToggleCategory) {
    toggleRaceSetupCategory(raceToggleCategory.dataset.raceToggleCategory);
    return;
  }

  const raceAdvanceButton = event.target.closest("[data-race-advance]");
  if (raceAdvanceButton) {
    advanceRace();
    return;
  }

  const jumpStartButton = event.target.closest("[data-jump-start]");
  if (jumpStartButton) {
    startJumpRoute();
    return;
  }

  const jumpToggleCategory = event.target.closest("[data-jump-toggle-category]");
  if (jumpToggleCategory) {
    toggleJumpSetupCategory(jumpToggleCategory.dataset.jumpToggleCategory);
    return;
  }

  const jumpActionButton = event.target.closest("[data-jump-action]");
  if (jumpActionButton) {
    performJumpAction(jumpActionButton.dataset.jumpAction);
    return;
  }

  const jumpOptionButton = event.target.closest("[data-jump-option]");
  if (jumpOptionButton) {
    answerJumpQuestion(Number(jumpOptionButton.dataset.jumpOption));
    return;
  }

  const jumpContinueButton = event.target.closest("[data-jump-continue]");
  if (jumpContinueButton) {
    continueJumpRoute();
    return;
  }

  const buildCaseStart = event.target.closest("[data-buildcase-start]");
  if (buildCaseStart) {
    startBuildCaseRoute();
    return;
  }

  const buildCaseNextTopic = event.target.closest("[data-buildcase-next-topic]");
  if (buildCaseNextTopic) {
    showNextDebateTopic();
    return;
  }

  const buildCaseLetsDebate = event.target.closest("[data-buildcase-lets-debate]");
  if (buildCaseLetsDebate) {
    startDebateConversation();
    return;
  }

  const buildCaseSpinToggle = event.target.closest("[data-buildcase-spin-toggle]");
  if (buildCaseSpinToggle) {
    toggleDebateSideSpin();
    return;
  }

  const buildCaseBackTopic = event.target.closest("[data-buildcase-back-topic]");
  if (buildCaseBackTopic) {
    returnToDebateTopic();
    return;
  }

  const buildCaseSpinAgain = event.target.closest("[data-buildcase-spin-again]");
  if (buildCaseSpinAgain) {
    resetDebateSpinForCurrentTopic();
    renderExperience();
    return;
  }

  const debateSuggestion = event.target.closest("[data-debate-suggestion]");
  if (debateSuggestion) {
    toggleDebateSuggestion(debateSuggestion.dataset.debateSuggestion);
    return;
  }

  const debateSubmitRound = event.target.closest("[data-debate-submit-round]");
  if (debateSubmitRound) {
    submitDebateRound();
    return;
  }

  const debateNextRound = event.target.closest("[data-debate-next-round]");
  if (debateNextRound) {
    advanceDebateRound();
    return;
  }

  const buildCaseCamp = event.target.closest("[data-buildcase-camp]");
  if (buildCaseCamp) {
    chooseBuildCaseCamp(buildCaseCamp.dataset.buildcaseCamp);
    return;
  }

  const buildCaseSupport = event.target.closest("[data-buildcase-support]");
  if (buildCaseSupport) {
    toggleBuildCaseSupport(Number(buildCaseSupport.dataset.buildcaseSupport));
    return;
  }

  const buildCaseSupportSubmit = event.target.closest("[data-buildcase-support-submit]");
  if (buildCaseSupportSubmit) {
    confirmBuildCaseSupports();
    return;
  }

  const buildCaseRebuttal = event.target.closest("[data-buildcase-rebuttal]");
  if (buildCaseRebuttal) {
    chooseBuildCaseRebuttal(Number(buildCaseRebuttal.dataset.buildcaseRebuttal));
    return;
  }

  const buildCaseNext = event.target.closest("[data-buildcase-next]");
  if (buildCaseNext) {
    advanceBuildCaseRound();
    return;
  }

  const jeopardyPlayMode = event.target.closest("[data-jeopardy-play-mode]");
  if (jeopardyPlayMode) {
    setJeopardyPlayMode(jeopardyPlayMode.dataset.jeopardyPlayMode);
    return;
  }

  const liveRefresh = event.target.closest("[data-jeopardy-live-refresh]");
  if (liveRefresh) {
    refreshAlpacapardyLiveLobby();
    return;
  }

  const liveCreate = event.target.closest("[data-jeopardy-live-create]");
  if (liveCreate) {
    createAlpacapardyLiveRoom();
    return;
  }

  const liveJoin = event.target.closest("[data-jeopardy-live-join]");
  if (liveJoin) {
    joinAlpacapardyLiveRoom(liveJoin.dataset.jeopardyLiveJoin);
    return;
  }

  const liveLeave = event.target.closest("[data-jeopardy-live-leave]");
  if (liveLeave) {
    leaveAlpacapardyLiveRoom();
    return;
  }

  const liveStart = event.target.closest("[data-jeopardy-live-start]");
  if (liveStart) {
    startAlpacapardyLiveGame();
    return;
  }

  const jeopardyTile = event.target.closest("[data-jeopardy-open]");
  if (jeopardyTile) {
    const [groupIndex, tileIndex] = jeopardyTile.dataset.jeopardyOpen.split(":").map(Number);
    openJeopardyTile(groupIndex, tileIndex);
    return;
  }

  const jeopardyOption = event.target.closest("[data-jeopardy-option]");
  if (jeopardyOption) {
    answerJeopardyQuestion(Number(jeopardyOption.dataset.jeopardyOption));
    return;
  }

  const jeopardySetTeams = event.target.closest("[data-jeopardy-set-teams]");
  if (jeopardySetTeams) {
    setJeopardyTeamCount(Number(jeopardySetTeams.dataset.jeopardySetTeams));
    return;
  }

  const jeopardyToggleCategory = event.target.closest("[data-jeopardy-toggle-category]");
  if (jeopardyToggleCategory) {
    toggleJeopardySetupCategory(jeopardyToggleCategory.dataset.jeopardyToggleCategory);
    return;
  }

  const jeopardyStart = event.target.closest("[data-jeopardy-start]");
  if (jeopardyStart) {
    startJeopardyGame();
    return;
  }

  const jeopardyBack = event.target.closest("[data-jeopardy-back]");
  if (jeopardyBack) {
    closeJeopardyFocus();
    return;
  }

  const jeopardyTeam = event.target.closest("[data-jeopardy-team]");
  if (jeopardyTeam) {
    chooseJeopardyTeam(Number(jeopardyTeam.dataset.jeopardyTeam));
    return;
  }

  const jeopardyAddTeam = event.target.closest("[data-jeopardy-add-team]");
  if (jeopardyAddTeam) {
    addJeopardyTeam();
    return;
  }

  const jeopardyRemoveTeam = event.target.closest("[data-jeopardy-remove-team]");
  if (jeopardyRemoveTeam) {
    removeJeopardyTeam();
    return;
  }

  const jeopardyNextTurn = event.target.closest("[data-jeopardy-next-turn]");
  if (jeopardyNextTurn) {
    advanceJeopardyTeam();
    return;
  }

  const relayOption = event.target.closest("[data-relay-option]");
  if (relayOption) {
    answerRelayQuestion(Number(relayOption.dataset.relayOption));
    return;
  }

  const relayStart = event.target.closest("[data-relay-start]");
  if (relayStart) {
    startRelayRoute();
    return;
  }

  const relayToggleCategory = event.target.closest("[data-relay-toggle-category]");
  if (relayToggleCategory) {
    toggleRelaySetupCategory(relayToggleCategory.dataset.relayToggleCategory);
    return;
  }

  const relaySetTeams = event.target.closest("[data-relay-set-teams]");
  if (relaySetTeams) {
    setRelayTeamCount(Number(relaySetTeams.dataset.relaySetTeams));
    return;
  }

  const relaySetQuestionCount = event.target.closest("[data-relay-set-question-count]");
  if (relaySetQuestionCount) {
    setRelayQuestionCount(Number(relaySetQuestionCount.dataset.relaySetQuestionCount));
    return;
  }

  const relayContinue = event.target.closest("[data-relay-continue]");
  if (relayContinue) {
    advanceRelayQuestion();
    return;
  }

  const relayAddTeam = event.target.closest("[data-relay-add-team]");
  if (relayAddTeam) {
    addRelayTeam();
    return;
  }

  const relayRemoveTeam = event.target.closest("[data-relay-remove-team]");
  if (relayRemoveTeam) {
    removeRelayTeam();
    return;
  }

  const relayBuzz = event.target.closest("[data-relay-buzz]");
  if (relayBuzz) {
    buzzRelayTeam(Number(relayBuzz.dataset.relayBuzz));
    return;
  }

  const runOption = event.target.closest("[data-run-option]");
  if (runOption) {
    answerRunQuestion(Number(runOption.dataset.runOption));
    return;
  }

  const runToggleCategory = event.target.closest("[data-run-toggle-category]");
  if (runToggleCategory) {
    toggleRunSetupCategory(runToggleCategory.dataset.runToggleCategory);
    return;
  }

  const runStart = event.target.closest("[data-run-start]");
  if (runStart) {
    startRunRoute();
    return;
  }

  const runContinue = event.target.closest("[data-run-continue]");
  if (runContinue) {
    continueRun();
    return;
  }

  const replayButton = event.target.closest("[data-replay-current]");
  if (replayButton) {
    resetCurrentRouteAttempts();
    document.body.classList.remove("with-popup");
    launchExperience();
    return;
  }

  const changeSectionsButton = event.target.closest("[data-change-sections]");
  if (changeSectionsButton) {
    changeGuidingSections();
    return;
  }

  const changeModeButton = event.target.closest("[data-change-mode]");
  if (changeModeButton) {
    changeModeSelection();
    return;
  }

  const closeExperience = event.target.closest("[data-close-experience]");
  if (closeExperience) {
    closeCurrentExperience();
    return;
  }
}

function handleInput(event) {
  const joinCodeInput = event.target.closest("[data-online-room-code-input]");
  if (joinCodeInput) {
    state.live.joinCodeDraft = alpacapardyLiveSupabaseService?.normalizeRoomCode
      ? alpacapardyLiveSupabaseService.normalizeRoomCode(joinCodeInput.value)
      : String(joinCodeInput.value || "").trim().toUpperCase();
    joinCodeInput.value = state.live.joinCodeDraft;
  }
}

function handleSubmit(event) {
  const onlineJoinCodeForm = event.target.closest("[data-online-join-code-form]");
  if (onlineJoinCodeForm) {
    event.preventDefault();
    joinAlpacapardyLiveRoomByCode(new FormData(onlineJoinCodeForm));
    return;
  }

  const liveChatForm = event.target.closest("[data-jeopardy-live-chat-form]");
  if (liveChatForm) {
    event.preventDefault();
    sendAlpacapardyLiveChat(new FormData(liveChatForm));
    liveChatForm.reset();
    return;
  }

  const authForm = event.target.closest("[data-auth-form]");
  if (!authForm) {
    return;
  }

  event.preventDefault();
  submitAuthForm(authForm);
}

function handleKeyDown(event) {
  if (state.ui.rawMediaLightbox) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeRawMediaLightbox();
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      shiftRawMediaLightbox(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      shiftRawMediaLightbox(1);
      return;
    }
  }

  if (getActiveMindMapEntryBundle() && event.key === "Escape") {
    event.preventDefault();
    closeMindMapEntry();
    return;
  }

  if (state.ui.resourcesOpen && event.key === "Escape") {
    event.preventDefault();
    state.ui.resourcesOpen = false;
    syncPopupScrollLock();
    renderResourcesModal();
    return;
  }

  if (state.ui.cooperationOpen && event.key === "Escape") {
    event.preventDefault();
    state.ui.cooperationOpen = false;
    syncPopupScrollLock();
    renderCooperationModal();
    return;
  }

  if (state.ui.authOpen && event.key === "Escape" && canDismissAuthModal()) {
    event.preventDefault();
    state.ui.authOpen = false;
    syncPopupScrollLock();
    renderAuthModal();
    return;
  }

  const targetTag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : "";
  if (targetTag === "input" || targetTag === "textarea" || targetTag === "select") {
    return;
  }

  if (
    state.ui.appShellMode === "online" &&
    state.live.currentSession?.game_type === "alpaquiz" &&
    event.key === " " &&
    !event.repeat
  ) {
    event.preventDefault();
    buzzSelectedLiveGame();
    return;
  }

  if (state.experience && state.experience.type === "jump") {
    if (event.key === "ArrowUp" || event.key === " " || event.key.toLowerCase() === "w") {
      event.preventDefault();
      performJumpAction("jump");
      return;
    }

    if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
      event.preventDefault();
      performJumpAction("duck");
      return;
    }
  }

  if (state.experience && state.experience.type === "alpacard") {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateAlpacard("previous");
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateAlpacard("next");
      return;
    }

    if (event.key === " " || event.key.toLowerCase() === "f") {
      event.preventDefault();
      flipAlpacard();
      return;
    }
  }

  if (event.repeat || !state.experience || state.experience.type !== "relay") {
    return;
  }

  const experience = state.experience;
  if (!experience.started || experience.revealed || experience.buzzedTeamIndex !== null) {
    return;
  }

  const normalizedKey = event.key.toLowerCase();
  const teamIndex = experience.teams.findIndex((team) => team.key.toLowerCase() === normalizedKey);
  if (teamIndex === -1) {
    return;
  }

  event.preventDefault();
  buzzRelayTeam(teamIndex);
}

function handleTouchStart(event) {
  if (!state.ui.rawMediaLightbox) {
    return;
  }

  const touch = event.changedTouches && event.changedTouches[0];
  if (!touch || !event.target.closest(".raw-media-lightbox-window")) {
    state.ui.rawMediaSwipeStartX = null;
    return;
  }

  state.ui.rawMediaSwipeStartX = touch.clientX;
}

function handleTouchEnd(event) {
  if (!state.ui.rawMediaLightbox || !Number.isFinite(state.ui.rawMediaSwipeStartX)) {
    return;
  }

  const touch = event.changedTouches && event.changedTouches[0];
  if (!touch) {
    state.ui.rawMediaSwipeStartX = null;
    return;
  }

  const deltaX = touch.clientX - state.ui.rawMediaSwipeStartX;
  state.ui.rawMediaSwipeStartX = null;

  if (Math.abs(deltaX) < 40) {
    return;
  }

  shiftRawMediaLightbox(deltaX < 0 ? 1 : -1);
}

function handleMindMapGalleryWheel(event) {
  if (state.experience?.type !== "mindmap") {
    return;
  }

  const viewport = event.target.closest?.("[data-mindmap-gallery-viewport]");
  if (!viewport || viewport.querySelectorAll("[data-mindmap-gallery-slide]").length < 2) {
    return;
  }

  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  if (!delta) {
    return;
  }

  event.preventDefault();
  viewport.scrollBy({ left: delta * 1.2, behavior: "auto" });
}

    return Object.freeze({
      handleClick,
      handleInput,
      handleSubmit,
      handleKeyDown,
      handleTouchStart,
      handleTouchEnd,
      handleMindMapGalleryWheel
    });
  }

  global.WSC_CREATE_APP_EVENT_ROUTER = createAppEventRouter;
})(window);
