(function initGameQuestionPlanningController(global) {
  "use strict";

  function requireObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error(`WSC game question planning controller requires ${name}.`);
    }
    return value;
  }

  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC game question planning controller requires ${name}().`);
    }
    return value;
  }

  function createGameQuestionPlanningController(options = {}) {
    const state = requireObject(options.appState, "appState");
    const data = requireObject(options.data, "data");
    const constants = options.constants || {};
    const services = options.services || {};
    const helpers = options.helpers || {};

    const GAME_CONFIG = constants.GAME_CONFIG || {};
    const importedRawContentBank = data.importedRawContentBank || {};
    const fullVoyageQuestions = Array.isArray(data.fullVoyageQuestions) ? data.fullVoyageQuestions : [];
    const sections = Array.isArray(data.sections) ? data.sections : [];
    const sectionById = data.sectionById || {};
    const subjectById = data.subjectById || {};

    const gameQuestionService = requireObject(services.gameQuestionService, "gameQuestionService");
    const alpaquizEngine = requireObject(services.alpaquizEngine, "alpaquizEngine");

    const escapeHtml = requireFunction(helpers, "escapeHtml");
    const findBigIdeaRouteIdByLabel = requireFunction(helpers, "findBigIdeaRouteIdByLabel");
    const getApprovedRawContentSection = requireFunction(helpers, "getApprovedRawContentSection");
    const getRawEntriesForRouteSelection = requireFunction(helpers, "getRawEntriesForRouteSelection");
    const getRawEntriesForSelection = requireFunction(helpers, "getRawEntriesForSelection");
    const getSectionGuideQuestions = requireFunction(helpers, "getSectionGuideQuestions");
    const getSectionIdFromGuidingTitle = requireFunction(helpers, "getSectionIdFromGuidingTitle");
    const getSelectedSectionIds = requireFunction(helpers, "getSelectedSectionIds");
    const getTargetLabel = requireFunction(helpers, "getTargetLabel");
    const normalizeKnowledgeKey = requireFunction(helpers, "normalizeKnowledgeKey");
    const shuffle = requireFunction(helpers, "shuffle");
    const slugifyBigIdea = requireFunction(helpers, "slugifyBigIdea");

    function getBroadSubjectIdsFromLabels(labels = []) {
      const ids = new Set();

      labels.forEach((label) => {
        const normalized = normalizeKnowledgeKey(label);

        if (normalized === "special area") {
          ids.add("special-area");
          return;
        }

        if (normalized.includes("history")) {
          ids.add("history");
          return;
        }

        if (normalized === "social studies") {
          ids.add("social-studies");
          return;
        }

        if (
          normalized.includes("geography") ||
          normalized.includes("sociology") ||
          normalized.includes("politics") ||
          normalized.includes("government") ||
          normalized.includes("economics") ||
          normalized.includes("trade") ||
          normalized.includes("migration") ||
          normalized.includes("tourism") ||
          normalized.includes("architecture") ||
          normalized.includes("urbanism")
        ) {
          ids.add("social-studies");
          return;
        }

        if (normalized === "science and tech" || normalized === "science tech") {
          ids.add("science-technology");
          return;
        }

        if (
          normalized.includes("computer science") ||
          normalized.includes("technology") ||
          normalized.includes("tech") ||
          normalized.includes("biology") ||
          normalized.includes("physics") ||
          normalized.includes("environmental science")
        ) {
          ids.add("science-technology");
          return;
        }

        if (normalized === "art and music" || normalized === "art music") {
          ids.add("art-music");
          return;
        }

        if (
          normalized.includes("visual arts") ||
          normalized.includes("performing arts") ||
          normalized.includes("music") ||
          normalized.includes("theatre")
        ) {
          ids.add("art-music");
          return;
        }

        if (normalized === "lit and media" || normalized === "lit media") {
          ids.add("literature-media");
          return;
        }

        if (
          normalized.includes("literature") ||
          normalized.includes("language") ||
          normalized.includes("media") ||
          normalized.includes("film")
        ) {
          ids.add("literature-media");
          return;
        }

        if (
          normalized.includes("psychology") ||
          normalized.includes("philosophy")
        ) {
          ids.add("special-area");
        }
      });

      return Array.from(ids);
    }

    function getQuestionSubjectLabels(question) {
      if (question && Array.isArray(question.subjectLabels) && question.subjectLabels.length) {
        return question.subjectLabels;
      }

      if (question && Array.isArray(question.subjectIds) && question.subjectIds.length) {
        return question.subjectIds
          .map((subjectId) => subjectById[subjectId])
          .filter(Boolean)
          .map((subject) => subject.label);
      }

      return [];
    }

    function getBigIdeaIdsFromLabels(labels = []) {
      return labels
        .map((label) => findBigIdeaRouteIdByLabel(label))
        .filter(Boolean);
    }

    function renderQuestionSubjectPills(question) {
      return getQuestionSubjectLabels(question).map((label) => `
        <span class="meta-pill subject">${escapeHtml(label)}</span>
      `).join("");
    }

    function getQuestionVisibleWrongExplanationByAnswer(question, answerText) {
      const selectedKey = normalizeKnowledgeKey(answerText);
      return (question.visibleWrongExplanations || []).find((item) => (
        normalizeKnowledgeKey(item.answer) === selectedKey ||
        normalizeKnowledgeKey(item.text) === selectedKey
      ))?.explanation || "";
    }

    function buildGameQuestionOptions(rawQuestion) {
      const correctAnswer = rawQuestion.correctAnswer;
      const options = shuffle([correctAnswer, ...(rawQuestion.wrongAnswers || [])]);
      const answerIndex = options.indexOf(correctAnswer);
      const correctFeedback = rawQuestion.visibleCorrectExplanation || rawQuestion.explanation || "";

      return {
        options,
        answerIndex,
        optionFeedback: options.map((option, index) => (
          index === answerIndex
            ? correctFeedback
            : getQuestionVisibleWrongExplanationByAnswer(rawQuestion, option)
        ))
      };
    }

    function createRawGameQuestion(entry, rawQuestion, entryIndex, questionIndex) {
      const optionPayload = buildGameQuestionOptions(rawQuestion);
      const subjectLabels = Array.isArray(entry.subjects) ? entry.subjects.slice() : [];
      const bigIdeaLabels = Array.isArray(entry.bigIdeas) ? entry.bigIdeas.slice() : [];
      const sectionId = entry.sectionId || getSectionIdFromGuidingTitle(entry.guidingSection || entry.sectionTitle);

      return {
        id: rawQuestion.id || `${sectionId || "raw"}-${slugifyBigIdea(entry.title || `entry-${entryIndex}`)}-level-${rawQuestion.level}-${questionIndex + 1}`,
        prompt: rawQuestion.prompt,
        options: optionPayload.options,
        answerIndex: optionPayload.answerIndex,
        optionFeedback: optionPayload.optionFeedback,
        explanation: rawQuestion.explanation || entry.studentExplanation || entry.whyItMatters || entry.takeaway || "",
        visibleCorrectExplanation: rawQuestion.visibleCorrectExplanation || rawQuestion.explanation || "",
        visibleConnection: rawQuestion.visibleConnection || "",
        visibleTakeaway: rawQuestion.visibleTakeaway || "",
        sectionId,
        sectionIds: [sectionId].filter(Boolean),
        subjectIds: getBroadSubjectIdsFromLabels(subjectLabels),
        subjectLabels,
        bigIdeaIds: getBigIdeaIdsFromLabels(bigIdeaLabels),
        bigIdeaLabels,
        sourceSubtopic: entry.title,
        sourceType: "point",
        anchors: [entry.takeaway].filter(Boolean),
        cueMood: rawQuestion.level >= 4 ? "determined" : "thinking",
        rawLevel: Number(rawQuestion.level),
        displayLevel: rawQuestion.displayLevel || Number(rawQuestion.level) * 100,
        entryTitle: entry.title,
        guidingSection: entry.guidingSection
      };
    }

    function createGuideGameQuestion(section, guideQuestion, questionIndex) {
      const optionPayload = buildGameQuestionOptions(guideQuestion);
      const sectionId = section.id || getSectionIdFromGuidingTitle(section.guidingSection || section.title);
      const sectionRecord = sectionId ? sectionById[sectionId] : null;
      const sectionTitle = sectionRecord ? sectionRecord.title : section.guidingSection || section.title;

      return {
        id: guideQuestion.id || `${sectionId || "section"}-guide-level-3-${questionIndex + 1}`,
        prompt: guideQuestion.prompt,
        options: optionPayload.options,
        answerIndex: optionPayload.answerIndex,
        optionFeedback: optionPayload.optionFeedback,
        explanation: guideQuestion.explanation || "",
        visibleCorrectExplanation: guideQuestion.visibleCorrectExplanation || guideQuestion.explanation || "",
        visibleConnection: guideQuestion.visibleConnection || "",
        visibleTakeaway: guideQuestion.visibleTakeaway || "",
        sectionId,
        sectionIds: [sectionId].filter(Boolean),
        subjectIds: [],
        subjectLabels: [],
        bigIdeaIds: [],
        bigIdeaLabels: [],
        sourceSubtopic: "Section Guide",
        sourceType: "guide",
        anchors: [guideQuestion.anchorEntry, guideQuestion.targetEntry].filter(Boolean),
        cueMood: "thinking",
        rawLevel: 3,
        displayLevel: guideQuestion.displayLevel || 300,
        entryTitle: guideQuestion.anchorEntry || "Section Guide",
        guidingSection: sectionTitle
      };
    }

    function createFullVoyageGameQuestion(rawQuestion) {
      const optionPayload = buildGameQuestionOptions(rawQuestion);
      const sectionIds = Array.isArray(rawQuestion.sectionIds) && rawQuestion.sectionIds.length
        ? rawQuestion.sectionIds
        : [rawQuestion.sectionId].filter(Boolean);
      const sectionId = rawQuestion.sectionId || sectionIds[0] || "introductory-questions";
      const sectionRecord = sectionById[sectionId] || null;

      return {
        id: rawQuestion.id,
        prompt: rawQuestion.prompt,
        options: optionPayload.options,
        answerIndex: optionPayload.answerIndex,
        optionFeedback: optionPayload.optionFeedback,
        explanation: rawQuestion.explanation || rawQuestion.visibleConnection || rawQuestion.visibleCorrectExplanation || "",
        visibleCorrectExplanation: rawQuestion.visibleCorrectExplanation || rawQuestion.explanation || "",
        visibleConnection: rawQuestion.visibleConnection || "",
        visibleTakeaway: rawQuestion.visibleTakeaway || "",
        sectionId,
        sectionIds,
        secondarySectionId: rawQuestion.secondarySectionId || null,
        subjectIds: [],
        subjectLabels: [],
        bigIdeaIds: [],
        bigIdeaLabels: [],
        sourceSubtopic: rawQuestion.targetReference || rawQuestion.anchorReference || "Full Voyage",
        sourceType: "full-voyage",
        anchors: [rawQuestion.anchorReference, rawQuestion.targetReference].filter(Boolean),
        cueMood: rawQuestion.level >= 5 ? "determined" : "thinking",
        rawLevel: Number(rawQuestion.level),
        displayLevel: rawQuestion.displayLevel || Number(rawQuestion.level) * 100,
        entryTitle: rawQuestion.targetReference || "Full Voyage",
        guidingSection: sectionRecord?.title || rawQuestion.guidingSectionPrimary || "",
        guidingSectionPrimary: rawQuestion.guidingSectionPrimary || "",
        guidingSectionSecondary: rawQuestion.guidingSectionSecondary || "",
        sourceUrl: rawQuestion.sourceUrl || "",
        sourceNote: rawQuestion.sourceNote || ""
      };
    }

    function getSectionIdsForEntries(entries) {
      const seen = new Set();
      return (entries || [])
        .map((entry) => entry.sectionId || getSectionIdFromGuidingTitle(entry.guidingSection || entry.sectionTitle))
        .filter(Boolean)
        .filter((sectionId) => {
          if (seen.has(sectionId)) {
            return false;
          }
          seen.add(sectionId);
          return true;
        });
    }

    function getGuideQuestionsForEntries(entries) {
      const sectionIds = getSectionIdsForEntries(entries);

      return sectionIds.flatMap((sectionId) => {
        const section = importedRawContentBank[sectionId] || getApprovedRawContentSection(sectionId);
        return getSectionGuideQuestions(section).map((question, questionIndex) =>
          createGuideGameQuestion(section, question, questionIndex)
        );
      });
    }

    function getFullVoyageQuestionsForEntries(entries) {
      const sectionIds = new Set(getSectionIdsForEntries(entries));
      const seen = new Set();
      return fullVoyageQuestions
        .filter((question) => (question.sectionIds || [question.sectionId]).some((sectionId) => sectionIds.has(sectionId)))
        .filter((question) => {
          if (seen.has(question.id)) {
            return false;
          }
          seen.add(question.id);
          return true;
        })
        .map((question) => createFullVoyageGameQuestion(question));
    }

    function buildRawQuestionPoolsFromEntries(entries) {
      return gameQuestionService.buildPoolsFromEntries(entries, {
        createRawGameQuestion,
        getGuideQuestionsForEntries,
        getFullVoyageQuestionsForEntries
      });
    }

    function buildRawQuestionPoolsForSelection() {
      return buildRawQuestionPoolsFromEntries(getRawEntriesForSelection());
    }

    function hasRequiredRawLevels(pools, levels = [1, 2, 3, 4, 5]) {
      return gameQuestionService.hasRequiredLevels(pools, levels);
    }

    function buildPatternQuestionSequence(pattern, pools, allowReuse = true) {
      return gameQuestionService.buildPatternSequence(pattern, pools, shuffle, allowReuse);
    }

    function getUnavailableRawGameReason() {
      return gameQuestionService.getUnavailableReason(getTargetLabel());
    }

    function buildAlpacaRunQuestionPlan(entries = null) {
      const pools = Array.isArray(entries)
        ? buildRawQuestionPoolsFromEntries(entries)
        : buildRawQuestionPoolsForSelection();
      if (!hasRequiredRawLevels(pools)) {
        return { unavailableReason: getUnavailableRawGameReason() };
      }

      const mainPattern = [
        ...Array.from({ length: GAME_CONFIG.runRegionalLevelOneCount }, () => 1),
        ...Array.from({ length: GAME_CONFIG.runRegionalLevelTwoCount }, () => 2),
        ...Array.from({ length: GAME_CONFIG.runGlobalLevelThreeCount }, () => 3),
        ...Array.from({ length: GAME_CONFIG.runGlobalLevelFourCount }, () => 4)
      ];
      const yalePattern = Array.from({ length: GAME_CONFIG.runYaleLevelFiveCount }, () => 5);

      const mainQuestions = buildPatternQuestionSequence(mainPattern, pools, true);
      const yaleQuestions = buildPatternQuestionSequence(yalePattern, pools, true);

      if (mainQuestions.length !== mainPattern.length || yaleQuestions.length !== yalePattern.length) {
        return { unavailableReason: getUnavailableRawGameReason() };
      }

      return {
        mainQuestions,
        yaleQuestions
      };
    }

    function buildRelayQuestionSequence(questionCount, entries = null) {
      const pools = Array.isArray(entries)
        ? buildRawQuestionPoolsFromEntries(entries)
        : buildRawQuestionPoolsForSelection();
      if (!hasRequiredRawLevels(pools)) {
        return { unavailableReason: getUnavailableRawGameReason(), questions: [] };
      }

      const pattern = Array.from({ length: questionCount }, (_, index) => (index % 5) + 1);
      return {
        unavailableReason: null,
        questions: buildPatternQuestionSequence(pattern, pools, true)
      };
    }

    function buildJumpQuestionPlan(entries = null) {
      const pools = Array.isArray(entries)
        ? buildRawQuestionPoolsFromEntries(entries)
        : buildRawQuestionPoolsForSelection();
      if (!hasRequiredRawLevels(pools)) {
        return { unavailableReason: getUnavailableRawGameReason(), questions: [] };
      }

      const questionsPerLevel = Math.max(1, Math.ceil(GAME_CONFIG.jumpQuestionCount / 5));
      const pattern = [1, 2, 3, 4, 5]
        .flatMap((level) => Array.from({ length: questionsPerLevel }, () => level))
        .slice(0, GAME_CONFIG.jumpQuestionCount);
      const questions = buildPatternQuestionSequence(pattern, pools, true);

      return {
        unavailableReason: questions.length === pattern.length ? null : getUnavailableRawGameReason(),
        questions
      };
    }

    function buildRaceLevelQueues(entries = null) {
      const pools = Array.isArray(entries)
        ? buildRawQuestionPoolsFromEntries(entries)
        : buildRawQuestionPoolsForSelection();
      if (!hasRequiredRawLevels(pools)) {
        return { unavailableReason: getUnavailableRawGameReason(), levels: [] };
      }

      const levels = [1, 2, 3, 4, 5].map((level) => {
        const questions = shuffle((pools[level] || []).slice());
        return {
          level,
          questions,
          pendingIds: new Set(questions.map((question) => question.id)),
          cycleQueue: questions.slice(),
          cycleIndex: 0
        };
      });

      return {
        unavailableReason: null,
        levels
      };
    }

    function getRaceActiveLevelState(experience) {
      return experience.levels[experience.currentLevelIndex] || null;
    }

    function getCurrentRaceQuestion(experience) {
      const levelState = getRaceActiveLevelState(experience);
      if (!levelState || !levelState.cycleQueue.length) {
        return null;
      }

      return levelState.cycleQueue[levelState.cycleIndex] || levelState.cycleQueue[0] || null;
    }

    function queueNextRaceQuestion(experience) {
      let movedToNewLevel = false;

      while (experience.currentLevelIndex < experience.levels.length) {
        const levelState = experience.levels[experience.currentLevelIndex];
        if (!levelState.questions.length) {
          experience.currentLevelIndex += 1;
          movedToNewLevel = true;
          continue;
        }

        if (levelState.pendingIds.size === 0) {
          experience.currentLevelIndex += 1;
          movedToNewLevel = true;
          continue;
        }

        if (movedToNewLevel || !experience.currentQuestion) {
          levelState.cycleQueue = shuffle(levelState.questions.filter((question) => levelState.pendingIds.has(question.id)));
          levelState.cycleIndex = 0;
        } else if (levelState.cycleIndex >= levelState.cycleQueue.length - 1) {
          levelState.cycleQueue = shuffle(levelState.questions.filter((question) => levelState.pendingIds.has(question.id)));
          levelState.cycleIndex = 0;
        } else {
          levelState.cycleIndex += 1;
        }

        experience.currentQuestion = getCurrentRaceQuestion(experience);
        return Boolean(experience.currentQuestion);
      }

      experience.currentQuestion = null;
      return false;
    }

    function getSelectionQuestions() {
      return getQuestionsForRouteSelection(state.selection.lens, state.selection.targetId);
    }

    function getQuestionsForRouteSelection(lensId, targetId) {
      return buildRawGameQuestionsFromEntries(getRawEntriesForRouteSelection(lensId, targetId));
    }

    function buildRawGameQuestionsFromEntries(entries) {
      const entryQuestions = (entries || []).flatMap((entry, entryIndex) =>
        (entry.quizQuestions || [])
          .map((rawQuestion, questionIndex) => {
            const level = Number(rawQuestion.level);
            if (!level || !rawQuestion.prompt || !rawQuestion.correctAnswer || !Array.isArray(rawQuestion.wrongAnswers)) {
              return null;
            }
            return createRawGameQuestion(entry, rawQuestion, entryIndex, questionIndex);
          })
          .filter(Boolean)
      );

      return [
        ...entryQuestions,
        ...getGuideQuestionsForEntries(entries),
        ...getFullVoyageQuestionsForEntries(entries)
      ];
    }

    function getDefaultQuizSectionIds() {
      const allIds = sections.map((section) => section.id);
      const selectedSectionIds = getSelectedSectionIds();
      if (selectedSectionIds.length) {
        return selectedSectionIds;
      }

      if (state.selection.lens === "section" && state.selection.targetId && state.selection.targetId !== "all") {
        const targetIndex = allIds.indexOf(state.selection.targetId);
        const ordered = targetIndex >= 0
          ? allIds.slice(targetIndex).concat(allIds.slice(0, targetIndex))
          : allIds;
        return ordered.slice(0, GAME_CONFIG.jeopardyMinGroups);
      }

      if (state.selection.targetId && state.selection.targetId !== "all") {
        const routeSectionIds = getSectionIdsForEntries(getRawEntriesForSelection());
        if (routeSectionIds.length >= GAME_CONFIG.jeopardyMinGroups) {
          return routeSectionIds;
        }
      }

      return allIds;
    }

    function getRawEntriesForQuizSectionIds(sectionIds) {
      const seen = new Set();
      return (sectionIds || []).flatMap((sectionId) =>
        getRawEntriesForRouteSelection("section", sectionId)
      ).filter((entry) => {
        const key = `${entry.sectionId || entry.guidingSection}|${entry.title}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    }

    function buildQuizQuestionPlan(sectionIds, questionCount, selectedDifficulties = [1, 2, 3, 4, 5]) {
      return alpaquizEngine.buildQuestionPlan(sectionIds, questionCount, selectedDifficulties, {
        getEntriesForSectionIds: getRawEntriesForQuizSectionIds,
        buildQuestionPools: buildRawQuestionPoolsFromEntries,
        hasRequiredLevels: hasRequiredRawLevels,
        buildPatternQuestionSequence,
        getUnavailableReason: getUnavailableRawGameReason
      });
    }

    return {
      buildAlpacaRunQuestionPlan,
      buildGameQuestionOptions,
      buildJumpQuestionPlan,
      buildPatternQuestionSequence,
      buildQuizQuestionPlan,
      buildRaceLevelQueues,
      buildRawGameQuestionsFromEntries,
      buildRawQuestionPoolsForSelection,
      buildRawQuestionPoolsFromEntries,
      buildRelayQuestionSequence,
      createFullVoyageGameQuestion,
      createGuideGameQuestion,
      createRawGameQuestion,
      getBigIdeaIdsFromLabels,
      getBroadSubjectIdsFromLabels,
      getCurrentRaceQuestion,
      getDefaultQuizSectionIds,
      getFullVoyageQuestionsForEntries,
      getGuideQuestionsForEntries,
      getQuestionSubjectLabels,
      getQuestionVisibleWrongExplanationByAnswer,
      getQuestionsForRouteSelection,
      getRaceActiveLevelState,
      getRawEntriesForQuizSectionIds,
      getSectionIdsForEntries,
      getSelectionQuestions,
      getUnavailableRawGameReason,
      hasRequiredRawLevels,
      queueNextRaceQuestion,
      renderQuestionSubjectPills
    };
  }

  global.WSC_CREATE_GAME_QUESTION_PLANNING_CONTROLLER = createGameQuestionPlanningController;
})(window);
