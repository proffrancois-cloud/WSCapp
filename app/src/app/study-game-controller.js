(function initStudyGameController(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC study game controller missing function dependency: " + name);
    }
    return value;
  }

  function createStudyGameController(options = {}) {
    const {
      appState: state,
      appData = {},
      alpaquizEngine,
      constants = {},
      callbacks = {}
    } = options;

    if (!state) {
      throw new Error("WSC study game controller missing app state.");
    }
    if (!alpaquizEngine) {
      throw new Error("WSC study game controller missing Alpaquiz engine.");
    }

    const GAME_CONFIG = constants.GAME_CONFIG || {};
    const WRITING_PHASES = constants.WRITING_PHASES || [];
    const data = appData.data || { sections: [] };
    const buildBowlExperience = requiredFunction(callbacks, "buildBowlExperience");
    const buildQuizExperience = requiredFunction(callbacks, "buildQuizExperience");
    const buildQuizQuestionPlan = requiredFunction(callbacks, "buildQuizQuestionPlan");
    const finalizeSessionStats = requiredFunction(callbacks, "finalizeSessionStats");
    const getBestStreakFromAnswers = requiredFunction(callbacks, "getBestStreakFromAnswers");
    const getCurrentBowlQuestion = requiredFunction(callbacks, "getCurrentBowlQuestion");
    const getUnavailableRawGameReason = requiredFunction(callbacks, "getUnavailableRawGameReason");
    const normalizeQuizDifficultySelection = requiredFunction(callbacks, "normalizeQuizDifficultySelection");
    const renderExperience = requiredFunction(callbacks, "renderExperience");
    const renderExperiencePreservingScroll = requiredFunction(callbacks, "renderExperiencePreservingScroll");

    function nextWritingPrompt() {
      const experience = state.experience;
      if (!experience || experience.type !== "writing" || !experience.prompts.length) {
        return;
      }
      experience.promptIndex = (experience.promptIndex + 1) % experience.prompts.length;
      renderExperiencePreservingScroll();
    }

    function setWritingPhase(phaseId) {
      const experience = state.experience;
      if (!experience || experience.type !== "writing" || !WRITING_PHASES.some((phase) => phase.id === phaseId)) {
        return;
      }
      experience.phase = phaseId;
      renderExperiencePreservingScroll();
    }

    function startBowlPractice() {
      const experience = state.experience;
      if (!experience || experience.type !== "bowl" || experience.unavailableReason) {
        return;
      }
      experience.started = true;
      experience.tipDismissed = true;
      renderExperience();
    }

    function answerBowlQuestion(optionIndex) {
      const experience = state.experience;
      const question = getCurrentBowlQuestion(experience);
      if (!experience || experience.type !== "bowl" || !experience.started || experience.revealed || !question) {
        return;
      }

      const isCorrect = optionIndex === question.answerIndex;
      const points = isCorrect ? 1 : 0;
      experience.selectedIndex = optionIndex;
      experience.revealed = true;
      experience.score += points;
      experience.streak = isCorrect ? experience.streak + 1 : 0;
      experience.bestStreak = Math.max(experience.bestStreak, experience.streak);
      experience.answers.push({
        questionId: question.id,
        sectionId: question.sectionId,
        subjectIds: question.subjectIds || [],
        bigIdeaIds: question.bigIdeaIds || [],
        isCorrect
      });
      renderExperience();
    }

    function advanceBowlQuestion() {
      const experience = state.experience;
      if (!experience || experience.type !== "bowl" || !experience.revealed) {
        return;
      }

      if (experience.index >= experience.questions.length - 1) {
        experience.finished = true;
        finalizeSessionStats(experience.answers, experience.bestStreak, {
          type: "bowl",
          score: experience.score
        });
      } else {
        experience.index += 1;
        experience.selectedIndex = null;
        experience.revealed = false;
      }
      renderExperience();
    }

    function resetBowlPractice() {
      const nextExperience = buildBowlExperience();
      nextExperience.tipDismissed = true;
      nextExperience.started = !nextExperience.unavailableReason;
      state.experience = nextExperience;
      renderExperience();
    }

    function toggleQuizSection(sectionId) {
      const experience = state.experience;
      if (!experience || experience.type !== "quiz" || experience.started) {
        return;
      }

      const current = new Set(experience.selectedSectionIds);
      if (current.has(sectionId)) {
        current.delete(sectionId);
      } else {
        current.add(sectionId);
      }
      experience.selectedSectionIds = data.sections
        .map((section) => section.id)
        .filter((id) => current.has(id));
      experience.unavailableReason = null;
      renderExperience();
    }

    function selectAllQuizSections() {
      const experience = state.experience;
      if (!experience || experience.type !== "quiz" || experience.started) {
        return;
      }

      experience.selectedSectionIds = data.sections.map((section) => section.id);
      experience.unavailableReason = null;
      renderExperience();
    }

    function toggleQuizDifficulty(level) {
      const experience = state.experience;
      if (!experience || experience.type !== "quiz" || experience.started || ![1, 2, 3, 4, 5].includes(level)) {
        return;
      }

      experience.selectedDifficulties = alpaquizEngine.toggleDifficulty(experience.selectedDifficulties, level);
      experience.unavailableReason = null;
      renderExperience();
    }

    function setQuizQuestionCount(count) {
      const experience = state.experience;
      if (!experience || experience.type !== "quiz" || experience.started || ![10, 15, 20].includes(count)) {
        return;
      }

      experience.setupQuestionCount = alpaquizEngine.setQuestionCount(experience.setupQuestionCount, count);
      renderExperience();
    }

    function startQuizRoute() {
      const experience = state.experience;
      if (!experience || experience.type !== "quiz" || experience.started) {
        return;
      }

      if (experience.selectedSectionIds.length < GAME_CONFIG.jeopardyMinGroups) {
        return;
      }

      if (!normalizeQuizDifficultySelection(experience.selectedDifficulties).length) {
        experience.unavailableReason = "Choose at least one difficulty.";
        renderExperience();
        return;
      }

      const plan = buildQuizQuestionPlan(
        experience.selectedSectionIds,
        experience.setupQuestionCount,
        experience.selectedDifficulties
      );
      if (plan.unavailableReason || plan.questions.length !== experience.setupQuestionCount) {
        experience.unavailableReason = plan.unavailableReason || getUnavailableRawGameReason();
        renderExperience();
        return;
      }

      experience.questions = plan.questions;
      experience.selectedAnswers = {};
      experience.answers = [];
      experience.score = 0;
      experience.started = true;
      experience.submitted = false;
      renderExperience();
    }

    function answerQuizQuestion(questionIndex, optionIndex) {
      const experience = state.experience;
      if (!experience || experience.type !== "quiz" || experience.submitted || !experience.questions[questionIndex]) {
        return;
      }

      experience.selectedAnswers = alpaquizEngine.answerQuestion(experience, questionIndex, optionIndex);
      renderExperiencePreservingScroll();
    }

    function submitQuizRoute() {
      const experience = state.experience;
      if (!experience || experience.type !== "quiz" || experience.submitted) {
        return;
      }

      if (Object.keys(experience.selectedAnswers).length !== experience.questions.length) {
        return;
      }

      const result = alpaquizEngine.buildSubmittedAnswers(experience);
      experience.answers = result.answers;
      experience.score = result.score;
      experience.submitted = true;
      finalizeSessionStats(experience.answers, getBestStreakFromAnswers(experience.answers), {
        type: "quiz",
        score: experience.score
      });
      renderExperience();
    }

    function resetQuizRoute() {
      const experience = state.experience;
      if (!experience || experience.type !== "quiz") {
        return;
      }

      state.experience = buildQuizExperience();
      renderExperience();
    }

    return Object.freeze({
      nextWritingPrompt,
      setWritingPhase,
      startBowlPractice,
      answerBowlQuestion,
      advanceBowlQuestion,
      resetBowlPractice,
      toggleQuizSection,
      selectAllQuizSections,
      toggleQuizDifficulty,
      setQuizQuestionCount,
      startQuizRoute,
      answerQuizQuestion,
      submitQuizRoute,
      resetQuizRoute
    });
  }

  global.WSC_CREATE_STUDY_GAME_CONTROLLER = createStudyGameController;
}(window));
