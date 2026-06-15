(function initArcadeRenderController(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC arcade render controller missing function dependency: " + name);
    }
    return value;
  }

  function createArcadeRenderController(options = {}) {
    const {
      appState: state,
      constants = {},
      helpers = {}
    } = options;

    if (!state) {
      throw new Error("WSC arcade render controller missing app state.");
    }

    const GAME_CONFIG = constants.GAME_CONFIG || {};
    const createJumpObstacle = requiredFunction(helpers, "createJumpObstacle");
    const escapeHtml = requiredFunction(helpers, "escapeHtml");
    const getAssetValue = requiredFunction(helpers, "getAssetValue");
    const getGamePromptLabel = requiredFunction(helpers, "getGamePromptLabel");
    const getGameplayAssetPath = requiredFunction(helpers, "getGameplayAssetPath");
    const getGameplayReviewBadge = requiredFunction(helpers, "getGameplayReviewBadge");
    const getLensCardPluralLabel = requiredFunction(helpers, "getLensCardPluralLabel");
    const getRaceActiveLevelState = requiredFunction(helpers, "getRaceActiveLevelState");
    const getSetupTargetHeading = requiredFunction(helpers, "getSetupTargetHeading");
    const getSetupTargetHelper = requiredFunction(helpers, "getSetupTargetHelper");
    const getTargetLabel = requiredFunction(helpers, "getTargetLabel");
    const getTargetSetupOptions = requiredFunction(helpers, "getTargetSetupOptions");
    const getUnavailableRawGameReason = requiredFunction(helpers, "getUnavailableRawGameReason");
    const renderAlternateLensBreakdown = requiredFunction(helpers, "renderAlternateLensBreakdown");
    const renderAssetImage = requiredFunction(helpers, "renderAssetImage");
    const renderCheckpointVisual = requiredFunction(helpers, "renderCheckpointVisual");
    const renderConfiguredMascotAsset = requiredFunction(helpers, "renderConfiguredMascotAsset");
    const renderGameNotes = requiredFunction(helpers, "renderGameNotes");
    const renderGameQuestionPopup = requiredFunction(helpers, "renderGameQuestionPopup");
    const renderMascot = requiredFunction(helpers, "renderMascot");
    const renderOptionToken = requiredFunction(helpers, "renderOptionToken");
    const renderPanelTitle = requiredFunction(helpers, "renderPanelTitle");
    const renderRaceFailVisual = requiredFunction(helpers, "renderRaceFailVisual");
    const renderRaceLivesIcon = requiredFunction(helpers, "renderRaceLivesIcon");
    const renderResultsScreen = requiredFunction(helpers, "renderResultsScreen");

    function renderRaceExperience() {
      const experience = state.experience;
    
      if (experience.finished) {
        return renderResultsScreen({
          title: experience.failed ? "Run Ended" : "Journey Summary",
          subtitle: experience.failed ? "The threshold closed." : "A strong run.",
          answers: experience.answers,
          failed: experience.failed,
          resultState: experience.failed ? "fail" : "success",
          visualHtml: experience.failed ? renderRaceFailVisual() : null,
          showTopClose: false,
          showBottomReplay: false,
          showPerformanceMessage: false,
          metrics: [
            {
              label: "Stops Cleared",
              value: `${experience.score}/${experience.totalQuestions}`
            },
            {
              label: "Time Survived",
              value: formatCountdown(experience.elapsedTime)
            }
          ]
        });
      }
    
      if (experience.unavailableReason) {
        return `
          ${renderPanelTitle("Survivalpaca", "Stay on track as the timer tightens around every question.", "")}
          <div class="mode-shell">
            <article class="setup-card">
              <div class="setup-card-header">
                ${renderConfiguredMascotAsset(
                  getGameplayAssetPath("launch", "race"),
                  "determined",
                  "medium",
                  { alt: "Race unavailable alpaca" }
                )}
                <div>
                  <p class="challenge-label">Route update pending</p>
                  <h3>${escapeHtml(experience.unavailableReason)}</h3>
                </div>
              </div>
            </article>
          </div>
        `;
      }
    
      const question = experience.currentQuestion;
      const currentLevel = getRaceActiveLevelState(experience);
      const timePercent = Math.max(0, (experience.timeRemaining / experience.questionTime) * 100);
      const timerClass = getTimerVisualState(experience.timeRemaining, experience.questionTime, {
        warningAt: 10,
        dangerAt: 5
      });
      const timerPhaseLabel = timerClass === "danger" ? "Critical" : timerClass === "warning" ? "Warning" : "Normal";
      return `
        ${renderPanelTitle(
          "Survivalpaca",
          "Stay on track as the timer tightens around every question.",
        )}
        <div class="mode-shell">
          <div class="mode-stats">
            <span>Current Run · ${escapeHtml(getTargetLabel())}</span>
          </div>
    
          ${!experience.started ? `
            <article class="race-launch-panel card-panel">
              <p class="race-launch-kicker">Timed Survival Route</p>
              <div class="race-launch-pills">
                <span>The timer only starts once you begin and paused after your answer to review.</span>
                <span>Each stop gives you ${GAME_CONFIG.raceQuestionTime} seconds to answer.</span>
                <span>${GAME_CONFIG.raceLives} chances stand between you and a lost route.</span>
              </div>
              ${renderRaceTargetSelector(experience)}
              <div class="panel-actions">
                <button class="button primary" data-race-start>En route</button>
              </div>
            </article>
          ` : renderGameQuestionPopup(`
            <article class="challenge-card race-question-card">
              ${renderRaceQuestionPills(experience, currentLevel)}
    
              <div class="challenge-copy">
                ${renderPopupQuestionTimerPanel(question.prompt, experience.timeRemaining, experience.questionTime, timerClass)}
                <div class="options-grid answer-options-grid">
                  ${question.options.map((option, index) => {
                    let classes = "option-button";
                    if (experience.revealed) {
                      if (index === question.answerIndex) {
                        classes += " correct";
                      } else if (index === experience.selectedIndex) {
                        classes += " wrong";
                      }
                      classes += " disabled";
                    }
                    return `
                      <button class="${classes}" data-race-option="${index}">
                        ${renderOptionToken(index)}
                        <span>${escapeHtml(option)}</span>
                      </button>
                    `;
                  }).join("")}
                </div>
              </div>
            </article>
            ${experience.revealed ? `
              <article class="feedback-card ${experience.lastCorrect ? "correct" : "wrong"}">
                ${renderCheckpointVisual(experience.lastCorrect ? "success" : "fail")}
                <div>
                  <h3>${escapeHtml(experience.lastCorrect ? "Still on track." : (experience.lastTimedOut ? "Missed checkpoint. Time ran out." : "Wrong turn. The route narrows."))}</h3>
                  <p>${escapeHtml(question.explanation)}</p>
                  <div class="feedback-actions">
                    <button class="button primary" data-race-advance>${experience.lives <= 0 ? "Journey Summary" : "Continue Forward"}</button>
                  </div>
                </div>
              </article>
            ` : ""}
          `, "race", { showClose: false })}
        </div>
      `;
    }
    
    function renderRaceTargetSelector(experience) {
      return renderTargetSetupSelector(experience, "race-toggle-category", "race-target-selector", "race-target-grid", "race-target-button");
    }
    
    function renderTargetSetupSelector(experience, dataAttributeName, blockClass = "", gridClass = "", buttonClass = "") {
      const setupOptions = getTargetSetupOptions();
      const selectedCount = experience.setupCategoryIds.length;
      return `
        <div class="setup-block ${escapeHtml(blockClass)}">
          <strong>${escapeHtml(getSetupTargetHeading())}</strong>
          <p class="setup-helper">${escapeHtml(getSetupTargetHelper(selectedCount))}</p>
          <div class="setup-option-grid ${escapeHtml(gridClass)}">
            ${setupOptions.map((option) => {
              const active = experience.setupCategoryIds.includes(option.id);
              return `
                <button
                  class="setup-option-button ${escapeHtml(buttonClass)} ${active ? "active" : ""}"
                  type="button"
                  data-${escapeHtml(dataAttributeName)}="${escapeHtml(option.id)}"
                  aria-pressed="${active ? "true" : "false"}"
                >
                  ${renderConfiguredMascotAsset(option.asset, option.mood, "small", {
                    alt: `${option.title} alpaca`
                  })}
                  <span>${escapeHtml(option.title)}</span>
                </button>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }
    
    function formatCountdown(totalSeconds) {
      const seconds = Math.max(0, totalSeconds);
      const minutes = Math.floor(seconds / 60);
      const remainder = seconds % 60;
      return `${minutes}:${String(remainder).padStart(2, "0")}`;
    }
    
    function getRunCurrentStop(experience) {
      return experience.route[Math.min(experience.stage, experience.route.length - 1)];
    }
    
    function getRunNextStop(experience) {
      return experience.route[experience.stage + 1] || null;
    }
    
    function getRunRoundsBeforeYale(experience) {
      return Math.max(0, (experience.route.length - 1) - experience.stage);
    }
    
    function getRunPassedStopLabels(experience) {
      return experience.route
        .slice(0, Math.max(0, Math.min(experience.stage, experience.route.length - 1)))
        .map((stop) => stop.label);
    }
    
    function getRunStopRoundSuffix(stop) {
      if (!stop?.phase) {
        return "";
      }
    
      return ` - ${stop.phase}`;
    }
    
    function formatRunCurrentStopLabel(stop) {
      return `${stop.label}${getRunStopRoundSuffix(stop)}`;
    }
    
    function getRunMapTop(stop) {
      return `calc(${stop.y}% - var(--run-travel-marker-offset, 0px))`;
    }
    
    function renderRunMap(experience) {
      const route = experience.route;
      const currentStop = getRunCurrentStop(experience);
    
      return `
        <div class="run-map-stage">
          ${renderRunMapBackground()}
          ${route.map((stop, index) => renderRunMapStop(stop, index, experience.stage)).join("")}
          <div class="run-travel-marker" style="left:${currentStop.x}%; top:${getRunMapTop(currentStop)}">
            ${renderRunTravelMarker()}
          </div>
          ${renderRunStatusRow(experience)}
        </div>
      `;
    }
    
    function renderRunStatusRow(experience) {
      const goalStop = experience.route[experience.route.length - 1];
      const currentStop = getRunCurrentStop(experience);
      const nextStop = getRunNextStop(experience);
    
      return `
        <div class="run-status-row">
          <div class="run-status-card">
            <span>Current Stop</span>
            <strong>${escapeHtml(formatRunCurrentStopLabel(currentStop))}</strong>
          </div>
          <div class="run-status-card">
            <span>Next Destination</span>
            <strong>${escapeHtml(nextStop ? nextStop.label : goalStop.label)}</strong>
          </div>
          <div class="run-status-card">
            <span>Number of rounds before Yale</span>
            <strong>${getRunRoundsBeforeYale(experience)}</strong>
          </div>
        </div>
      `;
    }
    
    function renderRunMapBackground() {
      const asset = getAssetValue(["run", "mapBackground"]);
      if (asset) {
        return renderAssetImage(
          asset,
          "Alpaca Run world map background",
          "run-map-background",
          "run-map-background-image"
        );
      }
    
      return `<div class="run-map-placeholder" aria-hidden="true"></div>`;
    }
    
    function renderRunTravelMarker() {
      const asset = getAssetValue(["run", "travelMarker"]);
      if (asset) {
        return renderAssetImage(
          asset,
          "Alpaca Run travel marker",
          "run-travel-marker-slot",
          "run-travel-marker-image"
        );
      }
    
      return renderMascot("determined", "small", { alt: "Traveling alpaca" });
    }
    
    function renderRegionalStopMarkerSvg(state) {
      return `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 96 96"
          width="96"
          height="96"
          fill="none"
          data-state="${escapeHtml(state)}"
          class="run-stop-svg run-stop-svg-regional"
          aria-hidden="true"
        >
          <defs>
            <style>
              .outer {
                fill: #fefaf2;
                stroke: #5a3726;
                stroke-width: 4;
              }
    
              .mid {
                fill: #802922;
              }
    
              .inner {
                fill: #fefaf2;
                stroke: #5a3726;
                stroke-width: 2.5;
              }
    
              .core {
                fill: #6d1f26;
              }
    
              .state-ring {
                fill: none;
                stroke: transparent;
                stroke-width: 3;
              }
    
              svg[data-state="current"] .state-ring {
                stroke: #fcd127;
              }
    
              svg[data-state="current"] .outer {
                stroke-width: 5;
              }
    
              svg[data-state="reached"] {
                opacity: 0.88;
              }
    
              svg[data-state="reached"] .core {
                fill: #802922;
              }
            </style>
          </defs>
    
          <circle class="state-ring" cx="48" cy="48" r="34"/>
          <circle class="outer" cx="48" cy="48" r="28"/>
          <circle class="mid" cx="48" cy="48" r="19"/>
          <circle class="inner" cx="48" cy="48" r="11"/>
          <circle class="core" cx="48" cy="48" r="4.5"/>
        </svg>
      `;
    }
    
    function renderGlobalRoundMarkerSvg() {
      return `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 96 96"
          width="96"
          height="96"
          fill="none"
          class="run-stop-svg run-stop-svg-global"
          aria-hidden="true"
        >
          <defs>
            <style>
              .outer-gold { fill: #fefaf2; stroke: #fcd127; stroke-width: 5; }
              .outer-navy { fill: none; stroke: #5a3726; stroke-width: 2.5; opacity: 0.95; }
              .mid { fill: #6d1f26; }
              .inner { fill: #fefaf2; stroke: #802922; stroke-width: 2.5; }
              .core-gold { fill: #fcd127; }
              .tick { stroke: #fcd127; stroke-width: 2.5; stroke-linecap: round; }
            </style>
          </defs>
    
          <circle class="outer-gold" cx="48" cy="48" r="30"/>
          <circle class="outer-navy" cx="48" cy="48" r="24.5"/>
          <circle class="mid" cx="48" cy="48" r="18"/>
          <circle class="inner" cx="48" cy="48" r="10.5"/>
          <circle class="core-gold" cx="48" cy="48" r="4.5"/>
          <path class="tick" d="M48 11v6"/>
          <path class="tick" d="M48 79v6"/>
          <path class="tick" d="M11 48h6"/>
          <path class="tick" d="M79 48h6"/>
        </svg>
      `;
    }
    
    function renderYaleDestinationMarkerSvg() {
      return `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 140 140"
          width="140"
          height="140"
          fill="none"
          class="run-stop-svg run-stop-svg-yale"
          aria-hidden="true"
        >
          <defs>
            <style>
              .gold-fill { fill: #fcd127; }
              .gold-stroke { stroke: #fcd127; }
              .navy-stroke { stroke: #5a3726; }
              .ring-outer {
                fill: #fefaf2;
                stroke: #fcd127;
                stroke-width: 6;
                vector-effect: non-scaling-stroke;
              }
    
              .ring-mid {
                fill: #6d1f26;
                stroke: #802922;
                stroke-width: 4;
                vector-effect: non-scaling-stroke;
              }
    
              .ring-inner {
                fill: #fefaf2;
                stroke: #5a3726;
                stroke-width: 3.5;
                vector-effect: non-scaling-stroke;
              }
    
              .crest-field {
                fill: #802922;
                stroke: #fcd127;
                stroke-width: 3;
                vector-effect: non-scaling-stroke;
              }
    
              .fine-line {
                stroke-width: 3;
                stroke-linecap: round;
                stroke-linejoin: round;
                fill: none;
                vector-effect: non-scaling-stroke;
              }
    
              .micro-line {
                stroke-width: 2.25;
                stroke-linecap: round;
                stroke-linejoin: round;
                fill: none;
                vector-effect: non-scaling-stroke;
              }
            </style>
          </defs>
    
          <circle class="ring-outer" cx="70" cy="70" r="46"/>
          <circle class="ring-mid" cx="70" cy="70" r="35"/>
          <circle class="ring-inner" cx="70" cy="70" r="24"/>
    
          <g class="gold-stroke fine-line" opacity="0.95">
            <path d="M70 9v10"/>
            <path d="M70 121v10"/>
            <path d="M9 70h10"/>
            <path d="M121 70h10"/>
          </g>
    
          <g class="gold-stroke micro-line" opacity="0.75">
            <path d="M28 28l6 6"/>
            <path d="M112 28l-6 6"/>
            <path d="M28 112l6-6"/>
            <path d="M112 112l-6-6"/>
          </g>
    
          <path
            class="crest-field"
            d="M70 45
               C77 45 83 47 87 51
               V66
               C87 79 78 88 70 93
               C62 88 53 79 53 66
               V51
               C57 47 63 45 70 45Z"
          />
    
          <g>
            <path
              fill="#fefaf2"
              d="M61 59
                 C64 57 67 56 70 56
                 C73 56 76 57 79 59
                 V72
                 C76 70.8 73 70 70 70
                 C67 70 64 70.8 61 72V59Z"
            />
            <path class="navy-stroke micro-line" d="M70 57v13"/>
            <path class="navy-stroke micro-line" d="M61.5 60.5C64 59 66.8 58.3 70 58.3"/>
            <path class="navy-stroke micro-line" d="M78.5 60.5C76 59 73.2 58.3 70 58.3"/>
            <path class="gold-stroke micro-line" d="M62.5 75.5H77.5"/>
          </g>
    
          <circle class="gold-fill" cx="70" cy="100" r="5.5"/>
          <path class="gold-stroke fine-line" d="M70 88V94"/>
    
          <g fill="#fcd127" opacity="0.95">
            <circle cx="70" cy="24" r="2.8"/>
            <circle cx="24" cy="70" r="2.8"/>
            <circle cx="116" cy="70" r="2.8"/>
          </g>
        </svg>
      `;
    }
    
    function renderRunMapStop(stop, index, currentIndex) {
      const stateClass = index < currentIndex ? "done" : index === currentIndex ? "current" : "";
      const phaseClass = stop.final ? "goal" : stop.phase === "Global Round" ? "global" : "regional";
    
      return `
        <div class="run-map-stop ${stateClass} ${phaseClass}" style="left:${stop.x}%; top:${getRunMapTop(stop)}">
          <div class="run-map-stop-marker">
            ${renderRunStopMarker(stop, index, currentIndex)}
          </div>
        </div>
      `;
    }
    
    function renderRunStopMarker(stop, index, currentIndex) {
      if (stop.final) {
        return renderYaleDestinationMarkerSvg();
      }
    
      if (stop.phase === "Global Round") {
        return renderGlobalRoundMarkerSvg();
      }
    
      const state = index < currentIndex ? "reached" : index === currentIndex ? "current" : "default";
      return renderRegionalStopMarkerSvg(state);
    }
    
    function renderJumpExperience() {
      const experience = state.experience;
      const question = experience.currentQuestion;
    
      if (experience.finished) {
        return renderResultsScreen({
          title: "Alpaca Jump Summary",
          subtitle: experience.failed ? "" : "You crossed the desert route.",
          answers: experience.answers,
          failed: experience.failed,
          resultState: experience.failed ? "fail" : "success",
          showPanelTitle: false,
          showTopClose: false,
          showBanner: false,
          showPerformanceMessage: false,
          showTopReplay: false,
          showBreakdowns: !experience.failed,
          metrics: [
            {
              label: "Questions",
              value: `${Math.min(experience.index + 1, experience.questions.length)}/${experience.questions.length}`
            },
            {
              label: "Distance",
              value: `${Math.round(experience.distance)}m`
            }
          ]
        });
      }
    
      if (!experience.started && !experience.unavailableReason) {
        return `
          ${renderPanelTitle("Alpaca Jump", "Jump, duck, and answer checkpoints across the desert.", "")}
          <div class="jump-shell">
            <article class="race-launch-panel card-panel jump-setup-card">
              <p class="race-launch-kicker">Checkpoint Jump Route</p>
              <div class="race-launch-pills">
                <span>Pick at least ${GAME_CONFIG.jeopardyMinGroups} ${escapeHtml(getLensCardPluralLabel(state.selection.lens))} before launch.</span>
                <span>Jump or duck past obstacles, then answer checkpoint questions.</span>
                <span>${GAME_CONFIG.jumpLives} lives stand between you and the journey summary.</span>
              </div>
              ${renderTargetSetupSelector(experience, "jump-toggle-category", "race-target-selector", "race-target-grid", "race-target-button")}
              <div class="panel-actions">
                <button class="button primary" type="button" data-jump-start ${experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups ? "disabled" : ""}>En route</button>
              </div>
            </article>
          </div>
        `;
      }
    
      if (experience.unavailableReason || !question) {
        return `
          ${renderPanelTitle("Alpaca Jump", "Jump, duck, and answer checkpoints across the desert.", "")}
          <div class="jump-shell">
            <article class="setup-card jump-setup-card">
              <div class="setup-card-header">
                ${renderConfiguredMascotAsset(
                  getGameplayAssetPath("launch", "jump"),
                  "excited",
                  "medium",
                  { alt: "Alpaca Jump unavailable alpaca" }
                )}
                <div>
                  <p class="challenge-label">Route update pending</p>
                  <h3>${escapeHtml(experience.unavailableReason || getUnavailableRawGameReason())}</h3>
                </div>
              </div>
            </article>
          </div>
        `;
      }
    
      const obstacle = experience.obstacle || createJumpObstacle(experience.obstacleCursor);
      const phaseClass = experience.phase;
      const runnerClass = getJumpRunnerClass(experience);
      const runnerTransform = `translateY(-${Math.max(0, experience.runnerY)}px)`;
      const questionValue = getJumpQuestionValue(question);
      const overlay = experience.phase === "question" || experience.phase === "feedback"
        ? renderJumpQuestionOverlay(experience, question)
        : "";
    
      return `
        ${renderPanelTitle("Alpaca Jump", "Jump, duck, and answer checkpoints across the desert.", "")}
        <div class="jump-shell">
          <section class="jump-stage ${escapeHtml(phaseClass)}" data-jump-stage>
            ${renderJumpBackground()}
            <div class="jump-hud">
              <div class="jump-hud-card">
                <span>Distance</span>
                <strong data-jump-distance>${Math.round(experience.distance)}m</strong>
              </div>
              <div class="jump-hud-card">
                <span>Lives</span>
                <div class="race-lives-row jump-lives" data-jump-lives>${renderJumpLives(experience.lives)}</div>
              </div>
            </div>
            <div class="jump-world">
              <div class="jump-runner ${escapeHtml(runnerClass)}" data-jump-runner data-jump-runner-state="${escapeHtml(getJumpRunnerState(experience))}" style="transform:${runnerTransform}">
                ${renderJumpRunner(experience)}
              </div>
              <div class="jump-obstacle ${escapeHtml(obstacle.kind)}" data-jump-obstacle data-jump-obstacle-kind="${escapeHtml(obstacle.kind)}" style="left:${obstacle.x}%">
                ${renderJumpObstacle(obstacle)}
              </div>
              <div class="jump-ground" aria-hidden="true"></div>
            </div>
            <div class="jump-controls">
              <button class="button secondary" type="button" data-jump-action="jump">Jump</button>
              <button class="button secondary" type="button" data-jump-action="duck">Duck</button>
              ${experience.phase === "ready" ? `<button class="button primary" type="button" data-jump-start>En route</button>` : ""}
            </div>
          </section>
          ${overlay}
        </div>
      `;
    }
    
    function renderJumpBackground() {
      const asset = getAssetValue(["jump", "background"]);
      if (!asset) {
        return `<div class="jump-background-placeholder" aria-hidden="true"></div>`;
      }
    
      return renderAssetImage(
        asset,
        "Alpaca Jump desert background",
        "jump-background",
        "jump-background-image",
        true
      );
    }
    
    function getJumpRunnerState(experience) {
      if (experience.runnerState === "hurting") {
        return "hurting";
      }
    
      if (experience.ducking) {
        return "ducking";
      }
    
      if (experience.runnerY > 1 || experience.runnerVelocity > 0) {
        return "jumping";
      }
    
      return "running";
    }
    
    function getJumpRunnerClass(experience) {
      return `state-${getJumpRunnerState(experience)}`;
    }
    
    function getJumpRunnerAssetConfig(stateName) {
      if (stateName === "ducking") {
        return {
          path: getAssetValue(["jump", "ducking"]) || getAssetValue(["jump", "runner"]),
          alt: "Ducking alpaca",
          aspect: "1.78 / 1"
        };
      }
    
      if (stateName === "hurting") {
        return {
          path: getAssetValue(["jump", "hurting"]) || getAssetValue(["jump", "runner"]),
          alt: "Hurt alpaca",
          aspect: "2.07 / 1"
        };
      }
    
      return {
        path: getAssetValue(["jump", "runner"]),
        alt: stateName === "jumping" ? "Jumping alpaca" : "Running alpaca",
        aspect: "1.48 / 1"
      };
    }
    
    function renderJumpRunner(experience) {
      const stateName = getJumpRunnerState(experience);
      const config = getJumpRunnerAssetConfig(stateName);
      if (!config.path) {
        return renderMascot("determined", "medium", { alt: "Running alpaca" });
      }
    
      return `
        <div
          class="jump-runner-viewport jump-runner-viewport-${escapeHtml(stateName)}"
          style="--jump-runner-aspect:${config.aspect};"
        >
          <img class="jump-runner-image" src="${escapeHtml(config.path)}" alt="${escapeHtml(config.alt)}" loading="eager" />
        </div>
      `;
    }
    
    function renderJumpObstacle(obstacle) {
      if (obstacle && obstacle.kind === "checkpoint") {
        const asset = getAssetValue(["jump", "questionGenie"]);
        if (asset) {
          return renderAssetImage(
            asset,
            "Question genie checkpoint",
            "jump-question-genie",
            "jump-question-genie-image",
            true
          );
        }
    
        return `<span class="jump-dark-alpaca-body" aria-hidden="true"></span>`;
      }
    
      const asset = obstacle && obstacle.kind === "flying"
        ? getAssetValue(["jump", "monsterToDuck"])
        : getAssetValue(["jump", "monsterToJump"]);
      if (!asset) {
        return `<span class="jump-dark-alpaca-body" aria-hidden="true"></span>`;
      }
    
      return renderAssetImage(
        asset,
        obstacle && obstacle.kind === "flying" ? "Flying monster to duck under" : "Ground monster to jump over",
        "jump-monster",
        "jump-monster-image",
        true
      );
    }
    
    function renderJumpLives(lives) {
      return Array.from({ length: Math.max(0, lives) }, (_, index) => {
        const state = lives === 1 && index === 0 ? "warning" : "full";
        return `<span class="race-life ${state}">${renderRaceLivesIcon(state)}</span>`;
      }).join("");
    }
    
    function getJumpQuestionLevel(question) {
      const level = Number(question && question.rawLevel);
      if (Number.isFinite(level) && level >= 1) {
        return Math.min(5, level);
      }
    
      return 1;
    }
    
    function getJumpQuestionValue(question) {
      return `${getJumpQuestionLevel(question) * 100}`;
    }
    
    function renderJumpQuestionOverlay(experience, question) {
      const revealed = experience.phase === "feedback";
      const heading = revealed
        ? (experience.lastCorrect ? "Question cleared." : "Wrong answer. One life lost.")
        : "Question box";
    
      return renderGameQuestionPopup(`
        <article class="challenge-card jump-question-card">
          ${renderConfiguredMascotAsset(
            getAssetValue(["jump", "questionGenie"]),
            "thinking",
            "large",
            {
              alt: "Question genie",
              slotClass: "jump-question-genie-card",
              imageClass: "jump-question-genie-card-image",
              eager: true,
              reviewBadge: getGameplayReviewBadge("question", "jump")
            }
          )}
          <span class="challenge-label">${escapeHtml(getGamePromptLabel("jump", question))}</span>
          ${renderGameNotes(question, "jump", {
            index: experience.index,
            total: experience.questions.length,
            lives: experience.lives,
            distance: experience.distance,
            value: getJumpQuestionValue(question)
          })}
          <div class="popup-question-panel">
            <div class="popup-question-copy">
              <span class="question-meta">${escapeHtml(heading)}</span>
              <h2 class="popup-question-text">${escapeHtml(question.prompt)}</h2>
            </div>
          </div>
                <div class="options-grid answer-options-grid">
            ${question.options.map((option, index) => {
              let classes = "option-button";
              if (revealed) {
                if (index === question.answerIndex) {
                  classes += " correct";
                } else if (index === experience.selectedIndex) {
                  classes += " wrong";
                }
                classes += " disabled";
              }
              return `
                <button class="${classes}" data-jump-option="${index}" ${revealed ? "disabled" : ""}>
                  ${renderOptionToken(index)}
                  <span>${escapeHtml(option)}</span>
                </button>
              `;
            }).join("")}
          </div>
          ${revealed ? `
            <article class="feedback-card ${experience.lastCorrect ? "correct" : "wrong"}">
              ${renderCheckpointVisual(experience.lastCorrect ? "success" : "fail")}
              <div>
                <h3>${escapeHtml(experience.lastCorrect ? "The alpaca keeps running." : (experience.lives <= 0 ? "No lives left." : `${experience.lives} lives left.`))}</h3>
                <p>${escapeHtml(question.explanation)}</p>
                <div class="run-actions">
                  <button class="button primary" type="button" data-jump-continue>${experience.lives <= 0 || experience.index >= experience.questions.length - 1 ? "Journey Summary" : "Continue Forward"}</button>
                </div>
              </div>
            </article>
          ` : ""}
        </article>
      `, "jump", { showClose: false });
    }
    
    function renderRunExperience() {
      const experience = state.experience;
      const timerClass = getTimerVisualState(experience.timeRemaining, GAME_CONFIG.runTotalTime, {
        warningAt: 90,
        dangerAt: 30
      });
    
      if (experience.finished) {
        const reachedStop = getRunCurrentStop(experience);
        const passedStops = getRunPassedStopLabels(experience);
        return renderResultsScreen({
          title: "Journey Summary",
          subtitle: experience.failed ? "Not there yet — but closer than before." : "You made it to the final destination.",
          answers: experience.answers,
          failed: experience.failed,
          resultState: experience.failed ? "fail" : "success",
          showPerformanceMessage: false,
          showBreakdowns: false,
          breakdownHtml: renderAlternateLensBreakdown(experience.answers),
          metrics: [
            {
              label: "Distance Reached",
              value: `${experience.stage + 1}/${experience.route.length} · ${reachedStop.label}`
            },
            {
              label: "Stops Cleared",
              value: passedStops.length ? passedStops.join(" · ") : "No city cleared yet"
            }
          ]
        });
      }
    
      if (!experience.started && !experience.unavailableReason) {
        return `
          ${renderPanelTitle("Alpaca Run", "Race from stop to stop and see how close you can get to Yale.", "")}
          <div class="run-shell">
            <article class="race-launch-panel card-panel run-setup-card">
              <p class="race-launch-kicker">Road to Yale</p>
              <div class="race-launch-pills">
                <span>The goal is to get to Yale before the clock runs out.</span>
                <span>Questions get harder as you move from Regional stops to Global stops.</span>
                <span>A wrong answer sends you back to the last place you reached.</span>
              </div>
    
              ${renderTargetSetupSelector(experience, "run-toggle-category", "race-target-selector", "race-target-grid", "race-target-button")}
    
              <div class="panel-actions">
                <button class="button primary" data-run-start ${experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups ? "disabled" : ""}>En route</button>
              </div>
            </article>
          </div>
        `;
      }
    
      if (experience.unavailableReason || !experience.currentQuestion) {
        return `
          ${renderPanelTitle("Alpaca Run", "Race from stop to stop and see how close you can get to Yale.", "")}
          <div class="run-shell">
            <article class="setup-card">
              <div class="setup-card-header">
                ${renderConfiguredMascotAsset(
                  getGameplayAssetPath("launch", "run"),
                  "determined",
                  "medium",
                  { alt: "Alpaca Run unavailable alpaca" }
                )}
                <div>
                  <p class="challenge-label">Route update pending</p>
                  <h3>${escapeHtml(experience.unavailableReason || getUnavailableRawGameReason())}</h3>
                </div>
              </div>
            </article>
          </div>
        `;
      }
    
      const question = experience.currentQuestion;
      const yaleMode = experience.stage >= experience.route.length - 1;
      const runFeedbackHeading = experience.lastCorrect
        ? (yaleMode
          ? (experience.yaleProgress === GAME_CONFIG.runYaleLevelFiveCount - 1
            ? "Yale reached."
            : "One Yale checkpoint cleared.")
          : "Next stop reached.")
        : (yaleMode
          ? "Wrong turn. Back to Question 20."
          : "Wrong turn. Back to the last destination reached.");
      return `
        ${renderPanelTitle(
          "Alpaca Run",
          "Race from stop to stop and see how close you can get to Yale.",
          ""
        )}
        <div class="run-shell">
          <section class="run-map-shell">
            ${renderRunMap(experience)}
    
            <section class="run-inline-shell">
              <article class="run-inline-card">
                <div class="run-inline-question">
                  <h2>${escapeHtml(question.prompt)}</h2>
                </div>
                <div class="options-grid run-inline-options answer-options-grid">
                  ${question.options.map((option, index) => {
                    let classes = "option-button";
                    if (experience.revealed) {
                      if (index === question.answerIndex) {
                        classes += " correct";
                      } else if (index === experience.selectedIndex) {
                        classes += " wrong";
                      }
                      classes += " disabled";
                    }
                    return `
                      <button class="${classes}" data-run-option="${index}">
                        ${renderOptionToken(index)}
                        <span>${escapeHtml(option)}</span>
                      </button>
                    `;
                  }).join("")}
                </div>
                <div class="run-inline-footer">
                  ${renderCompactRaceTimerCard("Time Left", experience.timeRemaining, GAME_CONFIG.runTotalTime, timerClass, "run")}
                  ${yaleMode ? `
                    <div class="run-inline-timer ${timerClass}">
                      <span>Yale Questions</span>
                      <strong>${experience.yaleProgress + 1}/${GAME_CONFIG.runYaleLevelFiveCount}</strong>
                    </div>
                  ` : ""}
                </div>
              </article>
    
              ${experience.revealed ? `
                <article class="feedback-card ${experience.lastCorrect ? "correct" : "wrong"}">
                  ${renderCheckpointVisual(experience.lastCorrect ? "success" : "fail")}
                  <div>
                    <h3>${escapeHtml(runFeedbackHeading)}</h3>
                    <p>${escapeHtml(question.explanation)}</p>
                    <div class="run-actions">
                      <button class="button primary" data-run-continue>${experience.lastCorrect && yaleMode && experience.yaleProgress === GAME_CONFIG.runYaleLevelFiveCount - 1 ? "Journey Summary" : "Continue Forward"}</button>
                    </div>
                  </div>
                </article>
              ` : ""}
            </section>
    
          </section>
        </div>
      `;
    }
    
    function renderRaceTimerWidget(seconds, stateClass = "", totalSeconds = 12) {
      const normalizedState = stateClass === "danger"
        ? "critical"
        : stateClass === "warning"
          ? "warning"
          : "normal";
      const safeTotal = Math.max(1, Number(totalSeconds) || 1);
      const safeSeconds = Math.max(0, Number(seconds) || 0);
      const fractionLeft = Math.max(0, Math.min(1, safeSeconds / safeTotal));
      const progressCircumference = 439.82;
      const warningCircumference = 515.22;
      const progressOffset = (progressCircumference * (1 - fractionLeft)).toFixed(2);
      const warningFraction = normalizedState === "normal"
        ? 0
        : normalizedState === "warning"
          ? Math.max(0.22, Math.min(0.54, 0.22 + ((9 - safeSeconds) / 4) * 0.32))
          : Math.max(0.56, Math.min(0.82, 0.56 + ((5 - safeSeconds) / 5) * 0.26));
      const warningOffset = (warningCircumference * (1 - warningFraction)).toFixed(2);
      const timeLabel = String(safeSeconds);
    
      return `
        <div class="race-timer-widget ${stateClass || "normal"}" aria-hidden="true">
          <svg
            class="race-timer-widget-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 240 240"
            width="240"
            height="240"
            fill="none"
            role="img"
            aria-label="Race countdown timer"
          >
            <defs>
              <style>
                .shadow-ring { fill: #4b2f21; opacity: 0.16; }
                .outer-frame { fill: #5a3726; }
                .main-body { fill: #ead8b7; stroke: #5a3726; stroke-width: 3; vector-effect: non-scaling-stroke; }
                .track-ring { fill: none; stroke: #c9b18d; stroke-width: 14; opacity: 0.95; vector-effect: non-scaling-stroke; }
                .progress-ring { fill: none; stroke: #6d1f26; stroke-width: 14; stroke-linecap: round; vector-effect: non-scaling-stroke; }
                .warning-ring { fill: none; stroke: #d8b13f; stroke-width: 6; stroke-linecap: round; opacity: 0; vector-effect: non-scaling-stroke; }
                .critical-ring { fill: none; stroke: #57171d; stroke-width: 4; stroke-linecap: round; opacity: 0; vector-effect: non-scaling-stroke; }
                .inner-disc { fill: #f2e5cb; stroke: #5a3726; stroke-width: 2.5; vector-effect: non-scaling-stroke; }
                .inner-line { fill: none; stroke: #d8b13f; stroke-width: 1.5; opacity: 0.9; vector-effect: non-scaling-stroke; }
                .tick-major { stroke: #5a3726; stroke-width: 3; stroke-linecap: round; opacity: 0.72; vector-effect: non-scaling-stroke; }
                .tick-minor { stroke: #b98d31; stroke-width: 2; stroke-linecap: round; opacity: 0.72; vector-effect: non-scaling-stroke; }
                .accent { fill: #d8b13f; opacity: 0.95; }
                .time-text { fill: #5a3726; font-family: Inter, Arial, sans-serif; font-size: 50px; font-weight: 800; text-anchor: middle; dominant-baseline: middle; letter-spacing: 1px; }
                .label-text { fill: #6d1f26; font-family: Inter, Arial, sans-serif; font-size: 11px; font-weight: 700; text-anchor: middle; letter-spacing: 2.6px; opacity: 0.88; }
                .state-normal .progress-ring { stroke: #6d1f26; }
                .state-normal .warning-ring { opacity: 0; }
                .state-normal .critical-ring { opacity: 0; }
                .state-warning .progress-ring { stroke: #b98d31; }
                .state-warning .warning-ring { opacity: 0.95; }
                .state-critical .progress-ring { stroke: #57171d; }
                .state-critical .warning-ring { opacity: 0.7; }
                .state-critical .critical-ring { opacity: 1; }
                .state-critical .time-text { fill: #57171d; }
              </style>
            </defs>
            <g id="timer-widget" class="state-${normalizedState}">
              <circle class="shadow-ring" cx="120" cy="124" r="102"/>
              <circle class="outer-frame" cx="120" cy="120" r="104"/>
              <circle class="main-body" cx="120" cy="120" r="98"/>
              <g id="timer-ticks">
                <path class="tick-major" d="M120 30V40"/>
                <path class="tick-major" d="M210 120H200"/>
                <path class="tick-major" d="M120 210V200"/>
                <path class="tick-major" d="M30 120H40"/>
                <path class="tick-minor" d="M165 42L161 50"/>
                <path class="tick-minor" d="M198 75L190 79"/>
                <path class="tick-minor" d="M198 165L190 161"/>
                <path class="tick-minor" d="M165 198L161 190"/>
                <path class="tick-minor" d="M75 198L79 190"/>
                <path class="tick-minor" d="M42 165L50 161"/>
                <path class="tick-minor" d="M42 75L50 79"/>
                <path class="tick-minor" d="M75 42L79 50"/>
              </g>
              <circle class="track-ring" cx="120" cy="120" r="70"/>
              <circle
                class="progress-ring"
                cx="120"
                cy="120"
                r="70"
                transform="rotate(-90 120 120)"
                stroke-dasharray="${progressCircumference}"
                stroke-dashoffset="${progressOffset}"
              />
              <circle
                class="warning-ring"
                cx="120"
                cy="120"
                r="82"
                transform="rotate(-90 120 120)"
                stroke-dasharray="${warningCircumference}"
                stroke-dashoffset="${warningOffset}"
              />
              <circle class="critical-ring" cx="120" cy="120" r="89"/>
              <circle class="inner-disc" cx="120" cy="120" r="48"/>
              <circle class="inner-line" cx="120" cy="120" r="40"/>
              <rect x="111" y="18" width="18" height="6" rx="3" class="accent"/>
              <path class="accent" d="M112 216H128L124 222H116L112 216Z"/>
              <text x="120" y="112" class="time-text">${escapeHtml(timeLabel)}</text>
              <text x="120" y="142" class="label-text">SECONDS</text>
            </g>
          </svg>
        </div>
      `;
    }
    
    function renderCompactRaceTimerCard(label, seconds, totalSeconds, stateClass = "normal", variant = "") {
      return `
        <div class="compact-race-timer-card ${escapeHtml(stateClass)} ${escapeHtml(variant)}">
          <span>${escapeHtml(label)}</span>
          ${renderRaceTimerWidget(seconds, stateClass, totalSeconds)}
          <strong>${escapeHtml(formatCountdown(seconds))}</strong>
        </div>
      `;
    }
    
    function getTimerVisualState(seconds, totalSeconds, options = {}) {
      const safeSeconds = Math.max(0, Number(seconds) || 0);
      const safeTotal = Math.max(1, Number(totalSeconds) || 1);
      const warningAt = Number.isFinite(options.warningAt) ? options.warningAt : Math.ceil(safeTotal * 0.36);
      const dangerAt = Number.isFinite(options.dangerAt) ? options.dangerAt : Math.ceil(safeTotal * 0.18);
    
      if (safeSeconds <= dangerAt) {
        return "danger";
      }
    
      if (safeSeconds <= warningAt) {
        return "warning";
      }
    
      return "normal";
    }
    
    function renderPopupQuestionTimerPanel(questionText, seconds, totalSeconds, stateClass = "normal") {
      return `
        <section class="popup-question-panel ${escapeHtml(stateClass)}">
          <div class="popup-question-copy">
            <h2 class="popup-question-text">${escapeHtml(questionText)}</h2>
          </div>
          <div class="popup-question-timer">
            ${renderRaceTimerWidget(seconds, stateClass, totalSeconds)}
          </div>
        </section>
      `;
    }

    function renderRaceQuestionPills(experience, currentLevel) {
      const pills = [
        `Pressure stop ${experience.index + 1}`,
        `Current level: ${currentLevel ? currentLevel.level : 1}`,
        `Chances remaining: ${experience.lives}`,
        `${experience.timeRemaining}s on the clock`
      ];
    
      return `
        <div class="race-question-pills" aria-label="Race question status">
          ${pills.map((pill) => `<span>${escapeHtml(pill)}</span>`).join("")}
        </div>
      `;
    }

    return Object.freeze({
      renderRaceExperience,
      renderRaceTargetSelector,
      renderTargetSetupSelector,
      renderRaceQuestionPills,
      formatCountdown,
      getRunCurrentStop,
      getRunNextStop,
      getRunRoundsBeforeYale,
      getRunPassedStopLabels,
      getRunStopRoundSuffix,
      formatRunCurrentStopLabel,
      getRunMapTop,
      renderRunMap,
      renderRunStatusRow,
      renderRunMapBackground,
      renderRunTravelMarker,
      renderRegionalStopMarkerSvg,
      renderGlobalRoundMarkerSvg,
      renderYaleDestinationMarkerSvg,
      renderRunMapStop,
      renderRunStopMarker,
      renderJumpExperience,
      renderJumpBackground,
      getJumpRunnerState,
      getJumpRunnerClass,
      getJumpRunnerAssetConfig,
      renderJumpRunner,
      renderJumpObstacle,
      renderJumpLives,
      getJumpQuestionLevel,
      getJumpQuestionValue,
      renderJumpQuestionOverlay,
      renderRunExperience,
      renderRaceTimerWidget,
      renderCompactRaceTimerCard,
      getTimerVisualState,
      renderPopupQuestionTimerPanel
    });
  }

  global.WSC_CREATE_ARCADE_RENDER_CONTROLLER = createArcadeRenderController;
}(window));
