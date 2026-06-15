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
    const windowRef = options.windowRef || global;
    const constants = options.constants || {};
    const callbacks = options.callbacks || {};
    const GAME_CONFIG = constants.GAME_CONFIG || {};

    const getExperience = requireFunction(callbacks, "getExperience");
    const getJumpObstacleSpeed = requireFunction(callbacks, "getJumpObstacleSpeed");
    const handleJumpObstacleHit = requireFunction(callbacks, "handleJumpObstacleHit");
    const hasJumpCollision = requireFunction(callbacks, "hasJumpCollision");
    const openJumpCheckpoint = requireFunction(callbacks, "openJumpCheckpoint");
    const queueNextJumpObstacle = requireFunction(callbacks, "queueNextJumpObstacle");
    const renderExperience = requireFunction(callbacks, "renderExperience");
    const updateJumpDom = requireFunction(callbacks, "updateJumpDom");

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
      hasActiveJumpAnimation,
      startJumpAnimation,
      updateJumpFrame
    };
  }

  global.WSC_CREATE_ARCADE_JUMP_ANIMATION_CONTROLLER = createArcadeJumpAnimationController;
})(window);
