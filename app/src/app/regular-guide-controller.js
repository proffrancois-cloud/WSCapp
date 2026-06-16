(function initRegularGuideController(global) {
  "use strict";

  function requireObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error(`WSC regular guide controller requires ${name}.`);
    }
    return value;
  }

  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC regular guide controller requires ${name}().`);
    }
    return value;
  }

  function createRegularGuideController(options = {}) {
    const state = requireObject(options.appState, "appState");
    const data = options.data || {};
    const renderers = options.renderers || {};
    const helpers = options.helpers || {};

    const regularGuideMode = requireObject(renderers.regularGuideMode, "regularGuideMode");
    const importedRawContentBank = data.importedRawContentBank || {};
    const sectionById = data.sectionById || {};

    const escapeHtml = requireFunction(helpers, "escapeHtml");
    const getAlpacaChannelVideosForSection = requireFunction(helpers, "getAlpacaChannelVideosForSection");
    const getApprovedRawContentSection = requireFunction(helpers, "getApprovedRawContentSection");
    const getModeAssetPath = requireFunction(helpers, "getModeAssetPath");
    const getOrderedRawContentSections = requireFunction(helpers, "getOrderedRawContentSections");
    const getRawContentScopeLabel = requireFunction(helpers, "getRawContentScopeLabel");
    const getRawEntriesForSelection = requireFunction(helpers, "getRawEntriesForSelection");
    const getRawQuizPageIndex = requireFunction(helpers, "getRawQuizPageIndex");
    const getRawQuizQuestionKey = requireFunction(helpers, "getRawQuizQuestionKey");
    const getSectionIdFromGuidingTitle = requireFunction(helpers, "getSectionIdFromGuidingTitle");
    const getSelectedSectionIds = requireFunction(helpers, "getSelectedSectionIds");
    const getTargetLabel = requireFunction(helpers, "getTargetLabel");
    const renderLearnCardFooterNav = requireFunction(helpers, "renderLearnCardFooterNav");
    const renderOptionToken = requireFunction(helpers, "renderOptionToken");
    const renderPanelTitle = requireFunction(helpers, "renderPanelTitle");
    const renderRawBackToTopButton = requireFunction(helpers, "renderRawBackToTopButton");
    const renderRawQuizFeedback = requireFunction(helpers, "renderRawQuizFeedback");
    const renderRawQuizOptionStateClass = requireFunction(helpers, "renderRawQuizOptionStateClass");
    const renderSectionTransferTable = requireFunction(helpers, "renderSectionTransferTable");
    const stableShuffleByKey = requireFunction(helpers, "stableShuffleByKey");

    function buildExperience() {
      return regularGuideMode.buildExperience(getTargetLabel(), getGuidesForSelection());
    }

    function getGuideForSection(section) {
      if (!section) {
        return null;
      }
      const sectionId = section.id || getSectionIdFromGuidingTitle(section.guidingSection || section.title);
      const guide = section.regularGuide || importedRawContentBank[sectionId]?.regularGuide || null;
      return guide
        ? {
            ...guide,
            sectionId,
            sectionTitle: section.guidingSection || section.title || guide.title
          }
        : null;
    }

    function getGuidesForSelection() {
      if (state.selection.lens !== "section") {
        return [];
      }

      const sections = getOrderedRawContentSections();
      const selectedSectionIds = getSelectedSectionIds();

      if (selectedSectionIds.length) {
        const selected = new Set(selectedSectionIds);
        return sections
          .filter((section) => selected.has(section.id))
          .map(getGuideForSection)
          .filter(Boolean);
      }

      if (state.selection.targetId === "all") {
        return sections.map(getGuideForSection).filter(Boolean);
      }

      if (state.selection.lens === "section") {
        const section = getApprovedRawContentSection(state.selection.targetId);
        return [getGuideForSection(section)].filter(Boolean);
      }

      const sectionIds = new Set(getRawEntriesForSelection().map((entry) => entry.sectionId).filter(Boolean));
      return sections
        .filter((section) => sectionIds.has(section.id))
        .map(getGuideForSection)
        .filter(Boolean);
    }

    function renderExperience() {
      return regularGuideMode.renderExperience(state.experience, getRenderContext(), getRenderHelpers());
    }

    function renderDocument(guide) {
      return regularGuideMode.renderDocument(guide, getRenderHelpers());
    }

    function renderQuestionBlock(section) {
      return regularGuideMode.renderQuestionBlock(section, getRenderContext(), getRenderHelpers());
    }

    function renderNavigation(section) {
      return regularGuideMode.renderNavigation(section, getRenderContext(), getRenderHelpers());
    }

    function renderSectionChannelButton(sectionId) {
      return regularGuideMode.renderSectionChannelButton(sectionId, getRenderContext(), getRenderHelpers());
    }

    function getSectionGuideQuestions(section) {
      return Array.isArray(section?.guideQuestions) ? section.guideQuestions : [];
    }

    function renderGuideQuizQuestion(question, section, questionIndex) {
      const quizKey = getRawQuizQuestionKey(question);
      const selectedIndex = state.ui.rawQuizSelections[quizKey];
      const options = stableShuffleByKey([
        {
          text: question.correctAnswer,
          correct: true
        },
        ...(question.wrongAnswers || []).map((answer) => ({
          text: answer,
          correct: false
        }))
      ].filter((option) => option.text), `${question.level}|${section.id}|${question.prompt}|${question.correctAnswer}`);
      const selectedOption = Number.isInteger(selectedIndex) ? options[selectedIndex] : null;

      return `
        <article class="raw-quiz-card">
          <p class="raw-quiz-prompt">${escapeHtml(question.prompt)}</p>
          <div class="raw-quiz-options">
            ${options.map((option, index) => `
              <button
                class="raw-quiz-option ${renderRawQuizOptionStateClass(option, index, selectedIndex)}"
                type="button"
                data-raw-quiz-option="${index}"
                data-raw-quiz-key="${escapeHtml(quizKey)}"
                aria-pressed="${selectedIndex === index ? "true" : "false"}"
              >
                ${renderOptionToken(index)}
                <span>${escapeHtml(option.text)}</span>
              </button>
            `).join("")}
          </div>
          ${renderRawQuizFeedback(question, selectedOption)}
        </article>
      `;
    }

    function getRenderContext() {
      return {
        importedRawContentBank,
        sectionById
      };
    }

    function getRenderHelpers() {
      return {
        escapeHtml,
        renderPanelTitle,
        renderLearnCardFooterNav,
        renderSectionTransferTable,
        renderGuideQuizQuestion,
        getRawQuizPageIndex,
        renderRawBackToTopButton,
        getRawContentScopeLabel,
        getTargetLabel,
        getSectionGuideQuestions,
        getOrderedRawContentSections,
        getRegularGuideForSection: getGuideForSection,
        getAlpacaChannelVideosForSection,
        getModeAssetPath
      };
    }

    return {
      buildExperience,
      getGuideForSection,
      getGuidesForSelection,
      getRenderContext,
      getRenderHelpers,
      renderDocument,
      renderExperience,
      renderGuideQuizQuestion,
      renderNavigation,
      renderQuestionBlock,
      renderSectionChannelButton,
      getSectionGuideQuestions
    };
  }

  global.WSC_CREATE_REGULAR_GUIDE_CONTROLLER = createRegularGuideController;
})(window);
