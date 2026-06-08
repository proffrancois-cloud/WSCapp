(function () {
  const EVENT_TYPES = Object.freeze({
    BOARD_STARTED: "alpacapardy.board_started",
    TEAM_SELECTED: "alpacapardy.team_selected",
    TILE_OPENED: "alpacapardy.tile_opened",
    TILE_ANSWERED: "alpacapardy.tile_answered",
    FOCUS_CLOSED: "alpacapardy.focus_closed",
    SESSION_FORFEITED: "alpacapardy.session_forfeited",
    CHAT_MESSAGE: "alpacapardy.chat_message"
  });

  function createState({ board = [], teams = [], activeTeamIndex = 0, active = null, answers = [], chat = [], finished = false, forfeit = null } = {}) {
    return {
      gameType: "alpacapardy",
      started: Boolean(board.length),
      finished: Boolean(finished),
      board: clone(board),
      teams: clone(teams),
      activeTeamIndex,
      active: clone(active),
      answers: clone(answers),
      chat: clone(chat),
      forfeit: clone(forfeit)
    };
  }

  function createBoardStartedEvent({ board, teams, activeTeamIndex = 0 }) {
    return {
      type: EVENT_TYPES.BOARD_STARTED,
      payload: {
        board: clone(board),
        teams: clone(teams),
        activeTeamIndex
      }
    };
  }

  function createTeamSelectedEvent(teamIndex) {
    return {
      type: EVENT_TYPES.TEAM_SELECTED,
      payload: { teamIndex }
    };
  }

  function createTileOpenedEvent({ groupIndex, tileIndex, teamIndex, answerTime }) {
    return {
      type: EVENT_TYPES.TILE_OPENED,
      payload: {
        groupIndex,
        tileIndex,
        teamIndex,
        answerTime
      }
    };
  }

  function createTileAnsweredEvent({ optionIndex = null, timedOut = false } = {}) {
    return {
      type: EVENT_TYPES.TILE_ANSWERED,
      payload: {
        optionIndex,
        timedOut
      }
    };
  }

  function createFocusClosedEvent() {
    return {
      type: EVENT_TYPES.FOCUS_CLOSED,
      payload: {}
    };
  }

  function createSessionForfeitedEvent({ forfeitingUserId, winnerUserId = null, reason = "left_game" } = {}) {
    return {
      type: EVENT_TYPES.SESSION_FORFEITED,
      payload: {
        forfeitingUserId,
        winnerUserId,
        reason
      }
    };
  }

  function createChatMessageEvent({ playerId, userId, displayName, message } = {}) {
    return {
      type: EVENT_TYPES.CHAT_MESSAGE,
      payload: {
        playerId,
        userId,
        displayName,
        message: String(message || "").trim().slice(0, 300),
        sentAt: new Date().toISOString()
      }
    };
  }

  function reduce(state, event, helpers = {}) {
    const next = clone(state || createState());
    const payload = event && event.payload ? event.payload : {};

    switch (event && event.type) {
      case EVENT_TYPES.BOARD_STARTED:
        next.started = true;
        next.finished = false;
        next.board = clone(payload.board || []);
        next.teams = clone(payload.teams || []);
        next.activeTeamIndex = clampTeamIndex(payload.activeTeamIndex, next.teams);
        next.active = null;
        next.answers = [];
        return next;

      case EVENT_TYPES.TEAM_SELECTED:
        if (next.active) {
          return next;
        }
        next.activeTeamIndex = clampTeamIndex(payload.teamIndex, next.teams);
        return next;

      case EVENT_TYPES.TILE_OPENED:
        if (next.active || next.finished) {
          return next;
        }
        if (!getTile(next.board, payload.groupIndex, payload.tileIndex) || getTile(next.board, payload.groupIndex, payload.tileIndex).done) {
          return next;
        }
        next.active = {
          groupIndex: payload.groupIndex,
          tileIndex: payload.tileIndex,
          teamIndex: clampTeamIndex(payload.teamIndex, next.teams),
          timeRemaining: Math.max(0, Number(payload.answerTime) || 0),
          revealed: false,
          selectedIndex: null,
          correct: false,
          timedOut: false
        };
        return next;

      case EVENT_TYPES.TILE_ANSWERED:
        return answerActiveTile(next, payload, helpers);

      case EVENT_TYPES.FOCUS_CLOSED:
        return closeFocus(next, helpers);

      case EVENT_TYPES.SESSION_FORFEITED:
        return forfeitSession(next, payload);

      case EVENT_TYPES.CHAT_MESSAGE:
        next.chat = Array.isArray(next.chat) ? next.chat : [];
        if (payload.message) {
          next.chat.push({
            playerId: payload.playerId || null,
            userId: payload.userId || null,
            displayName: payload.displayName || "Guest",
            message: payload.message,
            sentAt: payload.sentAt || new Date().toISOString()
          });
          next.chat = next.chat.slice(-50);
        }
        return next;

      default:
        return next;
    }
  }

  function answerActiveTile(state, payload, helpers) {
    if (!state.active || state.active.revealed) {
      return state;
    }

    const active = state.active;
    const tile = getTile(state.board, active.groupIndex, active.tileIndex);
    const team = state.teams[active.teamIndex];
    if (!tile || !team) {
      return state;
    }

    const question = tile.question || {};
    const optionIndex = Number.isInteger(payload.optionIndex) ? payload.optionIndex : null;
    const timedOut = Boolean(payload.timedOut);
    const isCorrect = !timedOut && optionIndex === question.answerIndex;

    active.revealed = true;
    active.selectedIndex = optionIndex;
    active.correct = isCorrect;
    active.timedOut = timedOut;
    tile.done = true;
    tile.teamIndex = active.teamIndex;
    tile.result = isCorrect ? "correct" : (timedOut ? "timeout" : "wrong");

    if (isCorrect) {
      team.score += Number(tile.value) || 0;
      team.correct += 1;
    } else {
      team.wrong += 1;
    }

    state.answers.push({
      questionId: question.id,
      sectionId: question.sectionId,
      subjectIds: question.subjectIds || [],
      bigIdeaIds: question.bigIdeaIds || [],
      isCorrect,
      teamId: team.id,
      teamLabel: team.label,
      userId: team.userId || null,
      playerId: team.playerId || null,
      timedOut
    });

    if (helpers.afterAnswer) {
      helpers.afterAnswer(state, { tile, team, question, isCorrect, timedOut });
    }

    return state;
  }

  function forfeitSession(state, payload) {
    const forfeitingUserId = payload.forfeitingUserId || null;
    const winnerUserId = payload.winnerUserId || null;
    const winnerTeam = state.teams.find((team) => team.userId === winnerUserId) ||
      state.teams.find((team) => team.userId !== forfeitingUserId) ||
      null;
    const remainingPoints = countRemainingPoints(state.board);

    if (winnerTeam && remainingPoints > 0) {
      winnerTeam.score += remainingPoints;
    }

    state.finished = true;
    state.active = null;
    state.forfeit = {
      forfeitingUserId,
      winnerUserId: winnerTeam?.userId || winnerUserId,
      winnerTeamId: winnerTeam?.id || null,
      reason: payload.reason || "left_game",
      awardedPoints: remainingPoints
    };
    return state;
  }

  function closeFocus(state, helpers) {
    const nextTeamIndex = state.active
      ? (state.active.teamIndex + 1) % Math.max(1, state.teams.length)
      : state.activeTeamIndex;

    state.active = null;
    if (allTilesDone(state.board)) {
      state.finished = true;
      if (helpers.afterFinished) {
        helpers.afterFinished(state);
      }
    } else {
      state.activeTeamIndex = nextTeamIndex;
    }

    return state;
  }

  function getTile(board, groupIndex, tileIndex) {
    return board?.[groupIndex]?.tiles?.[tileIndex] || null;
  }

  function allTilesDone(board) {
    const tiles = (board || []).flatMap((group) => group.tiles || []);
    return tiles.length > 0 && tiles.every((tile) => tile.done);
  }

  function countRemainingPoints(board) {
    return (board || [])
      .flatMap((group) => group.tiles || [])
      .filter((tile) => !tile.done)
      .reduce((total, tile) => total + (Number(tile.value) || 0), 0);
  }

  function canHostControl(live) {
    return Boolean(live?.enabled && live.isHost);
  }

  function getActiveTeam(state) {
    return state?.teams?.[state.active?.teamIndex ?? state.activeTeamIndex] || null;
  }

  function isUsersTurn(state, live) {
    const team = getActiveTeam(state);
    return Boolean(live?.enabled && team && team.userId === live.userId);
  }

  function canOpenTile(state, live) {
    return Boolean(
      live?.enabled &&
      state?.started &&
      !state.finished &&
      !state.active &&
      isUsersTurn(state, live)
    );
  }

  function canAnswerFocus(state, live) {
    return Boolean(
      live?.enabled &&
      state?.active &&
      !state.active.revealed &&
      isUsersTurn(state, live)
    );
  }

  function canCloseFocus(state, live) {
    return Boolean(
      live?.enabled &&
      state?.active &&
      state.active.revealed &&
      isUsersTurn(state, live)
    );
  }

  function clampTeamIndex(value, teams) {
    const index = Number(value);
    if (!Number.isInteger(index) || index < 0 || index >= teams.length) {
      return 0;
    }
    return index;
  }

  function clone(value) {
    if (value === null || value === undefined) {
      return value;
    }
    return JSON.parse(JSON.stringify(value));
  }

  window.WSC_ALPACAPARDY_LIVE = Object.freeze({
    EVENT_TYPES,
    createState,
    createBoardStartedEvent,
    createTeamSelectedEvent,
    createTileOpenedEvent,
    createTileAnsweredEvent,
    createFocusClosedEvent,
    createSessionForfeitedEvent,
    createChatMessageEvent,
    reduce,
    allTilesDone,
    countRemainingPoints,
    canHostControl,
    isUsersTurn,
    canOpenTile,
    canAnswerFocus,
    canCloseFocus
  });
}());
