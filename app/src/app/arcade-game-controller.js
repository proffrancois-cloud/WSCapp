(function initArcadeGameController(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC arcade game controller missing function dependency: " + name);
    }
    return value;
  }

  function createArcadeGameController(options = {}) {
    const {
      appState: state,
      windowRef = global,
      constants = {},
      callbacks = {}
    } = options;

    if (!state) {
      throw new Error("WSC arcade game controller missing app state.");
    }

    const window = windowRef;
    const GAME_CONFIG = constants.GAME_CONFIG || {};
    const buildAlpacaRunQuestionPlan = requiredFunction(callbacks, "buildAlpacaRunQuestionPlan");
    const buildJumpQuestionPlan = requiredFunction(callbacks, "buildJumpQuestionPlan");
    const buildRaceLevelQueues = requiredFunction(callbacks, "buildRaceLevelQueues");
    const buildRelayQuestionSequence = requiredFunction(callbacks, "buildRelayQuestionSequence");
    const clearRaceTimer = requiredFunction(callbacks, "clearRaceTimer");
    const clearRelayAnswerTimer = requiredFunction(callbacks, "clearRelayAnswerTimer");
    const createJumpObstacle = requiredFunction(callbacks, "createJumpObstacle");
    const createRelayTeams = requiredFunction(callbacks, "createRelayTeams");
    const finalizeSessionStats = requiredFunction(callbacks, "finalizeSessionStats");
    const getBestStreakFromAnswers = requiredFunction(callbacks, "getBestStreakFromAnswers");
    const getCurrentRaceQuestion = requiredFunction(callbacks, "getCurrentRaceQuestion");
    const getHighestTeamScore = requiredFunction(callbacks, "getHighestTeamScore");
    const getRaceActiveLevelState = requiredFunction(callbacks, "getRaceActiveLevelState");
    const getRawEntriesForRunSetupCategoryIds = requiredFunction(callbacks, "getRawEntriesForRunSetupCategoryIds");
    const getRunReachedStage = requiredFunction(callbacks, "getRunReachedStage");
    const getThemedTeamLabel = requiredFunction(callbacks, "getThemedTeamLabel");
    const getUnavailableRawGameReason = requiredFunction(callbacks, "getUnavailableRawGameReason");
    const playRelayBuzzSound = requiredFunction(callbacks, "playRelayBuzzSound");
    const queueNextJumpObstacle = requiredFunction(callbacks, "queueNextJumpObstacle");
    const queueNextRaceQuestion = requiredFunction(callbacks, "queueNextRaceQuestion");
    const render = requiredFunction(callbacks, "render");
    const renderExperience = requiredFunction(callbacks, "renderExperience");
    const syncRelayTeamBindings = requiredFunction(callbacks, "syncRelayTeamBindings");
    const updateJumpDom = requiredFunction(callbacks, "updateJumpDom");

    function toggleSetupCategorySelection(experience, categoryId) {
      const current = new Set(experience.setupCategoryIds);
      if (current.has(categoryId)) {
        if (current.size <= GAME_CONFIG.jeopardyMinGroups) {
          return false;
        }
        current.delete(categoryId);
      } else {
        current.add(categoryId);
      }

      experience.setupCategoryIds = Array.from(current);
      return true;
    }

    function startRaceRoute() {
      const experience = state.experience;
      if (!experience || experience.type !== "race" || experience.started || experience.unavailableReason) {
        return;
      }

      if (experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups) {
        return;
      }

      const racePlan = buildRaceLevelQueues(getRawEntriesForRunSetupCategoryIds(experience.setupCategoryIds));
      if (racePlan.unavailableReason || !racePlan.levels.length) {
        experience.unavailableReason = racePlan.unavailableReason || getUnavailableRawGameReason();
        renderExperience();
        return;
      }

      experience.levels = racePlan.levels;
      experience.availableQuestionCount = getRaceAvailableQuestionCount(experience.levels);
      experience.totalQuestions = experience.availableQuestionCount;
      const firstLevelIndex = experience.levels.findIndex((level) => level.questions.length);
      experience.currentLevelIndex = firstLevelIndex === -1 ? 0 : firstLevelIndex;
      experience.currentQuestion = getCurrentRaceQuestion(experience);
      if (!experience.currentQuestion) {
        experience.unavailableReason = getUnavailableRawGameReason();
        renderExperience();
        return;
      }
      experience.started = true;
      renderExperience();
    }

    function getRaceAvailableQuestionCount(levels) {
      return (levels || []).reduce((sum, level) => sum + level.questions.length, 0);
    }

    function toggleRaceSetupCategory(categoryId) {
      const experience = state.experience;
      if (!experience || experience.type !== "race" || experience.started) {
        return;
      }

      if (!toggleSetupCategorySelection(experience, categoryId)) {
        return;
      }

      renderExperience();
    }

    function answerRaceQuestion(optionIndex) {
      const experience = state.experience;
      if (!experience || experience.type !== "race" || experience.revealed || !experience.currentQuestion) {
        return;
      }

      resolveRaceQuestion(optionIndex, false);
    }

    function resolveRaceQuestion(optionIndex, timedOut) {
      const experience = state.experience;
      if (!experience || experience.type !== "race" || experience.revealed) {
        return;
      }

      clearRaceTimer();

      const question = experience.currentQuestion;
      const isCorrect = !timedOut && optionIndex === question.answerIndex;
      const levelState = getRaceActiveLevelState(experience);

      experience.revealed = true;
      experience.lastCorrect = isCorrect;
      experience.lastTimedOut = timedOut;
      experience.selectedIndex = Number.isInteger(optionIndex) ? optionIndex : null;

      if (isCorrect) {
        experience.score += 1;
        experience.streak += 1;
        experience.bestStreak = Math.max(experience.bestStreak, experience.streak);
        levelState && levelState.pendingIds.delete(question.id);
      } else {
        if (timedOut) {
          experience.timeouts += 1;
        }
        experience.lives = Math.max(0, experience.lives - 1);
        experience.streak = 0;
      }

      experience.answers.push({
        questionId: question.id,
        sectionId: question.sectionId,
        subjectIds: question.subjectIds,
        bigIdeaIds: question.bigIdeaIds || [],
        isCorrect,
        timedOut
      });

      renderExperience();
    }

    function advanceRace() {
      const experience = state.experience;
      if (!experience || experience.type !== "race") {
        return;
      }

      if (experience.lives <= 0) {
        experience.failed = true;
        experience.finished = true;
        finalizeSessionStats(experience.answers, experience.bestStreak, {
          type: "race",
          score: experience.score
        });
      } else if (!queueNextRaceQuestion(experience)) {
        experience.finished = true;
        finalizeSessionStats(experience.answers, experience.bestStreak, {
          type: "race",
          score: experience.score
        });
      } else {
        experience.index += 1;
        experience.revealed = false;
        experience.revealed = false;
        experience.lastCorrect = null;
        experience.lastTimedOut = false;
        experience.selectedIndex = null;
        experience.questionTime = GAME_CONFIG.raceQuestionTime;
        experience.timeRemaining = experience.questionTime;
      }

      render();
    }

    function toggleRunSetupCategory(categoryId) {
      const experience = state.experience;
      if (!experience || experience.type !== "run" || experience.started) {
        return;
      }

      if (!toggleSetupCategorySelection(experience, categoryId)) {
        return;
      }

      renderExperience();
    }

    function startRunRoute() {
      const experience = state.experience;
      if (!experience || experience.type !== "run" || experience.started) {
        return;
      }

      if (experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups) {
        return;
      }

      const runPlan = buildAlpacaRunQuestionPlan(getRawEntriesForRunSetupCategoryIds(experience.setupCategoryIds));
      if (runPlan.unavailableReason || !runPlan.mainQuestions?.length) {
        experience.unavailableReason = runPlan.unavailableReason || getUnavailableRawGameReason();
        renderExperience();
        return;
      }

      experience.mainQuestions = runPlan.mainQuestions || [];
      experience.yaleQuestions = runPlan.yaleQuestions || [];
      experience.currentQuestion = experience.mainQuestions[0] || null;
      experience.started = true;
      renderExperience();
    }

    function answerRunQuestion(optionIndex) {
      const experience = state.experience;
      if (!experience || experience.type !== "run" || experience.revealed) {
        return;
      }

      const question = experience.currentQuestion;
      if (!question) {
        return;
      }
      const isCorrect = optionIndex === question.answerIndex;
      const yaleStage = experience.stage >= experience.route.length - 1;

      experience.revealed = true;
      experience.lastCorrect = isCorrect;
      experience.selectedIndex = optionIndex;
      experience.answeredCount += 1;

      if (isCorrect) {
        experience.correctCount += 1;
        if (yaleStage) {
          experience.pendingStage = experience.stage;
          experience.pendingYaleProgress = experience.yaleProgress + 1;
        } else {
          experience.pendingStage = Math.min(experience.stage + 1, experience.route.length - 1);
          experience.pendingYaleProgress = 0;
        }
      } else {
        experience.pendingStage = yaleStage ? Math.max(experience.route.length - 2, 0) : Math.max(experience.stage - 1, 0);
        experience.pendingYaleProgress = 0;
      }

      experience.answers.push({
        questionId: question.id,
        sectionId: question.sectionId,
        subjectIds: question.subjectIds,
        bigIdeaIds: question.bigIdeaIds || [],
        isCorrect
      });

      renderExperience();
    }

    function continueRun() {
      const experience = state.experience;
      if (!experience || experience.type !== "run") {
        return;
      }

      if (experience.lastCorrect && experience.stage >= experience.route.length - 1 && experience.yaleProgress === GAME_CONFIG.runYaleLevelFiveCount - 1) {
        experience.finished = true;
        finalizeSessionStats(experience.answers, experience.correctCount, {
          type: "run",
          stage: getRunReachedStage(experience)
        });
        render();
        return;
      }

      if (experience.timeRemaining <= 0) {
        experience.failed = true;
        experience.finished = true;
        finalizeSessionStats(experience.answers, experience.correctCount, {
          type: "run",
          stage: getRunReachedStage(experience)
        });
        render();
        return;
      }

      experience.stage = Number.isInteger(experience.pendingStage) ? experience.pendingStage : experience.stage;
      experience.yaleProgress = Number.isInteger(experience.pendingYaleProgress) ? experience.pendingYaleProgress : experience.yaleProgress;
      if (experience.stage >= experience.route.length - 1) {
        experience.currentQuestion = experience.yaleQuestions[experience.yaleProgress] || null;
      } else {
        experience.currentQuestion = experience.mainQuestions[experience.stage] || null;
      }
      experience.revealed = false;
      experience.lastCorrect = null;
      experience.selectedIndex = null;
      experience.pendingStage = null;
      experience.pendingYaleProgress = null;

      renderExperience();
    }

    function startRelayRoute() {
      const experience = state.experience;
      if (!experience || experience.type !== "relay" || experience.started || experience.unavailableReason) {
        return;
      }

      if (experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups) {
        return;
      }

      const relayPlan = buildRelayQuestionSequence(
        experience.setupQuestionCount,
        getRawEntriesForRunSetupCategoryIds(experience.setupCategoryIds)
      );
      if (relayPlan.unavailableReason || !relayPlan.questions.length) {
        experience.unavailableReason = relayPlan.unavailableReason || getUnavailableRawGameReason();
        renderExperience();
        return;
      }

      experience.questions = relayPlan.questions;
      experience.index = 0;
      experience.started = true;
      experience.answerTimeRemaining = GAME_CONFIG.relayAnswerTime;
      renderExperience();
    }

    function toggleRelaySetupCategory(categoryId) {
      const experience = state.experience;
      if (!experience || experience.type !== "relay" || experience.started) {
        return;
      }

      if (!toggleSetupCategorySelection(experience, categoryId)) {
        return;
      }

      renderExperience();
    }

    function setRelayTeamCount(count) {
      const experience = state.experience;
      if (!experience || experience.type !== "relay" || experience.started) {
        return;
      }

      if (count < GAME_CONFIG.relayMinTeams || count > GAME_CONFIG.relayMaxTeams) {
        return;
      }

      experience.teams = createRelayTeams(count);
      renderExperience();
    }

    function setRelayQuestionCount(count) {
      const experience = state.experience;
      if (!experience || experience.type !== "relay" || experience.started) {
        return;
      }

      if (!GAME_CONFIG.relayQuestionOptions.includes(count)) {
        return;
      }

      experience.setupQuestionCount = count;
      renderExperience();
    }

    function buzzRelayTeam(teamIndex) {
      const experience = state.experience;
      if (
        !experience ||
        experience.type !== "relay" ||
        !experience.started ||
        experience.revealed ||
        experience.buzzedTeamIndex !== null ||
        teamIndex < 0 ||
        teamIndex >= experience.teams.length
      ) {
        return;
      }

      experience.buzzedTeamIndex = teamIndex;
      experience.answerTimeRemaining = GAME_CONFIG.relayAnswerTime;
      playRelayBuzzSound();
      renderExperience();
    }

    function answerRelayQuestion(optionIndex) {
      const experience = state.experience;
      if (
        !experience ||
        experience.type !== "relay" ||
        experience.revealed ||
        !Number.isInteger(experience.buzzedTeamIndex)
      ) {
        return;
      }

      const question = experience.questions[experience.index];
      const isCorrect = optionIndex === question.answerIndex;
      resolveRelayOutcome(optionIndex, isCorrect, false);
    }

    function getRelayAwardRecipients(experience, excludedIndex) {
      return experience.teams.filter((_, index) => index !== excludedIndex);
    }

    function formatRelayAwardedTeams(labels = []) {
      if (!labels.length) {
        return "";
      }

      if (labels.length === 1) {
        return labels[0];
      }

      if (labels.length === 2) {
        return `${labels[0]} and ${labels[1]}`;
      }

      return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
    }

    function resolveRelayOutcome(optionIndex, isCorrect, timedOut) {
      const experience = state.experience;
      if (!experience || experience.type !== "relay" || !Number.isInteger(experience.buzzedTeamIndex)) {
        return;
      }

      const team = experience.teams[experience.buzzedTeamIndex];
      const question = experience.questions[experience.index];
      const awardedTeams = isCorrect ? [team] : getRelayAwardRecipients(experience, experience.buzzedTeamIndex);
      const awardedTeamLabels = awardedTeams.map((entry) => entry.label);

      clearRelayAnswerTimer();
      experience.revealed = true;
      experience.lastCorrect = isCorrect;
      experience.lastTimedOut = timedOut;
      experience.lastAwardedTeamLabels = awardedTeamLabels;
      experience.selectedIndex = optionIndex;

      if (isCorrect) {
        team.score += GAME_CONFIG.relayCorrectPoints;
        team.correct += 1;
      } else {
        team.wrong += 1;
        awardedTeams.forEach((awardedTeam) => {
          awardedTeam.score += GAME_CONFIG.relayCorrectPoints;
        });
      }

      experience.answers.push({
        questionId: question.id,
        sectionId: question.sectionId,
        subjectIds: question.subjectIds,
        bigIdeaIds: question.bigIdeaIds || [],
        isCorrect,
        teamId: team.id,
        teamLabel: team.label,
        awardedTeamIds: awardedTeams.map((awardedTeam) => awardedTeam.id),
        awardedTeamLabels: awardedTeamLabels.slice(),
        timedOut
      });

      renderExperience();
    }

    function handleRelayTimeout() {
      const experience = state.experience;
      if (
        !experience ||
        experience.type !== "relay" ||
        experience.revealed ||
        !Number.isInteger(experience.buzzedTeamIndex)
      ) {
        return;
      }

      resolveRelayOutcome(null, false, true);
    }

    function advanceRelayQuestion() {
      const experience = state.experience;
      if (!experience || experience.type !== "relay") {
        return;
      }

      if (experience.index === experience.questions.length - 1) {
        experience.finished = true;
        finalizeSessionStats(experience.answers, getBestStreakFromAnswers(experience.answers), {
          type: "relay",
          score: getHighestTeamScore(experience.teams),
          teamOneScore: Number(experience.teams[0]?.score) || 0
        });
      } else {
        experience.index += 1;
        experience.buzzedTeamIndex = null;
        experience.answerTimeRemaining = GAME_CONFIG.relayAnswerTime;
        experience.revealed = false;
        experience.lastCorrect = null;
        experience.lastTimedOut = false;
        experience.lastAwardedTeamLabels = [];
        experience.selectedIndex = null;
      }

      render();
    }

    function addRelayTeam() {
      const experience = state.experience;
      if (
        !experience ||
        experience.type !== "relay" ||
        experience.revealed ||
        experience.buzzedTeamIndex !== null ||
        experience.teams.length >= GAME_CONFIG.relayMaxTeams
      ) {
        return;
      }

      experience.teams.push({
        id: `relay-team-${experience.teams.length + 1}`,
        label: getThemedTeamLabel(experience.teams.length),
        key: "",
        keyLabel: "",
        score: 0,
        correct: 0,
        wrong: 0
      });
      syncRelayTeamBindings(experience);
      renderExperience();
    }

    function removeRelayTeam() {
      const experience = state.experience;
      if (
        !experience ||
        experience.type !== "relay" ||
        experience.revealed ||
        experience.buzzedTeamIndex !== null ||
        experience.teams.length <= GAME_CONFIG.relayMinTeams
      ) {
        return;
      }

      experience.teams.pop();
      syncRelayTeamBindings(experience);
      renderExperience();
    }

    function startJumpRoute() {
      const experience = state.experience;
      if (!experience || experience.type !== "jump" || experience.started || experience.unavailableReason) {
        return;
      }

      if (experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups) {
        return;
      }

      const plan = buildJumpQuestionPlan(getRawEntriesForRunSetupCategoryIds(experience.setupCategoryIds));
      if (plan.unavailableReason || !plan.questions.length) {
        experience.unavailableReason = plan.unavailableReason || getUnavailableRawGameReason();
        renderExperience();
        return;
      }

      experience.questions = plan.questions || [];
      experience.index = 0;
      experience.currentQuestion = experience.questions[0] || null;
      experience.phase = "running";
      experience.started = true;
      experience.obstacleCursor = 0;
      experience.obstaclesCleared = 0;
      experience.obstacle = createJumpObstacle(experience.obstacleCursor);
      experience.runnerState = "running";
      experience.lastFrameAt = null;
      renderExperience();
    }

    function toggleJumpSetupCategory(categoryId) {
      const experience = state.experience;
      if (!experience || experience.type !== "jump" || experience.started) {
        return;
      }

      if (!toggleSetupCategorySelection(experience, categoryId)) {
        return;
      }

      renderExperience();
    }

    function performJumpAction(action) {
      const experience = state.experience;
      if (!experience || experience.type !== "jump" || experience.phase !== "running") {
        return;
      }

      if (action === "jump" && experience.runnerY <= 1) {
        experience.runnerVelocity = GAME_CONFIG.jumpImpulse;
        experience.runnerState = "jumping";
      }

      if (action === "duck") {
        experience.ducking = true;
        experience.runnerState = "ducking";
        window.setTimeout(() => {
          if (state.experience && state.experience.type === "jump") {
            state.experience.ducking = false;
            state.experience.runnerState = "running";
            updateJumpDom(state.experience);
          }
        }, 620);
      }

      updateJumpDom(experience);
    }

    function answerJumpQuestion(optionIndex) {
      const experience = state.experience;
      if (!experience || experience.type !== "jump" || experience.phase !== "question") {
        return;
      }

      const question = experience.currentQuestion;
      if (!question) {
        return;
      }

      const isCorrect = optionIndex === question.answerIndex;
      experience.selectedIndex = optionIndex;
      experience.lastCorrect = isCorrect;
      experience.phase = "feedback";
      experience.score += isCorrect ? 1 : 0;
      if (!isCorrect) {
        experience.lives = Math.max(0, experience.lives - 1);
        experience.runnerState = "hurting";
      } else {
        experience.runnerState = "running";
      }

      experience.answers.push({
        questionId: question.id,
        sectionId: question.sectionId,
        subjectIds: question.subjectIds,
        bigIdeaIds: question.bigIdeaIds || [],
        isCorrect
      });

      renderExperience();
    }

    function continueJumpRoute() {
      const experience = state.experience;
      if (!experience || experience.type !== "jump" || experience.phase !== "feedback") {
        return;
      }

      if (experience.lives <= 0 || experience.index >= experience.questions.length - 1) {
        experience.failed = experience.lives <= 0;
        experience.finished = true;
        finalizeSessionStats(experience.answers, getBestStreakFromAnswers(experience.answers), {
          type: "jump",
          score: experience.score,
          distance: experience.distance
        });
        render();
        return;
      }

      experience.index += 1;
      experience.currentQuestion = experience.questions[experience.index] || null;
      experience.phase = "running";
      experience.selectedIndex = null;
      experience.lastCorrect = null;
      experience.obstaclesCleared = 0;
      experience.runnerState = "running";
      queueNextJumpObstacle(experience);
      experience.lastFrameAt = null;
      renderExperience();
    }

    return Object.freeze({
      toggleSetupCategorySelection,
      startRaceRoute,
      getRaceAvailableQuestionCount,
      toggleRaceSetupCategory,
      answerRaceQuestion,
      resolveRaceQuestion,
      advanceRace,
      toggleRunSetupCategory,
      startRunRoute,
      answerRunQuestion,
      continueRun,
      startRelayRoute,
      toggleRelaySetupCategory,
      setRelayTeamCount,
      setRelayQuestionCount,
      buzzRelayTeam,
      answerRelayQuestion,
      getRelayAwardRecipients,
      formatRelayAwardedTeams,
      resolveRelayOutcome,
      handleRelayTimeout,
      advanceRelayQuestion,
      addRelayTeam,
      removeRelayTeam,
      startJumpRoute,
      toggleJumpSetupCategory,
      performJumpAction,
      answerJumpQuestion,
      continueJumpRoute
    });
  }

  global.WSC_CREATE_ARCADE_GAME_CONTROLLER = createArcadeGameController;
}(window));
