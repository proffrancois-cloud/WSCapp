(function () {
  function createWscApp(options = {}) {
    const window = options.windowRef || globalThis.window;
    const document = options.documentRef || window.document || globalThis.document;

const data = window.WSC_DATA;
const knowledgeBank = window.WSC_KNOWLEDGE_BANK || { sections: [] };
const alpacaChannelCatalog = window.WSC_ALPACA_CHANNEL || { videos: [] };
const assetConfig = window.WSC_ASSETS || {};
const debateLabData = window.WSC_DEBATE_LAB_DATA || { topics: [], judgePrep: [], howToUse: [] };
const OFFICIAL_WSC_GUIDING_URL = "https://www.scholarscup.org/subjects/2026/guiding-2026/";
const supabaseConfig = window.WSC_SUPABASE_CONFIG || {};
const SUPABASE_URL = supabaseConfig.url || "https://bwogymstqrrmoxlwlhio.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = supabaseConfig.publishableKey || "";
const ASSET_CACHE_VERSION = "20260524coop2";
const appAuthService = window.WSC_AUTH_SERVICE || null;
const appEntryService = window.WSC_APP_ENTRY_SERVICE;
const createOnlineModeController = window.WSC_CREATE_ONLINE_MODE_CONTROLLER;
const appBootstrapService = window.WSC_APP_BOOTSTRAP_SERVICE;
const appStateService = window.WSC_APP_STATE_SERVICE;
const appDomService = window.WSC_APP_DOM_SERVICE;
const modalFocusService = window.WSC_MODAL_FOCUS_SERVICE || null;
const createContentNormalizationHelpers = window.WSC_CREATE_CONTENT_NORMALIZATION_HELPERS;
const createKnowledgeRuntimeController = window.WSC_CREATE_KNOWLEDGE_RUNTIME_CONTROLLER;
const createSelectionContextService = window.WSC_CREATE_SELECTION_CONTEXT_SERVICE;
const routeBuilderController = window.WSC_ROUTE_BUILDER_CONTROLLER;
const createRouteBuilderOptionsService = window.WSC_CREATE_ROUTE_BUILDER_OPTIONS_SERVICE;
const createRouteBuilderViewController = window.WSC_CREATE_ROUTE_BUILDER_VIEW_CONTROLLER;
const createRouteOrchestrationController = window.WSC_CREATE_ROUTE_ORCHESTRATION_CONTROLLER;
const createAppShellRenderer = window.WSC_CREATE_APP_SHELL_RENDERER;
const createAppShellController = window.WSC_CREATE_APP_SHELL_CONTROLLER;
const createAuthController = window.WSC_CREATE_AUTH_CONTROLLER;
const createProgressStorageController = window.WSC_CREATE_PROGRESS_STORAGE_CONTROLLER;
const createGameLaunchController = window.WSC_CREATE_GAME_LAUNCH_CONTROLLER;
const createGameQuestionPlanningController = window.WSC_CREATE_GAME_QUESTION_PLANNING_CONTROLLER;
const createExperienceFactoryController = window.WSC_CREATE_EXPERIENCE_FACTORY_CONTROLLER;
const createModeRuntimeController = window.WSC_CREATE_MODE_RUNTIME_CONTROLLER;
const createLegacyLiveRoomController = window.WSC_CREATE_LEGACY_LIVE_ROOM_CONTROLLER;
const createLegacyLiveRoomRenderer = window.WSC_CREATE_LEGACY_LIVE_ROOM_RENDERER;
const createRawContentController = window.WSC_CREATE_RAW_CONTENT_CONTROLLER;
const createStudyGameController = window.WSC_CREATE_STUDY_GAME_CONTROLLER;
const createArcadeGameController = window.WSC_CREATE_ARCADE_GAME_CONTROLLER;
const createArcadeRenderController = window.WSC_CREATE_ARCADE_RENDER_CONTROLLER;
const createArcadeRuntimeTimerController = window.WSC_CREATE_ARCADE_RUNTIME_TIMER_CONTROLLER;
const createArcadeJumpAnimationController = window.WSC_CREATE_ARCADE_JUMP_ANIMATION_CONTROLLER;
const createGameResultsService = window.WSC_CREATE_GAME_RESULTS_SERVICE;
const createGameAudioService = window.WSC_CREATE_GAME_AUDIO_SERVICE;
const createGamePromptPresenter = window.WSC_CREATE_GAME_PROMPT_PRESENTER;
const createRelayTeamService = window.WSC_CREATE_RELAY_TEAM_SERVICE;
const createVisualAssetRenderer = window.WSC_CREATE_VISUAL_ASSET_RENDERER;
const createResultsRenderer = window.WSC_CREATE_RESULTS_RENDERER;
const createAlpacapardyBoardController = window.WSC_CREATE_ALPACAPARDY_BOARD_CONTROLLER;
const createAlpacapardyController = window.WSC_CREATE_ALPACAPARDY_CONTROLLER;
const createAlpacardsController = window.WSC_CREATE_ALPACARDS_CONTROLLER;
const createAlpacaChannelController = window.WSC_CREATE_ALPACA_CHANNEL_CONTROLLER;
const createTrainPracticeController = window.WSC_CREATE_TRAIN_PRACTICE_CONTROLLER;
const createBuildCaseController = window.WSC_CREATE_BUILD_CASE_CONTROLLER;
const createLearnSlideshowController = window.WSC_CREATE_LEARN_SLIDESHOW_CONTROLLER;
const createMindMapController = window.WSC_CREATE_MIND_MAP_CONTROLLER;
const createMindMapOrbitController = window.WSC_CREATE_MIND_MAP_ORBIT_CONTROLLER;
const createRegularGuideController = window.WSC_CREATE_REGULAR_GUIDE_CONTROLLER;
const createAppEventRouter = window.WSC_CREATE_APP_EVENT_ROUTER;
const createAppActionRegistry = window.WSC_CREATE_APP_ACTION_REGISTRY;
const createAppRuntimeCompatibilityFacade = window.WSC_CREATE_APP_RUNTIME_COMPATIBILITY_FACADE;
const createAppLearnRuntime = window.WSC_CREATE_APP_LEARN_RUNTIME;
const createAppShellRuntime = window.WSC_CREATE_APP_SHELL_RUNTIME;
const createAppLifecycleRuntime = window.WSC_CREATE_APP_LIFECYCLE_RUNTIME;
const createAlpaquizRenderController = window.WSC_CREATE_ALPAQUIZ_RENDER_CONTROLLER;
const arcadeJumpHelpers = window.WSC_ARCADE_JUMP_HELPERS;
const appConfig = window.WSC_APP_CONFIG;
const {
  DISCORD_INVITE_URL,
  CONTACT_EMAIL_URL,
  CAMPUS_PREVIEW_PUBLIC_ENABLED,
  LEGACY_LIVE_ROOMS_PUBLIC_ENABLED,
  UNAVAILABLE_MODE_REASONS,
  MULTIPLAYER_ALLOWED_EMAILS,
  MULTIPLAYER_ALLOWED_EMAIL_DOMAINS,
  WSC_ROUND_OPTIONS,
  GAME_CONFIG,
  LIVE_GAME_TYPES,
  LIVE_GAME_ORDER,
  LIVE_SYNC_INTERVAL_MS,
  LIVE_ALPACA_COLORS,
  WIZARD_TOTAL_STEPS,
  DEFAULT_LENS_ID,
  DEEP_STRUCTURE_BIG_IDEAS,
  ALPACA_RUN_ROUTE,
  RELAY_KEY_LAYOUTS,
  ALPACA_REVIEW_MODE,
  ALPACA_PENDING_REVIEW,
  ALPACA_REVIEW_BADGES,
  BIG_IDEA_ROUTE_PRESETS,
  PATH_OPTIONS,
  LENS_OPTIONS,
  MODE_OPTIONS,
  TRAIN_TIPS,
  WRITING_PRACTICE_FORMATS,
  WRITING_PHASES,
  BOWL_ROUND_TYPES,
  LEARN_SUBJECT_ROUTES
} = appConfig;
const ALPACA_NAME_PATTERN = appAuthService?.alpacaNamePattern || /^[a-z0-9][a-z0-9_-]{2,31}$/;
const sectionById = Object.fromEntries(data.sections.map((section) => [section.id, section]));
const subjectById = Object.fromEntries(data.subjects.map((subject) => [subject.id, subject]));
const sectionIdService = window.WSC_SECTION_IDS || {};
const knowledgeRuntimeController = createKnowledgeRuntimeController({
  getAppState: () => state,
  data,
  knowledgeBank,
  sectionIdService,
  sectionById,
  subjectById,
  constants: {
    deepStructureBigIdeas: DEEP_STRUCTURE_BIG_IDEAS,
    bigIdeaRoutePresets: BIG_IDEA_ROUTE_PRESETS,
    learnSubjectRoutes: LEARN_SUBJECT_ROUTES
  },
  getBigIdeaRoutes: () => BIG_IDEA_ROUTES,
  helpers: {
    countRawQuizQuestions,
    getRawEntriesForRouteSelection,
    getQuestionsForRouteSelection,
    getOrderedRawContentSections,
    mapRawEntriesWithSection,
    getActiveSubjectKnowledgeMap
  }
});
const appAssetService = window.WSC_ASSET_SERVICE || null;
const appStorageService = window.WSC_STORAGE_SERVICE || null;
const appProgressService = window.WSC_PROGRESS_SERVICE || null;
const appVideoService = window.WSC_VIDEO_SERVICE || null;
const gameQuestionService = window.WSC_GAME_QUESTION_SERVICE || null;
const scholarsBowlService = window.WSC_SCHOLARS_BOWL_SERVICE || null;
const supabaseProfileService = window.WSC_SUPABASE_PROFILE_SERVICE || null;
const alpacardsMode = window.WSC_ALPACARDS_MODE || null;
const alpacaChannelMode = window.WSC_ALPACA_CHANNEL_MODE || null;
const rawContentMode = window.WSC_RAW_CONTENT_MODE || null;
const rawContentEntryRenderer = window.WSC_RAW_CONTENT_ENTRY_RENDERER || null;
const rawContentQuizRenderer = window.WSC_RAW_CONTENT_QUIZ_RENDERER || null;
const rawContentMediaLightbox = window.WSC_RAW_CONTENT_MEDIA_LIGHTBOX || null;
const rawContentVisualAssets = window.WSC_RAW_CONTENT_VISUAL_ASSETS || null;
const rawContentTransferTable = window.WSC_RAW_CONTENT_TRANSFER_TABLE || null;
const rawContentMastery = window.WSC_RAW_CONTENT_MASTERY || null;
const regularGuideMode = window.WSC_REGULAR_GUIDE_MODE || null;
const mindMapMode = window.WSC_MINDMAP_MODE || null;
const authModalRenderer = window.WSC_AUTH_MODAL_RENDERER || null;
const wizardRenderer = window.WSC_WIZARD_RENDERER || null;
const alpaquizEngine = window.WSC_ALPAQUIZ_ENGINE || null;
const alpaquizRenderer = window.WSC_ALPAQUIZ_RENDERER || null;
const alpaquizRelayRenderer = window.WSC_ALPAQUIZ_RELAY_RENDERER || null;
const alpacapardyEngine = window.WSC_ALPACAPARDY_ENGINE || null;
const alpacapardyRenderer = window.WSC_ALPACAPARDY_RENDERER || null;
const alpacapardyLive = window.WSC_ALPACAPARDY_LIVE || null;
const alpacapardyLiveSupabaseService = window.WSC_ALPACAPARDY_LIVE_SUPABASE_SERVICE || null;

function normalizeSectionId(sectionId) {
  return knowledgeRuntimeController.normalizeSectionId(sectionId);
}

// The WSC site sequence is the source of truth. Raw imports may arrive alphabetized.
function getOfficialSectionOrder(sectionOrId) {
  return knowledgeRuntimeController.getOfficialSectionOrder(sectionOrId);
}

function compareOfficialSectionOrder(left, right) {
  return knowledgeRuntimeController.compareOfficialSectionOrder(left, right);
}

function compareRawEntriesByOfficialOrder(left, right) {
  return knowledgeRuntimeController.compareRawEntriesByOfficialOrder(left, right);
}

const rawContentOverrides = window.WSC_RAW_CONTENT_OVERRIDES || {};

const contentNormalizationHelpers = createContentNormalizationHelpers({
  constants: {
    rawSectionOverrides: rawContentOverrides.sectionOverrides || {},
    rawEntryOverrides: rawContentOverrides.entryOverrides || {}
  },
  callbacks: {
    compareOfficialSectionOrder,
    normalizeKnowledgeKey,
    normalizeSectionId
  }
});

const rawContentSections = contentNormalizationHelpers.normalizeRawContentSections(window.WSC_RAW_CONTENT_BANK?.sections || {});
const fullVoyageQuestions = contentNormalizationHelpers.normalizeFullVoyageQuestions(window.WSC_RAW_CONTENT_BANK?.fullVoyageQuestions || []);

const BIG_IDEA_ROUTES = buildBigIdeaRoutes(rawContentSections);
const bigIdeaRouteById = Object.fromEntries(BIG_IDEA_ROUTES.map((route) => [route.id, route]));

const learnSubjectRouteById = Object.fromEntries(LEARN_SUBJECT_ROUTES.map((route) => [route.id, route]));

const IMPORTED_RAW_CONTENT_BANK = rawContentSections;
const rawContentService = window.WSC_CREATE_RAW_CONTENT_SERVICE
  ? window.WSC_CREATE_RAW_CONTENT_SERVICE({
      rawContentSections: IMPORTED_RAW_CONTENT_BANK,
      sectionById,
      subjectById,
      bigIdeaRouteById,
      learnSubjectRouteById,
      normalizeKnowledgeKey,
      getSectionIdFromGuidingTitle,
      compareOfficialSectionOrder,
      compareRawEntriesByOfficialOrder,
      entryMatchesLearnSubjectRoute
    })
  : null;

const onlineModeController = createOnlineModeController({
  entryService: appEntryService
});

const progressStorageController = createProgressStorageController({
  storageService: appStorageService,
  progressService: appProgressService,
  entryService: appEntryService
});

const state = appStateService.createInitialState({
  defaultLensId: DEFAULT_LENS_ID,
  pendingRunColor: LIVE_ALPACA_COLORS[0]?.id || "cream",
  guestName: progressStorageController.loadGuestAlpacaName(),
  stats: progressStorageController.loadStats(),
  rawMastery: progressStorageController.loadRawMastery()
});

const refs = appDomService.getAppRefs(document);
let gameResultsService = null;
let gameAudioService = null;
let gamePromptPresenter = null;
let relayTeamService = null;
let visualAssetRenderer = null;
const selectionContextService = createSelectionContextService({
  appState: state,
  data,
  sectionById,
  bigIdeaRouteById,
  constants: {
    lensOptions: LENS_OPTIONS,
    modeOptions: MODE_OPTIONS
  },
  helpers: {
    getActiveSubjectCatalog,
    normalizeSectionId
  }
});
gameResultsService = createGameResultsService({
  appState: state,
  engines: {
    alpacapardyEngine
  },
  callbacks: {
    saveStats,
    renderStats
  }
});
gameAudioService = createGameAudioService({
  windowRef: window,
  helpers: {
    getAssetValue
  }
});
gamePromptPresenter = createGamePromptPresenter({
  sectionById,
  subjectById,
  constants: {
    GAME_CONFIG
  },
  helpers: {
    escapeHtml,
    formatCountdown,
    getQuestionSubjectLabels
  }
});
relayTeamService = createRelayTeamService({
  constants: {
    GAME_CONFIG,
    RELAY_KEY_LAYOUTS
  },
  helpers: {
    getThemedTeamLabel
  }
});
visualAssetRenderer = createVisualAssetRenderer({
  appState: state,
  assetService: appAssetService,
  constants: {
    ASSET_CACHE_VERSION,
    ALPACA_REVIEW_MODE,
    ALPACA_PENDING_REVIEW,
    ALPACA_REVIEW_BADGES
  },
  helpers: {
    escapeHtml
  }
});
let routeBuilderOptionsService = null;
let arcadeJumpAnimationController = null;
let mindMapController = null;
let mindMapOrbitController = null;
let regularGuideController = null;
let rawContentController = null;
let alpacardsController = null;
let alpacaChannelController = null;
let resultsRenderer = null;
let alpacapardyBoardController = null;
let alpacapardyController = null;
let trainPracticeController = null;
let learnSlideshowController = null;
let gameQuestionPlanningController = null;
let experienceFactoryController = null;
let appActions = null;
let appEventRouter = null;
let appShellRenderer = null;
let appShellController = null;

const runtimeCompatibilityFacade = createAppRuntimeCompatibilityFacade({
  appState: state,
  documentRef: document,
  constants: {
    GAME_CONFIG
  },
  services: {
    appDomService,
    arcadeJumpHelpers,
    supabaseProfileService
  },
  getControllers: {
    arcadeRuntimeTimerController: () => arcadeRuntimeTimerController,
    arcadeJumpAnimationController: () => arcadeJumpAnimationController,
    alpacapardyController: () => alpacapardyController,
    buildCaseController: () => buildCaseController,
    legacyLiveRoomController: () => legacyLiveRoomController,
    appEventRouter: () => appEventRouter,
    routeOrchestrationController: () => routeOrchestrationController,
    appShellController: () => appShellController,
    routeBuilderViewController: () => routeBuilderViewController,
    appShellRenderer: () => appShellRenderer,
    legacyLiveRoomRenderer: () => legacyLiveRoomRenderer,
    routeBuilderOptionsService: () => routeBuilderOptionsService,
    gameLaunchController: () => gameLaunchController,
    alpacardsController: () => alpacardsController,
    mindMapOrbitController: () => mindMapOrbitController,
    authController: () => authController,
    experienceFactoryController: () => experienceFactoryController,
    rawContentController: () => rawContentController,
    gameQuestionPlanningController: () => gameQuestionPlanningController,
    alpaquizEngine: () => alpaquizEngine,
    trainPracticeController: () => trainPracticeController,
    studyGameController: () => studyGameController,
    alpacaChannelController: () => alpacaChannelController,
    learnSlideshowController: () => learnSlideshowController,
    mindMapController: () => mindMapController,
    regularGuideController: () => regularGuideController,
    alpaquizRenderController: () => alpaquizRenderController,
    arcadeGameController: () => arcadeGameController,
    arcadeRenderController: () => arcadeRenderController,
    resultsRenderer: () => resultsRenderer,
    gamePromptPresenter: () => gamePromptPresenter,
    alpacapardyBoardController: () => alpacapardyBoardController,
    relayTeamService: () => relayTeamService,
    gameResultsService: () => gameResultsService,
    progressStorageController: () => progressStorageController,
    visualAssetRenderer: () => visualAssetRenderer,
    gameAudioService: () => gameAudioService,
    knowledgeRuntimeController: () => knowledgeRuntimeController,
    selectionContextService: () => selectionContextService
  }
});
const {
  clearRunTimer, clearRaceTimer, clearRelayAnswerTimer, clearJumpAnimation, clearJeopardyTimer,
  clearDebateSpinTimer, clearDebateRevealTimer, clearAlpacapardyLiveHeartbeat,
  clearAlpacapardyLiveSync, clearLiveLaunchCountdown, clearAlpacapardyLiveSubscriptions,
  resetAlpacapardyLiveState, handleClick, handleInput, handleSubmit, handleKeyDown, handleTouchStart,
  handleTouchEnd, choosePath, chooseLens, chooseTarget, toggleModeChoiceSection,
  getVisibleModeChoicePath, toggleHeroMenu, closeHeroMenu, primeModeChoiceCardSpread,
  scheduleModeChoiceCardSpread, getModeChoiceCardTarget, easeModeChoiceSpread,
  setModeChoiceCardSpreadFrame, animateModeChoiceCardSpread, clearModeChoiceCardSpread,
  freezeModeChoiceColumnAtCurrentPosition, getModeChoiceCollapsedSlot,
  moveModeChoiceColumnToCollapsedSlot, clearModeChoiceColumnPosition, toggleModeChoiceMenu,
  continueTargetSelection, chooseMode, changeGuidingSections, changeModeSelection, clearFrom,
  openRawConnection, openGuideSection, openSectionChannel, render, syncActiveModalFocus,
  renderInsights, renderSessionControls, renderAppEntryGate, renderAppEntryAuthPanel,
  chooseAppEntryMode, openAlpacaOnlineCampus, switchToLocalMode, openAlpacaOnlineHub,
  returnToAlpacaOnlineHub, renderProgressCircleStatCard, renderBestScoreStrip, renderBestScoreCard,
  renderOnlineScoreStrip, getOnlineGameRecord, formatBestNumberStat, getBestRunDestinationLabel,
  renderSummary, renderSummaryChip, renderWizard, renderAlpacaOnlineHub,
  renderLegacyLiveRoomsDisabled, getLiveOverlayRenderContext, getLiveOverlayMount,
  renderLiveOverlayMount, canPatchLiveWaitingOverlay, patchLiveWaitingOverlay,
  replaceLiveWaitingPart, renderOnlineLiveSidebar, renderOnlineCurrentGameSummary,
  getAlpacaOnlineConnectedCount, renderOnlineJoinForm, renderOnlineOpenRoomsList,
  renderOnlineCreateGamePanel, renderOnlineHomeGameGrid, renderOnlineHomeGameCard,
  getOnlineGameCardDescription, renderSelectedOnlineGameBody, renderOnlineAlpacapardyLiveGame,
  renderOnlineArcadeSetup, renderOnlineAlpacapardySetup, renderOnlineWaitingPopup,
  renderOnlineArcadeWaitingRoom, renderLiveOverlayLayer, renderLiveLaunchCountdownOverlay,
  renderLiveWaitingOverlay, renderLiveWaitingVideoRail, getLiveWaitingVideoIndex,
  navigateLiveWaitingVideo, getLiveWaitingVideos, isShortLiveWaitingVideo, getVideoDurationSeconds,
  renderOnlineArcadeGame, renderLivePlayerCard, getLiveRunSetupColorId,
  renderLiveRunSetupColorPicker, selectLiveRunSetupColor, renderLiveRunColorPicker,
  renderLiveRunGame, renderLiveRunMap, getLiveRunRouteIndex, renderLiveRunPlayerPanel,
  renderLiveQuizGame, renderLiveRaceGame, renderLiveAlpaquizGame, renderLiveRunAlpacaToken,
  renderLiveRaceLives, renderLiveAnswerStatus, renderLiveQuizRoundResults, renderLiveLeaderboard,
  renderLiveWinnerCard, renderOnlineRoomListItem, getAlpacaOnlineRoster, getOpenLiveRoomsByGame,
  getOpenRoomsForGame, normalizeLiveGameType, getCurrentLiveGameType, getLiveGameLabel,
  getLivePlayablePlayers, getArcadeState, createEmptyArcadeState, chooseOnlineGameType,
  renderStepPanel, getCurrentWizardStepNumber, getWizardStepDefinition, renderWizardRail,
  renderWizardRailItem, getWizardRailItems, getWizardCompletionDepth, renderPathCards,
  renderLensCards, renderTargetCards, renderModeCards, renderModeChoiceBoard, renderModeChoiceColumn,
  renderModeChoiceCard, getWizardRenderContext, getWizardRenderHelpers, getAppModeSwitchIcon,
  getVisibleModeOptions, getVisibleModeOptionsForPath, getModeUnavailableReason, isModeUnavailable,
  getDecoratedModeOption, getModePath, usesGranularLearnSubjects, getTargetOptions,
  resetCurrentRouteAttempts, launchExperience, closeCurrentExperience, renderExperience,
  renderExperiencePreservingScroll, renderPreservingScroll, renderLiveSurfaces,
  buildAlpacardExperience, getAlpacardsForSelection, renderAlpacardExperience, renderAlpacardFront,
  renderAlpacardBack, getAlpacardConnectionChips, navigateAlpacard, setAlpacardIndex, flipAlpacard,
  syncAlpacardCarouselState, shuffleAlpacard, syncRadialMindMapScroll, stopMindMapOrbitAnimation,
  syncMindMapOrbitAnimation, navigateMindMapGallery, handleMindMapGalleryWheel, replaceMarkup,
  keepRouteBuilderInView, hasActiveQuestionPopup, syncPopupScrollLock, hasSupabaseConfig, isSignedIn,
  hasAuthSession, isAnonymousUser, getCurrentUserEmail, canAccessLegacyLiveRooms,
  getLegacyLiveRoomsDisabledMessage, canAccessMultiplayer, canDismissAuthModal, syncAuthChrome,
  clearAuthNotice, normalizeAlpacaName, getCurrentRedirectUrl, getSupabaseClient, setupSupabaseAuth,
  loadAlpacaProfile, loadAlpacaProgress, submitAuthForm, createAlpaccount, resolveLoginIdentifier,
  connectToAlpaccount, sendPasswordReset, updateRecoveredPassword, signOutOfAlpaccount,
  ensureLiveAuthSession, getLiveDisplayName, renderAuthModal, renderAuthGate, renderAuthIntro,
  renderAuthNotice, renderAuthBody, renderConnectedAlpaccount, renderLoginForm, renderSignupForm,
  renderForgotPasswordForm, renderResetPasswordForm, getAuthRenderContext, renderResourcesModal,
  renderCooperationModal, buildSlideshowExperience, buildMindMapExperience,
  buildRawContentExperience, buildUnavailableModeExperience, renderUnavailableModeExperience,
  buildAlpacaChannelExperience, getApprovedRawContentSection, getBroadSubjectIdsFromLabels,
  getBigIdeaIdsFromLabels, renderQuestionSubjectPills, getQuestionVisibleWrongExplanationByAnswer,
  buildGameQuestionOptions, createRawGameQuestion, createGuideGameQuestion,
  createFullVoyageGameQuestion, getSectionIdsForEntries, getGuideQuestionsForEntries,
  getFullVoyageQuestionsForEntries, buildRawQuestionPoolsFromEntries,
  buildRawQuestionPoolsForSelection, hasRequiredRawLevels, buildPatternQuestionSequence,
  getUnavailableRawGameReason, buildAlpacaRunQuestionPlan, buildRelayQuestionSequence,
  buildJumpQuestionPlan, buildRaceLevelQueues, getRaceActiveLevelState, getCurrentRaceQuestion,
  queueNextRaceQuestion, buildRaceExperience, buildJeopardyExperience, buildRunExperience,
  createJumpObstacle, createJumpCheckpointObstacle, buildJumpExperience, buildRelayExperience,
  buildBuildCaseExperience, closeTrainTip, renderTrainTipSummary, renderTrainTipPopup,
  buildWritingPromptPool, buildWritingExperience, getCurrentWritingPrompt, nextWritingPrompt,
  setWritingPhase, buildBowlExperience, buildScholarsBowlQuestions, getBowlRoundType,
  getCurrentBowlQuestion, startBowlPractice, answerBowlQuestion, advanceBowlQuestion,
  resetBowlPractice, renderAlpacaChannelExperience, renderSlideshowExperience,
  renderSlideSecondaryContext, getSlideSecondaryContext, getPrimaryOfficialSubjectLabel,
  inferRelatedSubjectLabel, getBroadSubjectAssetPath, navigateSlide, navigateAlpacaChannel,
  getAlpacaChannelVideosForEntry, getAlpacaChannelVideosForSection,
  createStandaloneAlpacaChannelVideo, normalizeVideoUrl, getAlpacaChannelDomain, buildLearnDeck,
  renderMindMapExperience, renderRadialMindMap, buildRadialMindMapLayout, getMindMapRingPlan,
  getMindMapRingIndexForEntry, getRadialMindMapEntries, formatMindMapEntryMeta, getMindMapCurvePath,
  renderMindMapEntryPopup, buildRegularGuideExperience, getRegularGuideForSection,
  getRegularGuidesForSelection, renderRegularGuideExperience, renderRegularGuideDocument,
  renderRegularGuideQuestionBlock, renderRegularGuideNavigation, renderGuideSectionChannelButton,
  getRegularGuideRenderContext, getRegularGuideRenderHelpers, getRawVisibleQuizQuestionItems,
  getSectionGuideQuestions, renderSectionTransferTable, getVisibleWrongExplanation,
  getVisibleQuizFeedbackParts, renderRawQuizFeedback, renderGuideQuizQuestion,
  renderRawContentExperience, renderRawContentEntryGroups, renderRawContentEntryCard,
  getRawContentScopeLabel, getRawContentPayload, getRawEntriesForSelection,
  getRawEntriesForRunSetupCategoryIds, getRawEntryMasteryKey, isRawEntryMastered,
  getRawMasteryHelpers, renderRawMasteryToggle, renderRawEntryQuickActions, renderRawBackToTopButton,
  renderRawEntryChannelLinks, toggleRawMastery, getAllRawEntries, getTotalRawMasterableEntries,
  getMasteredRawEntryCount, findLearnSubjectRouteIdByLabel, findBigIdeaRouteIdByLabel,
  getRawConnectionGroups, renderRawConnectionGroups, buildMindMap, getMindMapEntryKey,
  buildMindMapDiagram, getMindMapTargetsForLens, getOrderedMindMapGroups, getMindMapEntryMeta,
  getMindMapLensLabel, getActiveMindMapEntryBundle, openMindMapEntry, closeMindMapEntry,
  openMindMapGuide, closeMindMapGuide, renderMindMapGuidePopup, getMindMapRenderHelpers,
  showNextDebateTopic, startDebateConversation, toggleDebateSideSpin, returnToDebateTopic,
  resetDebateSpinForCurrentTopic, toggleDebateSuggestion, submitDebateRound, advanceDebateRound,
  shortenTrainText, renderWritingPhaseButton, renderWritingExperience, renderBowlOption,
  renderBowlFlowBar, renderBowlSetup, renderBowlStimulusCard, renderBowlTargetCard,
  renderBowlProductionLedger, renderBowlReveal, renderBowlExperience, renderBuildCaseExperience,
  startBuildCaseRoute, chooseBuildCaseCamp, toggleBuildCaseSupport, confirmBuildCaseSupports,
  chooseBuildCaseRebuttal, advanceBuildCaseRound, buildQuizExperience, getDefaultQuizSectionIds,
  getQuizQuestionPattern, normalizeQuizDifficultySelection, getRawEntriesForQuizSectionIds,
  buildQuizQuestionPlan, renderQuizExperience, renderQuizSetup, renderQuizQuestionPage,
  getQuizRemainingNotice, getQuizDifficultyResults, renderQuizResultsFooter, renderQuizQuestionCard,
  renderQuizQuestionFeedback, toggleQuizSection, selectAllQuizSections, toggleQuizDifficulty,
  setQuizQuestionCount, startQuizRoute, answerQuizQuestion, submitQuizRoute, resetQuizRoute,
  renderRaceExperience, renderRaceTargetSelector, renderTargetSetupSelector, renderRaceQuestionPills,
  startRaceRoute, getRaceAvailableQuestionCount, toggleRaceSetupCategory, answerRaceQuestion,
  resolveRaceQuestion, advanceRace, renderJeopardyExperience, renderJeopardyFocus,
  renderJeopardySetup, getAlpacapardyRenderHelpers, getAlpacapardyLiveRenderContext,
  isAlpacapardyLiveActive, guardMultiplayerAccess, canOpenAlpacapardyLiveTile,
  canAnswerAlpacapardyLiveFocus, canCloseAlpacapardyLiveFocus, getAlpacapardyLiveIdentityContext,
  refreshAlpacapardyLiveLobby, subscribeAlpacapardyLobby, refreshAlpacapardyLiveLobbySilently,
  startAlpacapardyLiveSync, syncAlpacapardyLiveNow, maybeAutoRevealTimedLiveGame,
  maybeAutoResolveTimedAlpaquiz, refreshAlpacapardyLiveSessionState, createSelectedLiveGameRoom,
  createArcadeLiveRoom, createAlpacapardyLiveRoom, joinAlpacapardyLiveRoom,
  joinAlpacapardyLiveRoomByCode, buildAlpacapardyLiveSettings, applyAlpacapardyLiveSettings,
  syncAlpacapardyLiveSettings, subscribeAlpacapardySession, refreshAlpacapardyLivePlayers,
  startAlpacapardyLiveHeartbeat, maybeStartLiveLaunchCountdown, startLiveLaunchCountdown,
  maybeAutoStartReadyLiveGame, compareLivePlayers, syncAlpacapardyLiveEvents, applyLiveEvent,
  applyAlpacapardyLiveEvent, extractAlpacapardyLiveState, mergeAlpacapardyLiveState,
  emitAlpacapardyLiveEvent, emitLiveEvent, applyArcadeLiveEvent, reduceArcadeLiveState,
  reduceLiveRunState, reduceLiveQuizState, reduceLiveRaceState, reduceLiveAlpaquizState,
  canStartSelectedLiveGame, startSelectedLiveGame, getLiveRunColorAssignments, buildArcadeStartState,
  buildAllThemeQuestionSequence, selectLiveAlpacaColor, answerSelectedLiveGame,
  advanceSelectedLiveGame, buzzSelectedLiveGame, getArcadeLeaderboard, clonePlain,
  startAlpacapardyLiveGame, sendAlpacapardyLiveChat, leaveAlpacapardyLiveRoom, buildJeopardyBoard,
  getJeopardySetupOptions, getDefaultJeopardySetupCategoryIds, getTargetSetupOptions,
  getDefaultTargetSetupCategoryIds, getSetupTargetHeading, getSetupTargetHelper,
  toggleSetupCategorySelection, toggleRunSetupCategory, startRunRoute, setJeopardyTeamCount,
  toggleJeopardySetupCategory, startJeopardyGame, buildConfiguredJeopardyBoard,
  pickQuestionsForJeopardyCategory, getJeopardyGroupingStrategies, getJeopardySourceTypeDefinitions,
  createJeopardyTile, buildJeopardyBoardFromDefinitions, buildFallbackJeopardyBoard,
  openJeopardyTile, answerJeopardyQuestion, resolveJeopardyTimeout, resolveJeopardyQuestion,
  closeJeopardyFocus, createJeopardyTeams, getJeopardyActiveTeam, getJeopardyStandings,
  renderJeopardyTeams, renderJeopardyCategoryHeader, renderJeopardyTileFace, startJeopardyTimer,
  chooseJeopardyTeam, addJeopardyTeam, removeJeopardyTeam, advanceJeopardyTeam,
  renderJeopardyResults, createRelayTeams, syncRelayTeamBindings, getRelayStandings,
  renderRelayExperience, startRelayRoute, toggleRelaySetupCategory, setRelayTeamCount,
  setRelayQuestionCount, buzzRelayTeam, answerRelayQuestion, getRelayAwardRecipients,
  formatRelayAwardedTeams, resolveRelayOutcome, handleRelayTimeout, advanceRelayQuestion,
  addRelayTeam, removeRelayTeam, renderRelayResults, startRelayAnswerTimer, startRaceTimer,
  startRunTimer, getRunCurrentStop, getRunNextStop, getRunRoundsBeforeYale, getRunPassedStopLabels,
  getRunStopRoundSuffix, formatRunCurrentStopLabel, getRunMapTop, renderRunMap, renderRunStatusRow,
  renderRunMapBackground, renderRunTravelMarker, renderRegionalStopMarkerSvg,
  renderGlobalRoundMarkerSvg, renderYaleDestinationMarkerSvg, renderRunMapStop, renderRunStopMarker,
  renderJumpExperience, renderJumpBackground, getJumpRunnerState, getJumpRunnerClass,
  getJumpRunnerAssetConfig, renderJumpRunner, renderJumpObstacle, renderJumpLives,
  getJumpQuestionLevel, getJumpQuestionValue, getJumpObstacleRequirement, getJumpObstacleSpeed,
  queueNextJumpObstacle, renderJumpQuestionOverlay, startJumpRoute, toggleJumpSetupCategory,
  performJumpAction, startJumpAnimation, updateJumpFrame, hasJumpCollision, handleJumpObstacleHit,
  openJumpCheckpoint, updateJumpDom, answerJumpQuestion, continueJumpRoute, renderRunExperience,
  renderGameQuestionPopup, renderExperienceCloseButton, answerRunQuestion, continueRun,
  renderResultsScreen, renderMetricCard, renderBreakdowns, renderSelectedTargetBreakdown,
  renderAlternateLensBreakdown, getAlternateBreakdownLensId, getBreakdownRowsForLens,
  renderBreakdownRow, renderSelectedGuidingSectionSpans, renderPanelTitle, renderLearnCardFooterNav,
  getSelectionQuestions, buildRawGameQuestionsFromEntries, getSectionCounts, getSubjectCounts,
  hydrateKnowledgeBank, slugifyBigIdea, normalizeBankSection, buildSubjectKnowledge,
  buildLearnSubjectRouteKnowledge, buildBigIdeaKnowledge, atomMatchesLearnSubjectRoute,
  buildWholeThemeKnowledge, getKnowledgeContext, countKnowledgeItems, getQuestionCueMood,
  getGameMascotMood, getQuestionTypeLabel, getGamePromptLabel, getQuestionAnchorLine,
  getQuestionTypeHint, pushUniqueNote, renderGameNotes, buildWholeThemeDeck, buildSubjectDeck,
  buildSectionDeck, buildBigIdeaDeck, buildAtomSlide, samplePrompts, countJeopardyTiles,
  countJeopardyDoneTiles, allJeopardyTilesDone, isActiveJeopardyTile, getAccuracy,
  getBestStreakFromAnswers, getHighestTeamScore, getRunReachedStage, updateBestGameStats,
  finalizeSessionStats, getPerformanceRating, getPerformanceMood, getPathOption, getLensLabel,
  getModeOption, getLensCardPluralLabel, getOrderedSectionIds, getSelectedSectionIds,
  getSelectedSectionLabels, getSelectedSectionLabel, getTargetLabelForLens, getTargetLabel,
  getDefaultStats, normalizeStats, normalizeRawMastery, loadStats, loadRawMastery,
  loadGuestAlpacaName, saveAlpacaProgress, getWizardCardAsset, renderAssetImage, versionAssetSrc,
  renderOptionToken, preloadExperienceAudio, playRelayBuzzSound, renderReviewBadgeMarkup,
  wrapWithReviewBadge, getPathReviewBadge, getLensReviewBadge, getModeReviewBadge,
  getTargetReviewBadge, getGameplayReviewBadge, renderConfiguredMascotAsset, getTargetAssetPath,
  getModeAssetPath, getGameplayAssetPath, getResultAssetPath, getFallbackMood, renderMascot,
  renderHeroVisual, renderLessonVisual, renderCheckpointVisual, renderJeopardyDecoration,
  renderRaceFrame, renderRaceTimerWidget, renderCompactRaceTimerCard, getTimerVisualState,
  renderPopupQuestionTimerPanel, getRaceLifeState, renderRaceLivesIcon, hasRaceLivesIconAssets,
  renderRaceFailVisual, alpacaAvatar, renderAlpacaList, getRawVisualAssetHelpers,
  renderRawStudentAssets, getRawAssetSelectionKey, selectRawAssetPoint, renderRawSpecialAssets,
  renderRawSpecialAsset, renderRawTimelineAsset, renderRawRouteMapAsset, renderRawImageCardAsset,
  renderRawVisualSections, renderRawVisualFooterQuestion, renderRawVisualGallery,
  renderRawVisualLinkPreview, getRawMediaLinkItems, renderRawMediaLinkButtons, getEmbeddableVideo,
  getVideoPreview, renderRawVisualPreview, renderTextWithBreaks, getRawOfficialDisplayText,
  stripRawOfficialReferenceAppendix, isRawOfficialReferenceAppendix, isRawOfficialReferenceLine,
  getRawQuizPagerKey, getRawQuizPageIndex, renderRawQuizPager, renderRawQuizQuestion,
  openRawMediaLightboxFromTrigger, getRawMediaLightboxAnchor, closeRawMediaLightbox,
  shiftRawMediaLightbox, renderRawMediaLightbox, getRawQuizQuestionKey, selectRawQuizOption,
  rememberRawQuestionGallerySlide, setRawQuizPageIndex, shiftRawQuizPage,
  getRawQuestionGalleryByPagerKey, syncRawQuestionGalleries, syncRawQuestionGallery,
  renderRawQuizOptionStateClass, stableShuffleByKey, hashString
} = runtimeCompatibilityFacade;

routeBuilderOptionsService = createRouteBuilderOptionsService({
  appState: state,
  data,
  constants: {
    defaultLensId: DEFAULT_LENS_ID,
    modeOptions: MODE_OPTIONS,
    unavailableModeReasons: UNAVAILABLE_MODE_REASONS,
    bigIdeaRoutes: BIG_IDEA_ROUTES,
    learnSubjectRoutes: LEARN_SUBJECT_ROUTES
  },
  knowledge: {
    getSectionKnowledgeById: () => knowledgeRuntimeController.getSectionKnowledgeById(),
    getSubjectKnowledgeById: () => knowledgeRuntimeController.getSubjectKnowledgeById(),
    getLearnSubjectKnowledgeById: () => knowledgeRuntimeController.getLearnSubjectKnowledgeById(),
    getBigIdeaKnowledgeById: () => knowledgeRuntimeController.getBigIdeaKnowledgeById(),
    getWholeThemeKnowledge: () => knowledgeRuntimeController.getWholeThemeKnowledge()
  },
  helpers: {
    getQuestionsForRouteSelection,
    isOnlineMode: appStateService.isOnlineMode
  }
});

({
  mindMapOrbitController,
  mindMapController,
  alpacardsController,
  alpacaChannelController,
  learnSlideshowController,
  rawContentController,
  regularGuideController
} = createAppLearnRuntime({
  appState: state,
  refs,
  documentRef: document,
  windowRef: window,
  factories: {
    createMindMapOrbitController,
    createMindMapController,
    createAlpacardsController,
    createAlpacaChannelController,
    createLearnSlideshowController,
    createRawContentController,
    createRegularGuideController
  },
  data: {
    theme: data.theme,
    insights: data.insights,
    sections: data.sections,
    sectionById,
    subjectById,
    knowledgeBank,
    alpacaChannelCatalog,
    bigIdeaRoutes: BIG_IDEA_ROUTES,
    learnSubjectRoutes: LEARN_SUBJECT_ROUTES,
    bigIdeaRouteById,
    learnSubjectRouteById,
    importedRawContentBank: IMPORTED_RAW_CONTENT_BANK,
    getAlpacards: () => window.WSC_ALPACARDS
  },
  services: {
    rawContentService,
    appVideoService
  },
  renderers: {
    mindMapMode,
    alpacardsMode,
    alpacaChannelMode,
    rawContentMode,
    rawContentEntryRenderer,
    rawContentQuizRenderer,
    rawContentMediaLightbox,
    rawContentVisualAssets,
    rawContentTransferTable,
    rawContentMastery,
    regularGuideMode
  },
  knowledge: {
    getSectionKnowledgeById: () => knowledgeRuntimeController.getSectionKnowledgeById(),
    getBigIdeaKnowledgeById: () => knowledgeRuntimeController.getBigIdeaKnowledgeById()
  },
  helpers: {
    compareOfficialSectionOrder,
    compareRawEntriesByOfficialOrder,
    entryMatchesLearnSubjectRoute,
    escapeHtml,
    findBigIdeaRouteIdByLabel,
    findLearnSubjectRouteIdByLabel,
    getActiveSubjectCatalog,
    getActiveSubjectKnowledgeMap,
    getAlpacaChannelVideosForEntry,
    getAlpacaChannelVideosForSection,
    getApprovedRawContentSection,
    getAssetValue,
    getEmbeddableVideo,
    getKnowledgeContext,
    getLensLabel,
    getModeAssetPath,
    getOrderedRawContentSections,
    getRawContentScopeLabel,
    getRawEntriesForRouteSelection,
    getRawEntriesForSelection,
    getRawEntryMasteryKey,
    getRawQuizPageIndex,
    getRawQuizQuestionKey,
    getRegularGuideForSection,
    getSectionIdFromGuidingTitle,
    getSelectedSectionIds,
    getSelectedSectionLabels,
    getSelectionQuestions,
    getTargetAssetPath,
    getTargetLabel,
    getTargetLabelForLens,
    getVideoPreview,
    mapRawEntriesWithSection,
    normalizeKnowledgeKey,
    normalizeSectionId,
    renderAlpacaList,
    renderConfiguredMascotAsset,
    renderLearnCardFooterNav,
    renderOptionToken,
    renderPanelTitle,
    renderRawBackToTopButton,
    renderRawMasteryToggle,
    renderRawMediaLightbox,
    renderRawQuizFeedback,
    renderRawQuizOptionStateClass,
    renderRawQuizPager,
    renderRawStudentAssets,
    renderRegularGuideDocument,
    renderRegularGuideQuestionBlock,
    renderSectionTransferTable,
    renderTextWithBreaks,
    shuffle,
    stableShuffleByKey,
    usesGranularLearnSubjects
  },
  callbacks: {
    render,
    renderExperience,
    renderStats,
    saveRawMastery,
    syncPopupScrollLock
  }
}));

const authController = createAuthController({
  appState: state,
  config: { url: SUPABASE_URL, publishableKey: SUPABASE_PUBLISHABLE_KEY },
  authService: appAuthService,
  profileService: supabaseProfileService,
  supabaseGlobal: window.supabase,
  alpacaNamePattern: ALPACA_NAME_PATTERN,
  locationObject: window.location,
  callbacks: {
    syncAuthChrome,
    normalizeStats,
    normalizeRawMastery,
    saveProgressLocally,
    saveRemoteProgress: saveAlpacaProgress,
    renderStats,
    renderExperience,
    resetLiveState: resetAlpacapardyLiveState
  }
});

gameQuestionPlanningController = createGameQuestionPlanningController({
  appState: state,
  data: {
    importedRawContentBank: IMPORTED_RAW_CONTENT_BANK,
    fullVoyageQuestions,
    sections: data.sections,
    sectionById,
    subjectById
  },
  constants: {
    GAME_CONFIG
  },
  services: {
    gameQuestionService,
    alpaquizEngine
  },
  helpers: {
    escapeHtml,
    findBigIdeaRouteIdByLabel,
    getApprovedRawContentSection,
    getRawEntriesForRouteSelection,
    getRawEntriesForSelection,
    getSectionGuideQuestions,
    getSectionIdFromGuidingTitle,
    getSelectedSectionIds,
    getTargetLabel,
    normalizeKnowledgeKey,
    shuffle,
    slugifyBigIdea
  }
});

const buildCaseController = createBuildCaseController({
  appState: state,
  windowRef: window,
  data: {
    debateLabData,
    sectionById
  },
  constants: {
    buildCaseRoundCount: GAME_CONFIG.buildCaseRoundCount
  },
  helpers: {
    escapeHtml,
    getAssetValue,
    getBestStreakFromAnswers,
    getBigIdeaIdsFromLabels,
    getBroadSubjectIdsFromLabels,
    getOrderedSectionIds,
    getRawEntriesForSelection,
    getSectionIdFromGuidingTitle,
    getSelectedSectionIds,
    getTargetLabel,
    renderAssetImage,
    renderGameQuestionPopup,
    renderPanelTitle,
    shortenTrainText,
    shuffle,
    slugifyBigIdea
  },
  callbacks: {
    finalizeSessionStats,
    renderExperience,
    renderExperiencePreservingScroll
  }
});

const arcadeRenderController = createArcadeRenderController({
  appState: state,
  constants: {
    GAME_CONFIG
  },
  helpers: {
    createJumpObstacle,
    escapeHtml,
    getAssetValue,
    getGamePromptLabel,
    getGameplayAssetPath,
    getGameplayReviewBadge,
    getLensCardPluralLabel,
    getRaceActiveLevelState,
    getSetupTargetHeading,
    getSetupTargetHelper,
    getTargetLabel,
    getTargetSetupOptions,
    getUnavailableRawGameReason,
    renderAlternateLensBreakdown,
    renderAssetImage,
    renderCheckpointVisual,
    renderConfiguredMascotAsset,
    renderGameNotes,
    renderGameQuestionPopup,
    renderMascot,
    renderOptionToken,
    renderPanelTitle,
    renderRaceFailVisual,
    renderRaceLivesIcon,
    renderResultsScreen
  }
});

alpacapardyBoardController = createAlpacapardyBoardController({
  appState: state,
  data,
  sectionById,
  subjectById,
  bigIdeaRoutes: BIG_IDEA_ROUTES,
  constants: {
    GAME_CONFIG
  },
  engines: {
    alpacapardyEngine
  },
  renderers: {
    alpacapardyRenderer
  },
  callbacks: {
    escapeHtml,
    getActiveSubjectCatalog,
    getAlpacapardyLiveRenderContext,
    getAssetValue,
    getGamePromptLabel,
    getGameplayAssetPath,
    getGameplayReviewBadge,
    getLensCardPluralLabel,
    getQuestionsForRouteSelection,
    getResultAssetPath,
    getSectionCounts,
    getSelectedSectionIds,
    getSelectionQuestions,
    getSubjectCounts,
    getTargetLabel,
    getTargetLabelForLens,
    getThemedTeamLabel,
    getTimerVisualState,
    renderAssetImage,
    renderBreakdowns,
    renderCheckpointVisual,
    renderConfiguredMascotAsset,
    renderExperienceCloseButton,
    renderGameNotes,
    renderGameQuestionPopup,
    renderJeopardyDecoration,
    renderMetricCard,
    renderOptionToken,
    renderPanelTitle,
    renderPopupQuestionTimerPanel,
    shuffle
  }
});

experienceFactoryController = createExperienceFactoryController({
  constants: {
    GAME_CONFIG,
    ALPACA_RUN_ROUTE
  },
  modes: {
    rawContentMode
  },
  helpers: {
    buildQuizQuestionPlan,
    createJumpObstacle,
    createRelayTeams,
    escapeHtml,
    getDefaultQuizSectionIds,
    getDefaultTargetSetupCategoryIds,
    getKnowledgeContext,
    getModeAssetPath,
    getModeOption,
    getModeUnavailableReason,
    renderConfiguredMascotAsset,
    renderPanelTitle
  }
});

const experienceFactories = Object.freeze({
  slideshow: buildSlideshowExperience,
  mindmap: buildMindMapExperience,
  rawcontent: buildRawContentExperience,
  regularguide: buildRegularGuideExperience,
  channel: buildAlpacaChannelExperience,
  alpacard: buildAlpacardExperience,
  writing: buildWritingExperience,
  quiz: buildQuizExperience,
  bowl: buildBowlExperience,
  race: buildRaceExperience,
  jump: buildJumpExperience,
  jeopardy: buildJeopardyExperience,
  run: buildRunExperience,
  relay: buildRelayExperience,
  buildcase: buildBuildCaseExperience
});

const gameLaunchController = createGameLaunchController({
  appState: state,
  experienceFactories,
  unavailableFactory: buildUnavailableModeExperience,
  cleanupCallbacks: [
    clearJeopardyTimer,
    clearDebateSpinTimer,
    clearDebateRevealTimer
  ]
});

const studyGameController = createStudyGameController({
  appState: state,
  appData: {
    data
  },
  alpaquizEngine,
  constants: {
    GAME_CONFIG,
    WRITING_PHASES
  },
  callbacks: {
    buildBowlExperience,
    buildQuizExperience,
    buildQuizQuestionPlan,
    finalizeSessionStats,
    getBestStreakFromAnswers,
    getCurrentBowlQuestion,
    getUnavailableRawGameReason,
    normalizeQuizDifficultySelection,
    renderExperience,
    renderExperiencePreservingScroll
  }
});

const arcadeGameController = createArcadeGameController({
  appState: state,
  windowRef: window,
  constants: {
    GAME_CONFIG
  },
  callbacks: {
    buildAlpacaRunQuestionPlan,
    buildJumpQuestionPlan,
    buildRaceLevelQueues,
    buildRelayQuestionSequence,
    clearRaceTimer,
    clearRelayAnswerTimer,
    createJumpObstacle,
    createRelayTeams,
    finalizeSessionStats,
    getBestStreakFromAnswers,
    getCurrentRaceQuestion,
    getHighestTeamScore,
    getRaceActiveLevelState,
    getRawEntriesForRunSetupCategoryIds,
    getRunReachedStage,
    getThemedTeamLabel,
    getUnavailableRawGameReason,
    playRelayBuzzSound,
    queueNextJumpObstacle,
    queueNextRaceQuestion,
    render,
    renderExperience,
    syncRelayTeamBindings,
    updateJumpDom
  }
});

const arcadeRuntimeTimerController = createArcadeRuntimeTimerController({
  appState: state,
  windowRef: window,
  callbacks: {
    finalizeSessionStats,
    getRunReachedStage,
    handleRelayTimeout,
    refreshRunTimerDisplay,
    render,
    renderExperiencePreservingScroll,
    resolveRaceQuestion
  }
});

arcadeJumpAnimationController = createArcadeJumpAnimationController({
  appState: state,
  refs,
  domService: appDomService,
  windowRef: window,
  constants: {
    GAME_CONFIG
  },
  helpers: {
    getJumpRunnerState
  },
  renderers: {
    renderJumpLives,
    renderJumpObstacle,
    renderJumpRunner
  },
  callbacks: {
    createJumpCheckpointObstacle,
    createJumpObstacle,
    finalizeSessionStats,
    getExperience: () => state.experience,
    getBestStreakFromAnswers,
    getJumpObstacleRequirement,
    getJumpObstacleSpeed,
    hasJumpCollision,
    render,
    renderExperience,
  }
});

const appLifecycleRuntime = createAppLifecycleRuntime({
  appState: state,
  refs,
  documentRef: document,
  windowRef: window,
  bootstrapService: appBootstrapService,
  domService: appDomService,
  controllers: {
    arcadeRuntimeTimerController,
    arcadeJumpAnimationController
  },
  callbacks: {
    hydrateKnowledgeBank,
    preloadExperienceAudio,
    setupSupabaseAuth,
    renderHeroVisual,
    renderInsights,
    render,
    handleClick,
    handleInput,
    handleSubmit,
    handleKeyDown,
    handleMindMapGalleryWheel,
    handleTouchStart,
    handleTouchEnd,
    syncRadialMindMapScroll
  }
});

const alpaquizRenderController = createAlpaquizRenderController({
  appState: state,
  renderers: {
    quizRenderer: alpaquizRenderer,
    relayRenderer: alpaquizRelayRenderer
  },
  callbacks: {
    getQuizRenderHelpers: getAlpaquizRenderHelpers,
    getRelayRenderHelpers,
    renderTrainTipPopup
  }
});

const legacyLiveRoomController = createLegacyLiveRoomController({
  appState: state,
  appStateService,
  authController,
  alpacaChannelCatalog,
  alpacapardyLive,
  alpacapardyLiveSupabaseService,
  alpacapardyEngine,
  windowRef: window,
  constants: {
    LEGACY_LIVE_ROOMS_PUBLIC_ENABLED,
    MULTIPLAYER_ALLOWED_EMAILS,
    MULTIPLAYER_ALLOWED_EMAIL_DOMAINS,
    LIVE_GAME_TYPES,
    LIVE_ALPACA_COLORS,
    LIVE_SYNC_INTERVAL_MS,
    GAME_CONFIG
  },
  callbacks: {
    buildConfiguredJeopardyBoard,
    buildJeopardyExperience,
    buildPatternQuestionSequence,
    buildRawQuestionPoolsFromEntries,
    createStandaloneAlpacaChannelVideo,
    finalizeSessionStats,
    getBestStreakFromAnswers,
    getEmbeddableVideo,
    getHighestTeamScore,
    getRawEntriesForRouteSelection,
    loadGuestAlpacaName,
    render,
    renderLiveSurfaces,
    shuffle,
    startJeopardyTimer
  }
});

alpacapardyController = createAlpacapardyController({
  appState: state,
  windowRef: window,
  alpacapardyLive,
  constants: {
    GAME_CONFIG
  },
  callbacks: {
    allJeopardyTilesDone,
    buildConfiguredJeopardyBoard,
    canAnswerAlpacapardyLiveFocus,
    canCloseAlpacapardyLiveFocus,
    canOpenAlpacapardyLiveTile,
    clearJumpAnimation,
    clearRaceTimer,
    clearRelayAnswerTimer,
    clearRunTimer,
    createJeopardyTeams,
    emitAlpacapardyLiveEvent,
    finalizeSessionStats,
    getAlpacapardyLiveIdentityContext,
    getBestStreakFromAnswers,
    getHighestTeamScore,
    getThemedTeamLabel,
    isAlpacapardyLiveActive,
    render,
    renderExperience,
    renderExperiencePreservingScroll,
    renderLiveSurfaces,
    syncAlpacapardyLiveSettings
  }
});

const modeRuntimeController = createModeRuntimeController({
  appState: state,
  refs,
  domService: appDomService,
  renderers: {
    slideshow: renderSlideshowExperience,
    mindmap: renderMindMapExperience,
    rawcontent: renderRawContentExperience,
    regularguide: renderRegularGuideExperience,
    channel: renderAlpacaChannelExperience,
    alpacard: renderAlpacardExperience,
    writing: renderWritingExperience,
    quiz: renderQuizExperience,
    bowl: renderBowlExperience,
    race: renderRaceExperience,
    jump: renderJumpExperience,
    jeopardy: renderJeopardyExperience,
    run: renderRunExperience,
    relay: renderRelayExperience,
    buildcase: renderBuildCaseExperience,
    unavailable: renderUnavailableModeExperience
  },
  callbacks: {
    stopMindMapOrbitAnimation,
    syncExperienceTimers: appLifecycleRuntime.syncExperienceTimers,
    syncPopupScrollLock,
    syncRadialMindMapScroll,
    syncMindMapOrbitAnimation,
    syncRawQuestionGalleries,
    syncActiveModalFocus
  }
});

const legacyLiveRoomRenderer = createLegacyLiveRoomRenderer({
  appState: state,
  appDomService,
  onlineModeController,
  documentRef: document,
  windowRef: window,
  constants: {
    LIVE_GAME_TYPES,
    LIVE_GAME_ORDER,
    LIVE_ALPACA_COLORS,
    GAME_CONFIG,
    ALPACA_RUN_ROUTE
  },
  helpers: {
    escapeHtml,
    canAccessLegacyLiveRooms,
    getLegacyLiveRoomsDisabledMessage,
    getAlpacapardyLiveIdentityContext,
    getAlpacapardyLiveRenderContext,
    normalizeLiveGameType,
    getCurrentLiveGameType,
    getLiveGameLabel,
    getLivePlayablePlayers,
    getAssetValue,
    getWizardCardAsset,
    renderConfiguredMascotAsset,
    renderJeopardyExperience,
    renderJeopardySetup,
    canStartSelectedLiveGame,
    getLiveWaitingVideos,
    getLiveWaitingVideoIndex,
    getEmbeddableVideo,
    getVideoPreview,
    getAlpacaChannelDomain,
    normalizeVideoUrl,
    getModeAssetPath,
    getArcadeState,
    getLiveRunSetupColorId,
    renderRunMapBackground,
    renderRunMapStop,
    getRunMapTop,
    renderOptionToken,
    getArcadeLeaderboard,
    renderRaceLivesIcon
  },
  callbacks: {
    syncActiveModalFocus
  }
});

const routeBuilderViewController = createRouteBuilderViewController({
  appState: state,
  refs,
  appDomService,
  wizardRenderer,
  documentRef: document,
  windowRef: window,
  constants: {
    WIZARD_TOTAL_STEPS,
    DEFAULT_LENS_ID,
    PATH_OPTIONS,
    LENS_OPTIONS
  },
  helpers: {
    escapeHtml,
    renderConfiguredMascotAsset,
    getAssetValue,
    getWizardCardAsset,
    getTargetAssetPath,
    getModeAssetPath,
    getPathReviewBadge,
    getLensReviewBadge,
    getTargetReviewBadge,
    getModeReviewBadge,
    getTargetLabel,
    getModeOption,
    getSelectedSectionIds,
    getTargetOptions,
    getVisibleModeOptions,
    getVisibleModeOptionsForPath,
    getModePath,
    getAppModeSwitchIcon
  },
  callbacks: {
    renderAlpacaOnlineHub
  }
});


const routeOrchestrationController = createRouteOrchestrationController({
  appState: state,
  refs,
  routeBuilderController,
  routeBuilderViewController,
  gameLaunchController,
  documentRef: document,
  windowRef: window,
  constants: {
    DEFAULT_LENS_ID
  },
  helpers: {
    getSelectedSectionIds,
    getOrderedSectionIds,
    getModePath,
    isModeUnavailable,
    getAlpacaChannelVideosForSection,
    hasRegularGuideForSection: (sectionId) => Boolean(IMPORTED_RAW_CONTENT_BANK[sectionId]?.regularGuide),
    normalizeSectionId
  },
  callbacks: {
    clearJeopardyTimer,
    clearDebateSpinTimer,
    closeHeroMenu,
    render,
    renderCurrentExperience: () => modeRuntimeController.renderCurrentExperience(),
    isAlpacapardyLiveActive,
    leaveAlpacapardyLiveRoom
  }
});

({
  appActions,
  appEventRouter,
  appShellRenderer,
  appShellController
} = createAppShellRuntime({
  appState: state,
  refs,
  documentRef: document,
  windowRef: window,
  factories: {
    createAppActionRegistry,
    createAppEventRouter,
    createAppShellRenderer,
    createAppShellController
  },
  services: {
    appDomService,
    appStateService,
    appEntryService,
    onlineModeController,
    modalFocusService,
    authModalRenderer,
    alpacapardyLiveSupabaseService
  },
  constants: {
    ASSET_CACHE_VERSION,
    DISCORD_INVITE_URL,
    CONTACT_EMAIL_URL,
    WSC_ROUND_OPTIONS,
    LIVE_GAME_ORDER,
    ALPACA_RUN_ROUTE,
    DEFAULT_LENS_ID,
    RESOURCE_LINKS: window.WSC_APP_SHELL_RESOURCE_LINKS || [],
    insights: data.insights
  },
  helpers: {
    escapeHtml,
    getPathOption,
    getModePath,
    getModeAssetPath,
    getModeOption,
    getWizardCardAsset,
    normalizeLiveGameType,
    renderConfiguredMascotAsset
  },
  callbacks: {
    syncActiveModalFocus,
    isSignedIn,
    canDismissAuthModal,
    canAccessCampusPreview,
    getCurrentUserEmail,
    getTotalRawMasterableEntries,
    getMasteredRawEntryCount,
    getDefaultStats,
    getLiveGameLabel,
    getSelectedSectionIds,
    getSelectedSectionLabels,
    getTargetLabel,
    renderSummary,
    renderWizard,
    renderLiveOverlayMount,
    renderExperience,
    resetAlpacapardyLiveState,
    canAccessLegacyLiveRooms,
    getLegacyLiveRoomsDisabledMessage,
    buildJeopardyExperience,
    refreshAlpacapardyLiveLobby
  },
  actions: {
    ...runtimeCompatibilityFacade,
    goToWizardStep,
    setJeopardyPlayMode
  }
}));

resultsRenderer = createResultsRenderer({
  appState: state,
  data,
  bigIdeaRoutes: BIG_IDEA_ROUTES,
  helpers: {
    escapeHtml,
    getAccuracy,
    getMindMapLensLabel,
    getPerformanceMood,
    getPerformanceRating,
    getResultAssetPath,
    getTargetLabel,
    renderConfiguredMascotAsset,
    renderExperienceCloseButton,
    renderPanelTitle
  }
});

trainPracticeController = createTrainPracticeController({
  appState: state,
  data: {
    ...data,
    sectionById
  },
  constants: {
    trainTips: TRAIN_TIPS,
    writingPracticeFormats: WRITING_PRACTICE_FORMATS,
    writingPhases: WRITING_PHASES,
    bowlRoundTypes: BOWL_ROUND_TYPES
  },
  services: {
    scholarsBowlService
  },
  helpers: {
    escapeHtml,
    getAssetValue,
    getModeAssetPath,
    getRawEntriesForSelection,
    getSelectedSectionIds,
    getTargetLabel,
    renderAssetImage,
    renderLearnCardFooterNav,
    renderMetricCard,
    renderOptionToken,
    renderPanelTitle,
    renderResultsScreen,
    renderTextWithBreaks,
    versionAssetSrc
  },
  callbacks: {
    renderExperience
  }
});

appLifecycleRuntime.init();

function renderStats() {
  return appShellController.renderStats();
}

function goToWizardStep(stepNumber) {
  if (stepNumber <= 1) {
    clearFrom("target");
    return;
  }

  if (stepNumber === 2) {
    clearFrom("mode");
  }
}

function getActiveSubjectCatalog() {
  return routeBuilderOptionsService.getActiveSubjectCatalog();
}

function getActiveSubjectKnowledgeMap() {
  return routeBuilderOptionsService.getActiveSubjectKnowledgeMap();
}

function refreshRunTimerDisplay(experience) {
  if (!refs.experiencePanel || !experience || experience.type !== "run") {
    return false;
  }

  const timerCard = refs.experiencePanel.querySelector(".run-inline-footer .compact-race-timer-card.run");
  if (!timerCard) {
    return false;
  }

  const timerClass = getTimerVisualState(experience.timeRemaining, GAME_CONFIG.runTotalTime, {
    warningAt: 80,
    dangerAt: 35
  });

  return Boolean(replaceMarkup(
    timerCard,
    renderCompactRaceTimerCard("Time Left", experience.timeRemaining, GAME_CONFIG.runTotalTime, timerClass, "run")
  ));
}

function canAccessCampusPreview() {
  return Boolean(CAMPUS_PREVIEW_PUBLIC_ENABLED);
}

function getAccountAlpacaName() {
  const profileName = state.auth.profile && state.auth.profile.alpaca_name;
  return profileName ? String(profileName).trim() : "Alpaca";
}

function getThemedTeamLabel(index) {
  const name = getAccountAlpacaName();
  const labels = [
    `Team ${name}`,
    `anti-${name}`,
    `Dark ${name}`,
    `Not ${name}`
  ];

  return labels[index] || `Team ${index + 1}`;
}

function getQuestionSubjectLabels(question) {
  return gameQuestionPlanningController.getQuestionSubjectLabels(question);
}

function getRawEntriesForRouteSelection(...args) {
  return rawContentController.getRawEntriesForRouteSelection(...args);
}

function countRawQuizQuestions(...args) {
  return rawContentController.countRawQuizQuestions(...args);
}

function getOrderedRawContentSections(...args) {
  return rawContentController.getOrderedRawContentSections(...args);
}

function mapRawEntriesWithSection(...args) {
  return rawContentController.mapRawEntriesWithSection(...args);
}

function getAlpaquizRenderHelpers() {
  return {
    escapeHtml,
    renderPanelTitle,
    renderGameQuestionPopup,
    renderConfiguredMascotAsset,
    getModeAssetPath,
    renderLearnCardFooterNav,
    renderOptionToken,
    renderTextWithBreaks,
    getQuizRemainingNotice,
    getQuizDifficultyResults,
    getSectionTitle: (question) => sectionById[question.sectionId]?.title || ""
  };
}

function getRelayRenderHelpers() {
  return {
    GAME_CONFIG,
    escapeHtml,
    getTargetLabel,
    getQuestionSectionLabel: (question) => {
      if (!question) {
        return getTargetLabel();
      }
      return question.sectionId && sectionById[question.sectionId]
        ? sectionById[question.sectionId].originalTitle
        : (question.guidingSection || getTargetLabel());
    },
    renderPanelTitle,
    renderConfiguredMascotAsset,
    getGameplayAssetPath,
    getGameplayReviewBadge,
    getGamePromptLabel,
    renderGameNotes,
    renderQuestionSubjectPills,
    renderGameQuestionPopup,
    renderTargetSetupSelector,
    renderCompactRaceTimerCard,
    getTimerVisualState,
    renderOptionToken,
    renderCheckpointVisual,
    formatRelayAwardedTeams,
    renderMetricCard,
    renderSelectedTargetBreakdown,
    getResultAssetPath,
    getAssetValue,
    renderAssetImage
  };
}

function setJeopardyPlayMode(playMode) {
  const experience = state.experience;
  if (!experience || experience.type !== "jeopardy" || experience.started || state.live.currentSession) {
    return;
  }

  if (playMode === "multiplayer" && !guardMultiplayerAccess()) {
    return;
  }

  experience.playMode = playMode === "multiplayer" ? "multiplayer" : "solo";
  if (experience.playMode === "multiplayer") {
    refreshAlpacapardyLiveLobby();
  } else {
    resetAlpacapardyLiveState();
    renderLiveSurfaces();
  }
}

function getRaceQuestionDuration(index) {
  return GAME_CONFIG.raceQuestionTime;
}

function formatCountdown(...args) {
  return arcadeRenderController.formatCountdown(...args);
}

function getQuestionsForRouteSelection(lensId, targetId) {
  return gameQuestionPlanningController.getQuestionsForRouteSelection(lensId, targetId);
}

function normalizeKnowledgeKey(value) {
  return knowledgeRuntimeController.normalizeKnowledgeKey(value);
}

function buildBigIdeaRoutes(rawSections) {
  return knowledgeRuntimeController.buildBigIdeaRoutes(rawSections);
}

function getSectionIdFromGuidingTitle(title) {
  return knowledgeRuntimeController.getSectionIdFromGuidingTitle(title);
}

function entryMatchesLearnSubjectRoute(entry, sectionId, route) {
  return knowledgeRuntimeController.entryMatchesLearnSubjectRoute(entry, sectionId, route);
}

function buildWholeThemeMindMap(knowledge) {
  return {
    kicker: "Main route map",
    centerTitle: data.theme.name,
    centerBody: `Full bank loaded: ${knowledge.sections.length} sections, ${knowledge.atoms.length} subtopics, and ${knowledge.knowledgeItemCount} structured knowledge items.`,
    nodes: knowledge.sections.map((section) => ({
      title: section.title,
      body: section.summary,
      tags: [`${section.atoms.length} subtopics`, ...section.officialSubjects]
    })),
    prompts: knowledge.atoms.map((atom) => ({
      title: `${atom.sourceSectionOriginalTitle} · ${atom.subtopic}`,
      body: atom.coreIdea
    }))
  };
}

function buildSubjectMindMap(knowledge) {
  return {
    kicker: usesGranularLearnSubjects() ? "Study lane map" : "Subject route map",
    centerTitle: knowledge.label,
    centerBody: `${knowledge.description} This ${usesGranularLearnSubjects() ? "study lane" : "subject route"} includes ${knowledge.sections.length} sections, ${knowledge.atoms.length} subtopics, and ${knowledge.knowledgeItemCount} knowledge items.`,
    nodes: knowledge.sections.map((section) => ({
      title: section.title,
      body: section.summary,
      tags: [`${section.atoms.length} subtopics`, ...section.overlayCategories]
    })),
    prompts: knowledge.atoms.map((atom) => ({
      title: `${atom.sourceSectionOriginalTitle} · ${atom.subtopic}`,
      body: atom.coreIdea
    }))
  };
}

function buildSectionMindMap(knowledge) {
  return {
    kicker: "Guiding-section route map",
    centerTitle: knowledge.title,
    centerBody: `${knowledge.summary} This route includes ${knowledge.atoms.length} subtopics and ${knowledge.knowledgeItemCount} explicit knowledge items.`,
    nodes: knowledge.atoms.map((atom) => ({
      title: atom.subtopic,
      body: atom.coreIdea,
      tags: [atom.difficulty, ...atom.keywords]
    })),
    prompts: knowledge.atoms.flatMap((atom) => atom.mustKnowPoints.map((point, index) => ({
      title: `${atom.subtopic} · Must know ${index + 1}`,
      body: point
    })))
  };
}

function pickQuestions(questions, count) {
  const pool = shuffle(questions.slice());
  return pool.slice(0, Math.min(count, pool.length));
}

function saveStats() {
  saveProgressLocally();
  saveAlpacaProgress();
}

function saveRawMastery() {
  saveProgressLocally();
  saveAlpacaProgress();
}

function saveProgressLocally() {
  const result = progressStorageController.saveLocalProgress(state);
  state.ui.localProgressSaveError = result?.ok
    ? ""
    : "Local progress could not be saved in this browser. You can keep using WSCapp, but progress may reset after reload.";
  return result;
}

function getAssetValue(path, fallback = null) {
  return visualAssetRenderer.getAssetValue(path, fallback);
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}


    return Object.freeze({
      init: appLifecycleRuntime.init
    });
  }

  window.WSC_CREATE_APP = createWscApp;
}());
