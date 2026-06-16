(function () {
  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC app shell runtime requires ${name}().`);
    }
    return value;
  }

  function createAppShellRuntime(options = {}) {
    const state = options.appState;
    const refs = options.refs || {};
    const document = options.documentRef || globalThis.document;
    const window = options.windowRef || globalThis.window;
    const factories = options.factories || {};
    const services = options.services || {};
    const constants = options.constants || {};
    const helpers = options.helpers || {};
    const callbacks = options.callbacks || {};
    const localActions = options.actions || {};

    const createAppActionRegistry = requireFunction(factories, "createAppActionRegistry");
    const createAppEventRouter = requireFunction(factories, "createAppEventRouter");
    const createAppShellRenderer = requireFunction(factories, "createAppShellRenderer");
    const createAppShellController = requireFunction(factories, "createAppShellController");

    const appActions = createAppActionRegistry({
      actions: localActions
    });

    const appEventRouter = createAppEventRouter({
      appState: state,
      refs,
      alpacapardyLiveSupabaseService: services.alpacapardyLiveSupabaseService,
      windowRef: window,
      documentRef: document,
      actions: appActions
    });

    const appShellRenderer = createAppShellRenderer({
      appState: state,
      refs,
      appDomService: services.appDomService,
      appStateService: services.appStateService,
      appEntryService: services.appEntryService,
      onlineModeController: services.onlineModeController,
      authModalRenderer: services.authModalRenderer,
      constants: {
        ASSET_CACHE_VERSION: constants.ASSET_CACHE_VERSION,
        DISCORD_INVITE_URL: constants.DISCORD_INVITE_URL,
        CONTACT_EMAIL_URL: constants.CONTACT_EMAIL_URL,
        WSC_ROUND_OPTIONS: constants.WSC_ROUND_OPTIONS,
        LIVE_GAME_ORDER: constants.LIVE_GAME_ORDER,
        ALPACA_RUN_ROUTE: constants.ALPACA_RUN_ROUTE,
        RESOURCE_LINKS: constants.RESOURCE_LINKS,
        insights: constants.insights
      },
      helpers: {
        escapeHtml: helpers.escapeHtml,
        getPathOption: helpers.getPathOption,
        getModePath: helpers.getModePath,
        getModeAssetPath: helpers.getModeAssetPath,
        getModeOption: helpers.getModeOption,
        getWizardCardAsset: helpers.getWizardCardAsset,
        normalizeLiveGameType: helpers.normalizeLiveGameType,
        renderConfiguredMascotAsset: helpers.renderConfiguredMascotAsset
      },
      callbacks: {
        syncActiveModalFocus: callbacks.syncActiveModalFocus,
        isSignedIn: callbacks.isSignedIn,
        canDismissAuthModal: callbacks.canDismissAuthModal,
        canAccessCampusPreview: callbacks.canAccessCampusPreview,
        getCurrentUserEmail: callbacks.getCurrentUserEmail,
        getTotalRawMasterableEntries: callbacks.getTotalRawMasterableEntries,
        getMasteredRawEntryCount: callbacks.getMasteredRawEntryCount,
        getDefaultStats: callbacks.getDefaultStats,
        getLiveGameLabel: callbacks.getLiveGameLabel,
        getSelectedSectionIds: callbacks.getSelectedSectionIds,
        getSelectedSectionLabels: callbacks.getSelectedSectionLabels,
        getTargetLabel: callbacks.getTargetLabel
      }
    });

    const appShellController = createAppShellController({
      appState: state,
      refs,
      appStateService: services.appStateService,
      appShellRenderer,
      onlineModeController: services.onlineModeController,
      modalFocusService: services.modalFocusService,
      documentRef: document,
      constants: {
        DEFAULT_LENS_ID: constants.DEFAULT_LENS_ID
      },
      callbacks: {
        renderSummary: callbacks.renderSummary,
        renderWizard: callbacks.renderWizard,
        renderLiveOverlayMount: callbacks.renderLiveOverlayMount,
        renderExperience: callbacks.renderExperience,
        resetAlpacapardyLiveState: callbacks.resetAlpacapardyLiveState,
        canAccessLegacyLiveRooms: callbacks.canAccessLegacyLiveRooms,
        getLegacyLiveRoomsDisabledMessage: callbacks.getLegacyLiveRoomsDisabledMessage,
        buildJeopardyExperience: callbacks.buildJeopardyExperience,
        refreshAlpacapardyLiveLobby: callbacks.refreshAlpacapardyLiveLobby
      }
    });

    return Object.freeze({
      appActions,
      appEventRouter,
      appShellRenderer,
      appShellController
    });
  }

  window.WSC_CREATE_APP_SHELL_RUNTIME = createAppShellRuntime;
}());
