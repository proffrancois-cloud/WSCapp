(function initArcadeJumpAnimationController(global) {
  "use strict";

  function requireFunction(collection, name) {
    const value = collection?.[name];
    if (typeof value !== "function") {
      throw new Error(`WSC Jump animation controller requires ${name}().`);
    }
    return value;
  }

  function createArcadeJumpAnimationController(options = {}) {
    const state = options.appState || {};
    const refs = options.refs || {};
    const domService = options.domService || null;
    const windowRef = options.windowRef || global;
    const constants = options.constants || {};
    const callbacks = options.callbacks || {};
    const helpers = options.helpers || {};
    const renderers = options.renderers || {};
    const GAME_CONFIG = constants.GAME_CONFIG || {};

    const getExperience = requireFunction(callbacks, "getExperience");
    const createJumpCheckpointObstacle = requireFunction(callbacks, "createJumpCheckpointObstacle");
    const createJumpObstacle = requireFunction(callbacks, "createJumpObstacle");
    const finalizeSessionStats = requireFunction(callbacks, "finalizeSessionStats");
    const getBestStreakFromAnswers = requireFunction(callbacks, "getBestStreakFromAnswers");
    const getJumpObstacleRequirement = requireFunction(callbacks, "getJumpObstacleRequirement");
    const getJumpObstacleSpeed = requireFunction(callbacks, "getJumpObstacleSpeed");
    const hasJumpCollision = requireFunction(callbacks, "hasJumpCollision");
    const render = requireFunction(callbacks, "render");
    const renderExperience = requireFunction(callbacks, "renderExperience");
    const getJumpRunnerState = requireFunction(helpers, "getJumpRunnerState");
    const renderJumpLives = requireFunction(renderers, "renderJumpLives");
    const renderJumpObstacle = requireFunction(renderers, "renderJumpObstacle");
    const renderJumpRunner = requireFunction(renderers, "renderJumpRunner");

    let jumpAnimationId = null;

    function hasActiveJumpAnimation() {
      return Boolean(jumpAnimationId);
    }

    function clearJumpAnimation() {
      if (jumpAnimationId) {
        windowRef.cancelAnimationFrame(jumpAnimationId);
        jumpAnimationId = null;
      }
    }

    function startJumpAnimation() {
      clearJumpAnimation();

      const tick = (timestamp) => {
        const experience = getExperience();
        if (!experience || experience.type !== "jump" || experience.phase !== "running" || experience.finished) {
          clearJumpAnimation();
          return;
        }

        updateJumpFrame(experience, timestamp);
        if (experience.phase === "running") {
          jumpAnimationId = windowRef.requestAnimationFrame(tick);
        } else {
          clearJumpAnimation();
          renderExperience();
        }
      };

      jumpAnimationId = windowRef.requestAnimationFrame(tick);
    }

    function queueNextJumpObstacle(experience) {
      const requiredObstacles = getJumpObstacleRequirement(experience);
      if (experience.obstaclesCleared >= requiredObstacles) {
        experience.obstacle = createJumpCheckpointObstacle();
        return;
      }

      experience.obstacleCursor += 1;
      experience.obstacle = createJumpObstacle(experience.obstacleCursor);
    }

    function handleJumpObstacleHit(experience) {
      experience.lives = Math.max(0, experience.lives - 1);
      experience.ducking = false;
      experience.runnerY = 0;
      experience.runnerVelocity = 0;
      experience.runnerState = "hurting";
      experience.lastFrameAt = null;

      if (experience.lives <= 0) {
        experience.failed = true;
        experience.finished = true;
        finalizeSessionStats(experience.answers, getBestStreakFromAnswers(experience.answers), {
          type: "jump",
          score: experience.score,
          distance: experience.distance
        });
        clearJumpAnimation();
        render();
        return;
      }

      experience.obstacleCursor += 1;
      experience.obstacle = createJumpObstacle(experience.obstacleCursor);
      renderExperience();
      windowRef.setTimeout(() => {
        if (state.experience && state.experience.type === "jump" && state.experience.phase === "running") {
          state.experience.runnerState = "running";
          updateJumpDom(state.experience);
        }
      }, 2000);
    }

    function openJumpCheckpoint(experience) {
      experience.phase = "question";
      experience.ducking = false;
      experience.runnerY = 0;
      experience.runnerVelocity = 0;
      experience.runnerState = "running";
      experience.lastFrameAt = null;
    }

    function updateJumpDom(experience) {
      if (!refs.experiencePanel || !experience || experience.type !== "jump") {
        return;
      }

      const runner = refs.experiencePanel.querySelector("[data-jump-runner]");
      if (runner) {
        const runnerState = getJumpRunnerState(experience);
        if (runner.dataset.jumpRunnerState !== runnerState) {
          runner.dataset.jumpRunnerState = runnerState;
          domService.setTrustedHtml(
            runner,
            domService.trustedHtml(renderJumpRunner(experience), "jump-runner")
          );
        }
        runner.style.transform = `translateY(-${Math.max(0, experience.runnerY)}px)`;
        runner.classList.toggle("state-ducking", runnerState === "ducking");
        runner.classList.toggle("state-jumping", runnerState === "jumping");
        runner.classList.toggle("state-hurting", runnerState === "hurting");
        runner.classList.toggle("state-running", runnerState === "running");
      }

      const obstacle = refs.experiencePanel.querySelector("[data-jump-obstacle]");
      if (obstacle && experience.obstacle) {
        const obstacleKind = experience.obstacle.kind;
        if (obstacle.dataset.jumpObstacleKind !== obstacleKind) {
          obstacle.dataset.jumpObstacleKind = obstacleKind;
          domService.setTrustedHtml(
            obstacle,
            domService.trustedHtml(renderJumpObstacle(experience.obstacle), "jump-obstacle")
          );
        }
        obstacle.style.left = `${experience.obstacle.x}%`;
        obstacle.classList.toggle("ground", obstacleKind === "ground");
        obstacle.classList.toggle("flying", obstacleKind === "flying");
        obstacle.classList.toggle("checkpoint", obstacleKind === "checkpoint");
      }

      const distance = refs.experiencePanel.querySelector("[data-jump-distance]");
      if (distance) {
        distance.textContent = `${Math.round(experience.distance)}m`;
      }

      const lives = refs.experiencePanel.querySelector("[data-jump-lives]");
      if (lives) {
        domService.setTrustedHtml(
          lives,
          domService.trustedHtml(renderJumpLives(experience.lives), "jump-lives")
        );
      }
    }

    function updateJumpFrame(experience, timestamp) {
      const last = Number.isFinite(experience.lastFrameAt) ? experience.lastFrameAt : timestamp;
      const delta = Math.min(34, Math.max(0, timestamp - last));
      experience.lastFrameAt = timestamp;
      experience.distance += delta * 0.016;

      if (experience.runnerY > 0 || experience.runnerVelocity > 0) {
        experience.runnerY = Math.max(0, experience.runnerY + (experience.runnerVelocity * delta));
        experience.runnerVelocity -= GAME_CONFIG.jumpGravity * delta;
        if (experience.runnerY <= 0) {
          experience.runnerY = 0;
          experience.runnerVelocity = 0;
          if (experience.runnerState === "jumping") {
            experience.runnerState = "running";
          }
        }
      }

      experience.obstacle.x -= getJumpObstacleSpeed(experience) * delta;

      if (hasJumpCollision(experience)) {
        if (experience.obstacle.kind === "checkpoint") {
          openJumpCheckpoint(experience);
        } else {
          handleJumpObstacleHit(experience);
        }
        return;
      }

      if (experience.obstacle.x < 18 && !experience.obstacle.passed) {
        experience.obstacle.passed = true;
        if (experience.obstacle.kind !== "checkpoint") {
          experience.obstaclesCleared += 1;
        }
        return;
      }

      if (experience.obstacle.x < -12) {
        queueNextJumpObstacle(experience);
      }

      updateJumpDom(experience);
    }

    return {
      clearJumpAnimation,
      handleJumpObstacleHit,
      hasActiveJumpAnimation,
      openJumpCheckpoint,
      queueNextJumpObstacle,
      startJumpAnimation,
      updateJumpDom,
      updateJumpFrame
    };
  }

  global.WSC_CREATE_ARCADE_JUMP_ANIMATION_CONTROLLER = createArcadeJumpAnimationController;
})(window);
