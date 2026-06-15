(function () {
  function getStandings(teams) {
    return teams.slice().sort((left, right) =>
      right.score - left.score ||
      right.correct - left.correct ||
      left.wrong - right.wrong ||
      left.label.localeCompare(right.label)
    );
  }

  function renderExperience(experience, helpers) {
    const GAME_CONFIG = helpers.GAME_CONFIG;
    const question = experience.questions[experience.index];
    const questionSectionLabel = helpers.getQuestionSectionLabel(question);
    const buzzedTeam = Number.isInteger(experience.buzzedTeamIndex) ? experience.teams[experience.buzzedTeamIndex] : null;
    const leader = getStandings(experience.teams)[0];
    const mascotMood = experience.revealed
      ? (experience.lastCorrect ? "excited" : "sad")
      : "thinking";

    if (experience.finished) {
      return renderResults(experience, helpers);
    }

    if (experience.unavailableReason) {
      return `
        ${helpers.renderPanelTitle("Alpaquiz", "Buzz in first, claim the question, and move your team ahead.", "")}
        <div class="mode-shell">
          <article class="setup-card relay-setup-card">
            <div class="setup-card-header">
              ${helpers.renderConfiguredMascotAsset(
                helpers.getGameplayAssetPath("launch", "relay"),
                "thinking",
                "medium",
                { alt: "Relay unavailable alpaca" }
              )}
              <div>
                <p class="challenge-label">Route update pending</p>
                <h3>${helpers.escapeHtml(experience.unavailableReason)}</h3>
              </div>
            </div>
          </article>
        </div>
      `;
    }

    return `
      ${helpers.renderPanelTitle(
        "Alpaquiz",
        "Buzz first, claim the question, and move your team ahead.",
        experience.started
          ? `Route: ${helpers.getTargetLabel()} · Shared stop ${experience.index + 1} of ${experience.questions.length}`
          : `Route setup · ${helpers.getTargetLabel()}`
      )}
      <div class="mode-shell">
        <div class="mode-stats">
          <span>Correct answers score +${GAME_CONFIG.relayCorrectPoints}. Wrong turns or timeouts give +${GAME_CONFIG.relayCorrectPoints} to every other team.</span>
          <span>The first buzz takes control of the stop.</span>
          <span>The buzzing team has ${GAME_CONFIG.relayAnswerTime} seconds to answer.</span>
        </div>

        ${!experience.started ? `
          <section class="relay-team-shell">
            ${renderOverlay(helpers)}
            <div class="relay-team-grid">
              ${experience.teams.map((team, index) => renderTeamCard(team, index, experience, leader, helpers, {
                interactive: false,
                popup: false
              })).join("")}
            </div>
          </section>
          <article class="setup-card relay-setup-card relay-inline-setup-card">
            <div class="setup-card-header">
              ${helpers.renderConfiguredMascotAsset(
                helpers.getGameplayAssetPath("launch", "relay"),
                "excited",
                "medium",
                { alt: "Relay launch alpaca" }
              )}
              <div>
                <p class="challenge-label">Local multiplayer route</p>
                <h3>Choose the team count, read the rules, and launch the shared route.</h3>
              </div>
            </div>

            <div class="setup-block">
              <strong>How many teams are playing?</strong>
              <div class="setup-count-grid">
                ${Array.from({ length: GAME_CONFIG.relayMaxTeams - GAME_CONFIG.relayMinTeams + 1 }, (_, offset) => {
                  const count = GAME_CONFIG.relayMinTeams + offset;
                  return `
                    <button
                      class="setup-count-button ${experience.teams.length === count ? "active" : ""}"
                      type="button"
                      data-relay-set-teams="${count}"
                    >
                      ${count} teams
                    </button>
                  `;
                }).join("")}
              </div>
            </div>

            <div class="setup-block">
              <strong>Team keys</strong>
              <div class="setup-rule-list">
                <p>${experience.teams.map((team) => `${team.label}: ${team.keyLabel}`).join(" · ")}</p>
              </div>
            </div>

            ${helpers.renderTargetSetupSelector(experience, "relay-toggle-category", "race-target-selector", "race-target-grid", "race-target-button")}

            <div class="panel-actions">
              <button class="button primary" data-relay-start ${experience.setupCategoryIds.length < GAME_CONFIG.jeopardyMinGroups ? "disabled" : ""}>En route</button>
            </div>
          </article>
        ` : helpers.renderGameQuestionPopup(`
          ${renderPopupTeamSection(experience, leader, helpers)}
          <article class="challenge-card ${buzzedTeam || experience.revealed ? "relay-no-mascot" : ""}">
            ${!buzzedTeam && !experience.revealed ? `<aside class="challenge-mascot">
              ${helpers.renderConfiguredMascotAsset(
                helpers.getGameplayAssetPath("question", "relay"),
                mascotMood,
                "large",
                { alt: "Relay question alpaca", reviewBadge: helpers.getGameplayReviewBadge("question", "relay") }
              )}
              <span class="challenge-label">${helpers.escapeHtml(experience.revealed ? (experience.lastCorrect ? "shared checkpoint cleared" : "shared route interrupted") : helpers.getGamePromptLabel("relay", question))}</span>
              ${helpers.renderGameNotes(question, "relay", {
                index: experience.index,
                total: experience.questions.length,
                teamCount: experience.teams.length
              })}
            </aside>` : ""}

            <div class="challenge-copy">
              <div class="question-meta">
                <span class="meta-pill section">${helpers.escapeHtml(questionSectionLabel)}</span>
                ${helpers.renderQuestionSubjectPills(question)}
              </div>
              <h2>${helpers.escapeHtml(question.prompt)}</h2>

              ${!buzzedTeam && !experience.revealed ? `
                <div class="relay-buzz-banner">
                  <strong>Buzz for this stop</strong>
                  <p>The first team to hit its key takes control of this checkpoint.</p>
                </div>
              ` : ""}

              ${buzzedTeam || experience.revealed ? `
                <div class="relay-answer-status">
                  ${renderBuzzWinner("status", helpers)}
                  <span>${buzzedTeam ? `${buzzedTeam.label} buzzed first and controls the stop.` : "Still in play."}</span>
                </div>
              ` : ""}

              ${buzzedTeam && !experience.revealed ? `
                <div class="relay-inline-timer">
                  ${helpers.renderCompactRaceTimerCard(
                    "Answer timer",
                    experience.answerTimeRemaining,
                    GAME_CONFIG.relayAnswerTime,
                    helpers.getTimerVisualState(experience.answerTimeRemaining, GAME_CONFIG.relayAnswerTime, {
                      warningAt: 10,
                      dangerAt: 5
                    }),
                    "relay"
                  )}
                </div>
              ` : ""}

              <div class="options-grid answer-options-grid">
                ${question.options.map((option, index) => {
                  let classes = "option-button";
                  const disabled = !buzzedTeam || experience.revealed;
                  if (experience.revealed) {
                    if (index === question.answerIndex) {
                      classes += " correct";
                    } else if (index === experience.selectedIndex) {
                      classes += " wrong";
                    }
                    classes += " disabled";
                  } else if (!buzzedTeam) {
                    classes += " disabled awaiting-buzz";
                  }
                  return `
                    <button class="${classes}" data-relay-option="${index}" ${disabled ? "disabled" : ""}>
                      ${helpers.renderOptionToken(index)}
                      <span>${helpers.escapeHtml(option)}</span>
                    </button>
                  `;
                }).join("")}
              </div>
            </div>
          </article>
          ${experience.revealed ? `
            <article class="feedback-card relay-answer-popup ${experience.lastCorrect ? "correct" : "wrong"}">
              ${helpers.renderCheckpointVisual(experience.lastCorrect ? "success" : "fail")}
              <div>
                <h3>${helpers.escapeHtml(experience.lastCorrect
                  ? `${buzzedTeam.label} clears the stop for ${GAME_CONFIG.relayCorrectPoints} points`
                  : experience.lastAwardedTeamLabels?.length
                    ? `${helpers.formatRelayAwardedTeams(experience.lastAwardedTeamLabels)} ${experience.lastAwardedTeamLabels.length === 1 ? "takes" : "take"} the stop after ${buzzedTeam.label}'s ${experience.lastTimedOut ? "timeout" : "wrong turn"}`
                    : `${buzzedTeam.label} loses the stop`)}
                </h3>
                <p>${helpers.escapeHtml(question.explanation)}</p>
                <div class="feedback-actions">
                  <button class="button primary" data-relay-continue>${experience.index === experience.questions.length - 1 ? "Final Standing" : "Next shared stop"}</button>
                </div>
              </div>
            </article>
          ` : ""}
        `, "relay", { showClose: false })}
      </div>
    `;
  }

  function renderTeamCard(team, index, experience, leader, helpers, options = {}) {
    const active = index === experience.buzzedTeamIndex;
    const interactive = Boolean(options.interactive);
    const popup = Boolean(options.popup);
    const tag = interactive ? "button" : "div";
    const action = interactive ? `data-relay-buzz="${index}"` : "";

    return `
      <${tag}
        class="relay-team-card ${active ? "active" : ""} ${team.id === leader.id ? "leader" : ""} ${popup ? "popup" : ""}"
        ${action}
      >
        ${active ? renderBuzzWinner("card", helpers) : ""}
        ${renderTeamCardSkin(helpers)}
        ${renderKeycap(team.keyLabel, helpers)}
        <span class="team-label">${helpers.escapeHtml(team.label)}</span>
        <strong class="relay-score">${team.score} pts</strong>
        <span class="relay-state">${team.correct} correct · ${team.wrong} wrong</span>
      </${tag}>
    `;
  }

  function renderPopupTeamSection(experience, leader, helpers) {
    const buzzed = Number.isInteger(experience.buzzedTeamIndex);
    const visibleTeams = buzzed ? [experience.teams[experience.buzzedTeamIndex]] : experience.teams;

    if (buzzed) {
      return "";
    }

    return `
      <section class="relay-popup-team-shell">
        <div class="relay-popup-team-header">
          <div>
            <h3>Buzz in first to take the route</h3>
          </div>
          <button class="button secondary" type="button" data-replay-current>Take This Route Again</button>
        </div>
        <div class="relay-popup-team-grid">
          ${visibleTeams.map((team) => {
            const teamIndex = experience.teams.findIndex((entry) => entry.id === team.id);
            return renderTeamCard(team, teamIndex, experience, leader, helpers, {
              interactive: !experience.revealed,
              popup: true
            });
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderResults(experience, helpers) {
    const standings = getStandings(experience.teams);
    const winner = standings[0];
    const resultVisual = helpers.renderConfiguredMascotAsset(
      helpers.getResultAssetPath("relay", "success"),
      "victory",
      "large",
      { alt: "Relay victory alpaca" }
    );

    return `
      ${helpers.renderPanelTitle("Final Standing", "Top team on the path.", `Route: ${helpers.getTargetLabel()} · ${experience.teams.length} teams`)}
      <article class="result-shell">
        <div class="result-banner">
          <div class="result-visual">${resultVisual}</div>
          <div>
            <p class="challenge-label">Leading team</p>
            <h2>${helpers.escapeHtml(winner.label)}</h2>
            <p>${helpers.escapeHtml(`${winner.score} points with ${winner.correct} cleared shared stops.`)}</p>
          </div>
        </div>

        <div class="result-metrics">
          ${helpers.renderMetricCard("Lead Team", winner.label)}
          ${helpers.renderMetricCard("Teams", String(experience.teams.length))}
          ${helpers.renderMetricCard("Final Score", String(winner.score))}
          ${helpers.renderMetricCard("Stops Played", String(experience.questions.length))}
        </div>

        <div class="jeopardy-standings">
          ${standings.map((team, index) => `
            <article class="jeopardy-standing-card ${index === 0 ? "winner" : ""}">
              <span class="team-label">${helpers.escapeHtml(team.label)}</span>
              <strong>${team.score}</strong>
              <span>${team.correct} correct · ${team.wrong} wrong</span>
            </article>
          `).join("")}
        </div>

        ${helpers.renderSelectedTargetBreakdown(experience.answers)}

        <div class="result-actions">
          <button class="button primary" data-replay-current>Take This Route Again</button>
        </div>
      </article>
    `;
  }

  function renderOverlay(helpers) {
    const asset = helpers.getAssetValue(["multiplayer", "relayOverlay"]);
    return helpers.renderAssetImage(
      asset,
      "Relay mode decoration",
      "relay-overlay",
      "relay-overlay-image"
    );
  }

  function renderTeamCardSkin(helpers) {
    const asset = helpers.getAssetValue(["multiplayer", "teamCardSkin"]);
    return helpers.renderAssetImage(
      asset,
      "Relay team card skin",
      "relay-team-card-skin",
      "relay-team-card-skin-image"
    );
  }

  function renderKeycap(label, helpers) {
    const normalizedLabel = String(label || "").trim().toLowerCase();
    const asset = helpers.getAssetValue(["multiplayer", "keycaps", normalizedLabel]);

    if (!asset) {
      return `<span class="relay-keycap">${helpers.escapeHtml(String(label || ""))}</span>`;
    }

    return helpers.renderAssetImage(
      asset,
      `${String(label || "").toUpperCase()} keycap`,
      "relay-keycap",
      "relay-keycap-image"
    );
  }

  function renderBuzzWinner(surface = "status", helpers) {
    const asset = helpers.getAssetValue(["multiplayer", "buzzWinner"]);
    return helpers.renderAssetImage(
      asset,
      "Buzz winner highlight",
      `relay-buzz-winner relay-buzz-winner-${surface}`,
      `relay-buzz-winner-image relay-buzz-winner-image-${surface}`
    );
  }

  window.WSC_ALPAQUIZ_RELAY_RENDERER = Object.freeze({
    renderExperience,
    renderResults,
    getStandings
  });
}());
