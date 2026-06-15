(function initArcadeRuntimeTimerController(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC arcade runtime timer controller missing function dependency: " + name);
    }
    return value;
  }

  function createArcadeRuntimeTimerController(options = {}) {
    const {
      appState: state,
      windowRef = global,
      callbacks = {}
    } = options;

    if (!state) {
      throw new Error("WSC arcade runtime timer controller missing app state.");
    }

    const window = windowRef;
    const finalizeSessionStats = requiredFunction(callbacks, "finalizeSessionStats");
    const getRunReachedStage = requiredFunction(callbacks, "getRunReachedStage");
    const handleRelayTimeout = requiredFunction(callbacks, "handleRelayTimeout");
    const refreshRunTimerDisplay = requiredFunction(callbacks, "refreshRunTimerDisplay");
    const render = requiredFunction(callbacks, "render");
    const renderExperiencePreservingScroll = requiredFunction(callbacks, "renderExperiencePreservingScroll");
    const resolveRaceQuestion = requiredFunction(callbacks, "resolveRaceQuestion");

    let runTimerId = null;
    let raceTimerId = null;
    let relayAnswerTimerId = null;

    function clearRunTimer() {
      if (runTimerId) {
        window.clearInterval(runTimerId);
        runTimerId = null;
      }
    }

    function clearRaceTimer() {
      if (raceTimerId) {
        window.clearInterval(raceTimerId);
        raceTimerId = null;
      }
    }

    function clearRelayAnswerTimer() {
      if (relayAnswerTimerId) {
        window.clearInterval(relayAnswerTimerId);
        relayAnswerTimerId = null;
      }
    }

    function startRelayAnswerTimer() {
      clearRelayAnswerTimer();

      relayAnswerTimerId = window.setInterval(() => {
        const experience = state.experience;
        if (
          !experience ||
          experience.type !== "relay" ||
          !experience.started ||
          experience.revealed ||
          !Number.isInteger(experience.buzzedTeamIndex)
        ) {
          clearRelayAnswerTimer();
          return;
        }

        if (experience.answerTimeRemaining <= 1) {
          experience.answerTimeRemaining = 0;
          handleRelayTimeout();
          return;
        }

        experience.answerTimeRemaining -= 1;
        renderExperiencePreservingScroll();
      }, 1000);
    }

    function startRaceTimer() {
      clearRaceTimer();

      raceTimerId = window.setInterval(() => {
        const experience = state.experience;
        if (!experience || experience.type !== "race" || experience.finished || experience.revealed) {
          clearRaceTimer();
          return;
        }

        if (experience.timeRemaining <= 1) {
          experience.elapsedTime += 1;
          experience.timeRemaining = 0;
          resolveRaceQuestion(null, true);
          return;
        }

        experience.elapsedTime += 1;
        experience.timeRemaining -= 1;
        renderExperiencePreservingScroll();
      }, 1000);
    }

    function startRunTimer() {
      clearRunTimer();

      runTimerId = window.setInterval(() => {
        const experience = state.experience;
        if (
          !experience ||
          experience.type !== "run" ||
          experience.unavailableReason ||
          !experience.currentQuestion ||
          experience.finished ||
          experience.revealed
        ) {
          clearRunTimer();
          return;
        }

        if (experience.timeRemaining <= 1) {
          experience.timeRemaining = 0;
          experience.failed = true;
          experience.finished = true;
          clearRunTimer();
          finalizeSessionStats(experience.answers, experience.correctCount, {
            type: "run",
            stage: getRunReachedStage(experience)
          });
          render();
          return;
        }

        experience.timeRemaining -= 1;
        if (!refreshRunTimerDisplay(experience)) {
          renderExperiencePreservingScroll();
        }
      }, 1000);
    }

    function syncExperienceTimers() {
      if (
        !state.experience ||
        state.experience.type !== "run" ||
        state.experience.unavailableReason ||
        !state.experience.currentQuestion ||
        state.experience.finished ||
        state.experience.revealed
      ) {
        clearRunTimer();
      } else if (!runTimerId) {
        startRunTimer();
      }

      if (
        !state.experience ||
        state.experience.type !== "race" ||
        state.experience.unavailableReason ||
        !state.experience.currentQuestion ||
        !state.experience.started ||
        state.experience.finished ||
        state.experience.revealed
      ) {
        clearRaceTimer();
      } else if (!raceTimerId) {
        startRaceTimer();
      }

      if (
        !state.experience ||
        state.experience.type !== "relay" ||
        !state.experience.started ||
        state.experience.revealed ||
        !Number.isInteger(state.experience.buzzedTeamIndex)
      ) {
        clearRelayAnswerTimer();
      } else if (!relayAnswerTimerId) {
        startRelayAnswerTimer();
      }
    }

    return Object.freeze({
      clearRunTimer,
      clearRaceTimer,
      clearRelayAnswerTimer,
      startRunTimer,
      startRaceTimer,
      startRelayAnswerTimer,
      syncExperienceTimers
    });
  }

  global.WSC_CREATE_ARCADE_RUNTIME_TIMER_CONTROLLER = createArcadeRuntimeTimerController;
}(window));
