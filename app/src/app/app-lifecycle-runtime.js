(function () {
  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC app lifecycle runtime requires ${name}().`);
    }
    return value;
  }

  function createAppLifecycleRuntime(options = {}) {
    const state = options.appState;
    const refs = options.refs || {};
    const document = options.documentRef || globalThis.document;
    const window = options.windowRef || globalThis.window;
    const bootstrapService = options.bootstrapService;
    const domService = options.domService;
    const controllers = options.controllers || {};
    const callbacks = options.callbacks || {};

    const arcadeRuntimeTimerController = controllers.arcadeRuntimeTimerController;
    const arcadeJumpAnimationController = controllers.arcadeJumpAnimationController;
    const hydrateKnowledgeBank = requireFunction(callbacks, "hydrateKnowledgeBank");
    const preloadExperienceAudio = requireFunction(callbacks, "preloadExperienceAudio");
    const setupSupabaseAuth = requireFunction(callbacks, "setupSupabaseAuth");
    const renderHeroVisual = requireFunction(callbacks, "renderHeroVisual");
    const renderInsights = requireFunction(callbacks, "renderInsights");
    const render = requireFunction(callbacks, "render");
    const handleClick = requireFunction(callbacks, "handleClick");
    const handleInput = requireFunction(callbacks, "handleInput");
    const handleSubmit = requireFunction(callbacks, "handleSubmit");
    const handleKeyDown = requireFunction(callbacks, "handleKeyDown");
    const handleMindMapGalleryWheel = requireFunction(callbacks, "handleMindMapGalleryWheel");
    const handleTouchStart = requireFunction(callbacks, "handleTouchStart");
    const handleTouchEnd = requireFunction(callbacks, "handleTouchEnd");
    const syncRadialMindMapScroll = requireFunction(callbacks, "syncRadialMindMapScroll");

    if (!state || !bootstrapService || !domService || !arcadeRuntimeTimerController || !arcadeJumpAnimationController) {
      throw new Error("WSC app lifecycle runtime missing required state, services, or controllers.");
    }

    function syncExperienceTimers() {
      arcadeRuntimeTimerController.syncExperienceTimers();

      if (
        !state.experience ||
        state.experience.type !== "jump" ||
        state.experience.phase !== "running" ||
        state.experience.finished
      ) {
        arcadeJumpAnimationController.clearJumpAnimation();
      } else if (!arcadeJumpAnimationController.hasActiveJumpAnimation()) {
        arcadeJumpAnimationController.startJumpAnimation();
      }
    }

    function init() {
      const startupTasks = [
        hydrateKnowledgeBank,
        preloadExperienceAudio,
        setupSupabaseAuth,
        () => {
          if (refs.heroMascot) {
            domService.setHtml(refs.heroMascot, renderHeroVisual());
          }
        },
        renderInsights,
        render
      ];
      const eventBindings = [
        { target: document, type: "click", handler: handleClick },
        { target: document, type: "input", handler: handleInput },
        { target: document, type: "submit", handler: handleSubmit },
        { target: document, type: "keydown", handler: handleKeyDown },
        { target: document, type: "wheel", handler: handleMindMapGalleryWheel, options: { passive: false } },
        { target: document, type: "touchstart", handler: handleTouchStart, options: { passive: true } },
        { target: document, type: "touchend", handler: handleTouchEnd, options: { passive: true } },
        { target: window, type: "resize", handler: syncRadialMindMapScroll }
      ];

      bootstrapService.runStartupTasks(startupTasks);
      bootstrapService.markAppReady({
        windowTarget: window,
        flagName: "WSC_APP_READY",
        eventName: "wsc:app-ready"
      });
      return bootstrapService.registerEventListeners(eventBindings);
    }

    return Object.freeze({
      init,
      syncExperienceTimers
    });
  }

  window.WSC_CREATE_APP_LIFECYCLE_RUNTIME = createAppLifecycleRuntime;
}());
