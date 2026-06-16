(function () {
  function createAppRuntimeCompatibilityFacade(options = {}) {
    const state = options.appState;
    const document = options.documentRef || globalThis.document;
    const constants = options.constants || {};
    const services = options.services || {};
    const getControllers = options.getControllers || {};
    const GAME_CONFIG = constants.GAME_CONFIG || {};
    const appDomService = services.appDomService || null;
    const arcadeJumpHelpers = services.arcadeJumpHelpers || null;
    const supabaseProfileService = services.supabaseProfileService || null;

    function getController(name) {
      const getter = getControllers[name];
      const controller = typeof getter === "function" ? getter() : null;
      if (!controller) {
        throw new Error("WSC runtime compatibility facade missing controller: " + name);
      }
      return controller;
    }

    function createControllerProxy(name) {
      return new Proxy({}, {
        get(_target, property) {
          const controller = getController(name);
          const value = controller[property];
          if (typeof value === "function") {
            return value.bind(controller);
          }
          return value;
        }
      });
    }

    const arcadeRuntimeTimerController = createControllerProxy("arcadeRuntimeTimerController");
    const arcadeJumpAnimationController = createControllerProxy("arcadeJumpAnimationController");
    const alpacapardyController = createControllerProxy("alpacapardyController");
    const buildCaseController = createControllerProxy("buildCaseController");
    const legacyLiveRoomController = createControllerProxy("legacyLiveRoomController");
    const appEventRouter = createControllerProxy("appEventRouter");
    const routeOrchestrationController = createControllerProxy("routeOrchestrationController");
    const appShellController = createControllerProxy("appShellController");
    const routeBuilderViewController = createControllerProxy("routeBuilderViewController");
    const appShellRenderer = createControllerProxy("appShellRenderer");
    const legacyLiveRoomRenderer = createControllerProxy("legacyLiveRoomRenderer");
    const routeBuilderOptionsService = createControllerProxy("routeBuilderOptionsService");
    const gameLaunchController = createControllerProxy("gameLaunchController");
    const alpacardsController = createControllerProxy("alpacardsController");
    const mindMapOrbitController = createControllerProxy("mindMapOrbitController");
    const authController = createControllerProxy("authController");
    const experienceFactoryController = createControllerProxy("experienceFactoryController");
    const rawContentController = createControllerProxy("rawContentController");
    const gameQuestionPlanningController = createControllerProxy("gameQuestionPlanningController");
    const alpaquizEngine = createControllerProxy("alpaquizEngine");
    const trainPracticeController = createControllerProxy("trainPracticeController");
    const studyGameController = createControllerProxy("studyGameController");
    const alpacaChannelController = createControllerProxy("alpacaChannelController");
    const learnSlideshowController = createControllerProxy("learnSlideshowController");
    const mindMapController = createControllerProxy("mindMapController");
    const regularGuideController = createControllerProxy("regularGuideController");
    const alpaquizRenderController = createControllerProxy("alpaquizRenderController");
    const arcadeGameController = createControllerProxy("arcadeGameController");
    const arcadeRenderController = createControllerProxy("arcadeRenderController");
    const resultsRenderer = createControllerProxy("resultsRenderer");
    const gamePromptPresenter = createControllerProxy("gamePromptPresenter");
    const alpacapardyBoardController = createControllerProxy("alpacapardyBoardController");
    const relayTeamService = createControllerProxy("relayTeamService");
    const gameResultsService = createControllerProxy("gameResultsService");
    const progressStorageController = createControllerProxy("progressStorageController");
    const visualAssetRenderer = createControllerProxy("visualAssetRenderer");
    const gameAudioService = createControllerProxy("gameAudioService");
    const knowledgeRuntimeController = createControllerProxy("knowledgeRuntimeController");
    const selectionContextService = createControllerProxy("selectionContextService");

    function clearRunTimer() {
      return arcadeRuntimeTimerController.clearRunTimer();
    }

    function clearRaceTimer() {
      return arcadeRuntimeTimerController.clearRaceTimer();
    }

    function clearRelayAnswerTimer() {
      return arcadeRuntimeTimerController.clearRelayAnswerTimer();
    }

    function clearJumpAnimation() {
      return arcadeJumpAnimationController.clearJumpAnimation();
    }

    function clearJeopardyTimer() {
      return alpacapardyController.clearJeopardyTimer();
    }

    function clearDebateSpinTimer() {
      return buildCaseController.clearSpinTimer();
    }

    function clearDebateRevealTimer() {
      return buildCaseController.clearRevealTimer();
    }

    function clearAlpacapardyLiveHeartbeat(...args) {
      return legacyLiveRoomController.clearAlpacapardyLiveHeartbeat(...args);
    }

    function clearAlpacapardyLiveSync(...args) {
      return legacyLiveRoomController.clearAlpacapardyLiveSync(...args);
    }

    function clearLiveLaunchCountdown(...args) {
      return legacyLiveRoomController.clearLiveLaunchCountdown(...args);
    }

    function clearAlpacapardyLiveSubscriptions(...args) {
      return legacyLiveRoomController.clearAlpacapardyLiveSubscriptions(...args);
    }

    function resetAlpacapardyLiveState({ keepGuestName = true } = {}) {
      return legacyLiveRoomController.resetAlpacapardyLiveState({ keepGuestName });
    }

    function handleClick(...args) { return appEventRouter.handleClick(...args); }

    function handleInput(...args) { return appEventRouter.handleInput(...args); }

    function handleSubmit(...args) { return appEventRouter.handleSubmit(...args); }

    function handleKeyDown(...args) { return appEventRouter.handleKeyDown(...args); }

    function handleTouchStart(...args) { return appEventRouter.handleTouchStart(...args); }

    function handleTouchEnd(...args) { return appEventRouter.handleTouchEnd(...args); }

    function choosePath(pathId) {
      return routeOrchestrationController.choosePath(pathId);
    }

    function chooseLens(lensId) {
      return routeOrchestrationController.chooseLens(lensId);
    }

    function chooseTarget(targetId) {
      return routeOrchestrationController.chooseTarget(targetId);
    }

    function toggleModeChoiceSection(targetId) {
      return routeOrchestrationController.toggleModeChoiceSection(targetId);
    }

    function getVisibleModeChoicePath() {
      return routeOrchestrationController.getVisibleModeChoicePath();
    }

    function toggleHeroMenu(button) {
      return appShellController.toggleHeroMenu(button);
    }

    function closeHeroMenu() {
      return appShellController.closeHeroMenu();
    }

    function primeModeChoiceCardSpread(column) {
      return routeBuilderViewController.primeModeChoiceCardSpread(column);
    }

    function scheduleModeChoiceCardSpread(column, board) {
      return routeBuilderViewController.scheduleModeChoiceCardSpread(column, board);
    }

    function getModeChoiceCardTarget(card) {
      return routeBuilderViewController.getModeChoiceCardTarget(card);
    }

    function easeModeChoiceSpread(progress) {
      return routeBuilderViewController.easeModeChoiceSpread(progress);
    }

    function setModeChoiceCardSpreadFrame(card, target, progress) {
      return routeBuilderViewController.setModeChoiceCardSpreadFrame(card, target, progress);
    }

    function animateModeChoiceCardSpread(column, board) {
      return routeBuilderViewController.animateModeChoiceCardSpread(column, board);
    }

    function clearModeChoiceCardSpread(column) {
      return routeBuilderViewController.clearModeChoiceCardSpread(column);
    }

    function freezeModeChoiceColumnAtCurrentPosition(column, board) {
      return routeBuilderViewController.freezeModeChoiceColumnAtCurrentPosition(column, board);
    }

    function getModeChoiceCollapsedSlot(column) {
      return routeBuilderViewController.getModeChoiceCollapsedSlot(column);
    }

    function moveModeChoiceColumnToCollapsedSlot(column) {
      return routeBuilderViewController.moveModeChoiceColumnToCollapsedSlot(column);
    }

    function clearModeChoiceColumnPosition(column) {
      return routeBuilderViewController.clearModeChoiceColumnPosition(column);
    }

    function toggleModeChoiceMenu(button) {
      return routeBuilderViewController.toggleModeChoiceMenu(button);
    }

    function continueTargetSelection() {
      return routeOrchestrationController.continueTargetSelection();
    }

    function chooseMode(modeId, pathId = null) {
      return routeOrchestrationController.chooseMode(modeId, pathId);
    }

    function changeGuidingSections() {
      return routeOrchestrationController.changeGuidingSections();
    }

    function changeModeSelection() {
      return routeOrchestrationController.changeModeSelection();
    }

    function clearFrom(step) {
      return routeOrchestrationController.clearFrom(step);
    }

    function openRawConnection(lensId, targetId) {
      return routeOrchestrationController.openRawConnection(lensId, targetId);
    }

    function openGuideSection(sectionId) {
      return routeOrchestrationController.openGuideSection(sectionId);
    }

    function openSectionChannel(sectionId) {
      return routeOrchestrationController.openSectionChannel(sectionId);
    }

    function render() {
      return appShellController.render();
    }

    function syncActiveModalFocus() {
      return appShellController.syncActiveModalFocus();
    }

    function renderInsights() {
      return appShellController.renderInsights();
    }

    function renderSessionControls() {
      return appShellController.renderSessionControls();
    }

    function renderAppEntryGate() {
      return appShellController.renderAppEntryGate();
    }

    function renderAppEntryAuthPanel() {
      return appShellController.renderAppEntryAuthPanel();
    }

    function chooseAppEntryMode(mode) {
      return appShellController.chooseAppEntryMode(mode);
    }

    function openAlpacaOnlineCampus() {
      return appShellController.openAlpacaOnlineCampus();
    }

    function switchToLocalMode() {
      return appShellController.switchToLocalMode();
    }

    function openAlpacaOnlineHub() {
      return appShellController.openAlpacaOnlineHub();
    }

    function returnToAlpacaOnlineHub() {
      return legacyLiveRoomController.returnToAlpacaOnlineHub();
    }

    function renderProgressCircleStatCard(label, primary, secondary, percent) {
      return appShellRenderer.renderProgressCircleStatCard(label, primary, secondary, percent);
    }

    function renderBestScoreStrip() {
      return appShellRenderer.renderBestScoreStrip();
    }

    function renderBestScoreCard(card) {
      return appShellRenderer.renderBestScoreCard(card);
    }

    function renderOnlineScoreStrip() {
      return appShellRenderer.renderOnlineScoreStrip();
    }

    function getOnlineGameRecord(gameType) {
      return appShellRenderer.getOnlineGameRecord(gameType);
    }

    function formatBestNumberStat(value) {
      return appShellRenderer.formatBestNumberStat(value);
    }

    function getBestRunDestinationLabel(stageValue) {
      return appShellRenderer.getBestRunDestinationLabel(stageValue);
    }

    function renderSummary() {
      return appShellRenderer.renderSummary();
    }

    function renderSummaryChip(label, value) {
      return appShellRenderer.renderSummaryChip(label, value);
    }

    function renderWizard() {
      return routeBuilderViewController.renderWizard();
    }

    function renderAlpacaOnlineHub(...args) { return legacyLiveRoomRenderer.renderAlpacaOnlineHub(...args); }

    function renderLegacyLiveRoomsDisabled(...args) { return legacyLiveRoomRenderer.renderLegacyLiveRoomsDisabled(...args); }

    function getLiveOverlayRenderContext(...args) { return legacyLiveRoomRenderer.getLiveOverlayRenderContext(...args); }

    function getLiveOverlayMount(...args) { return legacyLiveRoomRenderer.getLiveOverlayMount(...args); }

    function renderLiveOverlayMount(...args) { return legacyLiveRoomRenderer.renderLiveOverlayMount(...args); }

    function canPatchLiveWaitingOverlay(...args) { return legacyLiveRoomRenderer.canPatchLiveWaitingOverlay(...args); }

    function patchLiveWaitingOverlay(...args) { return legacyLiveRoomRenderer.patchLiveWaitingOverlay(...args); }

    function replaceLiveWaitingPart(...args) { return legacyLiveRoomRenderer.replaceLiveWaitingPart(...args); }

    function renderOnlineLiveSidebar(...args) { return legacyLiveRoomRenderer.renderOnlineLiveSidebar(...args); }

    function renderOnlineCurrentGameSummary(...args) { return legacyLiveRoomRenderer.renderOnlineCurrentGameSummary(...args); }

    function getAlpacaOnlineConnectedCount(...args) { return legacyLiveRoomRenderer.getAlpacaOnlineConnectedCount(...args); }

    function renderOnlineJoinForm(...args) { return legacyLiveRoomRenderer.renderOnlineJoinForm(...args); }

    function renderOnlineOpenRoomsList(...args) { return legacyLiveRoomRenderer.renderOnlineOpenRoomsList(...args); }

    function renderOnlineCreateGamePanel(...args) { return legacyLiveRoomRenderer.renderOnlineCreateGamePanel(...args); }

    function renderOnlineHomeGameGrid(...args) { return legacyLiveRoomRenderer.renderOnlineHomeGameGrid(...args); }

    function renderOnlineHomeGameCard(...args) { return legacyLiveRoomRenderer.renderOnlineHomeGameCard(...args); }

    function getOnlineGameCardDescription(...args) { return legacyLiveRoomRenderer.getOnlineGameCardDescription(...args); }

    function renderSelectedOnlineGameBody(...args) { return legacyLiveRoomRenderer.renderSelectedOnlineGameBody(...args); }

    function renderOnlineAlpacapardyLiveGame(...args) { return legacyLiveRoomRenderer.renderOnlineAlpacapardyLiveGame(...args); }

    function renderOnlineArcadeSetup(...args) { return legacyLiveRoomRenderer.renderOnlineArcadeSetup(...args); }

    function renderOnlineAlpacapardySetup(...args) { return legacyLiveRoomRenderer.renderOnlineAlpacapardySetup(...args); }

    function renderOnlineWaitingPopup(...args) { return legacyLiveRoomRenderer.renderOnlineWaitingPopup(...args); }

    function renderOnlineArcadeWaitingRoom(...args) { return legacyLiveRoomRenderer.renderOnlineArcadeWaitingRoom(...args); }

    function renderLiveOverlayLayer(...args) { return legacyLiveRoomRenderer.renderLiveOverlayLayer(...args); }

    function renderLiveLaunchCountdownOverlay(...args) { return legacyLiveRoomRenderer.renderLiveLaunchCountdownOverlay(...args); }

    function renderLiveWaitingOverlay(...args) { return legacyLiveRoomRenderer.renderLiveWaitingOverlay(...args); }

    function renderLiveWaitingVideoRail(...args) { return legacyLiveRoomRenderer.renderLiveWaitingVideoRail(...args); }

    function getLiveWaitingVideoIndex(videos) {
      return legacyLiveRoomController.getLiveWaitingVideoIndex(videos);
    }

    function navigateLiveWaitingVideo(direction) {
      return legacyLiveRoomController.navigateLiveWaitingVideo(direction);
    }

    function getLiveWaitingVideos(sessionId) {
      return legacyLiveRoomController.getLiveWaitingVideos(sessionId);
    }

    function isShortLiveWaitingVideo(video) {
      return legacyLiveRoomController.isShortLiveWaitingVideo(video);
    }

    function getVideoDurationSeconds(duration) {
      return legacyLiveRoomController.getVideoDurationSeconds(duration);
    }

    function renderOnlineArcadeGame(...args) { return legacyLiveRoomRenderer.renderOnlineArcadeGame(...args); }

    function renderLivePlayerCard(...args) { return legacyLiveRoomRenderer.renderLivePlayerCard(...args); }

    function getLiveRunSetupColorId() {
      return legacyLiveRoomController.getLiveRunSetupColorId();
    }

    function renderLiveRunSetupColorPicker(...args) { return legacyLiveRoomRenderer.renderLiveRunSetupColorPicker(...args); }

    function selectLiveRunSetupColor(colorId) {
      return legacyLiveRoomController.selectLiveRunSetupColor(colorId);
    }

    function renderLiveRunColorPicker(...args) { return legacyLiveRoomRenderer.renderLiveRunColorPicker(...args); }

    function renderLiveRunGame(...args) { return legacyLiveRoomRenderer.renderLiveRunGame(...args); }

    function renderLiveRunMap(...args) { return legacyLiveRoomRenderer.renderLiveRunMap(...args); }

    function getLiveRunRouteIndex(...args) { return legacyLiveRoomRenderer.getLiveRunRouteIndex(...args); }

    function renderLiveRunPlayerPanel(...args) { return legacyLiveRoomRenderer.renderLiveRunPlayerPanel(...args); }

    function renderLiveQuizGame(...args) { return legacyLiveRoomRenderer.renderLiveQuizGame(...args); }

    function renderLiveRaceGame(...args) { return legacyLiveRoomRenderer.renderLiveRaceGame(...args); }

    function renderLiveAlpaquizGame(...args) { return legacyLiveRoomRenderer.renderLiveAlpaquizGame(...args); }

    function renderLiveRunAlpacaToken(...args) { return legacyLiveRoomRenderer.renderLiveRunAlpacaToken(...args); }

    function renderLiveRaceLives(...args) { return legacyLiveRoomRenderer.renderLiveRaceLives(...args); }

    function renderLiveAnswerStatus(...args) { return legacyLiveRoomRenderer.renderLiveAnswerStatus(...args); }

    function renderLiveQuizRoundResults(...args) { return legacyLiveRoomRenderer.renderLiveQuizRoundResults(...args); }

    function renderLiveLeaderboard(...args) { return legacyLiveRoomRenderer.renderLiveLeaderboard(...args); }

    function renderLiveWinnerCard(...args) { return legacyLiveRoomRenderer.renderLiveWinnerCard(...args); }

    function renderOnlineRoomListItem(...args) { return legacyLiveRoomRenderer.renderOnlineRoomListItem(...args); }

    function getAlpacaOnlineRoster(...args) { return legacyLiveRoomRenderer.getAlpacaOnlineRoster(...args); }

    function getOpenLiveRoomsByGame(...args) { return legacyLiveRoomRenderer.getOpenLiveRoomsByGame(...args); }

    function getOpenRoomsForGame(...args) { return legacyLiveRoomRenderer.getOpenRoomsForGame(...args); }

    function normalizeLiveGameType(gameType) {
      return legacyLiveRoomController.normalizeLiveGameType(gameType);
    }

    function getCurrentLiveGameType() {
      return legacyLiveRoomController.getCurrentLiveGameType();
    }

    function getLiveGameLabel(gameType = getCurrentLiveGameType()) {
      return legacyLiveRoomController.getLiveGameLabel(gameType);
    }

    function getLivePlayablePlayers(players = state.live.players) {
      return legacyLiveRoomController.getLivePlayablePlayers(players);
    }

    function getArcadeState(gameType = getCurrentLiveGameType()) {
      return legacyLiveRoomController.getArcadeState(gameType);
    }

    function createEmptyArcadeState(gameType) {
      return legacyLiveRoomController.createEmptyArcadeState(gameType);
    }

    function chooseOnlineGameType(gameType) {
      return legacyLiveRoomController.chooseOnlineGameType(gameType);
    }

    function renderStepPanel(index, title, helper, content, gridClass) {
      return routeBuilderViewController.renderStepPanel(index, title, helper, content, gridClass);
    }

    function getCurrentWizardStepNumber() {
      return routeBuilderViewController.getCurrentWizardStepNumber();
    }

    function getWizardStepDefinition(stepNumber) {
      return routeBuilderViewController.getWizardStepDefinition(stepNumber);
    }

    function renderWizardRail(currentStep) {
      return routeBuilderViewController.renderWizardRail(currentStep);
    }

    function renderWizardRailItem(item, currentStep) {
      return routeBuilderViewController.renderWizardRailItem(item, currentStep);
    }

    function getWizardRailItems() {
      return routeBuilderViewController.getWizardRailItems();
    }

    function getWizardCompletionDepth() {
      return routeBuilderViewController.getWizardCompletionDepth();
    }

    function renderPathCards() {
      return routeBuilderViewController.renderPathCards();
    }

    function renderLensCards() {
      return routeBuilderViewController.renderLensCards();
    }

    function renderTargetCards() {
      return routeBuilderViewController.renderTargetCards();
    }

    function renderModeCards() {
      return routeBuilderViewController.renderModeCards();
    }

    function renderModeChoiceBoard() {
      return routeBuilderViewController.renderModeChoiceBoard();
    }

    function renderModeChoiceColumn(pathId, title, asset, options) {
      return routeBuilderViewController.renderModeChoiceColumn(pathId, title, asset, options);
    }

    function renderModeChoiceCard(option, pathId) {
      return routeBuilderViewController.renderModeChoiceCard(option, pathId);
    }

    function getWizardRenderContext() {
      return routeBuilderViewController.getWizardRenderContext();
    }

    function getWizardRenderHelpers() {
      return routeBuilderViewController.getWizardRenderHelpers();
    }

    function getAppModeSwitchIcon() {
      return routeBuilderOptionsService.getAppModeSwitchIcon();
    }

    function getVisibleModeOptions() {
      return routeBuilderOptionsService.getVisibleModeOptions();
    }

    function getVisibleModeOptionsForPath(pathId) {
      return routeBuilderOptionsService.getVisibleModeOptionsForPath(pathId);
    }

    function getModeUnavailableReason(modeId) {
      return routeBuilderOptionsService.getModeUnavailableReason(modeId);
    }

    function isModeUnavailable(modeId) {
      return routeBuilderOptionsService.isModeUnavailable(modeId);
    }

    function getDecoratedModeOption(option) {
      return routeBuilderOptionsService.getDecoratedModeOption(option);
    }

    function getModePath(modeId) {
      return routeBuilderOptionsService.getModePath(modeId);
    }

    function usesGranularLearnSubjects() {
      return routeBuilderOptionsService.usesGranularLearnSubjects();
    }

    function getTargetOptions() {
      return routeBuilderOptionsService.getTargetOptions();
    }

    function resetCurrentRouteAttempts() {
      gameLaunchController.resetCurrentRouteAttempts();
    }

    function launchExperience() {
      return routeOrchestrationController.launchExperience();
    }

    function closeCurrentExperience() {
      return routeOrchestrationController.closeCurrentExperience();
    }

    function renderExperience() {
      return routeOrchestrationController.renderExperience();
    }

    function renderExperiencePreservingScroll() {
      return routeOrchestrationController.renderExperiencePreservingScroll();
    }

    function renderPreservingScroll(renderCallback) {
      return routeOrchestrationController.renderPreservingScroll(renderCallback);
    }

    function renderLiveSurfaces() {
      return routeOrchestrationController.renderLiveSurfaces();
    }

    function buildAlpacardExperience() {
      return alpacardsController.buildExperience();
    }

    function getAlpacardsForSelection() {
      return alpacardsController.getCardsForSelection();
    }

    function renderAlpacardExperience() {
      return alpacardsController.renderExperience();
    }

    function renderAlpacardFront(card) {
      return alpacardsController.renderFront(card);
    }

    function renderAlpacardBack(card) {
      return alpacardsController.renderBack(card);
    }

    function getAlpacardConnectionChips(card) {
      return alpacardsController.getConnectionChips(card);
    }

    function navigateAlpacard(direction) {
      return alpacardsController.navigate(direction);
    }

    function setAlpacardIndex(index) {
      return alpacardsController.setIndex(index);
    }

    function flipAlpacard() {
      return alpacardsController.flip();
    }

    function syncAlpacardCarouselState(options = {}) {
      return alpacardsController.syncCarouselState(options);
    }

    function shuffleAlpacard() {
      return alpacardsController.shuffleDeck();
    }

    function syncRadialMindMapScroll() {
      return mindMapOrbitController.syncRadialMindMapScroll();
    }

    function stopMindMapOrbitAnimation() {
      return mindMapOrbitController.stopMindMapOrbitAnimation();
    }

    function syncMindMapOrbitAnimation() {
      return mindMapOrbitController.syncMindMapOrbitAnimation();
    }

    function navigateMindMapGallery(direction) {
      return mindMapOrbitController.navigateMindMapGallery(direction);
    }

    function handleMindMapGalleryWheel(...args) { return appEventRouter.handleMindMapGalleryWheel(...args); }

    function replaceMarkup(target, markup) {
      return appDomService.replaceWithMarkup(target, markup, document);
    }

    function keepRouteBuilderInView() {
      return routeOrchestrationController.keepRouteBuilderInView();
    }

    function hasActiveQuestionPopup() {
      return appShellController.hasActiveQuestionPopup();
    }

    function syncPopupScrollLock() {
      return appShellController.syncPopupScrollLock();
    }

    function hasSupabaseConfig() {
      return authController.hasSupabaseConfig();
    }

    function isSignedIn() {
      return authController.isSignedIn();
    }

    function hasAuthSession() {
      return authController.hasAuthSession();
    }

    function isAnonymousUser(user) {
      return authController.isAnonymousUser(user);
    }

    function getCurrentUserEmail() {
      return authController.getCurrentUserEmail();
    }

    function canAccessLegacyLiveRooms() {
      return legacyLiveRoomController.canAccessLegacyLiveRooms();
    }

    function getLegacyLiveRoomsDisabledMessage() {
      return legacyLiveRoomController.getLegacyLiveRoomsDisabledMessage();
    }

    function canAccessMultiplayer() {
      return legacyLiveRoomController.canAccessMultiplayer();
    }

    function canDismissAuthModal() {
      return authController.canDismissAuthModal();
    }

    function syncAuthChrome() {
      return appShellController.syncAuthChrome();
    }

    function clearAuthNotice() {
      authController.clearNotice();
    }

    function normalizeAlpacaName(value) {
      return authController.normalizeAlpacaName(value);
    }

    function getCurrentRedirectUrl() {
      return authController.getCurrentRedirectUrl();
    }

    function getSupabaseClient() {
      return authController.getSupabaseClient();
    }

    function setupSupabaseAuth() {
      authController.setupSupabaseAuth();
    }

    async function loadAlpacaProfile() {
      await authController.loadProfile();
    }

    async function loadAlpacaProgress() {
      await authController.loadProgress();
    }

    async function submitAuthForm(form) {
      await authController.submitForm(form);
    }

    async function createAlpaccount(formData, client) {
      await authController.createAccount(formData, client);
    }

    async function resolveLoginIdentifier(identifier, client) {
      return authController.resolveLoginIdentifier(identifier, client);
    }

    async function connectToAlpaccount(formData, client) {
      await authController.connect(formData, client);
    }

    async function sendPasswordReset(formData, client) {
      await authController.sendPasswordReset(formData, client);
    }

    async function updateRecoveredPassword(formData, client) {
      await authController.updateRecoveredPassword(formData, client);
    }

    async function signOutOfAlpaccount() {
      await authController.signOut();
    }

    async function ensureLiveAuthSession() {
      return legacyLiveRoomController.ensureLiveAuthSession();
    }

    function getLiveDisplayName() {
      return legacyLiveRoomController.getLiveDisplayName();
    }

    function renderAuthModal() {
      return appShellController.renderAuthModal();
    }

    function renderAuthGate() {
      return appShellRenderer.renderAuthGate();
    }

    function renderAuthIntro(mode, signedIn) {
      return appShellRenderer.renderAuthIntro(mode, signedIn);
    }

    function renderAuthNotice() {
      return appShellRenderer.renderAuthNotice();
    }

    function renderAuthBody(mode, busy) {
      return appShellRenderer.renderAuthBody(mode, busy);
    }

    function renderConnectedAlpaccount(busy) {
      return appShellRenderer.renderConnectedAlpaccount(busy);
    }

    function renderLoginForm(busy) {
      return appShellRenderer.renderLoginForm(busy);
    }

    function renderSignupForm(busy) {
      return appShellRenderer.renderSignupForm(busy);
    }

    function renderForgotPasswordForm(busy) {
      return appShellRenderer.renderForgotPasswordForm(busy);
    }

    function renderResetPasswordForm(busy) {
      return appShellRenderer.renderResetPasswordForm(busy);
    }

    function getAuthRenderContext() {
      return appShellRenderer.getAuthRenderContext();
    }

    function renderResourcesModal() {
      return appShellController.renderResourcesModal();
    }

    function renderCooperationModal() {
      return appShellController.renderCooperationModal();
    }

    function buildSlideshowExperience() {
      return learnSlideshowController.buildExperience();
    }

    function buildMindMapExperience() {
      return mindMapController.buildExperience();
    }

    function buildRawContentExperience() {
      return experienceFactoryController.buildRawContentExperience();
    }

    function buildUnavailableModeExperience(modeId) {
      return experienceFactoryController.buildUnavailableModeExperience(modeId);
    }

    function renderUnavailableModeExperience() {
      return experienceFactoryController.renderUnavailableModeExperience(state.experience || {});
    }

    function buildAlpacaChannelExperience() {
      return alpacaChannelController.buildExperience();
    }

    function getApprovedRawContentSection(...args) {
      return rawContentController.getApprovedRawContentSection(...args);
    }

    function getBroadSubjectIdsFromLabels(labels = []) {
      return gameQuestionPlanningController.getBroadSubjectIdsFromLabels(labels);
    }

    function getBigIdeaIdsFromLabels(labels = []) {
      return gameQuestionPlanningController.getBigIdeaIdsFromLabels(labels);
    }

    function renderQuestionSubjectPills(question) {
      return gameQuestionPlanningController.renderQuestionSubjectPills(question);
    }

    function getQuestionVisibleWrongExplanationByAnswer(question, answerText) {
      return gameQuestionPlanningController.getQuestionVisibleWrongExplanationByAnswer(question, answerText);
    }

    function buildGameQuestionOptions(rawQuestion) {
      return gameQuestionPlanningController.buildGameQuestionOptions(rawQuestion);
    }

    function createRawGameQuestion(entry, rawQuestion, entryIndex, questionIndex) {
      return gameQuestionPlanningController.createRawGameQuestion(entry, rawQuestion, entryIndex, questionIndex);
    }

    function createGuideGameQuestion(section, guideQuestion, questionIndex) {
      return gameQuestionPlanningController.createGuideGameQuestion(section, guideQuestion, questionIndex);
    }

    function createFullVoyageGameQuestion(rawQuestion) {
      return gameQuestionPlanningController.createFullVoyageGameQuestion(rawQuestion);
    }

    function getSectionIdsForEntries(entries) {
      return gameQuestionPlanningController.getSectionIdsForEntries(entries);
    }

    function getGuideQuestionsForEntries(entries) {
      return gameQuestionPlanningController.getGuideQuestionsForEntries(entries);
    }

    function getFullVoyageQuestionsForEntries(entries) {
      return gameQuestionPlanningController.getFullVoyageQuestionsForEntries(entries);
    }

    function buildRawQuestionPoolsFromEntries(entries) {
      return gameQuestionPlanningController.buildRawQuestionPoolsFromEntries(entries);
    }

    function buildRawQuestionPoolsForSelection() {
      return gameQuestionPlanningController.buildRawQuestionPoolsForSelection();
    }

    function hasRequiredRawLevels(pools, levels = [1, 2, 3, 4, 5]) {
      return gameQuestionPlanningController.hasRequiredRawLevels(pools, levels);
    }

    function buildPatternQuestionSequence(pattern, pools, allowReuse = true) {
      return gameQuestionPlanningController.buildPatternQuestionSequence(pattern, pools, allowReuse);
    }

    function getUnavailableRawGameReason() {
      return gameQuestionPlanningController.getUnavailableRawGameReason();
    }

    function buildAlpacaRunQuestionPlan(entries = null) {
      return gameQuestionPlanningController.buildAlpacaRunQuestionPlan(entries);
    }

    function buildRelayQuestionSequence(questionCount, entries = null) {
      return gameQuestionPlanningController.buildRelayQuestionSequence(questionCount, entries);
    }

    function buildJumpQuestionPlan(entries = null) {
      return gameQuestionPlanningController.buildJumpQuestionPlan(entries);
    }

    function buildRaceLevelQueues(entries = null) {
      return gameQuestionPlanningController.buildRaceLevelQueues(entries);
    }

    function getRaceActiveLevelState(experience) {
      return gameQuestionPlanningController.getRaceActiveLevelState(experience);
    }

    function getCurrentRaceQuestion(experience) {
      return gameQuestionPlanningController.getCurrentRaceQuestion(experience);
    }

    function queueNextRaceQuestion(experience) {
      return gameQuestionPlanningController.queueNextRaceQuestion(experience);
    }

    function buildRaceExperience() {
      return experienceFactoryController.buildRaceExperience();
    }

    function buildJeopardyExperience() {
      return alpacapardyBoardController.buildJeopardyExperience();
    }

    function buildRunExperience() {
      return experienceFactoryController.buildRunExperience();
    }

    function createJumpObstacle(cursor = 0) {
      return arcadeJumpHelpers.createJumpObstacle(cursor);
    }

    function createJumpCheckpointObstacle() {
      return arcadeJumpHelpers.createJumpCheckpointObstacle();
    }

    function buildJumpExperience() {
      return experienceFactoryController.buildJumpExperience();
    }

    function buildRelayExperience() {
      return experienceFactoryController.buildRelayExperience();
    }

    function buildBuildCaseExperience() {
      return buildCaseController.buildExperience();
    }

    function closeTrainTip() {
      return trainPracticeController.closeTip();
    }

    function renderTrainTipSummary(modeId) {
      return trainPracticeController.renderTipSummary(modeId);
    }

    function renderTrainTipPopup(modeId) {
      return trainPracticeController.renderTipPopup(modeId);
    }

    function buildWritingPromptPool() {
      return trainPracticeController.buildWritingPromptPool();
    }

    function buildWritingExperience() {
      return trainPracticeController.buildWritingExperience();
    }

    function getCurrentWritingPrompt(experience = state.experience) {
      return trainPracticeController.getCurrentWritingPrompt(experience);
    }

    function nextWritingPrompt(...args) {
      return studyGameController.nextWritingPrompt(...args);
    }

    function setWritingPhase(...args) {
      return studyGameController.setWritingPhase(...args);
    }

    function buildBowlExperience() {
      return trainPracticeController.buildBowlExperience();
    }

    function buildScholarsBowlQuestions() {
      return trainPracticeController.buildScholarsBowlQuestions();
    }

    function getBowlRoundType(index) {
      return trainPracticeController.getBowlRoundType(index);
    }

    function getCurrentBowlQuestion(experience = state.experience) {
      return trainPracticeController.getCurrentBowlQuestion(experience);
    }

    function startBowlPractice(...args) {
      return studyGameController.startBowlPractice(...args);
    }

    function answerBowlQuestion(...args) {
      return studyGameController.answerBowlQuestion(...args);
    }

    function advanceBowlQuestion(...args) {
      return studyGameController.advanceBowlQuestion(...args);
    }

    function resetBowlPractice(...args) {
      return studyGameController.resetBowlPractice(...args);
    }

    function renderAlpacaChannelExperience() {
      return alpacaChannelController.renderExperience();
    }

    function renderSlideshowExperience() {
      return learnSlideshowController.renderExperience();
    }

    function renderSlideSecondaryContext(slide) {
      return learnSlideshowController.renderSecondaryContext(slide);
    }

    function getSlideSecondaryContext(slide) {
      return learnSlideshowController.getSecondaryContext(slide);
    }

    function getPrimaryOfficialSubjectLabel() {
      return learnSlideshowController.getPrimaryOfficialSubjectLabel();
    }

    function inferRelatedSubjectLabel(atom, knowledge) {
      return learnSlideshowController.inferRelatedSubjectLabel(atom, knowledge);
    }

    function getBroadSubjectAssetPath(label) {
      return learnSlideshowController.getBroadSubjectAssetPath(label);
    }

    function navigateSlide(direction) {
      return learnSlideshowController.navigate(direction);
    }

    function navigateAlpacaChannel(direction) {
      return alpacaChannelController.navigate(direction);
    }

    function getAlpacaChannelVideosForEntry(entry) {
      return alpacaChannelController.getVideosForEntry(entry);
    }

    function getAlpacaChannelVideosForSection(sectionId) {
      return alpacaChannelController.getVideosForSection(sectionId);
    }

    function createStandaloneAlpacaChannelVideo(video, fallbackSectionId = null) {
      return alpacaChannelController.createStandaloneVideo(video, fallbackSectionId);
    }

    function normalizeVideoUrl(url) {
      return alpacaChannelController.normalizeVideoUrl(url);
    }

    function getAlpacaChannelDomain(label) {
      return alpacaChannelController.getDomain(label);
    }

    function buildLearnDeck() {
      return learnSlideshowController.buildLearnDeck();
    }

    function renderMindMapExperience() {
      return mindMapController.renderExperience();
    }

    function renderRadialMindMap(layout) {
      return mindMapController.renderRadialMindMap(layout);
    }

    function buildRadialMindMapLayout(map) {
      return mindMapController.buildRadialMindMapLayout(map);
    }

    function getMindMapRingPlan(entryCount) {
      return mindMapController.getMindMapRingPlan(entryCount);
    }

    function getMindMapRingIndexForEntry(entryIndex, ringPlan) {
      return mindMapController.getMindMapRingIndexForEntry(entryIndex, ringPlan);
    }

    function getRadialMindMapEntries(diagram) {
      return mindMapController.getRadialMindMapEntries(diagram);
    }

    function formatMindMapEntryMeta(labels, fallback = "") {
      return mindMapController.formatMindMapEntryMeta(labels, fallback);
    }

    function getMindMapCurvePath(startX, startY, endX, endY, seed = 0) {
      return mindMapController.getMindMapCurvePath(startX, startY, endX, endY, seed);
    }

    function renderMindMapEntryPopup() {
      return mindMapController.renderEntryPopup();
    }

    function buildRegularGuideExperience() {
      return regularGuideController.buildExperience();
    }

    function getRegularGuideForSection(section) {
      return regularGuideController.getGuideForSection(section);
    }

    function getRegularGuidesForSelection() {
      return regularGuideController.getGuidesForSelection();
    }

    function renderRegularGuideExperience() {
      return regularGuideController.renderExperience();
    }

    function renderRegularGuideDocument(guide) {
      return regularGuideController.renderDocument(guide);
    }

    function renderRegularGuideQuestionBlock(section) {
      return regularGuideController.renderQuestionBlock(section);
    }

    function renderRegularGuideNavigation(section) {
      return regularGuideController.renderNavigation(section);
    }

    function renderGuideSectionChannelButton(sectionId) {
      return regularGuideController.renderSectionChannelButton(sectionId);
    }

    function getRegularGuideRenderContext() {
      return regularGuideController.getRenderContext();
    }

    function getRegularGuideRenderHelpers() {
      return regularGuideController.getRenderHelpers();
    }

    function getRawVisibleQuizQuestionItems(...args) {
      return rawContentController.getRawVisibleQuizQuestionItems(...args);
    }

    function getSectionGuideQuestions(section) {
      return regularGuideController.getSectionGuideQuestions(section);
    }

    function renderSectionTransferTable(...args) {
      return rawContentController.renderSectionTransferTable(...args);
    }

    function getVisibleWrongExplanation(...args) {
      return rawContentController.getVisibleWrongExplanation(...args);
    }

    function getVisibleQuizFeedbackParts(...args) {
      return rawContentController.getVisibleQuizFeedbackParts(...args);
    }

    function renderRawQuizFeedback(...args) {
      return rawContentController.renderRawQuizFeedback(...args);
    }

    function renderGuideQuizQuestion(question, section, questionIndex) {
      return regularGuideController.renderGuideQuizQuestion(question, section, questionIndex);
    }

    function renderRawContentExperience(...args) {
      return rawContentController.renderRawContentExperience(...args);
    }

    function renderRawContentEntryGroups(...args) {
      return rawContentController.renderRawContentEntryGroups(...args);
    }

    function renderRawContentEntryCard(...args) {
      return rawContentController.renderRawContentEntryCard(...args);
    }

    function getRawContentScopeLabel(...args) {
      return rawContentController.getRawContentScopeLabel(...args);
    }

    function getRawContentPayload(...args) {
      return rawContentController.getRawContentPayload(...args);
    }

    function getRawEntriesForSelection(...args) {
      return rawContentController.getRawEntriesForSelection(...args);
    }

    function getRawEntriesForRunSetupCategoryIds(...args) {
      return rawContentController.getRawEntriesForRunSetupCategoryIds(...args);
    }

    function getRawEntryMasteryKey(...args) {
      return rawContentController.getRawEntryMasteryKey(...args);
    }

    function isRawEntryMastered(...args) {
      return rawContentController.isRawEntryMastered(...args);
    }

    function getRawMasteryHelpers(...args) {
      return rawContentController.getRawMasteryHelpers(...args);
    }

    function renderRawMasteryToggle(...args) {
      return rawContentController.renderRawMasteryToggle(...args);
    }

    function renderRawEntryQuickActions(...args) {
      return rawContentController.renderRawEntryQuickActions(...args);
    }

    function renderRawBackToTopButton(...args) {
      return rawContentController.renderRawBackToTopButton(...args);
    }

    function renderRawEntryChannelLinks(...args) {
      return rawContentController.renderRawEntryChannelLinks(...args);
    }

    function toggleRawMastery(...args) {
      return rawContentController.toggleRawMastery(...args);
    }

    function getAllRawEntries(...args) {
      return rawContentController.getAllRawEntries(...args);
    }

    function getTotalRawMasterableEntries(...args) {
      return rawContentController.getTotalRawMasterableEntries(...args);
    }

    function getMasteredRawEntryCount(...args) {
      return rawContentController.getMasteredRawEntryCount(...args);
    }

    function findLearnSubjectRouteIdByLabel(...args) {
      return rawContentController.findLearnSubjectRouteIdByLabel(...args);
    }

    function findBigIdeaRouteIdByLabel(...args) {
      return rawContentController.findBigIdeaRouteIdByLabel(...args);
    }

    function getRawConnectionGroups(...args) {
      return rawContentController.getRawConnectionGroups(...args);
    }

    function renderRawConnectionGroups(...args) {
      return rawContentController.renderRawConnectionGroups(...args);
    }

    function buildMindMap(sectionId = null, providedEntries = null, entryOffset = 0) {
      return mindMapController.buildMindMap(sectionId, providedEntries, entryOffset);
    }

    function getMindMapEntryKey(entry, index) {
      return mindMapController.getMindMapEntryKey(entry, index);
    }

    function buildMindMapDiagram(lensId, entries) {
      return mindMapController.buildMindMapDiagram(lensId, entries);
    }

    function getMindMapTargetsForLens(entry, lensId) {
      return mindMapController.getMindMapTargetsForLens(entry, lensId);
    }

    function getOrderedMindMapGroups(lensId, groups) {
      return mindMapController.getOrderedMindMapGroups(lensId, groups);
    }

    function getMindMapEntryMeta(entry, lensId) {
      return mindMapController.getMindMapEntryMeta(entry, lensId);
    }

    function getMindMapLensLabel(lensId) {
      return mindMapController.getMindMapLensLabel(lensId);
    }

    function getActiveMindMapEntryBundle() {
      return mindMapController.getActiveEntryBundle();
    }

    function openMindMapEntry(entryKey) {
      return mindMapController.openEntry(entryKey);
    }

    function closeMindMapEntry() {
      return mindMapController.closeEntry();
    }

    function openMindMapGuide(sectionId) {
      return mindMapController.openGuide(sectionId);
    }

    function closeMindMapGuide() {
      return mindMapController.closeGuide();
    }

    function renderMindMapGuidePopup() {
      return mindMapController.renderGuidePopup();
    }

    function getMindMapRenderHelpers() {
      return mindMapController.getRenderHelpers();
    }

    function showNextDebateTopic() {
      return buildCaseController.showNextTopic();
    }

    function startDebateConversation() {
      return buildCaseController.startConversation();
    }

    function toggleDebateSideSpin() {
      return buildCaseController.toggleSideSpin();
    }

    function returnToDebateTopic() {
      return buildCaseController.returnToTopic();
    }

    function resetDebateSpinForCurrentTopic() {
      return buildCaseController.resetSpinForCurrentTopic();
    }

    function toggleDebateSuggestion(itemId) {
      return buildCaseController.toggleSuggestion(itemId);
    }

    function submitDebateRound() {
      return buildCaseController.submitRound();
    }

    function advanceDebateRound() {
      return buildCaseController.advanceRound();
    }

    function shortenTrainText(value, maxLength = 260) {
      return trainPracticeController.shortenText(value, maxLength);
    }

    function renderWritingPhaseButton(phase, activePhaseId) {
      return trainPracticeController.renderWritingPhaseButton(phase, activePhaseId);
    }

    function renderWritingExperience() {
      return trainPracticeController.renderWritingExperience();
    }

    function renderBowlOption(question, option, index, experience) {
      return trainPracticeController.renderBowlOption(question, option, index, experience);
    }

    function renderBowlFlowBar() {
      return trainPracticeController.renderBowlFlowBar();
    }

    function renderBowlSetup(experience) {
      return trainPracticeController.renderBowlSetup(experience);
    }

    function renderBowlStimulusCard(question, roundType) {
      return trainPracticeController.renderBowlStimulusCard(question, roundType);
    }

    function renderBowlTargetCard(target) {
      return trainPracticeController.renderBowlTargetCard(target);
    }

    function renderBowlProductionLedger(question) {
      return trainPracticeController.renderBowlProductionLedger(question);
    }

    function renderBowlReveal(question, experience) {
      return trainPracticeController.renderBowlReveal(question, experience);
    }

    function renderBowlExperience() {
      return trainPracticeController.renderBowlExperience();
    }

    function renderBuildCaseExperience() {
      return buildCaseController.renderExperience();
    }

    function startBuildCaseRoute() {
      return buildCaseController.startRoute();
    }

    function chooseBuildCaseCamp(camp) {
      return buildCaseController.chooseCamp(camp);
    }

    function toggleBuildCaseSupport(index) {
      return buildCaseController.toggleSupport(index);
    }

    function confirmBuildCaseSupports() {
      return buildCaseController.confirmSupports();
    }

    function chooseBuildCaseRebuttal(index) {
      return buildCaseController.chooseRebuttal(index);
    }

    function advanceBuildCaseRound() {
      return buildCaseController.advanceLegacyRound();
    }

    function buildQuizExperience() {
      return experienceFactoryController.buildQuizExperience();
    }

    function getDefaultQuizSectionIds() {
      return gameQuestionPlanningController.getDefaultQuizSectionIds();
    }

    function getQuizQuestionPattern(questionCount, selectedDifficulties = [1, 2, 3, 4, 5]) {
      return alpaquizEngine.getQuestionPattern(questionCount, selectedDifficulties);
    }

    function normalizeQuizDifficultySelection(selectedDifficulties = []) {
      return alpaquizEngine.normalizeDifficultySelection(selectedDifficulties);
    }

    function getRawEntriesForQuizSectionIds(sectionIds) {
      return gameQuestionPlanningController.getRawEntriesForQuizSectionIds(sectionIds);
    }

    function buildQuizQuestionPlan(sectionIds, questionCount, selectedDifficulties = [1, 2, 3, 4, 5]) {
      return gameQuestionPlanningController.buildQuizQuestionPlan(sectionIds, questionCount, selectedDifficulties);
    }

    function renderQuizExperience() {
      return alpaquizRenderController.renderQuizExperience();
    }

    function renderQuizSetup(experience) {
      return alpaquizRenderController.renderQuizSetup(experience);
    }

    function renderQuizQuestionPage(experience) {
      return alpaquizRenderController.renderQuizQuestionPage(experience);
    }

    function getQuizRemainingNotice(experience) {
      return alpaquizEngine.getRemainingNotice(experience);
    }

    function getQuizDifficultyResults(experience) {
      return alpaquizEngine.getDifficultyResults(experience);
    }

    function renderQuizResultsFooter(experience) {
      return alpaquizRenderController.renderQuizResultsFooter(experience);
    }

    function renderQuizQuestionCard(question, questionIndex, experience) {
      return alpaquizRenderController.renderQuizQuestionCard(question, questionIndex, experience);
    }

    function renderQuizQuestionFeedback(question, selectedIndex, isCorrect) {
      return alpaquizRenderController.renderQuizQuestionFeedback(question, selectedIndex, isCorrect);
    }

    function toggleQuizSection(...args) {
      return studyGameController.toggleQuizSection(...args);
    }

    function selectAllQuizSections(...args) {
      return studyGameController.selectAllQuizSections(...args);
    }

    function toggleQuizDifficulty(...args) {
      return studyGameController.toggleQuizDifficulty(...args);
    }

    function setQuizQuestionCount(...args) {
      return studyGameController.setQuizQuestionCount(...args);
    }

    function startQuizRoute(...args) {
      return studyGameController.startQuizRoute(...args);
    }

    function answerQuizQuestion(...args) {
      return studyGameController.answerQuizQuestion(...args);
    }

    function submitQuizRoute(...args) {
      return studyGameController.submitQuizRoute(...args);
    }

    function resetQuizRoute(...args) {
      return studyGameController.resetQuizRoute(...args);
    }

    function renderRaceExperience() {
      return arcadeRenderController.renderRaceExperience();
    }

    function renderRaceTargetSelector(...args) {
      return arcadeRenderController.renderRaceTargetSelector(...args);
    }

    function renderTargetSetupSelector(...args) {
      return arcadeRenderController.renderTargetSetupSelector(...args);
    }

    function renderRaceQuestionPills(...args) {
      return arcadeRenderController.renderRaceQuestionPills(...args);
    }

    function startRaceRoute(...args) {
      return arcadeGameController.startRaceRoute(...args);
    }

    function getRaceAvailableQuestionCount(...args) {
      return arcadeGameController.getRaceAvailableQuestionCount(...args);
    }

    function toggleRaceSetupCategory(...args) {
      return arcadeGameController.toggleRaceSetupCategory(...args);
    }

    function answerRaceQuestion(...args) {
      return arcadeGameController.answerRaceQuestion(...args);
    }

    function resolveRaceQuestion(...args) {
      return arcadeGameController.resolveRaceQuestion(...args);
    }

    function advanceRace(...args) {
      return arcadeGameController.advanceRace(...args);
    }

    function renderJeopardyExperience() {
      return alpacapardyBoardController.renderJeopardyExperience();
    }

    function renderJeopardyFocus(experience) {
      return alpacapardyBoardController.renderJeopardyFocus(experience);
    }

    function renderJeopardySetup(experience) {
      return alpacapardyBoardController.renderJeopardySetup(experience);
    }

    function getAlpacapardyRenderHelpers() {
      return alpacapardyBoardController.getAlpacapardyRenderHelpers();
    }

    function getAlpacapardyLiveRenderContext() {
      return legacyLiveRoomController.getAlpacapardyLiveRenderContext();
    }

    function isAlpacapardyLiveActive() {
      return legacyLiveRoomController.isAlpacapardyLiveActive();
    }

    function guardMultiplayerAccess() {
      return legacyLiveRoomController.guardMultiplayerAccess();
    }

    function canOpenAlpacapardyLiveTile() {
      return legacyLiveRoomController.canOpenAlpacapardyLiveTile();
    }

    function canAnswerAlpacapardyLiveFocus() {
      return legacyLiveRoomController.canAnswerAlpacapardyLiveFocus();
    }

    function canCloseAlpacapardyLiveFocus() {
      return legacyLiveRoomController.canCloseAlpacapardyLiveFocus();
    }

    function getAlpacapardyLiveIdentityContext() {
      return legacyLiveRoomController.getAlpacapardyLiveIdentityContext();
    }

    async function refreshAlpacapardyLiveLobby(...args) {
      return legacyLiveRoomController.refreshAlpacapardyLiveLobby(...args);
    }

    function subscribeAlpacapardyLobby(...args) {
      return legacyLiveRoomController.subscribeAlpacapardyLobby(...args);
    }

    async function refreshAlpacapardyLiveLobbySilently(...args) {
      return legacyLiveRoomController.refreshAlpacapardyLiveLobbySilently(...args);
    }

    function startAlpacapardyLiveSync(...args) {
      return legacyLiveRoomController.startAlpacapardyLiveSync(...args);
    }

    async function syncAlpacapardyLiveNow(...args) {
      return legacyLiveRoomController.syncAlpacapardyLiveNow(...args);
    }

    async function maybeAutoRevealTimedLiveGame(...args) {
      return legacyLiveRoomController.maybeAutoRevealTimedLiveGame(...args);
    }

    async function maybeAutoResolveTimedAlpaquiz(...args) {
      return legacyLiveRoomController.maybeAutoResolveTimedAlpaquiz(...args);
    }

    async function refreshAlpacapardyLiveSessionState(...args) {
      return legacyLiveRoomController.refreshAlpacapardyLiveSessionState(...args);
    }

    async function createSelectedLiveGameRoom(...args) {
      return legacyLiveRoomController.createSelectedLiveGameRoom(...args);
    }

    async function createArcadeLiveRoom(...args) {
      return legacyLiveRoomController.createArcadeLiveRoom(...args);
    }

    async function createAlpacapardyLiveRoom(...args) {
      return legacyLiveRoomController.createAlpacapardyLiveRoom(...args);
    }

    async function joinAlpacapardyLiveRoom(...args) {
      return legacyLiveRoomController.joinAlpacapardyLiveRoom(...args);
    }

    async function joinAlpacapardyLiveRoomByCode(...args) {
      return legacyLiveRoomController.joinAlpacapardyLiveRoomByCode(...args);
    }

    function buildAlpacapardyLiveSettings(...args) {
      return legacyLiveRoomController.buildAlpacapardyLiveSettings(...args);
    }

    function applyAlpacapardyLiveSettings(...args) {
      return legacyLiveRoomController.applyAlpacapardyLiveSettings(...args);
    }

    async function syncAlpacapardyLiveSettings(...args) {
      return legacyLiveRoomController.syncAlpacapardyLiveSettings(...args);
    }

    function subscribeAlpacapardySession(...args) {
      return legacyLiveRoomController.subscribeAlpacapardySession(...args);
    }

    async function refreshAlpacapardyLivePlayers(...args) {
      return legacyLiveRoomController.refreshAlpacapardyLivePlayers(...args);
    }

    function startAlpacapardyLiveHeartbeat(...args) {
      return legacyLiveRoomController.startAlpacapardyLiveHeartbeat(...args);
    }

    function maybeStartLiveLaunchCountdown(...args) {
      return legacyLiveRoomController.maybeStartLiveLaunchCountdown(...args);
    }

    function startLiveLaunchCountdown(...args) {
      return legacyLiveRoomController.startLiveLaunchCountdown(...args);
    }

    function maybeAutoStartReadyLiveGame(...args) {
      return legacyLiveRoomController.maybeAutoStartReadyLiveGame(...args);
    }

    function compareLivePlayers(left, right) {
      return legacyLiveRoomController.compareLivePlayers(left, right);
    }

    async function syncAlpacapardyLiveEvents(...args) {
      return legacyLiveRoomController.syncAlpacapardyLiveEvents(...args);
    }

    function applyLiveEvent(...args) {
      return legacyLiveRoomController.applyLiveEvent(...args);
    }

    function applyAlpacapardyLiveEvent(...args) {
      return legacyLiveRoomController.applyAlpacapardyLiveEvent(...args);
    }

    function extractAlpacapardyLiveState(...args) {
      return legacyLiveRoomController.extractAlpacapardyLiveState(...args);
    }

    function mergeAlpacapardyLiveState(...args) {
      return legacyLiveRoomController.mergeAlpacapardyLiveState(...args);
    }

    async function emitAlpacapardyLiveEvent(...args) {
      return legacyLiveRoomController.emitAlpacapardyLiveEvent(...args);
    }

    async function emitLiveEvent(...args) {
      return legacyLiveRoomController.emitLiveEvent(...args);
    }

    function applyArcadeLiveEvent(...args) {
      return legacyLiveRoomController.applyArcadeLiveEvent(...args);
    }

    function reduceArcadeLiveState(...args) {
      return legacyLiveRoomController.reduceArcadeLiveState(...args);
    }

    function reduceLiveRunState(...args) {
      return legacyLiveRoomController.reduceLiveRunState(...args);
    }

    function reduceLiveQuizState(...args) {
      return legacyLiveRoomController.reduceLiveQuizState(...args);
    }

    function reduceLiveRaceState(...args) {
      return legacyLiveRoomController.reduceLiveRaceState(...args);
    }

    function reduceLiveAlpaquizState(...args) {
      return legacyLiveRoomController.reduceLiveAlpaquizState(...args);
    }

    function canStartSelectedLiveGame(...args) {
      return legacyLiveRoomController.canStartSelectedLiveGame(...args);
    }

    async function startSelectedLiveGame(...args) {
      return legacyLiveRoomController.startSelectedLiveGame(...args);
    }

    function getLiveRunColorAssignments(...args) {
      return legacyLiveRoomController.getLiveRunColorAssignments(...args);
    }

    function buildArcadeStartState(...args) {
      return legacyLiveRoomController.buildArcadeStartState(...args);
    }

    function buildAllThemeQuestionSequence(...args) {
      return legacyLiveRoomController.buildAllThemeQuestionSequence(...args);
    }

    async function selectLiveAlpacaColor(...args) {
      return legacyLiveRoomController.selectLiveAlpacaColor(...args);
    }

    async function answerSelectedLiveGame(...args) {
      return legacyLiveRoomController.answerSelectedLiveGame(...args);
    }

    async function advanceSelectedLiveGame(...args) {
      return legacyLiveRoomController.advanceSelectedLiveGame(...args);
    }

    async function buzzSelectedLiveGame(...args) {
      return legacyLiveRoomController.buzzSelectedLiveGame(...args);
    }

    function getArcadeLeaderboard(...args) {
      return legacyLiveRoomController.getArcadeLeaderboard(...args);
    }

    function clonePlain(...args) {
      return legacyLiveRoomController.clonePlain(...args);
    }

    async function startAlpacapardyLiveGame(...args) {
      return legacyLiveRoomController.startAlpacapardyLiveGame(...args);
    }

    async function sendAlpacapardyLiveChat(...args) {
      return legacyLiveRoomController.sendAlpacapardyLiveChat(...args);
    }

    async function leaveAlpacapardyLiveRoom(...args) {
      return legacyLiveRoomController.leaveAlpacapardyLiveRoom(...args);
    }

    function buildJeopardyBoard() {
      return alpacapardyBoardController.buildJeopardyBoard();
    }

    function getJeopardySetupOptions() {
      return alpacapardyBoardController.getJeopardySetupOptions();
    }

    function getDefaultJeopardySetupCategoryIds() {
      return alpacapardyBoardController.getDefaultJeopardySetupCategoryIds();
    }

    function getTargetSetupOptions() {
      return alpacapardyBoardController.getTargetSetupOptions();
    }

    function getDefaultTargetSetupCategoryIds() {
      return alpacapardyBoardController.getDefaultTargetSetupCategoryIds();
    }

    function getSetupTargetHeading() {
      return alpacapardyBoardController.getSetupTargetHeading();
    }

    function getSetupTargetHelper(selectedCount) {
      return alpacapardyBoardController.getSetupTargetHelper(selectedCount);
    }

    function toggleSetupCategorySelection(...args) {
      return arcadeGameController.toggleSetupCategorySelection(...args);
    }

    function toggleRunSetupCategory(...args) {
      return arcadeGameController.toggleRunSetupCategory(...args);
    }

    function startRunRoute(...args) {
      return arcadeGameController.startRunRoute(...args);
    }

    function setJeopardyTeamCount(count) {
      return alpacapardyController.setJeopardyTeamCount(count);
    }

    function toggleJeopardySetupCategory(categoryId) {
      return alpacapardyController.toggleJeopardySetupCategory(categoryId);
    }

    function startJeopardyGame() {
      return alpacapardyController.startJeopardyGame();
    }

    function buildConfiguredJeopardyBoard(categoryIds) {
      return alpacapardyBoardController.buildConfiguredJeopardyBoard(categoryIds);
    }

    function pickQuestionsForJeopardyCategory(pool, usedQuestionIds) {
      return alpacapardyBoardController.pickQuestionsForJeopardyCategory(pool, usedQuestionIds);
    }

    function getJeopardyGroupingStrategies(selectionQuestions) {
      return alpacapardyBoardController.getJeopardyGroupingStrategies(selectionQuestions);
    }

    function getJeopardySourceTypeDefinitions() {
      return alpacapardyBoardController.getJeopardySourceTypeDefinitions();
    }

    function createJeopardyTile(question, index) {
      return alpacapardyBoardController.createJeopardyTile(question, index);
    }

    function buildJeopardyBoardFromDefinitions(selectionQuestions, definitions, groupCount) {
      return alpacapardyBoardController.buildJeopardyBoardFromDefinitions(selectionQuestions, definitions, groupCount);
    }

    function buildFallbackJeopardyBoard(selectionQuestions) {
      return alpacapardyBoardController.buildFallbackJeopardyBoard(selectionQuestions);
    }

    function openJeopardyTile(groupIndex, tileIndex) {
      return alpacapardyController.openJeopardyTile(groupIndex, tileIndex);
    }

    function answerJeopardyQuestion(optionIndex) {
      return alpacapardyController.answerJeopardyQuestion(optionIndex);
    }

    function resolveJeopardyTimeout() {
      return alpacapardyController.resolveJeopardyTimeout();
    }

    function resolveJeopardyQuestion(optionIndex, timedOut) {
      return alpacapardyController.resolveJeopardyQuestion(optionIndex, timedOut);
    }

    function closeJeopardyFocus() {
      return alpacapardyController.closeJeopardyFocus();
    }

    function createJeopardyTeams(count = GAME_CONFIG.jeopardyDefaultTeams) {
      return alpacapardyBoardController.createJeopardyTeams(count);
    }

    function getJeopardyActiveTeam(experience) {
      return alpacapardyBoardController.getJeopardyActiveTeam(experience);
    }

    function getJeopardyStandings(teams) {
      return alpacapardyBoardController.getJeopardyStandings(teams);
    }

    function renderJeopardyTeams(experience) {
      return alpacapardyBoardController.renderJeopardyTeams(experience);
    }

    function renderJeopardyCategoryHeader(label) {
      return alpacapardyBoardController.renderJeopardyCategoryHeader(label);
    }

    function renderJeopardyTileFace(tile) {
      return alpacapardyBoardController.renderJeopardyTileFace(tile);
    }

    function startJeopardyTimer() {
      return alpacapardyController.startJeopardyTimer();
    }

    function chooseJeopardyTeam(teamIndex) {
      return alpacapardyController.chooseJeopardyTeam(teamIndex);
    }

    function addJeopardyTeam() {
      return alpacapardyController.addJeopardyTeam();
    }

    function removeJeopardyTeam() {
      return alpacapardyController.removeJeopardyTeam();
    }

    function advanceJeopardyTeam() {
      return alpacapardyController.advanceJeopardyTeam();
    }

    function renderJeopardyResults(experience) {
      return alpacapardyBoardController.renderJeopardyResults(experience);
    }

    function createRelayTeams(count = GAME_CONFIG.relayDefaultTeams) {
      return relayTeamService.createRelayTeams(count);
    }

    function syncRelayTeamBindings(experience) {
      return relayTeamService.syncRelayTeamBindings(experience);
    }

    function getRelayStandings(...args) {
      return alpaquizRenderController.getRelayStandings(...args);
    }

    function renderRelayExperience() {
      return alpaquizRenderController.renderRelayExperience();
    }

    function startRelayRoute(...args) {
      return arcadeGameController.startRelayRoute(...args);
    }

    function toggleRelaySetupCategory(...args) {
      return arcadeGameController.toggleRelaySetupCategory(...args);
    }

    function setRelayTeamCount(...args) {
      return arcadeGameController.setRelayTeamCount(...args);
    }

    function setRelayQuestionCount(...args) {
      return arcadeGameController.setRelayQuestionCount(...args);
    }

    function buzzRelayTeam(...args) {
      return arcadeGameController.buzzRelayTeam(...args);
    }

    function answerRelayQuestion(...args) {
      return arcadeGameController.answerRelayQuestion(...args);
    }

    function getRelayAwardRecipients(...args) {
      return arcadeGameController.getRelayAwardRecipients(...args);
    }

    function formatRelayAwardedTeams(...args) {
      return arcadeGameController.formatRelayAwardedTeams(...args);
    }

    function resolveRelayOutcome(...args) {
      return arcadeGameController.resolveRelayOutcome(...args);
    }

    function handleRelayTimeout(...args) {
      return arcadeGameController.handleRelayTimeout(...args);
    }

    function advanceRelayQuestion(...args) {
      return arcadeGameController.advanceRelayQuestion(...args);
    }

    function addRelayTeam(...args) {
      return arcadeGameController.addRelayTeam(...args);
    }

    function removeRelayTeam(...args) {
      return arcadeGameController.removeRelayTeam(...args);
    }

    function renderRelayResults(experience) {
      return alpaquizRenderController.renderRelayResults(experience);
    }

    function startRelayAnswerTimer() {
      return arcadeRuntimeTimerController.startRelayAnswerTimer();
    }

    function startRaceTimer() {
      return arcadeRuntimeTimerController.startRaceTimer();
    }

    function startRunTimer() {
      return arcadeRuntimeTimerController.startRunTimer();
    }

    function getRunCurrentStop(...args) {
      return arcadeRenderController.getRunCurrentStop(...args);
    }

    function getRunNextStop(...args) {
      return arcadeRenderController.getRunNextStop(...args);
    }

    function getRunRoundsBeforeYale(...args) {
      return arcadeRenderController.getRunRoundsBeforeYale(...args);
    }

    function getRunPassedStopLabels(...args) {
      return arcadeRenderController.getRunPassedStopLabels(...args);
    }

    function getRunStopRoundSuffix(...args) {
      return arcadeRenderController.getRunStopRoundSuffix(...args);
    }

    function formatRunCurrentStopLabel(...args) {
      return arcadeRenderController.formatRunCurrentStopLabel(...args);
    }

    function getRunMapTop(...args) {
      return arcadeRenderController.getRunMapTop(...args);
    }

    function renderRunMap(...args) {
      return arcadeRenderController.renderRunMap(...args);
    }

    function renderRunStatusRow(...args) {
      return arcadeRenderController.renderRunStatusRow(...args);
    }

    function renderRunMapBackground(...args) {
      return arcadeRenderController.renderRunMapBackground(...args);
    }

    function renderRunTravelMarker(...args) {
      return arcadeRenderController.renderRunTravelMarker(...args);
    }

    function renderRegionalStopMarkerSvg(...args) {
      return arcadeRenderController.renderRegionalStopMarkerSvg(...args);
    }

    function renderGlobalRoundMarkerSvg(...args) {
      return arcadeRenderController.renderGlobalRoundMarkerSvg(...args);
    }

    function renderYaleDestinationMarkerSvg(...args) {
      return arcadeRenderController.renderYaleDestinationMarkerSvg(...args);
    }

    function renderRunMapStop(...args) {
      return arcadeRenderController.renderRunMapStop(...args);
    }

    function renderRunStopMarker(...args) {
      return arcadeRenderController.renderRunStopMarker(...args);
    }

    function renderJumpExperience() {
      return arcadeRenderController.renderJumpExperience();
    }

    function renderJumpBackground(...args) {
      return arcadeRenderController.renderJumpBackground(...args);
    }

    function getJumpRunnerState(...args) {
      return arcadeRenderController.getJumpRunnerState(...args);
    }

    function getJumpRunnerClass(...args) {
      return arcadeRenderController.getJumpRunnerClass(...args);
    }

    function getJumpRunnerAssetConfig(...args) {
      return arcadeRenderController.getJumpRunnerAssetConfig(...args);
    }

    function renderJumpRunner(...args) {
      return arcadeRenderController.renderJumpRunner(...args);
    }

    function renderJumpObstacle(...args) {
      return arcadeRenderController.renderJumpObstacle(...args);
    }

    function renderJumpLives(...args) {
      return arcadeRenderController.renderJumpLives(...args);
    }

    function getJumpQuestionLevel(...args) {
      return arcadeRenderController.getJumpQuestionLevel(...args);
    }

    function getJumpQuestionValue(...args) {
      return arcadeRenderController.getJumpQuestionValue(...args);
    }

    function getJumpObstacleRequirement(experience) {
      return arcadeJumpHelpers.getJumpObstacleRequirement(experience.currentQuestion, getJumpQuestionLevel);
    }

    function getJumpObstacleSpeed(experience) {
      return arcadeJumpHelpers.getJumpObstacleSpeed(experience, GAME_CONFIG);
    }

    function queueNextJumpObstacle(experience) {
      return arcadeJumpAnimationController.queueNextJumpObstacle(experience);
    }

    function renderJumpQuestionOverlay(...args) {
      return arcadeRenderController.renderJumpQuestionOverlay(...args);
    }

    function startJumpRoute(...args) {
      return arcadeGameController.startJumpRoute(...args);
    }

    function toggleJumpSetupCategory(...args) {
      return arcadeGameController.toggleJumpSetupCategory(...args);
    }

    function performJumpAction(...args) {
      return arcadeGameController.performJumpAction(...args);
    }

    function startJumpAnimation() {
      return arcadeJumpAnimationController.startJumpAnimation();
    }

    function updateJumpFrame(experience, timestamp) {
      return arcadeJumpAnimationController.updateJumpFrame(experience, timestamp);
    }

    function hasJumpCollision(experience) {
      return arcadeJumpHelpers.hasJumpCollision(experience);
    }

    function handleJumpObstacleHit(experience) {
      return arcadeJumpAnimationController.handleJumpObstacleHit(experience);
    }

    function openJumpCheckpoint(experience) {
      return arcadeJumpAnimationController.openJumpCheckpoint(experience);
    }

    function updateJumpDom(experience) {
      return arcadeJumpAnimationController.updateJumpDom(experience);
    }

    function answerJumpQuestion(...args) {
      return arcadeGameController.answerJumpQuestion(...args);
    }

    function continueJumpRoute(...args) {
      return arcadeGameController.continueJumpRoute(...args);
    }

    function renderRunExperience() {
      return arcadeRenderController.renderRunExperience();
    }

    function renderGameQuestionPopup(...args) {
      return appShellRenderer.renderGameQuestionPopup(...args);
    }

    function renderExperienceCloseButton(...args) {
      return appShellRenderer.renderExperienceCloseButton(...args);
    }

    function answerRunQuestion(...args) {
      return arcadeGameController.answerRunQuestion(...args);
    }

    function continueRun(...args) {
      return arcadeGameController.continueRun(...args);
    }

    function renderResultsScreen(config) {
      return resultsRenderer.renderResultsScreen(config);
    }

    function renderMetricCard(label, value) {
      return resultsRenderer.renderMetricCard(label, value);
    }

    function renderBreakdowns(answers) {
      return resultsRenderer.renderBreakdowns(answers);
    }

    function renderSelectedTargetBreakdown(answers) {
      return resultsRenderer.renderSelectedTargetBreakdown(answers);
    }

    function renderAlternateLensBreakdown(answers) {
      return resultsRenderer.renderAlternateLensBreakdown(answers);
    }

    function getAlternateBreakdownLensId() {
      return resultsRenderer.getAlternateBreakdownLensId();
    }

    function getBreakdownRowsForLens(answers, lensId) {
      return resultsRenderer.getBreakdownRowsForLens(answers, lensId);
    }

    function renderBreakdownRow(label, value, accuracy) {
      return resultsRenderer.renderBreakdownRow(label, value, accuracy);
    }

    function renderSelectedGuidingSectionSpans(...args) {
      return appShellRenderer.renderSelectedGuidingSectionSpans(...args);
    }

    function renderPanelTitle(...args) {
      return appShellRenderer.renderPanelTitle(...args);
    }

    function renderLearnCardFooterNav(...args) {
      return appShellRenderer.renderLearnCardFooterNav(...args);
    }

    function getSelectionQuestions() {
      return gameQuestionPlanningController.getSelectionQuestions();
    }

    function buildRawGameQuestionsFromEntries(entries) {
      return gameQuestionPlanningController.buildRawGameQuestionsFromEntries(entries);
    }

    function getSectionCounts(questions) {
      return gamePromptPresenter.getSectionCounts(questions);
    }

    function getSubjectCounts(questions) {
      return gamePromptPresenter.getSubjectCounts(questions);
    }

    function hydrateKnowledgeBank() {
      return knowledgeRuntimeController.hydrateKnowledgeBank();
    }

    function slugifyBigIdea(label) {
      return knowledgeRuntimeController.slugifyBigIdea(label);
    }

    function normalizeBankSection(bankSection, sectionId) {
      return knowledgeRuntimeController.normalizeBankSection(bankSection, sectionId);
    }

    function buildSubjectKnowledge(subjectId) {
      return knowledgeRuntimeController.buildSubjectKnowledge(subjectId);
    }

    function buildLearnSubjectRouteKnowledge(route) {
      return knowledgeRuntimeController.buildLearnSubjectRouteKnowledge(route);
    }

    function buildBigIdeaKnowledge(route) {
      return knowledgeRuntimeController.buildBigIdeaKnowledge(route);
    }

    function atomMatchesLearnSubjectRoute(atom, section, route) {
      return knowledgeRuntimeController.atomMatchesLearnSubjectRoute(atom, section, route);
    }

    function buildWholeThemeKnowledge() {
      return knowledgeRuntimeController.buildWholeThemeKnowledge();
    }

    function getKnowledgeContext() {
      return knowledgeRuntimeController.getKnowledgeContext();
    }

    function countKnowledgeItems(atoms) {
      return knowledgeRuntimeController.countKnowledgeItems(atoms);
    }

    function getQuestionCueMood(question, fallbackMood) {
      return gamePromptPresenter.getQuestionCueMood(question, fallbackMood);
    }

    function getGameMascotMood(mode, question, context, fallbackMood) {
      return gamePromptPresenter.getGameMascotMood(mode, question, context, fallbackMood);
    }

    function getQuestionTypeLabel(question) {
      return gamePromptPresenter.getQuestionTypeLabel(question);
    }

    function getGamePromptLabel(mode, question) {
      return gamePromptPresenter.getGamePromptLabel(mode, question);
    }

    function getQuestionAnchorLine(question) {
      return gamePromptPresenter.getQuestionAnchorLine(question);
    }

    function getQuestionTypeHint(question) {
      return gamePromptPresenter.getQuestionTypeHint(question);
    }

    function pushUniqueNote(notes, note) {
      return gamePromptPresenter.pushUniqueNote(notes, note);
    }

    function renderGameNotes(question, mode, context) {
      return gamePromptPresenter.renderGameNotes(question, mode, context);
    }

    function buildWholeThemeDeck(knowledge) {
      return learnSlideshowController.buildWholeThemeDeck(knowledge);
    }

    function buildSubjectDeck(knowledge) {
      return learnSlideshowController.buildSubjectDeck(knowledge);
    }

    function buildSectionDeck(knowledge) {
      return learnSlideshowController.buildSectionDeck(knowledge);
    }

    function buildBigIdeaDeck(knowledge) {
      return learnSlideshowController.buildBigIdeaDeck(knowledge);
    }

    function buildAtomSlide(atom, overline, context = {}) {
      return learnSlideshowController.buildAtomSlide(atom, overline, context);
    }

    function samplePrompts(questions, count) {
      return learnSlideshowController.samplePrompts(questions, count);
    }

    function countJeopardyTiles(board) {
      return alpacapardyBoardController.countJeopardyTiles(board);
    }

    function countJeopardyDoneTiles(board) {
      return alpacapardyBoardController.countJeopardyDoneTiles(board);
    }

    function allJeopardyTilesDone(board) {
      return alpacapardyBoardController.allJeopardyTilesDone(board);
    }

    function isActiveJeopardyTile(groupIndex, tileIndex) {
      return alpacapardyBoardController.isActiveJeopardyTile(groupIndex, tileIndex);
    }

    function getAccuracy(answers) {
      return gameResultsService.getAccuracy(answers);
    }

    function getBestStreakFromAnswers(answers) {
      return gameResultsService.getBestStreakFromAnswers(answers);
    }

    function getHighestTeamScore(teams = []) {
      return gameResultsService.getHighestTeamScore(teams);
    }

    function getRunReachedStage(experience) {
      return gameResultsService.getRunReachedStage(experience);
    }

    function updateBestGameStats(result) {
      return gameResultsService.updateBestGameStats(result);
    }

    function finalizeSessionStats(answers, bestStreak, gameResult = null) {
      return gameResultsService.finalizeSessionStats(answers, bestStreak, gameResult);
    }

    function getPerformanceRating(accuracy) {
      return gameResultsService.getPerformanceRating(accuracy);
    }

    function getPerformanceMood(accuracy) {
      return gameResultsService.getPerformanceMood(accuracy);
    }

    function getPathOption(pathId) {
      return selectionContextService.getPathOption(pathId);
    }

    function getLensLabel(lensId) {
      return selectionContextService.getLensLabel(lensId);
    }

    function getModeOption(modeId) {
      return selectionContextService.getModeOption(modeId);
    }

    function getLensCardPluralLabel(lensId) {
      return selectionContextService.getLensCardPluralLabel(lensId);
    }

    function getOrderedSectionIds() {
      return selectionContextService.getOrderedSectionIds();
    }

    function getSelectedSectionIds() {
      return selectionContextService.getSelectedSectionIds();
    }

    function getSelectedSectionLabels() {
      return selectionContextService.getSelectedSectionLabels();
    }

    function getSelectedSectionLabel() {
      return selectionContextService.getSelectedSectionLabel();
    }

    function getTargetLabelForLens(lensId, targetId) {
      return selectionContextService.getTargetLabelForLens(lensId, targetId);
    }

    function getTargetLabel() {
      return selectionContextService.getTargetLabel();
    }

    function getDefaultStats() {
      return progressStorageController.getDefaultStats();
    }

    function normalizeStats(value) {
      return progressStorageController.normalizeStats(value);
    }

    function normalizeRawMastery(value) {
      return progressStorageController.normalizeRawMastery(value);
    }

    function loadStats() {
      return progressStorageController.loadStats();
    }

    function loadRawMastery() {
      return progressStorageController.loadRawMastery();
    }

    function loadGuestAlpacaName() {
      return progressStorageController.loadGuestAlpacaName();
    }

    async function saveAlpacaProgress() {
      return progressStorageController.saveRemoteProgress({
        client: getSupabaseClient(),
        user: state.auth.session && state.auth.session.user,
        stats: state.stats,
        rawMastery: state.rawMastery,
        profileService: supabaseProfileService,
        isAnonymousUser
      });
    }

    function getWizardCardAsset(asset) {
      return visualAssetRenderer.getWizardCardAsset(asset);
    }

    function renderAssetImage(src, alt, slotClass = "", imageClass = "", eager = false) {
      return visualAssetRenderer.renderAssetImage(src, alt, slotClass, imageClass, eager);
    }

    function versionAssetSrc(src) {
      return visualAssetRenderer.versionAssetSrc(src);
    }

    function renderOptionToken(index) {
      return visualAssetRenderer.renderOptionToken(index);
    }

    function preloadExperienceAudio() {
      return gameAudioService.preloadExperienceAudio();
    }

    function playRelayBuzzSound() {
      return gameAudioService.playRelayBuzzSound();
    }

    function renderReviewBadgeMarkup(label) {
      return visualAssetRenderer.renderReviewBadgeMarkup(label);
    }

    function wrapWithReviewBadge(markup, label) {
      return visualAssetRenderer.wrapWithReviewBadge(markup, label);
    }

    function getPathReviewBadge(pathId) {
      return visualAssetRenderer.getPathReviewBadge(pathId);
    }

    function getLensReviewBadge(lensId) {
      return visualAssetRenderer.getLensReviewBadge(lensId);
    }

    function getModeReviewBadge(modeId) {
      return visualAssetRenderer.getModeReviewBadge(modeId);
    }

    function getTargetReviewBadge(targetId = state.selection.targetId) {
      return visualAssetRenderer.getTargetReviewBadge(targetId);
    }

    function getGameplayReviewBadge(stage, modeId = state.experience?.type || state.selection.mode) {
      return visualAssetRenderer.getGameplayReviewBadge(stage, modeId);
    }

    function renderConfiguredMascotAsset(asset, fallbackMood, size, options = {}) {
      return visualAssetRenderer.renderConfiguredMascotAsset(asset, fallbackMood, size, options);
    }

    function getTargetAssetPath(targetId = state.selection.targetId) {
      return visualAssetRenderer.getTargetAssetPath(targetId);
    }

    function getModeAssetPath(modeId = state.selection.mode) {
      return visualAssetRenderer.getModeAssetPath(modeId);
    }

    function getGameplayAssetPath(stage, modeId = state.experience?.type || state.selection.mode) {
      return visualAssetRenderer.getGameplayAssetPath(stage, modeId);
    }

    function getResultAssetPath(modeId = state.experience?.type, outcome = "success") {
      return visualAssetRenderer.getResultAssetPath(modeId, outcome);
    }

    function getFallbackMood(mood) {
      return visualAssetRenderer.getFallbackMood(mood);
    }

    function renderMascot(mood, size, options = {}) {
      return visualAssetRenderer.renderMascot(mood, size, options);
    }

    function renderHeroVisual() {
      return visualAssetRenderer.renderHeroVisual();
    }

    function renderLessonVisual(type) {
      return visualAssetRenderer.renderLessonVisual(type);
    }

    function renderCheckpointVisual(kind) {
      return visualAssetRenderer.renderCheckpointVisual(kind);
    }

    function renderJeopardyDecoration() {
      return visualAssetRenderer.renderJeopardyDecoration();
    }

    function renderRaceFrame() {
      return visualAssetRenderer.renderRaceFrame();
    }

    function renderRaceTimerWidget(...args) {
      return arcadeRenderController.renderRaceTimerWidget(...args);
    }

    function renderCompactRaceTimerCard(...args) {
      return arcadeRenderController.renderCompactRaceTimerCard(...args);
    }

    function getTimerVisualState(...args) {
      return arcadeRenderController.getTimerVisualState(...args);
    }

    function renderPopupQuestionTimerPanel(...args) {
      return arcadeRenderController.renderPopupQuestionTimerPanel(...args);
    }

    function getRaceLifeState(index, livesRemaining) {
      return visualAssetRenderer.getRaceLifeState(index, livesRemaining);
    }

    function renderRaceLivesIcon(state) {
      return visualAssetRenderer.renderRaceLivesIcon(state);
    }

    function hasRaceLivesIconAssets() {
      return visualAssetRenderer.hasRaceLivesIconAssets();
    }

    function renderRaceFailVisual() {
      return visualAssetRenderer.renderRaceFailVisual();
    }

    function alpacaAvatar(mood, size) {
      return visualAssetRenderer.alpacaAvatar(mood, size);
    }

    function renderAlpacaList(items) {
      return visualAssetRenderer.renderAlpacaList(items);
    }

    function getRawVisualAssetHelpers(...args) {
      return rawContentController.getRawVisualAssetHelpers(...args);
    }

    function renderRawStudentAssets(...args) {
      return rawContentController.renderRawStudentAssets(...args);
    }

    function getRawAssetSelectionKey(...args) {
      return rawContentController.getRawAssetSelectionKey(...args);
    }

    function selectRawAssetPoint(...args) {
      return rawContentController.selectRawAssetPoint(...args);
    }

    function renderRawSpecialAssets(...args) {
      return rawContentController.renderRawSpecialAssets(...args);
    }

    function renderRawSpecialAsset(...args) {
      return rawContentController.renderRawSpecialAsset(...args);
    }

    function renderRawTimelineAsset(...args) {
      return rawContentController.renderRawTimelineAsset(...args);
    }

    function renderRawRouteMapAsset(...args) {
      return rawContentController.renderRawRouteMapAsset(...args);
    }

    function renderRawImageCardAsset(...args) {
      return rawContentController.renderRawImageCardAsset(...args);
    }

    function renderRawVisualSections(...args) {
      return rawContentController.renderRawVisualSections(...args);
    }

    function renderRawVisualFooterQuestion(...args) {
      return rawContentController.renderRawVisualFooterQuestion(...args);
    }

    function renderRawVisualGallery(...args) {
      return rawContentController.renderRawVisualGallery(...args);
    }

    function renderRawVisualLinkPreview(...args) {
      return rawContentController.renderRawVisualLinkPreview(...args);
    }

    function getRawMediaLinkItems(...args) {
      return rawContentController.getRawMediaLinkItems(...args);
    }

    function renderRawMediaLinkButtons(...args) {
      return rawContentController.renderRawMediaLinkButtons(...args);
    }

    function getEmbeddableVideo(url) {
      return alpacaChannelController.getEmbeddableVideo(url);
    }

    function getVideoPreview(url) {
      return alpacaChannelController.getVideoPreview(url);
    }

    function renderRawVisualPreview(...args) {
      return rawContentController.renderRawVisualPreview(...args);
    }

    function renderTextWithBreaks(...args) {
      return rawContentController.renderTextWithBreaks(...args);
    }

    function getRawOfficialDisplayText(...args) {
      return rawContentController.getRawOfficialDisplayText(...args);
    }

    function stripRawOfficialReferenceAppendix(...args) {
      return rawContentController.stripRawOfficialReferenceAppendix(...args);
    }

    function isRawOfficialReferenceAppendix(...args) {
      return rawContentController.isRawOfficialReferenceAppendix(...args);
    }

    function isRawOfficialReferenceLine(...args) {
      return rawContentController.isRawOfficialReferenceLine(...args);
    }

    function getRawQuizPagerKey(...args) {
      return rawContentController.getRawQuizPagerKey(...args);
    }

    function getRawQuizPageIndex(...args) {
      return rawContentController.getRawQuizPageIndex(...args);
    }

    function renderRawQuizPager(...args) {
      return rawContentController.renderRawQuizPager(...args);
    }

    function renderRawQuizQuestion(...args) {
      return rawContentController.renderRawQuizQuestion(...args);
    }

    function openRawMediaLightboxFromTrigger(...args) {
      return rawContentController.openRawMediaLightboxFromTrigger(...args);
    }

    function getRawMediaLightboxAnchor(...args) {
      return rawContentController.getRawMediaLightboxAnchor(...args);
    }

    function closeRawMediaLightbox(...args) {
      return rawContentController.closeRawMediaLightbox(...args);
    }

    function shiftRawMediaLightbox(...args) {
      return rawContentController.shiftRawMediaLightbox(...args);
    }

    function renderRawMediaLightbox(...args) {
      return rawContentController.renderRawMediaLightbox(...args);
    }

    function getRawQuizQuestionKey(...args) {
      return rawContentController.getRawQuizQuestionKey(...args);
    }

    function selectRawQuizOption(...args) {
      return rawContentController.selectRawQuizOption(...args);
    }

    function rememberRawQuestionGallerySlide(...args) {
      return rawContentController.rememberRawQuestionGallerySlide(...args);
    }

    function setRawQuizPageIndex(...args) {
      return rawContentController.setRawQuizPageIndex(...args);
    }

    function shiftRawQuizPage(...args) {
      return rawContentController.shiftRawQuizPage(...args);
    }

    function getRawQuestionGalleryByPagerKey(...args) {
      return rawContentController.getRawQuestionGalleryByPagerKey(...args);
    }

    function syncRawQuestionGalleries(...args) {
      return rawContentController.syncRawQuestionGalleries(...args);
    }

    function syncRawQuestionGallery(...args) {
      return rawContentController.syncRawQuestionGallery(...args);
    }

    function renderRawQuizOptionStateClass(...args) {
      return rawContentController.renderRawQuizOptionStateClass(...args);
    }

    function stableShuffleByKey(...args) {
      return rawContentController.stableShuffleByKey(...args);
    }

    function hashString(...args) {
      return rawContentController.hashString(...args);
    }

    return Object.freeze({
      clearRunTimer,
      clearRaceTimer,
      clearRelayAnswerTimer,
      clearJumpAnimation,
      clearJeopardyTimer,
      clearDebateSpinTimer,
      clearDebateRevealTimer,
      clearAlpacapardyLiveHeartbeat,
      clearAlpacapardyLiveSync,
      clearLiveLaunchCountdown,
      clearAlpacapardyLiveSubscriptions,
      resetAlpacapardyLiveState,
      handleClick,
      handleInput,
      handleSubmit,
      handleKeyDown,
      handleTouchStart,
      handleTouchEnd,
      choosePath,
      chooseLens,
      chooseTarget,
      toggleModeChoiceSection,
      getVisibleModeChoicePath,
      toggleHeroMenu,
      closeHeroMenu,
      primeModeChoiceCardSpread,
      scheduleModeChoiceCardSpread,
      getModeChoiceCardTarget,
      easeModeChoiceSpread,
      setModeChoiceCardSpreadFrame,
      animateModeChoiceCardSpread,
      clearModeChoiceCardSpread,
      freezeModeChoiceColumnAtCurrentPosition,
      getModeChoiceCollapsedSlot,
      moveModeChoiceColumnToCollapsedSlot,
      clearModeChoiceColumnPosition,
      toggleModeChoiceMenu,
      continueTargetSelection,
      chooseMode,
      changeGuidingSections,
      changeModeSelection,
      clearFrom,
      openRawConnection,
      openGuideSection,
      openSectionChannel,
      render,
      syncActiveModalFocus,
      renderInsights,
      renderSessionControls,
      renderAppEntryGate,
      renderAppEntryAuthPanel,
      chooseAppEntryMode,
      openAlpacaOnlineCampus,
      switchToLocalMode,
      openAlpacaOnlineHub,
      returnToAlpacaOnlineHub,
      renderProgressCircleStatCard,
      renderBestScoreStrip,
      renderBestScoreCard,
      renderOnlineScoreStrip,
      getOnlineGameRecord,
      formatBestNumberStat,
      getBestRunDestinationLabel,
      renderSummary,
      renderSummaryChip,
      renderWizard,
      renderAlpacaOnlineHub,
      renderLegacyLiveRoomsDisabled,
      getLiveOverlayRenderContext,
      getLiveOverlayMount,
      renderLiveOverlayMount,
      canPatchLiveWaitingOverlay,
      patchLiveWaitingOverlay,
      replaceLiveWaitingPart,
      renderOnlineLiveSidebar,
      renderOnlineCurrentGameSummary,
      getAlpacaOnlineConnectedCount,
      renderOnlineJoinForm,
      renderOnlineOpenRoomsList,
      renderOnlineCreateGamePanel,
      renderOnlineHomeGameGrid,
      renderOnlineHomeGameCard,
      getOnlineGameCardDescription,
      renderSelectedOnlineGameBody,
      renderOnlineAlpacapardyLiveGame,
      renderOnlineArcadeSetup,
      renderOnlineAlpacapardySetup,
      renderOnlineWaitingPopup,
      renderOnlineArcadeWaitingRoom,
      renderLiveOverlayLayer,
      renderLiveLaunchCountdownOverlay,
      renderLiveWaitingOverlay,
      renderLiveWaitingVideoRail,
      getLiveWaitingVideoIndex,
      navigateLiveWaitingVideo,
      getLiveWaitingVideos,
      isShortLiveWaitingVideo,
      getVideoDurationSeconds,
      renderOnlineArcadeGame,
      renderLivePlayerCard,
      getLiveRunSetupColorId,
      renderLiveRunSetupColorPicker,
      selectLiveRunSetupColor,
      renderLiveRunColorPicker,
      renderLiveRunGame,
      renderLiveRunMap,
      getLiveRunRouteIndex,
      renderLiveRunPlayerPanel,
      renderLiveQuizGame,
      renderLiveRaceGame,
      renderLiveAlpaquizGame,
      renderLiveRunAlpacaToken,
      renderLiveRaceLives,
      renderLiveAnswerStatus,
      renderLiveQuizRoundResults,
      renderLiveLeaderboard,
      renderLiveWinnerCard,
      renderOnlineRoomListItem,
      getAlpacaOnlineRoster,
      getOpenLiveRoomsByGame,
      getOpenRoomsForGame,
      normalizeLiveGameType,
      getCurrentLiveGameType,
      getLiveGameLabel,
      getLivePlayablePlayers,
      getArcadeState,
      createEmptyArcadeState,
      chooseOnlineGameType,
      renderStepPanel,
      getCurrentWizardStepNumber,
      getWizardStepDefinition,
      renderWizardRail,
      renderWizardRailItem,
      getWizardRailItems,
      getWizardCompletionDepth,
      renderPathCards,
      renderLensCards,
      renderTargetCards,
      renderModeCards,
      renderModeChoiceBoard,
      renderModeChoiceColumn,
      renderModeChoiceCard,
      getWizardRenderContext,
      getWizardRenderHelpers,
      getAppModeSwitchIcon,
      getVisibleModeOptions,
      getVisibleModeOptionsForPath,
      getModeUnavailableReason,
      isModeUnavailable,
      getDecoratedModeOption,
      getModePath,
      usesGranularLearnSubjects,
      getTargetOptions,
      resetCurrentRouteAttempts,
      launchExperience,
      closeCurrentExperience,
      renderExperience,
      renderExperiencePreservingScroll,
      renderPreservingScroll,
      renderLiveSurfaces,
      buildAlpacardExperience,
      getAlpacardsForSelection,
      renderAlpacardExperience,
      renderAlpacardFront,
      renderAlpacardBack,
      getAlpacardConnectionChips,
      navigateAlpacard,
      setAlpacardIndex,
      flipAlpacard,
      syncAlpacardCarouselState,
      shuffleAlpacard,
      syncRadialMindMapScroll,
      stopMindMapOrbitAnimation,
      syncMindMapOrbitAnimation,
      navigateMindMapGallery,
      handleMindMapGalleryWheel,
      replaceMarkup,
      keepRouteBuilderInView,
      hasActiveQuestionPopup,
      syncPopupScrollLock,
      hasSupabaseConfig,
      isSignedIn,
      hasAuthSession,
      isAnonymousUser,
      getCurrentUserEmail,
      canAccessLegacyLiveRooms,
      getLegacyLiveRoomsDisabledMessage,
      canAccessMultiplayer,
      canDismissAuthModal,
      syncAuthChrome,
      clearAuthNotice,
      normalizeAlpacaName,
      getCurrentRedirectUrl,
      getSupabaseClient,
      setupSupabaseAuth,
      loadAlpacaProfile,
      loadAlpacaProgress,
      submitAuthForm,
      createAlpaccount,
      resolveLoginIdentifier,
      connectToAlpaccount,
      sendPasswordReset,
      updateRecoveredPassword,
      signOutOfAlpaccount,
      ensureLiveAuthSession,
      getLiveDisplayName,
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
      renderCooperationModal,
      buildSlideshowExperience,
      buildMindMapExperience,
      buildRawContentExperience,
      buildUnavailableModeExperience,
      renderUnavailableModeExperience,
      buildAlpacaChannelExperience,
      getApprovedRawContentSection,
      getBroadSubjectIdsFromLabels,
      getBigIdeaIdsFromLabels,
      renderQuestionSubjectPills,
      getQuestionVisibleWrongExplanationByAnswer,
      buildGameQuestionOptions,
      createRawGameQuestion,
      createGuideGameQuestion,
      createFullVoyageGameQuestion,
      getSectionIdsForEntries,
      getGuideQuestionsForEntries,
      getFullVoyageQuestionsForEntries,
      buildRawQuestionPoolsFromEntries,
      buildRawQuestionPoolsForSelection,
      hasRequiredRawLevels,
      buildPatternQuestionSequence,
      getUnavailableRawGameReason,
      buildAlpacaRunQuestionPlan,
      buildRelayQuestionSequence,
      buildJumpQuestionPlan,
      buildRaceLevelQueues,
      getRaceActiveLevelState,
      getCurrentRaceQuestion,
      queueNextRaceQuestion,
      buildRaceExperience,
      buildJeopardyExperience,
      buildRunExperience,
      createJumpObstacle,
      createJumpCheckpointObstacle,
      buildJumpExperience,
      buildRelayExperience,
      buildBuildCaseExperience,
      closeTrainTip,
      renderTrainTipSummary,
      renderTrainTipPopup,
      buildWritingPromptPool,
      buildWritingExperience,
      getCurrentWritingPrompt,
      nextWritingPrompt,
      setWritingPhase,
      buildBowlExperience,
      buildScholarsBowlQuestions,
      getBowlRoundType,
      getCurrentBowlQuestion,
      startBowlPractice,
      answerBowlQuestion,
      advanceBowlQuestion,
      resetBowlPractice,
      renderAlpacaChannelExperience,
      renderSlideshowExperience,
      renderSlideSecondaryContext,
      getSlideSecondaryContext,
      getPrimaryOfficialSubjectLabel,
      inferRelatedSubjectLabel,
      getBroadSubjectAssetPath,
      navigateSlide,
      navigateAlpacaChannel,
      getAlpacaChannelVideosForEntry,
      getAlpacaChannelVideosForSection,
      createStandaloneAlpacaChannelVideo,
      normalizeVideoUrl,
      getAlpacaChannelDomain,
      buildLearnDeck,
      renderMindMapExperience,
      renderRadialMindMap,
      buildRadialMindMapLayout,
      getMindMapRingPlan,
      getMindMapRingIndexForEntry,
      getRadialMindMapEntries,
      formatMindMapEntryMeta,
      getMindMapCurvePath,
      renderMindMapEntryPopup,
      buildRegularGuideExperience,
      getRegularGuideForSection,
      getRegularGuidesForSelection,
      renderRegularGuideExperience,
      renderRegularGuideDocument,
      renderRegularGuideQuestionBlock,
      renderRegularGuideNavigation,
      renderGuideSectionChannelButton,
      getRegularGuideRenderContext,
      getRegularGuideRenderHelpers,
      getRawVisibleQuizQuestionItems,
      getSectionGuideQuestions,
      renderSectionTransferTable,
      getVisibleWrongExplanation,
      getVisibleQuizFeedbackParts,
      renderRawQuizFeedback,
      renderGuideQuizQuestion,
      renderRawContentExperience,
      renderRawContentEntryGroups,
      renderRawContentEntryCard,
      getRawContentScopeLabel,
      getRawContentPayload,
      getRawEntriesForSelection,
      getRawEntriesForRunSetupCategoryIds,
      getRawEntryMasteryKey,
      isRawEntryMastered,
      getRawMasteryHelpers,
      renderRawMasteryToggle,
      renderRawEntryQuickActions,
      renderRawBackToTopButton,
      renderRawEntryChannelLinks,
      toggleRawMastery,
      getAllRawEntries,
      getTotalRawMasterableEntries,
      getMasteredRawEntryCount,
      findLearnSubjectRouteIdByLabel,
      findBigIdeaRouteIdByLabel,
      getRawConnectionGroups,
      renderRawConnectionGroups,
      buildMindMap,
      getMindMapEntryKey,
      buildMindMapDiagram,
      getMindMapTargetsForLens,
      getOrderedMindMapGroups,
      getMindMapEntryMeta,
      getMindMapLensLabel,
      getActiveMindMapEntryBundle,
      openMindMapEntry,
      closeMindMapEntry,
      openMindMapGuide,
      closeMindMapGuide,
      renderMindMapGuidePopup,
      getMindMapRenderHelpers,
      showNextDebateTopic,
      startDebateConversation,
      toggleDebateSideSpin,
      returnToDebateTopic,
      resetDebateSpinForCurrentTopic,
      toggleDebateSuggestion,
      submitDebateRound,
      advanceDebateRound,
      shortenTrainText,
      renderWritingPhaseButton,
      renderWritingExperience,
      renderBowlOption,
      renderBowlFlowBar,
      renderBowlSetup,
      renderBowlStimulusCard,
      renderBowlTargetCard,
      renderBowlProductionLedger,
      renderBowlReveal,
      renderBowlExperience,
      renderBuildCaseExperience,
      startBuildCaseRoute,
      chooseBuildCaseCamp,
      toggleBuildCaseSupport,
      confirmBuildCaseSupports,
      chooseBuildCaseRebuttal,
      advanceBuildCaseRound,
      buildQuizExperience,
      getDefaultQuizSectionIds,
      getQuizQuestionPattern,
      normalizeQuizDifficultySelection,
      getRawEntriesForQuizSectionIds,
      buildQuizQuestionPlan,
      renderQuizExperience,
      renderQuizSetup,
      renderQuizQuestionPage,
      getQuizRemainingNotice,
      getQuizDifficultyResults,
      renderQuizResultsFooter,
      renderQuizQuestionCard,
      renderQuizQuestionFeedback,
      toggleQuizSection,
      selectAllQuizSections,
      toggleQuizDifficulty,
      setQuizQuestionCount,
      startQuizRoute,
      answerQuizQuestion,
      submitQuizRoute,
      resetQuizRoute,
      renderRaceExperience,
      renderRaceTargetSelector,
      renderTargetSetupSelector,
      renderRaceQuestionPills,
      startRaceRoute,
      getRaceAvailableQuestionCount,
      toggleRaceSetupCategory,
      answerRaceQuestion,
      resolveRaceQuestion,
      advanceRace,
      renderJeopardyExperience,
      renderJeopardyFocus,
      renderJeopardySetup,
      getAlpacapardyRenderHelpers,
      getAlpacapardyLiveRenderContext,
      isAlpacapardyLiveActive,
      guardMultiplayerAccess,
      canOpenAlpacapardyLiveTile,
      canAnswerAlpacapardyLiveFocus,
      canCloseAlpacapardyLiveFocus,
      getAlpacapardyLiveIdentityContext,
      refreshAlpacapardyLiveLobby,
      subscribeAlpacapardyLobby,
      refreshAlpacapardyLiveLobbySilently,
      startAlpacapardyLiveSync,
      syncAlpacapardyLiveNow,
      maybeAutoRevealTimedLiveGame,
      maybeAutoResolveTimedAlpaquiz,
      refreshAlpacapardyLiveSessionState,
      createSelectedLiveGameRoom,
      createArcadeLiveRoom,
      createAlpacapardyLiveRoom,
      joinAlpacapardyLiveRoom,
      joinAlpacapardyLiveRoomByCode,
      buildAlpacapardyLiveSettings,
      applyAlpacapardyLiveSettings,
      syncAlpacapardyLiveSettings,
      subscribeAlpacapardySession,
      refreshAlpacapardyLivePlayers,
      startAlpacapardyLiveHeartbeat,
      maybeStartLiveLaunchCountdown,
      startLiveLaunchCountdown,
      maybeAutoStartReadyLiveGame,
      compareLivePlayers,
      syncAlpacapardyLiveEvents,
      applyLiveEvent,
      applyAlpacapardyLiveEvent,
      extractAlpacapardyLiveState,
      mergeAlpacapardyLiveState,
      emitAlpacapardyLiveEvent,
      emitLiveEvent,
      applyArcadeLiveEvent,
      reduceArcadeLiveState,
      reduceLiveRunState,
      reduceLiveQuizState,
      reduceLiveRaceState,
      reduceLiveAlpaquizState,
      canStartSelectedLiveGame,
      startSelectedLiveGame,
      getLiveRunColorAssignments,
      buildArcadeStartState,
      buildAllThemeQuestionSequence,
      selectLiveAlpacaColor,
      answerSelectedLiveGame,
      advanceSelectedLiveGame,
      buzzSelectedLiveGame,
      getArcadeLeaderboard,
      clonePlain,
      startAlpacapardyLiveGame,
      sendAlpacapardyLiveChat,
      leaveAlpacapardyLiveRoom,
      buildJeopardyBoard,
      getJeopardySetupOptions,
      getDefaultJeopardySetupCategoryIds,
      getTargetSetupOptions,
      getDefaultTargetSetupCategoryIds,
      getSetupTargetHeading,
      getSetupTargetHelper,
      toggleSetupCategorySelection,
      toggleRunSetupCategory,
      startRunRoute,
      setJeopardyTeamCount,
      toggleJeopardySetupCategory,
      startJeopardyGame,
      buildConfiguredJeopardyBoard,
      pickQuestionsForJeopardyCategory,
      getJeopardyGroupingStrategies,
      getJeopardySourceTypeDefinitions,
      createJeopardyTile,
      buildJeopardyBoardFromDefinitions,
      buildFallbackJeopardyBoard,
      openJeopardyTile,
      answerJeopardyQuestion,
      resolveJeopardyTimeout,
      resolveJeopardyQuestion,
      closeJeopardyFocus,
      createJeopardyTeams,
      getJeopardyActiveTeam,
      getJeopardyStandings,
      renderJeopardyTeams,
      renderJeopardyCategoryHeader,
      renderJeopardyTileFace,
      startJeopardyTimer,
      chooseJeopardyTeam,
      addJeopardyTeam,
      removeJeopardyTeam,
      advanceJeopardyTeam,
      renderJeopardyResults,
      createRelayTeams,
      syncRelayTeamBindings,
      getRelayStandings,
      renderRelayExperience,
      startRelayRoute,
      toggleRelaySetupCategory,
      setRelayTeamCount,
      setRelayQuestionCount,
      buzzRelayTeam,
      answerRelayQuestion,
      getRelayAwardRecipients,
      formatRelayAwardedTeams,
      resolveRelayOutcome,
      handleRelayTimeout,
      advanceRelayQuestion,
      addRelayTeam,
      removeRelayTeam,
      renderRelayResults,
      startRelayAnswerTimer,
      startRaceTimer,
      startRunTimer,
      getRunCurrentStop,
      getRunNextStop,
      getRunRoundsBeforeYale,
      getRunPassedStopLabels,
      getRunStopRoundSuffix,
      formatRunCurrentStopLabel,
      getRunMapTop,
      renderRunMap,
      renderRunStatusRow,
      renderRunMapBackground,
      renderRunTravelMarker,
      renderRegionalStopMarkerSvg,
      renderGlobalRoundMarkerSvg,
      renderYaleDestinationMarkerSvg,
      renderRunMapStop,
      renderRunStopMarker,
      renderJumpExperience,
      renderJumpBackground,
      getJumpRunnerState,
      getJumpRunnerClass,
      getJumpRunnerAssetConfig,
      renderJumpRunner,
      renderJumpObstacle,
      renderJumpLives,
      getJumpQuestionLevel,
      getJumpQuestionValue,
      getJumpObstacleRequirement,
      getJumpObstacleSpeed,
      queueNextJumpObstacle,
      renderJumpQuestionOverlay,
      startJumpRoute,
      toggleJumpSetupCategory,
      performJumpAction,
      startJumpAnimation,
      updateJumpFrame,
      hasJumpCollision,
      handleJumpObstacleHit,
      openJumpCheckpoint,
      updateJumpDom,
      answerJumpQuestion,
      continueJumpRoute,
      renderRunExperience,
      renderGameQuestionPopup,
      renderExperienceCloseButton,
      answerRunQuestion,
      continueRun,
      renderResultsScreen,
      renderMetricCard,
      renderBreakdowns,
      renderSelectedTargetBreakdown,
      renderAlternateLensBreakdown,
      getAlternateBreakdownLensId,
      getBreakdownRowsForLens,
      renderBreakdownRow,
      renderSelectedGuidingSectionSpans,
      renderPanelTitle,
      renderLearnCardFooterNav,
      getSelectionQuestions,
      buildRawGameQuestionsFromEntries,
      getSectionCounts,
      getSubjectCounts,
      hydrateKnowledgeBank,
      slugifyBigIdea,
      normalizeBankSection,
      buildSubjectKnowledge,
      buildLearnSubjectRouteKnowledge,
      buildBigIdeaKnowledge,
      atomMatchesLearnSubjectRoute,
      buildWholeThemeKnowledge,
      getKnowledgeContext,
      countKnowledgeItems,
      getQuestionCueMood,
      getGameMascotMood,
      getQuestionTypeLabel,
      getGamePromptLabel,
      getQuestionAnchorLine,
      getQuestionTypeHint,
      pushUniqueNote,
      renderGameNotes,
      buildWholeThemeDeck,
      buildSubjectDeck,
      buildSectionDeck,
      buildBigIdeaDeck,
      buildAtomSlide,
      samplePrompts,
      countJeopardyTiles,
      countJeopardyDoneTiles,
      allJeopardyTilesDone,
      isActiveJeopardyTile,
      getAccuracy,
      getBestStreakFromAnswers,
      getHighestTeamScore,
      getRunReachedStage,
      updateBestGameStats,
      finalizeSessionStats,
      getPerformanceRating,
      getPerformanceMood,
      getPathOption,
      getLensLabel,
      getModeOption,
      getLensCardPluralLabel,
      getOrderedSectionIds,
      getSelectedSectionIds,
      getSelectedSectionLabels,
      getSelectedSectionLabel,
      getTargetLabelForLens,
      getTargetLabel,
      getDefaultStats,
      normalizeStats,
      normalizeRawMastery,
      loadStats,
      loadRawMastery,
      loadGuestAlpacaName,
      saveAlpacaProgress,
      getWizardCardAsset,
      renderAssetImage,
      versionAssetSrc,
      renderOptionToken,
      preloadExperienceAudio,
      playRelayBuzzSound,
      renderReviewBadgeMarkup,
      wrapWithReviewBadge,
      getPathReviewBadge,
      getLensReviewBadge,
      getModeReviewBadge,
      getTargetReviewBadge,
      getGameplayReviewBadge,
      renderConfiguredMascotAsset,
      getTargetAssetPath,
      getModeAssetPath,
      getGameplayAssetPath,
      getResultAssetPath,
      getFallbackMood,
      renderMascot,
      renderHeroVisual,
      renderLessonVisual,
      renderCheckpointVisual,
      renderJeopardyDecoration,
      renderRaceFrame,
      renderRaceTimerWidget,
      renderCompactRaceTimerCard,
      getTimerVisualState,
      renderPopupQuestionTimerPanel,
      getRaceLifeState,
      renderRaceLivesIcon,
      hasRaceLivesIconAssets,
      renderRaceFailVisual,
      alpacaAvatar,
      renderAlpacaList,
      getRawVisualAssetHelpers,
      renderRawStudentAssets,
      getRawAssetSelectionKey,
      selectRawAssetPoint,
      renderRawSpecialAssets,
      renderRawSpecialAsset,
      renderRawTimelineAsset,
      renderRawRouteMapAsset,
      renderRawImageCardAsset,
      renderRawVisualSections,
      renderRawVisualFooterQuestion,
      renderRawVisualGallery,
      renderRawVisualLinkPreview,
      getRawMediaLinkItems,
      renderRawMediaLinkButtons,
      getEmbeddableVideo,
      getVideoPreview,
      renderRawVisualPreview,
      renderTextWithBreaks,
      getRawOfficialDisplayText,
      stripRawOfficialReferenceAppendix,
      isRawOfficialReferenceAppendix,
      isRawOfficialReferenceLine,
      getRawQuizPagerKey,
      getRawQuizPageIndex,
      renderRawQuizPager,
      renderRawQuizQuestion,
      openRawMediaLightboxFromTrigger,
      getRawMediaLightboxAnchor,
      closeRawMediaLightbox,
      shiftRawMediaLightbox,
      renderRawMediaLightbox,
      getRawQuizQuestionKey,
      selectRawQuizOption,
      rememberRawQuestionGallerySlide,
      setRawQuizPageIndex,
      shiftRawQuizPage,
      getRawQuestionGalleryByPagerKey,
      syncRawQuestionGalleries,
      syncRawQuestionGallery,
      renderRawQuizOptionStateClass,
      stableShuffleByKey,
      hashString
    });
  }

  window.WSC_CREATE_APP_RUNTIME_COMPATIBILITY_FACADE = createAppRuntimeCompatibilityFacade;
}());
