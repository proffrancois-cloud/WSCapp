(function () {
  function createTeams(count, getTeamLabel) {
    return Array.from({ length: count }, (_, index) => ({
      id: `team-${index + 1}`,
      label: getTeamLabel(index),
      playerId: null,
      userId: null,
      isGuest: false,
      score: 0,
      correct: 0,
      wrong: 0
    }));
  }

  function createTeamsFromPlayers(players = []) {
    return players
      .filter((player) => ["host", "player"].includes(player.role))
      .slice()
      .sort((left, right) => Number(left.team_index) - Number(right.team_index))
      .map((player, index) => ({
        id: `team-${index + 1}`,
        label: player.display_name || `Guest ${index + 1}`,
        playerId: player.id || null,
        userId: player.user_id || null,
        isGuest: Boolean(player.is_guest),
        score: 0,
        correct: 0,
        wrong: 0
      }));
  }

  function createTile(question, index, values) {
    return {
      question,
      value: values[index],
      done: false,
      result: null,
      teamIndex: null
    };
  }

  function buildConfiguredBoard(categoryIds, helpers) {
    const usedQuestionIds = new Set();
    return categoryIds.map((categoryId) => {
      const pool = helpers.getQuestionsForCategory(categoryId);
      const chosen = pickQuestionsForCategory(pool, usedQuestionIds, helpers);

      return {
        label: helpers.getCategoryLabel(categoryId),
        tiles: chosen.map((question, index) => createTile(question, index, helpers.values))
      };
    });
  }

  function pickQuestionsForCategory(pool, usedQuestionIds, helpers) {
    const rowCount = helpers.values.length;
    let chosen = [];

    helpers.values.forEach((_value, index) => {
      const targetLevel = index + 1;
      const candidates = helpers.shuffle(pool.filter((question) => (
        Number(question.rawLevel) === targetLevel &&
        !usedQuestionIds.has(question.id) &&
        !chosen.some((item) => item.id === question.id)
      )));
      if (candidates.length) {
        chosen.push(candidates[0]);
      }
    });

    if (chosen.length < rowCount) {
      const fallback = helpers.shuffle(helpers.selectionQuestions().filter((question) => (
        !usedQuestionIds.has(question.id) &&
        !chosen.some((item) => item.id === question.id)
      )));
      chosen = chosen.concat(fallback.slice(0, rowCount - chosen.length));
    }

    chosen.forEach((question) => usedQuestionIds.add(question.id));
    return chosen.slice(0, rowCount);
  }

  function buildBoardFromDefinitions(selectionQuestions, definitions, groupCount, helpers) {
    const rowCount = helpers.values.length;
    let remaining = helpers.shuffle(selectionQuestions.slice());

    return definitions.slice(0, groupCount).map((definition) => {
      const chosen = [];
      const nextRemaining = [];

      remaining.forEach((question) => {
        if (chosen.length < rowCount && definition.match(question)) {
          chosen.push(question);
        } else {
          nextRemaining.push(question);
        }
      });

      remaining = nextRemaining;

      if (chosen.length !== rowCount) {
        return null;
      }

      return {
        label: definition.label,
        tiles: chosen.map((question, index) => createTile(question, index, helpers.values))
      };
    }).filter(Boolean);
  }

  function buildFallbackBoard(selectionQuestions, helpers) {
    const shuffled = helpers.shuffle(selectionQuestions.slice());
    const rowCount = helpers.values.length;
    const maxColumns = Math.min(
      helpers.maxGroups,
      Math.max(helpers.minGroups, Math.floor(shuffled.length / rowCount))
    );

    return Array.from({ length: maxColumns }, (_, groupIndex) => {
      const groupQuestions = shuffled.slice(groupIndex * rowCount, (groupIndex + 1) * rowCount);
      return {
        label: `Mixed Lane ${groupIndex + 1}`,
        tiles: groupQuestions.map((question, index) => createTile(question, index, helpers.values))
      };
    }).filter((group) => group.tiles.length === rowCount);
  }

  function countTiles(board) {
    return board.reduce((sum, group) => sum + group.tiles.length, 0);
  }

  function countDoneTiles(board) {
    return board.reduce((sum, group) => sum + group.tiles.filter((tile) => tile.done).length, 0);
  }

  function allTilesDone(board) {
    return countDoneTiles(board) === countTiles(board);
  }

  function getStandings(teams) {
    return teams.slice().sort((left, right) =>
      right.score - left.score ||
      right.correct - left.correct ||
      left.wrong - right.wrong ||
      left.label.localeCompare(right.label)
    );
  }

  function getHighestTeamScore(teams = []) {
    return teams.reduce((best, team) => Math.max(best, Number(team.score) || 0), 0);
  }

  window.WSC_ALPACAPARDY_ENGINE = Object.freeze({
    createTeams,
    createTeamsFromPlayers,
    createTile,
    buildConfiguredBoard,
    pickQuestionsForCategory,
    buildBoardFromDefinitions,
    buildFallbackBoard,
    countTiles,
    countDoneTiles,
    allTilesDone,
    getStandings,
    getHighestTeamScore
  });
}());
