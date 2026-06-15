(function initRouteBuilderOptionsService(global) {
  "use strict";

  function requireObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error(`WSC route builder options service requires ${name}.`);
    }
    return value;
  }

  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC route builder options service requires ${name}().`);
    }
    return value;
  }

  function createRouteBuilderOptionsService(options = {}) {
    const state = requireObject(options.appState, "appState");
    const data = requireObject(options.data, "data");
    const constants = options.constants || {};
    const helpers = options.helpers || {};
    const knowledge = options.knowledge || {};

    const defaultLensId = constants.defaultLensId || "section";
    const modeOptions = constants.modeOptions || {};
    const unavailableModeReasons = constants.unavailableModeReasons || {};
    const bigIdeaRoutes = Array.isArray(constants.bigIdeaRoutes) ? constants.bigIdeaRoutes : [];
    const learnSubjectRoutes = Array.isArray(constants.learnSubjectRoutes) ? constants.learnSubjectRoutes : [];

    const getQuestionsForRouteSelection = requireFunction(helpers, "getQuestionsForRouteSelection");
    const isOnlineMode = requireFunction(helpers, "isOnlineMode");

    const getSectionKnowledgeById = knowledge.getSectionKnowledgeById || (() => ({}));
    const getSubjectKnowledgeById = knowledge.getSubjectKnowledgeById || (() => ({}));
    const getLearnSubjectKnowledgeById = knowledge.getLearnSubjectKnowledgeById || (() => ({}));
    const getBigIdeaKnowledgeById = knowledge.getBigIdeaKnowledgeById || (() => ({}));
    const getWholeThemeKnowledge = knowledge.getWholeThemeKnowledge || (() => null);

    function getAppModeSwitchIcon() {
      return isOnlineMode(state)
        ? "./app-icons/icon-local-transparent.png?v=20260520train"
        : "./assets/mascot/library/final-pack/Multiplayer.png?v=20260520train";
    }

    function getVisibleModeOptions() {
      return getVisibleModeOptionsForPath(state.selection.path || "learn");
    }

    function getVisibleModeOptionsForPath(pathId) {
      const optionsForPath = modeOptions[pathId] || [];
      const visibleOptions = optionsForPath.map((option) => getDecoratedModeOption(option));
      if (pathId === "learn") {
        return visibleOptions.filter((option) => (
          option.id !== "slideshow"
          && (option.id !== "regularguide" || state.selection.lens === defaultLensId)
        ));
      }

      return visibleOptions;
    }

    function getModeUnavailableReason(modeId) {
      return unavailableModeReasons[modeId] || "";
    }

    function isModeUnavailable(modeId) {
      return Boolean(getModeUnavailableReason(modeId));
    }

    function getDecoratedModeOption(option) {
      if (!option || !isModeUnavailable(option.id)) {
        return option;
      }

      return {
        ...option,
        meta: "Available soon",
        unavailableReason: getModeUnavailableReason(option.id)
      };
    }

    function getModePath(modeId) {
      if (!modeId) {
        return null;
      }

      const pathId = Object.keys(modeOptions).find((key) =>
        (modeOptions[key] || []).some((option) => option.id === modeId)
      );
      if (pathId) {
        return pathId;
      }

      return null;
    }

    function usesGranularLearnSubjects() {
      return false;
    }

    function getActiveSubjectCatalog() {
      return usesGranularLearnSubjects() ? learnSubjectRoutes : data.subjects;
    }

    function getActiveSubjectKnowledgeMap() {
      return usesGranularLearnSubjects() ? getLearnSubjectKnowledgeById() : getSubjectKnowledgeById();
    }

    function getTargetOptions() {
      const totalQuestions = getQuestionsForRouteSelection(null, "all").length;
      const wholeThemeKnowledge = getWholeThemeKnowledge();
      const totalKnowledgeItems = wholeThemeKnowledge ? wholeThemeKnowledge.knowledgeItemCount : 0;

      if (state.selection.lens === "subject") {
        return getSubjectTargetOptions(totalQuestions, totalKnowledgeItems);
      }

      if (state.selection.lens === "bigidea") {
        return getBigIdeaTargetOptions(totalQuestions, totalKnowledgeItems);
      }

      return getSectionTargetOptions();
    }

    function getSubjectTargetOptions(totalQuestions, totalKnowledgeItems) {
      const subjectCatalog = getActiveSubjectCatalog();
      const subjectKnowledgeMap = getActiveSubjectKnowledgeMap();
      const options = [
        {
          id: "all",
          title: "All subjects",
          description: "Review the whole theme across every subject lane.",
          meta: `${totalQuestions} questions · ${totalKnowledgeItems} knowledge items · ${data.subjects.length} subjects`,
          kicker: "Complete subject route",
          mood: "happy"
        }
      ];

      subjectCatalog.forEach((subject) => {
        const subjectKnowledge = subjectKnowledgeMap[subject.id];
        const questions = getQuestionsForRouteSelection("subject", subject.id);
        const sectionCount = subjectKnowledge
          ? subjectKnowledge.sections.length
          : new Set(questions.map((question) => question.sectionId)).size;
        const knowledgeCount = subjectKnowledge ? subjectKnowledge.knowledgeItemCount : 0;
        const atomCount = subjectKnowledge ? subjectKnowledge.atoms.length : 0;
        options.push({
          id: subject.id,
          title: subject.label,
          description: subject.description,
          meta: usesGranularLearnSubjects()
            ? `${atomCount} subtopics · ${knowledgeCount} knowledge items · ${sectionCount} sections`
            : `${questions.length} questions · ${knowledgeCount} knowledge items · ${sectionCount} sections`,
          kicker: usesGranularLearnSubjects() ? "Study lane" : "Subject route",
          mood: subject.mood || "wise"
        });
      });

      return options;
    }

    function getBigIdeaTargetOptions(totalQuestions, totalKnowledgeItems) {
      const bigIdeaKnowledgeById = getBigIdeaKnowledgeById();
      const options = [
        {
          id: "all",
          title: "All big ideas",
          description: "Review the whole theme across every big idea route.",
          meta: `${totalQuestions} questions · ${totalKnowledgeItems} knowledge items · ${bigIdeaRoutes.length} big ideas`,
          kicker: "Complete big idea route",
          mood: "happy"
        }
      ];

      bigIdeaRoutes.forEach((route) => {
        const routeKnowledge = bigIdeaKnowledgeById[route.id];
        options.push({
          id: route.id,
          title: route.label,
          description: route.description,
          meta: `${routeKnowledge ? routeKnowledge.entries.length : 0} raw entries · ${routeKnowledge ? routeKnowledge.sections.length : 0} sections · ${routeKnowledge ? routeKnowledge.questionCount : 0} questions`,
          kicker: "Big idea route",
          mood: route.mood || "wise"
        });
      });

      return options;
    }

    function getSectionTargetOptions() {
      const sectionKnowledgeById = getSectionKnowledgeById();
      return data.sections.map((section) => {
        const questions = getQuestionsForRouteSelection("section", section.id);
        const subjectCount = new Set(questions.flatMap((question) => question.subjectIds)).size;
        const knowledgeCount = sectionKnowledgeById[section.id]
          ? sectionKnowledgeById[section.id].knowledgeItemCount
          : 0;
        return {
          id: section.id,
          title: section.title,
          description: section.blurb,
          meta: `${questions.length} questions · ${knowledgeCount} knowledge items · ${subjectCount} subjects`,
          kicker: section.originalTitle,
          mood: "determined"
        };
      });
    }

    return {
      getActiveSubjectCatalog,
      getActiveSubjectKnowledgeMap,
      getAppModeSwitchIcon,
      getDecoratedModeOption,
      getModePath,
      getModeUnavailableReason,
      getTargetOptions,
      getVisibleModeOptions,
      getVisibleModeOptionsForPath,
      isModeUnavailable,
      usesGranularLearnSubjects
    };
  }

  global.WSC_CREATE_ROUTE_BUILDER_OPTIONS_SERVICE = createRouteBuilderOptionsService;
})(window);
