(function initAlpacapardyBoardController(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC Alpacapardy board controller missing function dependency: " + name);
    }
    return value;
  }

  function createAlpacapardyBoardController(options = {}) {
    const {
      appState: state,
      data = {},
      sectionById = {},
      subjectById = {},
      bigIdeaRoutes = [],
      constants = {},
      engines = {},
      renderers = {},
      callbacks = {}
    } = options;

    if (!state) {
      throw new Error("WSC Alpacapardy board controller missing app state.");
    }

    const GAME_CONFIG = constants.GAME_CONFIG || {};
    const alpacapardyEngine = engines.alpacapardyEngine;
    const alpacapardyRenderer = renderers.alpacapardyRenderer;

    if (!alpacapardyEngine || !alpacapardyRenderer) {
      throw new Error("WSC Alpacapardy board controller missing engine or renderer.");
    }

    const escapeHtml = requiredFunction(callbacks, "escapeHtml");
    const getActiveSubjectCatalog = requiredFunction(callbacks, "getActiveSubjectCatalog");
    const getAlpacapardyLiveRenderContext = requiredFunction(callbacks, "getAlpacapardyLiveRenderContext");
    const getAssetValue = requiredFunction(callbacks, "getAssetValue");
    const getGamePromptLabel = requiredFunction(callbacks, "getGamePromptLabel");
    const getGameplayAssetPath = requiredFunction(callbacks, "getGameplayAssetPath");
    const getGameplayReviewBadge = requiredFunction(callbacks, "getGameplayReviewBadge");
    const getLensCardPluralLabel = requiredFunction(callbacks, "getLensCardPluralLabel");
    const getQuestionsForRouteSelection = requiredFunction(callbacks, "getQuestionsForRouteSelection");
    const getResultAssetPath = requiredFunction(callbacks, "getResultAssetPath");
    const getSectionCounts = requiredFunction(callbacks, "getSectionCounts");
    const getSelectedSectionIds = requiredFunction(callbacks, "getSelectedSectionIds");
    const getSelectionQuestions = requiredFunction(callbacks, "getSelectionQuestions");
    const getSubjectCounts = requiredFunction(callbacks, "getSubjectCounts");
    const getTargetLabel = requiredFunction(callbacks, "getTargetLabel");
    const getTargetLabelForLens = requiredFunction(callbacks, "getTargetLabelForLens");
    const getThemedTeamLabel = requiredFunction(callbacks, "getThemedTeamLabel");
    const getTimerVisualState = requiredFunction(callbacks, "getTimerVisualState");
    const renderAssetImage = requiredFunction(callbacks, "renderAssetImage");
    const renderBreakdowns = requiredFunction(callbacks, "renderBreakdowns");
    const renderCheckpointVisual = requiredFunction(callbacks, "renderCheckpointVisual");
    const renderConfiguredMascotAsset = requiredFunction(callbacks, "renderConfiguredMascotAsset");
    const renderExperienceCloseButton = requiredFunction(callbacks, "renderExperienceCloseButton");
    const renderGameNotes = requiredFunction(callbacks, "renderGameNotes");
    const renderGameQuestionPopup = requiredFunction(callbacks, "renderGameQuestionPopup");
    const renderJeopardyDecoration = requiredFunction(callbacks, "renderJeopardyDecoration");
    const renderMetricCard = requiredFunction(callbacks, "renderMetricCard");
    const renderOptionToken = requiredFunction(callbacks, "renderOptionToken");
    const renderPanelTitle = requiredFunction(callbacks, "renderPanelTitle");
    const renderPopupQuestionTimerPanel = requiredFunction(callbacks, "renderPopupQuestionTimerPanel");
    const shuffle = requiredFunction(callbacks, "shuffle");

    function buildJeopardyExperience() {
      const teamCount = GAME_CONFIG.jeopardyDefaultTeams;
      return {
        type: "jeopardy",
        title: "Alpacapardy",
        playMode: "solo",
        board: [],
        active: null,
        teams: createJeopardyTeams(teamCount),
        activeTeamIndex: 0,
        started: false,
        setupTeamCount: teamCount,
        setupCategoryIds: getDefaultJeopardySetupCategoryIds(),
        answers: [],
        chat: [],
        finished: false
      };
    }

    function renderJeopardyExperience() {
      return alpacapardyRenderer.renderExperience(state.experience, getAlpacapardyRenderHelpers());
    }

    function renderJeopardyFocus(experience) {
      return alpacapardyRenderer.renderFocus(experience, getAlpacapardyRenderHelpers());
    }

    function renderJeopardySetup(experience) {
      return alpacapardyRenderer.renderSetup(experience, getAlpacapardyRenderHelpers());
    }

    function getAlpacapardyRenderHelpers() {
      return {
        config: GAME_CONFIG,
        selectionLens: state.selection.lens,
        sectionById,
        subjectById,
        escapeHtml,
        renderPanelTitle,
        renderConfiguredMascotAsset,
        renderGameQuestionPopup,
        renderPopupQuestionTimerPanel,
        renderCheckpointVisual,
        renderGameNotes,
        renderOptionToken,
        renderJeopardyDecoration,
        renderAssetImage,
        renderExperienceCloseButton,
        renderMetricCard,
        renderBreakdowns,
        getAssetValue,
        getGameplayAssetPath,
        getGameplayReviewBadge,
        getGamePromptLabel,
        getLensCardPluralLabel,
        getTargetLabel,
        getResultAssetPath,
        getSetupOptions: getJeopardySetupOptions,
        getStandings: getJeopardyStandings,
        showInlinePlayMode: false,
        setupPanelTitleOptions: state.ui.appShellMode === "online" ? { showReplay: false, hideSetupTitle: true } : {},
        setupStartAttribute: state.ui.appShellMode === "online" ? "data-jeopardy-live-create" : "data-jeopardy-start",
        setupStartLabel: state.ui.appShellMode === "online" ? "Create game" : "En route",
        getTimerVisualState,
        countTiles: countJeopardyTiles,
        countDoneTiles: countJeopardyDoneTiles,
        allTilesDone: allJeopardyTilesDone,
        isActiveTile: isActiveJeopardyTile,
        live: getAlpacapardyLiveRenderContext()
      };
    }

    function buildJeopardyBoard() {
      const selectionQuestions = getSelectionQuestions();
      const strategies = getJeopardyGroupingStrategies(selectionQuestions);

      for (const strategy of strategies) {
        const board = buildJeopardyBoardFromDefinitions(selectionQuestions, strategy.definitions, strategy.groupCount);
        if (board.length >= GAME_CONFIG.jeopardyMinGroups) {
          return board;
        }
      }

      return buildFallbackJeopardyBoard(selectionQuestions);
    }

    function getJeopardySetupOptions() {
      if (state.selection.lens === "subject") {
        return getActiveSubjectCatalog().map((subject) => ({
          id: subject.id,
          title: subject.label,
          mood: subject.mood || "wise",
          asset: getAssetValue(["contexts", "targets", "subject", subject.id])
        }));
      }

      if (state.selection.lens === "bigidea") {
        return bigIdeaRoutes.map((route) => ({
          id: route.id,
          title: route.label,
          mood: route.mood || "wise",
          asset: getAssetValue(["contexts", "targets", "bigidea", route.id])
        }));
      }

      return (data.sections || []).map((section) => ({
        id: section.id,
        title: section.title,
        mood: "determined",
        asset: getAssetValue(["contexts", "targets", "section", section.id])
      }));
    }

    function getDefaultJeopardySetupCategoryIds() {
      const options = getJeopardySetupOptions();
      const selectedSectionIds = state.selection.lens === "section" ? getSelectedSectionIds() : [];
      if (selectedSectionIds.length) {
        const preferred = options.filter((option) => selectedSectionIds.includes(option.id));
        const fallback = options.filter((option) => !selectedSectionIds.includes(option.id));
        return preferred
          .concat(fallback)
          .slice(0, GAME_CONFIG.jeopardyMinGroups)
          .map((option) => option.id);
      }

      const preferred = state.selection.targetId && state.selection.targetId !== "all"
        ? options.filter((option) => option.id === state.selection.targetId)
        : [];
      const fallback = options.filter((option) => option.id !== state.selection.targetId);
      return preferred
        .concat(fallback)
        .slice(0, GAME_CONFIG.jeopardyMinGroups)
        .map((option) => option.id);
    }

    function getTargetSetupOptions() {
      return getJeopardySetupOptions();
    }

    function getDefaultTargetSetupCategoryIds() {
      return getDefaultJeopardySetupCategoryIds();
    }

    function getSetupTargetHeading() {
      return `Pick your targeted ${getLensCardPluralLabel(state.selection.lens)}`;
    }

    function getSetupTargetHelper(selectedCount) {
      const minimum = GAME_CONFIG.jeopardyMinGroups;
      return `${selectedCount} selected. Minimum ${minimum}.`;
    }

    function buildConfiguredJeopardyBoard(categoryIds) {
      return alpacapardyEngine.buildConfiguredBoard(categoryIds, {
        values: GAME_CONFIG.jeopardyValues,
        getQuestionsForCategory: (categoryId) => getQuestionsForRouteSelection(state.selection.lens, categoryId),
        getCategoryLabel: (categoryId) => getTargetLabelForLens(state.selection.lens, categoryId),
        selectionQuestions: getSelectionQuestions,
        shuffle
      });
    }

    function pickQuestionsForJeopardyCategory(pool, usedQuestionIds) {
      return alpacapardyEngine.pickQuestionsForCategory(pool, usedQuestionIds, {
        values: GAME_CONFIG.jeopardyValues,
        selectionQuestions: getSelectionQuestions,
        shuffle
      });
    }

    function getJeopardyGroupingStrategies(selectionQuestions) {
      const strategies = [];

      if (state.selection.lens === "section" && state.selection.targetId !== "all") {
        strategies.push({
          groupCount: GAME_CONFIG.jeopardyMinGroups,
          definitions: getJeopardySourceTypeDefinitions()
        });
      }

      if (state.selection.lens === "subject" && state.selection.targetId === "all") {
        strategies.push({
          groupCount: GAME_CONFIG.jeopardyMaxGroups,
          definitions: getSubjectCounts(selectionQuestions)
            .slice(0, GAME_CONFIG.jeopardyMaxGroups)
            .map((entry) => ({
              label: entry.label,
              match: (question) => question.subjectIds.includes(entry.id)
            }))
        });
      }

      strategies.push({
        groupCount: GAME_CONFIG.jeopardyMaxGroups,
        definitions: getSectionCounts(selectionQuestions)
          .slice(0, GAME_CONFIG.jeopardyMaxGroups)
          .map((entry) => ({
            label: entry.label,
            match: (question) => question.sectionId === entry.id
          }))
      });

      strategies.push({
        groupCount: GAME_CONFIG.jeopardyMinGroups,
        definitions: getJeopardySourceTypeDefinitions()
      });

      return strategies;
    }

    function getJeopardySourceTypeDefinitions() {
      return [
        {
          label: "Core Ideas",
          match: (question) => question.sourceType === "definition"
        },
        {
          label: "Examples",
          match: (question) => question.sourceType === "example"
        },
        {
          label: "Must-Know Points",
          match: (question) => question.sourceType === "point"
        },
        {
          label: "Keywords",
          match: (question) => question.sourceType === "keyword"
        }
      ];
    }

    function createJeopardyTile(question, index) {
      return alpacapardyEngine.createTile(question, index, GAME_CONFIG.jeopardyValues);
    }

    function buildJeopardyBoardFromDefinitions(selectionQuestions, definitions, groupCount) {
      return alpacapardyEngine.buildBoardFromDefinitions(selectionQuestions, definitions, groupCount, {
        values: GAME_CONFIG.jeopardyValues,
        shuffle
      });
    }

    function buildFallbackJeopardyBoard(selectionQuestions) {
      return alpacapardyEngine.buildFallbackBoard(selectionQuestions, {
        values: GAME_CONFIG.jeopardyValues,
        minGroups: GAME_CONFIG.jeopardyMinGroups,
        maxGroups: GAME_CONFIG.jeopardyMaxGroups,
        shuffle
      });
    }

    function createJeopardyTeams(count = GAME_CONFIG.jeopardyDefaultTeams) {
      return alpacapardyEngine.createTeams(count, getThemedTeamLabel);
    }

    function getJeopardyActiveTeam(experience) {
      return experience.teams[experience.activeTeamIndex] || experience.teams[0];
    }

    function getJeopardyStandings(teams) {
      return alpacapardyEngine.getStandings(teams);
    }

    function renderJeopardyTeams(experience) {
      return alpacapardyRenderer.renderTeams(experience, getAlpacapardyRenderHelpers());
    }

    function renderJeopardyCategoryHeader(label) {
      return alpacapardyRenderer.renderCategoryHeader(label, getAlpacapardyRenderHelpers());
    }

    function renderJeopardyTileFace(tile) {
      return alpacapardyRenderer.renderTileFace(tile, getAlpacapardyRenderHelpers());
    }

    function renderJeopardyResults(experience) {
      return alpacapardyRenderer.renderResults(experience, getAlpacapardyRenderHelpers());
    }

    function countJeopardyTiles(board) {
      return alpacapardyEngine.countTiles(board);
    }

    function countJeopardyDoneTiles(board) {
      return alpacapardyEngine.countDoneTiles(board);
    }

    function allJeopardyTilesDone(board) {
      return alpacapardyEngine.allTilesDone(board);
    }

    function isActiveJeopardyTile(groupIndex, tileIndex) {
      return Boolean(
        state.experience &&
          state.experience.type === "jeopardy" &&
          state.experience.active &&
          state.experience.active.groupIndex === groupIndex &&
          state.experience.active.tileIndex === tileIndex
      );
    }

    return Object.freeze({
      buildJeopardyExperience,
      renderJeopardyExperience,
      renderJeopardyFocus,
      renderJeopardySetup,
      getAlpacapardyRenderHelpers,
      buildJeopardyBoard,
      getJeopardySetupOptions,
      getDefaultJeopardySetupCategoryIds,
      getTargetSetupOptions,
      getDefaultTargetSetupCategoryIds,
      getSetupTargetHeading,
      getSetupTargetHelper,
      buildConfiguredJeopardyBoard,
      pickQuestionsForJeopardyCategory,
      getJeopardyGroupingStrategies,
      getJeopardySourceTypeDefinitions,
      createJeopardyTile,
      buildJeopardyBoardFromDefinitions,
      buildFallbackJeopardyBoard,
      createJeopardyTeams,
      getJeopardyActiveTeam,
      getJeopardyStandings,
      renderJeopardyTeams,
      renderJeopardyCategoryHeader,
      renderJeopardyTileFace,
      renderJeopardyResults,
      countJeopardyTiles,
      countJeopardyDoneTiles,
      allJeopardyTilesDone,
      isActiveJeopardyTile
    });
  }

  global.WSC_CREATE_ALPACAPARDY_BOARD_CONTROLLER = createAlpacapardyBoardController;
}(window));
