(function () {
  function createGameResultsService({
    appState,
    engines,
    callbacks
  }) {
    const { alpacapardyEngine } = engines;
    const { saveStats, renderStats } = callbacks;

    function getAccuracy(answers) {
      if (!answers.length) {
        return 0;
      }
      const correct = answers.filter((answer) => answer.isCorrect).length;
      return Math.round((correct / answers.length) * 100);
    }

    function getBestStreakFromAnswers(answers) {
      let best = 0;
      let current = 0;

      answers.forEach((answer) => {
        if (answer.isCorrect) {
          current += 1;
          best = Math.max(best, current);
        } else {
          current = 0;
        }
      });

      return best;
    }

    function getHighestTeamScore(teams = []) {
      return alpacapardyEngine.getHighestTeamScore(teams);
    }

    function getRunReachedStage(experience) {
      if (!experience || !Array.isArray(experience.route) || !experience.route.length) {
        return -1;
      }

      return Math.min(
        experience.route.length - 1,
        Math.max(0, Number.isInteger(experience.stage) ? experience.stage : 0)
      );
    }

    function updateBestGameStats(result) {
      if (!result || typeof result !== "object") {
        return;
      }

      if (result.type === "jeopardy") {
        appState.stats.bestAlpacapardyScore = Math.max(
          appState.stats.bestAlpacapardyScore,
          Number(result.teamOneScore ?? result.score) || 0
        );
      } else if (result.type === "run") {
        const stage = Number(result.stage);
        appState.stats.bestRunStage = Math.max(appState.stats.bestRunStage, Number.isFinite(stage) ? stage : -1);
      } else if (result.type === "jump") {
        appState.stats.bestJumpScore = Math.max(appState.stats.bestJumpScore, Number(result.score) || 0);
        appState.stats.bestJumpDistance = Math.max(appState.stats.bestJumpDistance, Number(result.distance) || 0);
      } else if (result.type === "relay") {
        appState.stats.bestRelayScore = Math.max(
          appState.stats.bestRelayScore,
          Number(result.teamOneScore ?? result.score) || 0
        );
      } else if (result.type === "race") {
        appState.stats.bestRaceScore = Math.max(appState.stats.bestRaceScore, Number(result.score) || 0);
      }
    }

    function finalizeSessionStats(answers, bestStreak, gameResult = null) {
      const accuracy = getAccuracy(answers);
      const answered = answers.length;
      const correct = answers.filter((answer) => answer.isCorrect).length;
      appState.stats.sessions += 1;
      appState.stats.totalAnswered += answered;
      appState.stats.totalCorrect += correct;
      appState.stats.bestAccuracy = Math.max(appState.stats.bestAccuracy, accuracy);
      appState.stats.bestStreak = Math.max(appState.stats.bestStreak, bestStreak);
      updateBestGameStats(gameResult);
      saveStats();
      renderStats();
    }

    function getPerformanceRating(accuracy) {
      if (accuracy >= 90) {
        return {
          title: "Tournament of Champions Alpaca",
          badge: "Brilliant arrival",
          body: "You already have a strong grip on the logic of the theme and the way it connects across subjects."
        };
      }

      if (accuracy >= 75) {
        return {
          title: "Strategist Alpaca",
          badge: "Almost at the summit",
          body: "Very strong foundation. A few foggy patches remain, but the structure of the theme is already clear."
        };
      }

      if (accuracy >= 55) {
        return {
          title: "In-Transit Alpaca",
          badge: "Good direction",
          body: "You have the major lanes in place. Another run should turn more of those near-misses into instant answers."
        };
      }

      return {
        title: "Explorer Alpaca",
        badge: "The journey begins",
        body: "This is a good starting point. Repeat exposure is exactly how this theme becomes natural and fast."
      };
    }

    function getPerformanceMood(accuracy) {
      if (accuracy >= 90) {
        return "victory";
      }
      if (accuracy >= 75) {
        return "happy";
      }
      if (accuracy >= 50) {
        return "wise";
      }
      return "sad";
    }

    return Object.freeze({
      getAccuracy,
      getBestStreakFromAnswers,
      getHighestTeamScore,
      getRunReachedStage,
      updateBestGameStats,
      finalizeSessionStats,
      getPerformanceRating,
      getPerformanceMood
    });
  }

  window.WSC_CREATE_GAME_RESULTS_SERVICE = createGameResultsService;
}());
