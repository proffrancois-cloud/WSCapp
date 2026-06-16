(function () {
  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC app learn runtime requires ${name}().`);
    }
    return value;
  }

  function createAppLearnRuntime(options = {}) {
    const state = options.appState;
    const refs = options.refs || {};
    const document = options.documentRef || globalThis.document;
    const window = options.windowRef || globalThis.window;
    const factories = options.factories || {};
    const data = options.data || {};
    const services = options.services || {};
    const renderers = options.renderers || {};
    const helpers = options.helpers || {};
    const callbacks = options.callbacks || {};
    const knowledge = options.knowledge || {};

    const createMindMapOrbitController = requireFunction(factories, "createMindMapOrbitController");
    const createMindMapController = requireFunction(factories, "createMindMapController");
    const createAlpacardsController = requireFunction(factories, "createAlpacardsController");
    const createAlpacaChannelController = requireFunction(factories, "createAlpacaChannelController");
    const createLearnSlideshowController = requireFunction(factories, "createLearnSlideshowController");
    const createRawContentController = requireFunction(factories, "createRawContentController");
    const createRegularGuideController = requireFunction(factories, "createRegularGuideController");

    const mindMapOrbitController = createMindMapOrbitController({
      appState: state,
      refs,
      windowRef: window,
      documentRef: document
    });

    const mindMapController = createMindMapController({
      appState: state,
      data: {
        sections: data.sections,
        sectionById: data.sectionById,
        bigIdeaRoutes: data.bigIdeaRoutes
      },
      renderers: {
        mindMapMode: renderers.mindMapMode
      },
      helpers: {
        compareRawEntriesByOfficialOrder: helpers.compareRawEntriesByOfficialOrder,
        escapeHtml: helpers.escapeHtml,
        findBigIdeaRouteIdByLabel: helpers.findBigIdeaRouteIdByLabel,
        findLearnSubjectRouteIdByLabel: helpers.findLearnSubjectRouteIdByLabel,
        getActiveSubjectCatalog: helpers.getActiveSubjectCatalog,
        getApprovedRawContentSection: helpers.getApprovedRawContentSection,
        getLensLabel: helpers.getLensLabel,
        getRawEntriesForRouteSelection: helpers.getRawEntriesForRouteSelection,
        getRawEntriesForSelection: helpers.getRawEntriesForSelection,
        getRawEntryMasteryKey: helpers.getRawEntryMasteryKey,
        getRegularGuideForSection: helpers.getRegularGuideForSection,
        getSelectedSectionIds: helpers.getSelectedSectionIds,
        getTargetLabel: helpers.getTargetLabel,
        getTargetLabelForLens: helpers.getTargetLabelForLens,
        normalizeSectionId: helpers.normalizeSectionId,
        renderAlpacaList: helpers.renderAlpacaList,
        renderLearnCardFooterNav: helpers.renderLearnCardFooterNav,
        renderPanelTitle: helpers.renderPanelTitle,
        renderRawMasteryToggle: helpers.renderRawMasteryToggle,
        renderRawMediaLightbox: helpers.renderRawMediaLightbox,
        renderRawQuizPager: helpers.renderRawQuizPager,
        renderRawStudentAssets: helpers.renderRawStudentAssets,
        renderRegularGuideDocument: helpers.renderRegularGuideDocument,
        renderRegularGuideQuestionBlock: helpers.renderRegularGuideQuestionBlock,
        renderTextWithBreaks: helpers.renderTextWithBreaks,
        usesGranularLearnSubjects: helpers.usesGranularLearnSubjects
      },
      callbacks: {
        renderExperience: callbacks.renderExperience,
        syncPopupScrollLock: callbacks.syncPopupScrollLock
      }
    });

    const alpacardsController = createAlpacardsController({
      appState: state,
      refs,
      data: {
        getCards: data.getAlpacards
      },
      renderers: {
        alpacardsMode: renderers.alpacardsMode
      },
      helpers: {
        escapeHtml: helpers.escapeHtml,
        getSelectedSectionIds: helpers.getSelectedSectionIds,
        getSelectionQuestions: helpers.getSelectionQuestions,
        getTargetLabel: helpers.getTargetLabel,
        normalizeSectionId: helpers.normalizeSectionId,
        renderLearnCardFooterNav: helpers.renderLearnCardFooterNav,
        renderPanelTitle: helpers.renderPanelTitle,
        shuffle: helpers.shuffle
      },
      callbacks: {
        renderExperience: callbacks.renderExperience
      }
    });

    const alpacaChannelController = createAlpacaChannelController({
      appState: state,
      data: {
        alpacaChannelCatalog: data.alpacaChannelCatalog,
        sectionById: data.sectionById,
        subjectById: data.subjectById,
        bigIdeaRouteById: data.bigIdeaRouteById,
        learnSubjectRouteById: data.learnSubjectRouteById
      },
      services: {
        videoService: services.appVideoService
      },
      renderers: {
        alpacaChannelMode: renderers.alpacaChannelMode
      },
      helpers: {
        escapeHtml: helpers.escapeHtml,
        getApprovedRawContentSection: helpers.getApprovedRawContentSection,
        getModeAssetPath: helpers.getModeAssetPath,
        getRawEntriesForSelection: helpers.getRawEntriesForSelection,
        getSectionIdFromGuidingTitle: helpers.getSectionIdFromGuidingTitle,
        getSelectedSectionIds: helpers.getSelectedSectionIds,
        getSelectedSectionLabels: helpers.getSelectedSectionLabels,
        getTargetLabel: helpers.getTargetLabel,
        mapRawEntriesWithSection: helpers.mapRawEntriesWithSection,
        normalizeKnowledgeKey: helpers.normalizeKnowledgeKey,
        normalizeSectionId: helpers.normalizeSectionId,
        renderConfiguredMascotAsset: helpers.renderConfiguredMascotAsset,
        renderLearnCardFooterNav: helpers.renderLearnCardFooterNav,
        renderPanelTitle: helpers.renderPanelTitle
      },
      callbacks: {
        renderExperience: callbacks.renderExperience
      }
    });

    const learnSlideshowController = createLearnSlideshowController({
      appState: state,
      data: {
        theme: data.theme,
        insights: data.insights,
        sections: data.sections,
        sectionById: data.sectionById,
        knowledgeBank: data.knowledgeBank,
        bigIdeaRoutes: data.bigIdeaRoutes
      },
      helpers: {
        escapeHtml: helpers.escapeHtml,
        getActiveSubjectCatalog: helpers.getActiveSubjectCatalog,
        getActiveSubjectKnowledgeMap: helpers.getActiveSubjectKnowledgeMap,
        getAssetValue: helpers.getAssetValue,
        getBigIdeaKnowledgeById: knowledge.getBigIdeaKnowledgeById,
        getKnowledgeContext: helpers.getKnowledgeContext,
        getPrimaryTargetAssetPath: helpers.getTargetAssetPath,
        getSectionKnowledgeById: knowledge.getSectionKnowledgeById,
        getSelectionQuestions: helpers.getSelectionQuestions,
        getTargetLabel: helpers.getTargetLabel,
        normalizeKnowledgeKey: helpers.normalizeKnowledgeKey,
        renderAlpacaList: helpers.renderAlpacaList,
        renderConfiguredMascotAsset: helpers.renderConfiguredMascotAsset,
        renderPanelTitle: helpers.renderPanelTitle,
        usesGranularLearnSubjects: helpers.usesGranularLearnSubjects
      },
      callbacks: {
        render: callbacks.render,
        renderExperience: callbacks.renderExperience
      }
    });

    const rawContentController = createRawContentController({
      appState: state,
      refs,
      documentRef: document,
      windowRef: window,
      services: {
        rawContentService: services.rawContentService,
        appVideoService: services.appVideoService
      },
      renderers: {
        rawContentMode: renderers.rawContentMode,
        rawContentEntryRenderer: renderers.rawContentEntryRenderer,
        rawContentQuizRenderer: renderers.rawContentQuizRenderer,
        rawContentMediaLightbox: renderers.rawContentMediaLightbox,
        rawContentVisualAssets: renderers.rawContentVisualAssets,
        rawContentTransferTable: renderers.rawContentTransferTable,
        rawContentMastery: renderers.rawContentMastery
      },
      data: {
        IMPORTED_RAW_CONTENT_BANK: data.importedRawContentBank,
        sectionById: data.sectionById,
        subjectById: data.subjectById,
        bigIdeaRouteById: data.bigIdeaRouteById,
        learnSubjectRouteById: data.learnSubjectRouteById,
        BIG_IDEA_ROUTES: data.bigIdeaRoutes,
        LEARN_SUBJECT_ROUTES: data.learnSubjectRoutes
      },
      helpers: {
        escapeHtml: helpers.escapeHtml,
        compareOfficialSectionOrder: helpers.compareOfficialSectionOrder,
        compareRawEntriesByOfficialOrder: helpers.compareRawEntriesByOfficialOrder,
        entryMatchesLearnSubjectRoute: helpers.entryMatchesLearnSubjectRoute,
        getAlpacaChannelVideosForEntry: helpers.getAlpacaChannelVideosForEntry,
        getAssetValue: helpers.getAssetValue,
        getEmbeddableVideo: helpers.getEmbeddableVideo,
        getModeAssetPath: helpers.getModeAssetPath,
        getSectionIdFromGuidingTitle: helpers.getSectionIdFromGuidingTitle,
        getSelectedSectionIds: helpers.getSelectedSectionIds,
        getTargetLabel: helpers.getTargetLabel,
        getTargetLabelForLens: helpers.getTargetLabelForLens,
        getVideoPreview: helpers.getVideoPreview,
        normalizeKnowledgeKey: helpers.normalizeKnowledgeKey,
        renderAlpacaList: helpers.renderAlpacaList,
        renderLearnCardFooterNav: helpers.renderLearnCardFooterNav,
        renderOptionToken: helpers.renderOptionToken,
        renderPanelTitle: helpers.renderPanelTitle,
        usesGranularLearnSubjects: helpers.usesGranularLearnSubjects
      },
      callbacks: {
        renderExperience: callbacks.renderExperience,
        renderStats: callbacks.renderStats,
        saveRawMastery: callbacks.saveRawMastery,
        syncPopupScrollLock: callbacks.syncPopupScrollLock
      }
    });

    const regularGuideController = createRegularGuideController({
      appState: state,
      data: {
        importedRawContentBank: data.importedRawContentBank,
        sectionById: data.sectionById
      },
      renderers: {
        regularGuideMode: renderers.regularGuideMode
      },
      helpers: {
        escapeHtml: helpers.escapeHtml,
        getAlpacaChannelVideosForSection: helpers.getAlpacaChannelVideosForSection,
        getApprovedRawContentSection: helpers.getApprovedRawContentSection,
        getModeAssetPath: helpers.getModeAssetPath,
        getOrderedRawContentSections: helpers.getOrderedRawContentSections,
        getRawContentScopeLabel: helpers.getRawContentScopeLabel,
        getRawEntriesForSelection: helpers.getRawEntriesForSelection,
        getRawQuizPageIndex: helpers.getRawQuizPageIndex,
        getRawQuizQuestionKey: helpers.getRawQuizQuestionKey,
        getSectionIdFromGuidingTitle: helpers.getSectionIdFromGuidingTitle,
        getSelectedSectionIds: helpers.getSelectedSectionIds,
        getTargetLabel: helpers.getTargetLabel,
        renderLearnCardFooterNav: helpers.renderLearnCardFooterNav,
        renderOptionToken: helpers.renderOptionToken,
        renderPanelTitle: helpers.renderPanelTitle,
        renderRawBackToTopButton: helpers.renderRawBackToTopButton,
        renderRawQuizFeedback: helpers.renderRawQuizFeedback,
        renderRawQuizOptionStateClass: helpers.renderRawQuizOptionStateClass,
        renderSectionTransferTable: helpers.renderSectionTransferTable,
        stableShuffleByKey: helpers.stableShuffleByKey
      }
    });

    return Object.freeze({
      mindMapOrbitController,
      mindMapController,
      alpacardsController,
      alpacaChannelController,
      learnSlideshowController,
      rawContentController,
      regularGuideController
    });
  }

  window.WSC_CREATE_APP_LEARN_RUNTIME = createAppLearnRuntime;
}());
