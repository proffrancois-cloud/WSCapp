(function () {
  function createExperienceFactoryController({
    constants,
    modes,
    helpers
  }) {
    const {
      GAME_CONFIG,
      ALPACA_RUN_ROUTE
    } = constants;
    const {
      rawContentMode
    } = modes;
    const {
      buildQuizQuestionPlan,
      createJumpObstacle,
      createRelayTeams,
      escapeHtml,
      getDefaultQuizSectionIds,
      getDefaultTargetSetupCategoryIds,
      getKnowledgeContext,
      getModeAssetPath,
      getModeOption,
      getModeUnavailableReason,
      renderConfiguredMascotAsset,
      renderPanelTitle
    } = helpers;

    function buildRawContentExperience() {
      return rawContentMode?.buildExperience
        ? rawContentMode.buildExperience(getKnowledgeContext())
        : {
            type: "rawcontent",
            title: "Raw Content",
            section: getKnowledgeContext()
          };
    }

    function buildUnavailableModeExperience(modeId) {
      const option = getModeOption(modeId) || { id: modeId, title: "Available soon", mood: "thinking" };
      return {
        type: "unavailable",
        modeId,
        title: option.title,
        mood: option.mood || "thinking",
        reason: getModeUnavailableReason(modeId) || "This section is available soon."
      };
    }

    function renderUnavailableModeExperience(experience = {}) {
      return `
        ${renderPanelTitle(experience.title || "Available soon", null, "", { showReplay: false })}
        <div class="mode-shell">
          <article class="setup-card">
            <div class="setup-card-header">
              ${renderConfiguredMascotAsset(getModeAssetPath(experience.modeId), experience.mood || "thinking", "medium", {
                alt: `${experience.title || "Available soon"} alpaca`,
                slotClass: "mascot-slot mascot-slot-medium",
                imageClass: "mascot-asset mascot-asset-medium"
              })}
              <div>
                <p class="challenge-label">Available soon</p>
                <h3>${escapeHtml(experience.reason || "This section is available soon.")}</h3>
              </div>
            </div>
          </article>
        </div>
      `;
    }

    function buildRaceExperience() {
      return {
        type: "race",
        title: "Survivalpaca",
        levels: [],
        totalQuestions: 0,
        availableQuestionCount: 0,
        setupCategoryIds: getDefaultTargetSetupCategoryIds(),
        currentLevelIndex: 0,
        currentQuestion: null,
        started: false,
        index: 0,
        score: 0,
        streak: 0,
        bestStreak: 0,
        lives: GAME_CONFIG.raceLives,
        timeRemaining: GAME_CONFIG.raceQuestionTime,
        questionTime: GAME_CONFIG.raceQuestionTime,
        timeouts: 0,
        elapsedTime: 0,
        revealed: false,
        lastCorrect: null,
        lastTimedOut: false,
        answers: [],
        failed: false,
        finished: false,
        unavailableReason: null
      };
    }

    function buildRunExperience() {
      return {
        type: "run",
        title: "Alpaca Run",
        route: ALPACA_RUN_ROUTE,
        mainQuestions: [],
        yaleQuestions: [],
        stage: 0,
        yaleProgress: 0,
        currentQuestion: null,
        started: false,
        setupCategoryIds: getDefaultTargetSetupCategoryIds(),
        timeRemaining: GAME_CONFIG.runTotalTime,
        correctCount: 0,
        answeredCount: 0,
        revealed: false,
        lastCorrect: null,
        pendingStage: null,
        pendingYaleProgress: null,
        failed: false,
        answers: [],
        finished: false,
        unavailableReason: null
      };
    }

    function buildJumpExperience() {
      return {
        type: "jump",
        title: "Alpaca Jump",
        questions: [],
        index: 0,
        currentQuestion: null,
        phase: "setup",
        started: false,
        setupCategoryIds: getDefaultTargetSetupCategoryIds(),
        lives: GAME_CONFIG.jumpLives,
        score: 0,
        distance: 0,
        runnerY: 0,
        runnerVelocity: 0,
        ducking: false,
        obstacleCursor: 0,
        obstaclesCleared: 0,
        obstacle: createJumpObstacle(0),
        runnerState: "running",
        lastFrameAt: null,
        selectedIndex: null,
        lastCorrect: null,
        answers: [],
        failed: false,
        finished: false,
        unavailableReason: null
      };
    }

    function buildRelayExperience() {
      return {
        type: "relay",
        title: "Alpaquiz",
        questions: [],
        index: 0,
        teams: createRelayTeams(),
        started: false,
        setupCategoryIds: getDefaultTargetSetupCategoryIds(),
        setupQuestionCount: GAME_CONFIG.relayDefaultQuestionCount,
        buzzedTeamIndex: null,
        answerTimeRemaining: GAME_CONFIG.relayAnswerTime,
        revealed: false,
        lastCorrect: null,
        lastTimedOut: false,
        lastAwardedTeamLabels: [],
        selectedIndex: null,
        answers: [],
        finished: false,
        unavailableReason: null
      };
    }

    function buildQuizExperience() {
      const selectedSectionIds = getDefaultQuizSectionIds();
      const setupQuestionCount = 15;
      const plan = buildQuizQuestionPlan(selectedSectionIds, setupQuestionCount, [1, 2, 3, 4, 5]);

      return {
        type: "quiz",
        title: "Scholar's Challenge",
        selectedSectionIds,
        selectedDifficulties: [1, 2, 3, 4, 5],
        setupQuestionCount,
        questions: plan.questions,
        selectedAnswers: {},
        started: !plan.unavailableReason && plan.questions.length === setupQuestionCount,
        submitted: false,
        score: 0,
        answers: [],
        tipDismissed: false,
        unavailableReason: plan.unavailableReason
      };
    }

    return Object.freeze({
      buildRawContentExperience,
      buildUnavailableModeExperience,
      renderUnavailableModeExperience,
      buildRaceExperience,
      buildRunExperience,
      buildJumpExperience,
      buildRelayExperience,
      buildQuizExperience
    });
  }

  window.WSC_CREATE_EXPERIENCE_FACTORY_CONTROLLER = createExperienceFactoryController;
}());
