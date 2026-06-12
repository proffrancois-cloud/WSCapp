(function () {
  function createGameLaunchController({
    appState,
    experienceFactories = {},
    unavailableFactory = null,
    cleanupCallbacks = []
  } = {}) {
    if (!appState) {
      throw new Error("createGameLaunchController requires appState.");
    }

    function runCleanup() {
      cleanupCallbacks.forEach((callback) => {
        if (typeof callback === "function") {
          callback();
        }
      });
    }

    function resetCurrentRouteAttempts() {
      appState.ui.rawQuizSelections = {};
      appState.ui.rawQuizPages = {};
      appState.ui.rawMediaLightbox = null;
      appState.ui.rawMediaSwipeStartX = null;
    }

    function getFactory(modeId) {
      return typeof experienceFactories[modeId] === "function"
        ? experienceFactories[modeId]
        : null;
    }

    function launchSelectedExperience() {
      const modeId = appState.selection?.mode;
      const factory = getFactory(modeId);

      if (!modeId || !factory) {
        return { launched: false, modeId };
      }

      runCleanup();
      appState.experience = factory();
      return {
        launched: Boolean(appState.experience),
        modeId,
        experience: appState.experience
      };
    }

    function openUnavailableExperience(modeId) {
      if (typeof unavailableFactory !== "function") {
        return { opened: false, modeId };
      }

      runCleanup();
      appState.experience = unavailableFactory(modeId);
      return {
        opened: Boolean(appState.experience),
        modeId,
        experience: appState.experience
      };
    }

    function closeExperience() {
      runCleanup();
      appState.experience = null;
      return true;
    }

    return Object.freeze({
      resetCurrentRouteAttempts,
      launchSelectedExperience,
      openUnavailableExperience,
      closeExperience
    });
  }

  window.WSC_CREATE_GAME_LAUNCH_CONTROLLER = createGameLaunchController;
}());
