(function initArcadeJumpHelpers(global) {
  "use strict";

  const JUMP_OBSTACLE_PATTERN = Object.freeze([
    "ground",
    "ground",
    "flying",
    "ground",
    "ground",
    "ground",
    "flying",
    "ground",
    "flying",
    "flying",
    "ground",
    "flying",
    "ground",
    "ground",
    "flying",
    "flying",
    "ground",
    "ground",
    "ground",
    "flying",
    "ground",
    "flying",
    "ground",
    "ground"
  ]);

  function createJumpObstacle(cursor = 0) {
    return {
      kind: JUMP_OBSTACLE_PATTERN[cursor % JUMP_OBSTACLE_PATTERN.length],
      x: 106,
      passed: false
    };
  }

  function createJumpCheckpointObstacle() {
    return {
      kind: "checkpoint",
      x: 106,
      passed: false
    };
  }

  function getJumpObstacleRequirement(question, getQuestionLevel) {
    return 2 + getQuestionLevel(question);
  }

  function getJumpObstacleSpeed(experience, gameConfig) {
    const progression = experience.index + Math.floor(experience.distance / 120);
    return Math.min(
      gameConfig.jumpMaxObstacleSpeed,
      gameConfig.jumpObstacleSpeed + progression * gameConfig.jumpObstacleSpeedGain
    );
  }

  function hasJumpCollision(experience) {
    const obstacle = experience.obstacle;
    if (!obstacle || obstacle.x < 18 || obstacle.x > 29) {
      return false;
    }

    if (obstacle.kind === "checkpoint") {
      return true;
    }

    if (obstacle.kind === "ground") {
      return experience.runnerY < 52;
    }

    return !experience.ducking && experience.runnerY < 36;
  }

  global.WSC_ARCADE_JUMP_HELPERS = Object.freeze({
    createJumpObstacle,
    createJumpCheckpointObstacle,
    getJumpObstacleRequirement,
    getJumpObstacleSpeed,
    hasJumpCollision
  });
}(window));
