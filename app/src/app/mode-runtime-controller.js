(function () {
  const POPUP_MODE_TYPES = Object.freeze(["rawcontent", "mindmap"]);

  function createModeRuntimeController({
    appState,
    refs,
    domService,
    renderers = {},
    callbacks = {}
  } = {}) {
    if (!appState || !refs || !domService) {
      throw new Error("createModeRuntimeController requires appState, refs, and domService.");
    }

    function resetRawMediaUi() {
      appState.ui.rawMediaLightbox = null;
      appState.ui.rawMediaSwipeStartX = null;
    }

    function clearExperiencePanel() {
      resetRawMediaUi();
      refs.experiencePanel.classList.add("hidden");
      refs.experiencePanel.classList.remove("experience-panel--mindmap");
      domService.clearHtml(refs.experiencePanel);
      callbacks.stopMindMapOrbitAnimation?.();
      callbacks.syncPopupScrollLock?.();
      callbacks.syncActiveModalFocus?.();
    }

    function renderCurrentExperience() {
      if (appState.ui.appShellMode === "online" || !appState.experience) {
        clearExperiencePanel();
        return { rendered: false, reason: appState.ui.appShellMode === "online" ? "online-shell" : "no-experience" };
      }

      const experienceType = appState.experience.type;
      refs.experiencePanel.classList.remove("hidden");
      refs.experiencePanel.classList.toggle("experience-panel--mindmap", experienceType === "mindmap");

      if (!POPUP_MODE_TYPES.includes(experienceType) && appState.ui.rawMediaLightbox) {
        resetRawMediaUi();
      }

      const renderer = renderers[experienceType] || null;
      if (typeof renderer === "function") {
        domService.setHtml(refs.experiencePanel, renderer());
      }

      callbacks.syncExperienceTimers?.();
      callbacks.syncPopupScrollLock?.();
      callbacks.syncRadialMindMapScroll?.();
      callbacks.syncMindMapOrbitAnimation?.();
      callbacks.syncRawQuestionGalleries?.();
      callbacks.syncActiveModalFocus?.();

      return { rendered: Boolean(renderer), type: experienceType };
    }

    return Object.freeze({
      clearExperiencePanel,
      renderCurrentExperience
    });
  }

  window.WSC_CREATE_MODE_RUNTIME_CONTROLLER = createModeRuntimeController;
}());
