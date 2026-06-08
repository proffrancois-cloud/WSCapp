(function () {
  const LEVELS = [1, 2, 3, 4, 5];

  function createLevelPools() {
    return Object.fromEntries(LEVELS.map((level) => [level, []]));
  }

  function buildPoolsFromEntries(entries, helpers) {
    const pools = createLevelPools();

    entries.forEach((entry, entryIndex) => {
      (entry.quizQuestions || []).forEach((rawQuestion, questionIndex) => {
        const level = Number(rawQuestion.level);
        if (!pools[level] || !rawQuestion.prompt || !rawQuestion.correctAnswer || !Array.isArray(rawQuestion.wrongAnswers)) {
          return;
        }

        pools[level].push(helpers.createRawGameQuestion(entry, rawQuestion, entryIndex, questionIndex));
      });
    });

    helpers.getGuideQuestionsForEntries(entries).forEach((question) => {
      pools[3].push(question);
    });

    helpers.getFullVoyageQuestionsForEntries(entries).forEach((question) => {
      const level = Number(question.rawLevel);
      if (pools[level]) {
        pools[level].push(question);
      }
    });

    return pools;
  }

  function hasRequiredLevels(pools, levels = LEVELS) {
    return levels.every((level) => Array.isArray(pools[level]) && pools[level].length > 0);
  }

  function buildPatternSequence(pattern, pools, shuffle, allowReuse = true) {
    const workingPools = {};
    const cursors = {};

    Object.keys(pools).forEach((key) => {
      workingPools[key] = shuffle((pools[key] || []).slice());
      cursors[key] = 0;
    });

    return pattern.map((level) => {
      const key = String(level);
      const pool = workingPools[key] || [];
      if (!pool.length) {
        return null;
      }

      if (cursors[key] >= pool.length) {
        if (!allowReuse) {
          return null;
        }
        workingPools[key] = shuffle(pool.slice());
        cursors[key] = 0;
      }

      const question = workingPools[key][cursors[key]];
      cursors[key] += 1;
      return question;
    }).filter(Boolean);
  }

  function getUnavailableReason(targetLabel) {
    return `This route does not yet have a complete raw-question ladder for ${targetLabel}.`;
  }

  window.WSC_GAME_QUESTION_SERVICE = Object.freeze({
    levels: LEVELS,
    createLevelPools,
    buildPoolsFromEntries,
    hasRequiredLevels,
    buildPatternSequence,
    getUnavailableReason
  });
}());
