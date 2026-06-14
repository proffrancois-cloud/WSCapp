(function initAlpacapardyController(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC Alpacapardy controller missing function dependency: " + name);
    }
    return value;
  }

  function createAlpacapardyController(options = {}) {
    const {
      appState: state,
      windowRef = global,
      alpacapardyLive = null,
      constants = {},
      callbacks = {}
    } = options;

    if (!state) {
      throw new Error("WSC Alpacapardy controller missing app state.");
    }

    const window = windowRef;
    const GAME_CONFIG = constants.GAME_CONFIG || {};
    let jeopardyTimerId = null;

    const allJeopardyTilesDone = requiredFunction(callbacks, "allJeopardyTilesDone");
    const buildConfiguredJeopardyBoard = requiredFunction(callbacks, "buildConfiguredJeopardyBoard");
    const canAnswerAlpacapardyLiveFocus = requiredFunction(callbacks, "canAnswerAlpacapardyLiveFocus");
    const canCloseAlpacapardyLiveFocus = requiredFunction(callbacks, "canCloseAlpacapardyLiveFocus");
    const canOpenAlpacapardyLiveTile = requiredFunction(callbacks, "canOpenAlpacapardyLiveTile");
    const clearJumpAnimation = requiredFunction(callbacks, "clearJumpAnimation");
    const clearRaceTimer = requiredFunction(callbacks, "clearRaceTimer");
    const clearRelayAnswerTimer = requiredFunction(callbacks, "clearRelayAnswerTimer");
    const clearRunTimer = requiredFunction(callbacks, "clearRunTimer");
    const createJeopardyTeams = requiredFunction(callbacks, "createJeopardyTeams");
    const emitAlpacapardyLiveEvent = requiredFunction(callbacks, "emitAlpacapardyLiveEvent");
    const finalizeSessionStats = requiredFunction(callbacks, "finalizeSessionStats");
    const getAlpacapardyLiveIdentityContext = requiredFunction(callbacks, "getAlpacapardyLiveIdentityContext");
    const getBestStreakFromAnswers = requiredFunction(callbacks, "getBestStreakFromAnswers");
    const getHighestTeamScore = requiredFunction(callbacks, "getHighestTeamScore");
    const getThemedTeamLabel = requiredFunction(callbacks, "getThemedTeamLabel");
    const isAlpacapardyLiveActive = requiredFunction(callbacks, "isAlpacapardyLiveActive");
    const render = requiredFunction(callbacks, "render");
    const renderExperience = requiredFunction(callbacks, "renderExperience");
    const renderExperiencePreservingScroll = requiredFunction(callbacks, "renderExperiencePreservingScroll");
    const renderLiveSurfaces = requiredFunction(callbacks, "renderLiveSurfaces");
    const syncAlpacapardyLiveSettings = requiredFunction(callbacks, "syncAlpacapardyLiveSettings");

    function clearJeopardyTimer() {
      if (jeopardyTimerId) {
        window.clearInterval(jeopardyTimerId);
        jeopardyTimerId = null;
      }
      clearRunTimer();
      clearRaceTimer();
      clearRelayAnswerTimer();
      clearJumpAnimation();
    }

    function setJeopardyTeamCount(count) {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy" || experience.started) {
        return;
      }

      if (
        experience.playMode === "multiplayer" &&
        state.live.currentSession &&
        (!getAlpacapardyLiveIdentityContext().isHost || state.live.players.length > 1)
      ) {
        return;
      }

      if (count < GAME_CONFIG.jeopardyMinTeams || count > GAME_CONFIG.jeopardyMaxTeams) {
        return;
      }

      experience.setupTeamCount = count;
      experience.teams = createJeopardyTeams(count);
      experience.activeTeamIndex = 0;
      if (experience.playMode === "multiplayer" && state.live.currentSession) {
        syncAlpacapardyLiveSettings();
      }
      renderLiveSurfaces();
    }

    function toggleJeopardySetupCategory(categoryId) {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy" || experience.started) {
        return;
      }

      if (
        experience.playMode === "multiplayer" &&
        state.live.currentSession &&
        !getAlpacapardyLiveIdentityContext().isHost
      ) {
        return;
      }

      const current = new Set(experience.setupCategoryIds);
      if (current.has(categoryId)) {
        if (current.size === 1) {
          return;
        }
        current.delete(categoryId);
      } else if (current.size < GAME_CONFIG.jeopardyMinGroups) {
        current.add(categoryId);
      } else {
        return;
      }

      experience.setupCategoryIds = Array.from(current);
      if (experience.playMode === "multiplayer" && state.live.currentSession) {
        syncAlpacapardyLiveSettings();
      }
      renderLiveSurfaces();
    }

    function startJeopardyGame() {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy" || experience.started) {
        return;
      }

      if (experience.playMode === "multiplayer") {
        return;
      }

      if (experience.setupCategoryIds.length !== GAME_CONFIG.jeopardyMinGroups) {
        return;
      }

      experience.started = true;
      experience.teams = createJeopardyTeams(experience.setupTeamCount);
      experience.board = buildConfiguredJeopardyBoard(experience.setupCategoryIds);
      experience.activeTeamIndex = 0;
      renderExperience();
    }

    function openJeopardyTile(groupIndex, tileIndex) {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy") {
        return;
      }

      if (isAlpacapardyLiveActive()) {
        if (!canOpenAlpacapardyLiveTile()) {
          return;
        }
        emitAlpacapardyLiveEvent(alpacapardyLive.createTileOpenedEvent({
          groupIndex,
          tileIndex,
          teamIndex: experience.activeTeamIndex,
          answerTime: GAME_CONFIG.jeopardyAnswerTime
        }));
        return;
      }

      if (experience.active) {
        return;
      }

      const tile = experience.board[groupIndex].tiles[tileIndex];
      if (!tile || tile.done) {
        return;
      }

      experience.active = {
        groupIndex,
        tileIndex,
        teamIndex: experience.activeTeamIndex,
        timeRemaining: GAME_CONFIG.jeopardyAnswerTime,
        revealed: false,
        selectedIndex: null,
        correct: false,
        timedOut: false
      };

      renderExperience();
      startJeopardyTimer();
    }

    function answerJeopardyQuestion(optionIndex) {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy" || !experience.active || experience.active.revealed) {
        return;
      }

      if (isAlpacapardyLiveActive()) {
        if (!canAnswerAlpacapardyLiveFocus()) {
          return;
        }
        emitAlpacapardyLiveEvent(alpacapardyLive.createTileAnsweredEvent({ optionIndex, timedOut: false }));
        return;
      }

      resolveJeopardyQuestion(optionIndex, false);
    }

    function resolveJeopardyTimeout() {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy" || !experience.active || experience.active.revealed) {
        clearJeopardyTimer();
        return;
      }

      if (isAlpacapardyLiveActive()) {
        clearJeopardyTimer();
        if (canAnswerAlpacapardyLiveFocus()) {
          emitAlpacapardyLiveEvent(alpacapardyLive.createTileAnsweredEvent({ optionIndex: null, timedOut: true }));
        }
        return;
      }

      resolveJeopardyQuestion(null, true);
    }

    function resolveJeopardyQuestion(optionIndex, timedOut) {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy" || !experience.active || experience.active.revealed) {
        return;
      }

      clearJeopardyTimer();

      const active = experience.active;
      const tile = experience.board[active.groupIndex].tiles[active.tileIndex];
      const question = tile.question;
      const team = experience.teams[active.teamIndex];
      const isCorrect = !timedOut && optionIndex === question.answerIndex;

      active.revealed = true;
      active.selectedIndex = Number.isInteger(optionIndex) ? optionIndex : null;
      active.correct = isCorrect;
      active.timedOut = timedOut;
      tile.done = true;
      tile.teamIndex = active.teamIndex;
      tile.result = isCorrect ? "correct" : (timedOut ? "timeout" : "wrong");

      if (isCorrect) {
        team.score += tile.value;
        team.correct += 1;
      } else {
        team.wrong += 1;
      }

      experience.answers.push({
        questionId: question.id,
        sectionId: question.sectionId,
        subjectIds: question.subjectIds,
        bigIdeaIds: question.bigIdeaIds || [],
        isCorrect,
        teamId: team.id,
        teamLabel: team.label,
        timedOut
      });

      renderExperience();
    }

    function closeJeopardyFocus() {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy") {
        return;
      }

      if (isAlpacapardyLiveActive()) {
        if (!canCloseAlpacapardyLiveFocus()) {
          return;
        }
        clearJeopardyTimer();
        emitAlpacapardyLiveEvent(alpacapardyLive.createFocusClosedEvent());
        return;
      }

      clearJeopardyTimer();
      const nextTeamIndex = experience.active ? (experience.active.teamIndex + 1) % experience.teams.length : experience.activeTeamIndex;
      experience.active = null;
      if (allJeopardyTilesDone(experience.board)) {
        experience.finished = true;
        finalizeSessionStats(experience.answers, getBestStreakFromAnswers(experience.answers), {
          type: "jeopardy",
          score: getHighestTeamScore(experience.teams),
          teamOneScore: Number(experience.teams[0]?.score) || 0
        });
      } else {
        experience.activeTeamIndex = nextTeamIndex;
      }

      render();
    }

    function startJeopardyTimer() {
      clearJeopardyTimer();

      jeopardyTimerId = window.setInterval(() => {
        const experience = state.experience;
        if (!experience || experience.type !== "jeopardy" || !experience.active) {
          clearJeopardyTimer();
          return;
        }

        if (experience.active.revealed) {
          clearJeopardyTimer();
          return;
        }

        if (experience.active.timeRemaining <= 1) {
          resolveJeopardyTimeout();
          return;
        }

        experience.active.timeRemaining -= 1;
        renderExperiencePreservingScroll();
      }, 1000);
    }

    function chooseJeopardyTeam(teamIndex) {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy" || experience.active) {
        return;
      }

      if (isAlpacapardyLiveActive()) {
        return;
      }

      if (teamIndex < 0 || teamIndex >= experience.teams.length) {
        return;
      }

      experience.activeTeamIndex = teamIndex;
      renderExperience();
    }

    function addJeopardyTeam() {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy" || experience.active || experience.teams.length >= GAME_CONFIG.jeopardyMaxTeams) {
        return;
      }

      if (isAlpacapardyLiveActive()) {
        return;
      }

      const nextIndex = experience.teams.length;
      experience.teams.push({
        id: `team-${nextIndex + 1}`,
        label: getThemedTeamLabel(nextIndex),
        score: 0,
        correct: 0,
        wrong: 0
      });
      renderExperience();
    }

    function removeJeopardyTeam() {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy" || experience.active || experience.teams.length <= GAME_CONFIG.jeopardyMinTeams) {
        return;
      }

      if (isAlpacapardyLiveActive()) {
        return;
      }

      experience.teams.pop();
      experience.activeTeamIndex = Math.min(experience.activeTeamIndex, experience.teams.length - 1);
      renderExperience();
    }

    function advanceJeopardyTeam() {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy" || experience.active) {
        return;
      }

      if (isAlpacapardyLiveActive()) {
        return;
      }

      experience.activeTeamIndex = (experience.activeTeamIndex + 1) % experience.teams.length;
      renderExperience();
    }

    return Object.freeze({
      clearJeopardyTimer,
      setJeopardyTeamCount,
      toggleJeopardySetupCategory,
      startJeopardyGame,
      openJeopardyTile,
      answerJeopardyQuestion,
      resolveJeopardyTimeout,
      resolveJeopardyQuestion,
      closeJeopardyFocus,
      startJeopardyTimer,
      chooseJeopardyTeam,
      addJeopardyTeam,
      removeJeopardyTeam,
      advanceJeopardyTeam
    });
  }

  global.WSC_CREATE_ALPACAPARDY_CONTROLLER = createAlpacapardyController;
}(window));
