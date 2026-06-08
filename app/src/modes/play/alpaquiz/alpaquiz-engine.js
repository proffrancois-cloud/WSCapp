(function () {
  const VALID_DIFFICULTIES = [1, 2, 3, 4, 5];
  const VALID_QUESTION_COUNTS = [10, 15, 20];

  function normalizeDifficultySelection(selectedDifficulties = []) {
    return Array.from(new Set((selectedDifficulties || [])
      .map((level) => Number(level))
      .filter((level) => VALID_DIFFICULTIES.includes(level))))
      .sort((left, right) => left - right);
  }

  function getQuestionPattern(questionCount, selectedDifficulties = VALID_DIFFICULTIES) {
    const levels = normalizeDifficultySelection(selectedDifficulties);
    if (!levels.length) {
      return [];
    }

    const baseCount = Math.floor(questionCount / levels.length);
    let remainder = questionCount % levels.length;
    const counts = Object.fromEntries(levels.map((level) => [level, baseCount]));
    const descending = levels.slice().sort((left, right) => right - left);
    let index = 0;

    while (remainder > 0) {
      counts[descending[index % descending.length]] += 1;
      remainder -= 1;
      index += 1;
    }

    return levels.flatMap((level) => Array.from({ length: counts[level] }, () => level));
  }

  function buildQuestionPlan(sectionIds, questionCount, selectedDifficulties = VALID_DIFFICULTIES, helpers) {
    const entries = helpers.getEntriesForSectionIds(sectionIds);
    const pools = helpers.buildQuestionPools(entries);
    const levels = normalizeDifficultySelection(selectedDifficulties);
    if (!levels.length) {
      return {
        unavailableReason: "Choose at least one difficulty.",
        questions: []
      };
    }

    if (!helpers.hasRequiredLevels(pools, levels)) {
      return {
        unavailableReason: "Choose more guiding sections, or choose all sections, so the quiz has questions for every selected difficulty.",
        questions: []
      };
    }

    const pattern = getQuestionPattern(questionCount, levels);
    const questions = helpers.buildPatternQuestionSequence(pattern, pools, true);
    return {
      unavailableReason: questions.length === pattern.length ? null : helpers.getUnavailableReason(),
      questions
    };
  }

  function toggleDifficulty(selectedDifficulties, level) {
    const numericLevel = Number(level);
    if (!VALID_DIFFICULTIES.includes(numericLevel)) {
      return normalizeDifficultySelection(selectedDifficulties);
    }

    const current = new Set(normalizeDifficultySelection(selectedDifficulties));
    if (current.has(numericLevel)) {
      current.delete(numericLevel);
    } else {
      current.add(numericLevel);
    }

    return normalizeDifficultySelection([...current]);
  }

  function setQuestionCount(currentCount, requestedCount) {
    const count = Number(requestedCount);
    return VALID_QUESTION_COUNTS.includes(count) ? count : currentCount;
  }

  function getRemainingNotice(experience) {
    const total = experience?.questions?.length || 0;
    const answeredCount = Object.keys(experience?.selectedAnswers || {}).length;
    const remaining = Math.max(0, total - answeredCount);
    if (!remaining) {
      return "";
    }
    return `${remaining} ${remaining === 1 ? "question" : "questions"} remaining.`;
  }

  function getDifficultyResults(experience) {
    const rows = VALID_DIFFICULTIES.map((level) => ({
      level,
      correct: 0,
      total: 0
    }));

    (experience.questions || []).forEach((question, index) => {
      const level = Math.max(1, Math.min(5, Number(question.rawLevel) || 1));
      const row = rows[level - 1];
      row.total += 1;
      if (experience.selectedAnswers[index] === question.answerIndex) {
        row.correct += 1;
      }
    });

    return rows;
  }

  function answerQuestion(experience, questionIndex, optionIndex) {
    if (!experience?.questions?.[questionIndex]) {
      return experience?.selectedAnswers || {};
    }

    return {
      ...(experience.selectedAnswers || {}),
      [questionIndex]: optionIndex
    };
  }

  function buildSubmittedAnswers(experience) {
    let score = 0;
    const answers = (experience.questions || []).map((question, index) => {
      const selectedIndex = experience.selectedAnswers[index];
      const isCorrect = selectedIndex === question.answerIndex;
      if (isCorrect) {
        score += 1;
      }
      return {
        questionId: question.id,
        sectionId: question.sectionId,
        subjectIds: question.subjectIds || [],
        bigIdeaIds: question.bigIdeaIds || [],
        isCorrect
      };
    });

    return { answers, score };
  }

  window.WSC_ALPAQUIZ_ENGINE = Object.freeze({
    validDifficulties: VALID_DIFFICULTIES,
    validQuestionCounts: VALID_QUESTION_COUNTS,
    normalizeDifficultySelection,
    getQuestionPattern,
    buildQuestionPlan,
    toggleDifficulty,
    setQuestionCount,
    getRemainingNotice,
    getDifficultyResults,
    answerQuestion,
    buildSubmittedAnswers
  });
}());
