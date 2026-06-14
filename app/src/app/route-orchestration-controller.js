(function initRouteOrchestrationController(global) {
  "use strict";

  function requireObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error("WSC route orchestration controller requires " + name + ".");
    }
    return value;
  }

  function requireFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC route orchestration controller missing callback/helper: " + name);
    }
    return value;
  }

  function createRouteOrchestrationController(options = {}) {
    const state = requireObject(options.appState, "appState");
    const refs = requireObject(options.refs, "refs");
    const routeBuilderController = requireObject(options.routeBuilderController, "routeBuilderController");
    const routeBuilderViewController = requireObject(options.routeBuilderViewController, "routeBuilderViewController");
    const gameLaunchController = requireObject(options.gameLaunchController, "gameLaunchController");
    const documentRef = options.documentRef || global.document;
    const windowRef = options.windowRef || global.window;
    const constants = options.constants || {};
    const helpers = options.helpers || {};
    const callbacks = options.callbacks || {};

    const DEFAULT_LENS_ID = constants.DEFAULT_LENS_ID || "section";
    const getSelectedSectionIds = requireFunction(helpers, "getSelectedSectionIds");
    const getOrderedSectionIds = requireFunction(helpers, "getOrderedSectionIds");
    const getModePath = requireFunction(helpers, "getModePath");
    const isModeUnavailable = requireFunction(helpers, "isModeUnavailable");
    const getAlpacaChannelVideosForSection = requireFunction(helpers, "getAlpacaChannelVideosForSection");
    const hasRegularGuideForSection = requireFunction(helpers, "hasRegularGuideForSection");
    const normalizeSectionId = requireFunction(helpers, "normalizeSectionId");
    const clearJeopardyTimer = requireFunction(callbacks, "clearJeopardyTimer");
    const clearDebateSpinTimer = requireFunction(callbacks, "clearDebateSpinTimer");
    const closeHeroMenu = requireFunction(callbacks, "closeHeroMenu");
    const render = requireFunction(callbacks, "render");
    const renderCurrentExperience = requireFunction(callbacks, "renderCurrentExperience");
    const isAlpacapardyLiveActive = requireFunction(callbacks, "isAlpacapardyLiveActive");
    const leaveAlpacapardyLiveRoom = requireFunction(callbacks, "leaveAlpacapardyLiveRoom");

    function clearRouteTimers({ includeDebateSpin = false } = {}) {
      clearJeopardyTimer();
      if (includeDebateSpin) {
        clearDebateSpinTimer();
      }
    }

    function keepRouteBuilderInView() {
      windowRef.requestAnimationFrame(() => {
        if (refs.routeBuilder) {
          refs.routeBuilder.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }

    function scrollExperienceIntoView() {
      refs.experiencePanel?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function choosePath(pathId) {
      clearRouteTimers({ includeDebateSpin: true });
      routeBuilderController.choosePath(state, pathId, { defaultLensId: DEFAULT_LENS_ID });
      render();
      keepRouteBuilderInView();
    }

    function chooseLens(lensId) {
      clearRouteTimers();
      routeBuilderController.chooseLens(state, lensId);
      render();
      keepRouteBuilderInView();
    }

    function chooseTarget(targetId) {
      clearRouteTimers();
      routeBuilderController.chooseTarget(state, targetId, {
        getSelectedSectionIds,
        getOrderedSectionIds
      });
      render();
      keepRouteBuilderInView();
    }

    function toggleModeChoiceSection(targetId) {
      clearRouteTimers();
      routeBuilderController.toggleModeChoiceSection(state, targetId, {
        visibleOpenPath: getVisibleModeChoicePath(),
        getSelectedSectionIds,
        getOrderedSectionIds
      });
      render();
      keepRouteBuilderInView();
    }

    function getVisibleModeChoicePath() {
      return routeBuilderViewController.getVisibleModeChoicePath();
    }

    function continueTargetSelection() {
      const selectedIds = getSelectedSectionIds();
      if (!selectedIds.length) {
        return;
      }

      clearRouteTimers();
      routeBuilderController.continueTargetSelection(state, {
        defaultLensId: DEFAULT_LENS_ID,
        selectedIds
      });
      render();
      keepRouteBuilderInView();
    }

    function chooseMode(modeId, pathId = null) {
      clearRouteTimers();
      closeHeroMenu();
      const result = routeBuilderController.chooseMode(state, modeId, {
        pathId,
        defaultLensId: DEFAULT_LENS_ID,
        selectedIds: getSelectedSectionIds(),
        getModePath,
        isModeUnavailable
      });
      if (!result.selected) {
        render();
        keepRouteBuilderInView();
        return;
      }

      if (result.unavailable) {
        gameLaunchController.openUnavailableExperience(modeId);
        render();
        scrollExperienceIntoView();
        return;
      }

      launchExperience();
    }

    function changeGuidingSections() {
      clearRouteTimers();
      routeBuilderController.changeGuidingSections(state, { defaultLensId: DEFAULT_LENS_ID });
      documentRef.body.classList.remove("with-popup");
      render();
      keepRouteBuilderInView();
    }

    function changeModeSelection() {
      clearRouteTimers();
      const selectedIds = getSelectedSectionIds();
      routeBuilderController.changeModeSelection(state, {
        defaultLensId: DEFAULT_LENS_ID,
        selectedIds
      });
      documentRef.body.classList.remove("with-popup");
      render();
      keepRouteBuilderInView();
    }

    function clearFrom(step) {
      clearRouteTimers();
      routeBuilderController.clearFrom(state, step, { defaultLensId: DEFAULT_LENS_ID });
      render();
      keepRouteBuilderInView();
    }

    function openRawConnection(lensId, targetId) {
      if (!lensId || !targetId) {
        return;
      }

      clearRouteTimers();
      routeBuilderController.openRawConnection(state, lensId, targetId);
      launchExperience();
    }

    function openGuideSection(sectionId) {
      if (!sectionId || !hasRegularGuideForSection(sectionId)) {
        return;
      }

      clearRouteTimers();
      routeBuilderController.openGuideSection(state, sectionId);
      launchExperience();
    }

    function openSectionChannel(sectionId) {
      if (!sectionId || !getAlpacaChannelVideosForSection(sectionId).length) {
        return;
      }

      clearRouteTimers();
      routeBuilderController.openSectionChannel(state, sectionId, { normalizeSectionId });
      launchExperience();
    }

    function launchExperience() {
      const result = gameLaunchController.launchSelectedExperience();
      if (!result.launched) {
        return;
      }

      render();
      scrollExperienceIntoView();
    }

    function closeCurrentExperience() {
      if (isAlpacapardyLiveActive()) {
        leaveAlpacapardyLiveRoom();
        return false;
      }

      gameLaunchController.closeExperience();
      render();
      return true;
    }

    function renderExperience() {
      renderCurrentExperience();
    }

    function renderExperiencePreservingScroll() {
      renderPreservingScroll(renderExperience);
    }

    function renderPreservingScroll(renderCallback) {
      const scrollContainer = documentRef.scrollingElement || documentRef.documentElement || documentRef.body;
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : windowRef.scrollY || 0;
      const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : windowRef.scrollX || 0;
      const waitingOverlay = documentRef.querySelector(".live-waiting-overlay");
      const waitingOverlayScrollTop = waitingOverlay ? waitingOverlay.scrollTop : null;
      const waitingOverlayScrollLeft = waitingOverlay ? waitingOverlay.scrollLeft : null;
      const previousHtmlBehavior = documentRef.documentElement ? documentRef.documentElement.style.scrollBehavior : "";
      const previousBodyBehavior = documentRef.body ? documentRef.body.style.scrollBehavior : "";

      if (documentRef.documentElement) {
        documentRef.documentElement.style.scrollBehavior = "auto";
      }
      if (documentRef.body) {
        documentRef.body.style.scrollBehavior = "auto";
      }

      renderCallback();

      const restoreScroll = () => {
        const target = documentRef.scrollingElement || documentRef.documentElement || documentRef.body;
        if (target) {
          target.scrollTop = scrollTop;
          target.scrollLeft = scrollLeft;
        }
        const currentWaitingOverlay = documentRef.querySelector(".live-waiting-overlay");
        if (currentWaitingOverlay && waitingOverlayScrollTop !== null) {
          currentWaitingOverlay.scrollTop = waitingOverlayScrollTop;
          currentWaitingOverlay.scrollLeft = waitingOverlayScrollLeft || 0;
        }
        windowRef.scrollTo({ left: scrollLeft, top: scrollTop, behavior: "auto" });
        if (documentRef.documentElement) {
          documentRef.documentElement.style.scrollBehavior = previousHtmlBehavior;
        }
        if (documentRef.body) {
          documentRef.body.style.scrollBehavior = previousBodyBehavior;
        }
      };

      windowRef.requestAnimationFrame(() => {
        windowRef.requestAnimationFrame(restoreScroll);
      });
    }

    function renderLiveSurfaces() {
      if (state.ui.appShellMode === "online") {
        renderPreservingScroll(render);
        return;
      }

      renderExperiencePreservingScroll();
    }

    return {
      choosePath,
      chooseLens,
      chooseTarget,
      toggleModeChoiceSection,
      getVisibleModeChoicePath,
      continueTargetSelection,
      chooseMode,
      changeGuidingSections,
      changeModeSelection,
      clearFrom,
      openRawConnection,
      openGuideSection,
      openSectionChannel,
      launchExperience,
      closeCurrentExperience,
      renderExperience,
      renderExperiencePreservingScroll,
      renderPreservingScroll,
      renderLiveSurfaces,
      keepRouteBuilderInView
    };
  }

  global.WSC_CREATE_ROUTE_ORCHESTRATION_CONTROLLER = createRouteOrchestrationController;
})(window);
