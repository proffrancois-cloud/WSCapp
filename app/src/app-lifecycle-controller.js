(function () {
  function createAppLifecycleController(deps = {}) {
    const win = deps.window || window;
    const doc = deps.document || win.document || document;
    const state = deps.state || {};
    const refs = deps.refs || {};
    const startup = deps.startup || {};
    const events = deps.events || {};
    const timers = deps.timers || {};
    const live = deps.live || {};
    const experienceLifecycle = deps.experience || {};
    const liveSyncIntervalMs = Number(deps.liveSyncIntervalMs) || 900;
    const liveHeartbeatIntervalMs = Number(deps.liveHeartbeatIntervalMs) || 25000;
    const timerIds = {
      jeopardy: null,
      run: null,
      race: null,
      relayAnswer: null,
      jumpAnimation: null,
      liveLaunchCountdown: null,
      debateSpin: null,
      debateReveal: null
    };
    const listenerCleanups = [];
    let started = false;
    let eventsBound = false;

    function call(fn, ...args) {
      return typeof fn === "function" ? fn(...args) : undefined;
    }

    function getExperience() {
      return state.experience || null;
    }

    function getLiveService() {
      return typeof live.getService === "function" ? live.getService() : live.service;
    }

    function bind(target, eventName, handler, options) {
      if (!target || typeof handler !== "function") {
        return;
      }

      target.addEventListener(eventName, handler, options);
      listenerCleanups.push(() => target.removeEventListener(eventName, handler, options));
    }

    function bindEventListeners() {
      if (eventsBound) {
        return;
      }

      bind(doc, "click", events.handleClick);
      bind(doc, "input", events.handleInput);
      bind(doc, "submit", events.handleSubmit);
      bind(doc, "keydown", events.handleKeyDown);
      bind(doc, "wheel", events.handleMindMapGalleryWheel, { passive: false });
      bind(doc, "touchstart", events.handleTouchStart, { passive: true });
      bind(doc, "touchend", events.handleTouchEnd, { passive: true });
      bind(win, "resize", events.syncRadialMindMapScroll);
      eventsBound = true;
    }

    function runStartupTasks() {
      call(startup.hydrateKnowledgeBank);
      call(startup.preloadExperienceAudio);
      call(startup.setupSupabaseAuth);
      if (refs.heroMascot && typeof startup.renderHeroVisual === "function") {
        refs.heroMascot.innerHTML = startup.renderHeroVisual();
      }
      call(startup.renderInsights);
      call(startup.render);
    }

    function markReady() {
      win.WSC_APP_READY = true;
      win.dispatchEvent(new win.Event("wsc:app-ready"));
    }

    function start() {
      if (started) {
        return;
      }

      started = true;
      runStartupTasks();
      markReady();
      bindEventListeners();
    }

    function clearIntervalTimer(name) {
      if (timerIds[name] !== null) {
        win.clearInterval(timerIds[name]);
        timerIds[name] = null;
      }
    }

    function clearTimeoutTimer(name) {
      if (timerIds[name] !== null) {
        win.clearTimeout(timerIds[name]);
        timerIds[name] = null;
      }
    }

    function clearRunTimer() {
      clearIntervalTimer("run");
    }

    function clearRaceTimer() {
      clearIntervalTimer("race");
    }

    function clearRelayAnswerTimer() {
      clearIntervalTimer("relayAnswer");
    }

    function clearJumpAnimation() {
      if (timerIds.jumpAnimation !== null) {
        win.cancelAnimationFrame(timerIds.jumpAnimation);
        timerIds.jumpAnimation = null;
      }
    }

    function clearModeTimers() {
      clearRunTimer();
      clearRaceTimer();
      clearRelayAnswerTimer();
      clearJumpAnimation();
    }

    function clearJeopardyTimer() {
      clearIntervalTimer("jeopardy");
      clearModeTimers();
    }

    function clearDebateSpinTimer() {
      clearTimeoutTimer("debateSpin");
    }

    function clearDebateRevealTimer() {
      clearTimeoutTimer("debateReveal");
    }

    function clearExperienceTimers() {
      clearJeopardyTimer();
      clearDebateSpinTimer();
      clearDebateRevealTimer();
    }

    function clearAlpacapardyLiveHeartbeat() {
      if (state.live?.heartbeatId) {
        win.clearInterval(state.live.heartbeatId);
        state.live.heartbeatId = null;
      }
    }

    function clearAlpacapardyLiveSync() {
      if (state.live?.syncId) {
        win.clearInterval(state.live.syncId);
        state.live.syncId = null;
      }
      if (state.live) {
        state.live.syncBusy = false;
      }
    }

    function clearLiveLaunchCountdown() {
      clearTimeoutTimer("liveLaunchCountdown");
    }

    function clearAlpacapardyLiveSubscriptions() {
      const client = call(live.getSupabaseClient);
      const service = getLiveService();
      if (!state.live) {
        return;
      }

      if (state.live.sessionChannel) {
        if (service && client) {
          service.removeChannel(client, state.live.sessionChannel);
        }
        state.live.sessionChannel = null;
      }
      if (state.live.lobbyChannel) {
        if (service && client) {
          service.removeChannel(client, state.live.lobbyChannel);
        }
        state.live.lobbyChannel = null;
      }
    }

    function resetAlpacapardyLiveState({ keepGuestName = true } = {}) {
      if (!state.live) {
        return;
      }

      clearAlpacapardyLiveHeartbeat();
      clearAlpacapardyLiveSync();
      clearAlpacapardyLiveSubscriptions();
      clearLiveLaunchCountdown();
      state.live.openSessions = [];
      state.live.currentSession = null;
      state.live.currentPlayer = null;
      state.live.players = [];
      state.live.revision = 0;
      state.live.status = "idle";
      state.live.message = "";
      state.live.error = "";
      state.live.selectedGameType = "alpacapardy";
      state.live.onlineView = "hub";
      state.live.arcadeState = null;
      state.live.syncBusy = false;
      state.live.joinCodeDraft = "";
      state.live.autoStartBusy = false;
      state.live.launchCountdownText = "";
      state.live.launchCountdownSessionId = null;
      state.live.waitingVideoSessionId = null;
      state.live.waitingVideos = [];
      state.live.waitingVideoIndex = 0;
      if (!keepGuestName) {
        state.live.guestName = call(live.loadGuestAlpacaName);
      }
    }

    function closeCurrentExperience() {
      if (call(experienceLifecycle.isAlpacapardyLiveActive)) {
        call(experienceLifecycle.leaveAlpacapardyLiveRoom);
        return;
      }

      clearExperienceTimers();
      state.experience = null;
      call(startup.render);
    }

    function syncExperienceTimers() {
      const experience = getExperience();

      if (
        !experience ||
        experience.type !== "run" ||
        experience.unavailableReason ||
        !experience.currentQuestion ||
        experience.finished ||
        experience.revealed
      ) {
        clearRunTimer();
      } else if (timerIds.run === null) {
        startRunTimer();
      }

      if (
        !experience ||
        experience.type !== "race" ||
        experience.unavailableReason ||
        !experience.currentQuestion ||
        !experience.started ||
        experience.finished ||
        experience.revealed
      ) {
        clearRaceTimer();
      } else if (timerIds.race === null) {
        startRaceTimer();
      }

      if (
        !experience ||
        experience.type !== "relay" ||
        !experience.started ||
        experience.revealed ||
        !Number.isInteger(experience.buzzedTeamIndex)
      ) {
        clearRelayAnswerTimer();
      } else if (timerIds.relayAnswer === null) {
        startRelayAnswerTimer();
      }

      if (
        !experience ||
        experience.type !== "jump" ||
        experience.phase !== "running" ||
        experience.finished
      ) {
        clearJumpAnimation();
      } else if (timerIds.jumpAnimation === null) {
        startJumpAnimation();
      }
    }

    function startJeopardyTimer() {
      clearJeopardyTimer();

      timerIds.jeopardy = win.setInterval(() => {
        const experience = getExperience();
        if (!experience || experience.type !== "jeopardy" || !experience.active) {
          clearJeopardyTimer();
          return;
        }

        if (experience.active.revealed) {
          clearJeopardyTimer();
          return;
        }

        if (experience.active.timeRemaining <= 1) {
          call(timers.resolveJeopardyTimeout);
          return;
        }

        experience.active.timeRemaining -= 1;
        call(timers.renderExperiencePreservingScroll);
      }, 1000);
    }

    function startRelayAnswerTimer() {
      clearRelayAnswerTimer();

      timerIds.relayAnswer = win.setInterval(() => {
        const experience = getExperience();
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
          call(timers.handleRelayTimeout);
          return;
        }

        experience.answerTimeRemaining -= 1;
        call(timers.renderExperiencePreservingScroll);
      }, 1000);
    }

    function startRaceTimer() {
      clearRaceTimer();

      timerIds.race = win.setInterval(() => {
        const experience = getExperience();
        if (!experience || experience.type !== "race" || experience.finished || experience.revealed) {
          clearRaceTimer();
          return;
        }

        if (experience.timeRemaining <= 1) {
          experience.elapsedTime += 1;
          experience.timeRemaining = 0;
          call(timers.resolveRaceQuestion, null, true);
          return;
        }

        experience.elapsedTime += 1;
        experience.timeRemaining -= 1;
        call(timers.renderExperiencePreservingScroll);
      }, 1000);
    }

    function startRunTimer() {
      clearRunTimer();

      timerIds.run = win.setInterval(() => {
        const experience = getExperience();
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
          call(timers.finalizeSessionStats, experience.answers, experience.correctCount, {
            type: "run",
            stage: call(timers.getRunReachedStage, experience)
          });
          call(timers.render);
          return;
        }

        experience.timeRemaining -= 1;
        if (!call(timers.refreshRunTimerDisplay, experience)) {
          call(timers.renderExperiencePreservingScroll);
        }
      }, 1000);
    }

    function startJumpAnimation() {
      clearJumpAnimation();

      const tick = (timestamp) => {
        const experience = getExperience();
        if (!experience || experience.type !== "jump" || experience.phase !== "running" || experience.finished) {
          clearJumpAnimation();
          return;
        }

        call(timers.updateJumpFrame, experience, timestamp);
        if (experience.phase === "running") {
          timerIds.jumpAnimation = win.requestAnimationFrame(tick);
        } else {
          clearJumpAnimation();
          call(timers.renderExperience);
        }
      };

      timerIds.jumpAnimation = win.requestAnimationFrame(tick);
    }

    function scheduleDebateSpinTimer(callback, delayMs) {
      clearDebateSpinTimer();
      timerIds.debateSpin = win.setTimeout(() => {
        timerIds.debateSpin = null;
        call(callback);
      }, delayMs);
    }

    function scheduleDebateRevealTimer(callback, delayMs) {
      clearDebateRevealTimer();
      timerIds.debateReveal = win.setTimeout(() => {
        timerIds.debateReveal = null;
        call(callback);
      }, delayMs);
    }

    function startAlpacapardyLiveSync() {
      if (state.live?.syncId) {
        return;
      }

      const sync = () => {
        call(live.syncAlpacapardyLiveNow, { renderAfter: true });
      };
      sync();
      state.live.syncId = win.setInterval(sync, liveSyncIntervalMs);
    }

    function startAlpacapardyLiveHeartbeat() {
      clearAlpacapardyLiveHeartbeat();
      const beat = async () => {
        const service = getLiveService();
        if (!state.live?.currentSession || !state.live?.currentPlayer || !service) {
          return;
        }

        const client = call(live.getSupabaseClient);
        await service.heartbeatPlayer(client, state.live.currentPlayer.id);
        if (call(live.isHost)) {
          const response = await service.heartbeatHost(client, state.live.currentSession.id);
          if (!response.error && response.data) {
            state.live.currentSession = response.data;
          }
        }
      };

      beat();
      state.live.heartbeatId = win.setInterval(beat, liveHeartbeatIntervalMs);
    }

    function startLiveLaunchCountdown(sessionId) {
      clearLiveLaunchCountdown();
      state.live.launchCountdownSessionId = sessionId;
      const steps = ["3", "2", "1", "Let's go"];
      let index = 0;

      const advance = () => {
        state.live.launchCountdownText = steps[index] || "";
        call(live.renderLiveSurfaces);
        index += 1;
        if (index <= steps.length) {
          timerIds.liveLaunchCountdown = win.setTimeout(advance, index === steps.length ? 1000 : 850);
          return;
        }
        state.live.launchCountdownText = "";
        timerIds.liveLaunchCountdown = null;
        call(live.renderLiveSurfaces);
      };

      advance();
    }

    function dispose() {
      clearExperienceTimers();
      clearAlpacapardyLiveHeartbeat();
      clearAlpacapardyLiveSync();
      clearLiveLaunchCountdown();
      while (listenerCleanups.length) {
        call(listenerCleanups.pop());
      }
      started = false;
      eventsBound = false;
    }

    return Object.freeze({
      start,
      dispose,
      bindEventListeners,
      clearRunTimer,
      clearRaceTimer,
      clearRelayAnswerTimer,
      clearJumpAnimation,
      clearJeopardyTimer,
      clearDebateSpinTimer,
      clearDebateRevealTimer,
      clearExperienceTimers,
      clearAlpacapardyLiveHeartbeat,
      clearAlpacapardyLiveSync,
      clearLiveLaunchCountdown,
      clearAlpacapardyLiveSubscriptions,
      resetAlpacapardyLiveState,
      closeCurrentExperience,
      syncExperienceTimers,
      startJeopardyTimer,
      startRelayAnswerTimer,
      startRaceTimer,
      startRunTimer,
      startJumpAnimation,
      scheduleDebateSpinTimer,
      scheduleDebateRevealTimer,
      startAlpacapardyLiveSync,
      startAlpacapardyLiveHeartbeat,
      startLiveLaunchCountdown
    });
  }

  window.WSC_APP_LIFECYCLE_CONTROLLER = Object.freeze({
    create: createAppLifecycleController
  });
}());
