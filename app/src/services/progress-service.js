(function () {
  function getDefaultStats() {
    return {
      sessions: 0,
      totalAnswered: 0,
      totalCorrect: 0,
      bestAccuracy: 0,
      bestStreak: 0,
      bestAlpacapardyScore: 0,
      bestRunStage: -1,
      bestJumpScore: 0,
      bestJumpDistance: 0,
      bestRelayScore: 0,
      bestRaceScore: 0,
      liveRecords: {}
    };
  }

  function normalizeStats(value) {
    const defaults = getDefaultStats();
    if (!value || typeof value !== "object") {
      return defaults;
    }

    return {
      ...defaults,
      ...Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => key !== "liveRecords")
          .map(([key, entryValue]) => [key, Number(entryValue) || 0])
      ),
      liveRecords: normalizeLiveRecords(value.liveRecords)
    };
  }

  function normalizeLiveRecords(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    return Object.fromEntries(Object.entries(value).map(([gameType, record]) => {
      const safeRecord = record && typeof record === "object" ? record : {};
      return [String(gameType || "").trim().toLowerCase(), {
        games: Math.max(0, Number(safeRecord.games) || 0),
        wins: Math.max(0, Number(safeRecord.wins) || 0),
        bestName: String(safeRecord.bestName || "").slice(0, 64),
        bestGames: Math.max(0, Number(safeRecord.bestGames) || 0),
        bestWins: Math.max(0, Number(safeRecord.bestWins) || 0)
      }];
    }));
  }

  function normalizeRawMastery(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(value)
        .filter(([key, entryValue]) => key && entryValue === true)
        .map(([key]) => [key, true])
    );
  }

  window.WSC_PROGRESS_SERVICE = Object.freeze({
    getDefaultStats,
    normalizeStats,
    normalizeRawMastery
  });
}());
