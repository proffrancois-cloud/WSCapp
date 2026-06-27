(function () {
  function renderExperience(experience, helpers) {
    if (!experience) {
      return "";
    }

    if (!experience.started && !experience.unavailableReason) {
      return renderSetup(experience, helpers);
    }

    if (experience.finished) {
      return renderResults(experience, helpers);
    }

    const live = helpers.live || {};
    const canOpenTile = !live.enabled || live.canOpenTile;

    return `
      ${helpers.renderPanelTitle(
        "Alpacapardy",
        "Choose a clue. Clear the stop. Keep the board moving.",
        `Board built from ${experience.board.length} ${helpers.getLensCardPluralLabel(helpers.selectionLens)} · ${experience.teams.length} teams`
      )}
      <div class="mode-shell">
        <div class="mode-stats">
          <span>${helpers.escapeHtml(experience.board.map((group) => group.label).join(" · "))}</span>
        </div>

        ${renderTeams(experience, helpers)}
        ${live.enabled ? renderLiveChat(experience, helpers) : ""}

        <div class="jeopardy-board-shell">
          ${helpers.renderJeopardyDecoration()}
          <div class="jeopardy-board" style="--jeopardy-columns:${experience.board.length}">
            ${experience.board.map((group, groupIndex) => `
              <article class="jeopardy-category">
                ${renderCategoryHeader(group.label, helpers)}
                <div class="jeopardy-stack">
                  ${group.tiles.map((tile, tileIndex) => `
                    <button
                      class="tile-button ${tile.done ? "done" : ""} ${helpers.isActiveTile(groupIndex, tileIndex) ? "active" : ""}"
                      data-jeopardy-open="${groupIndex}:${tileIndex}"
                      ${tile.done || experience.active || !canOpenTile ? "disabled" : ""}
                    >
                      ${renderTileFace(tile, helpers)}
                    </button>
                  `).join("")}
                </div>
              </article>
            `).join("")}
          </div>
        </div>

        ${experience.active ? renderFocus(experience, helpers) : ""}
      </div>
    `;
  }

  function renderFocus(experience, helpers) {
    const active = experience.active;
    const tile = experience.board[active.groupIndex].tiles[active.tileIndex];
    const question = tile.question;
    const team = experience.teams[active.teamIndex];
    const timerClass = helpers.getTimerVisualState(active.timeRemaining, helpers.config.jeopardyAnswerTime, {
      warningAt: 10,
      dangerAt: 5
    });
    const revealVisual = helpers.renderCheckpointVisual(active.correct ? "success" : "fail");
    const live = helpers.live || {};
    const canAnswer = !live.enabled || live.canAnswerFocus;
    const canClose = !live.enabled || live.canCloseFocus;

    return helpers.renderGameQuestionPopup(`
        <div class="challenge-card">
          <aside class="challenge-mascot">
            ${active.revealed
              ? revealVisual
              : helpers.renderConfiguredMascotAsset(
                helpers.getGameplayAssetPath("question", "jeopardy"),
                "thinking",
                "large",
                { alt: "Alpacapardy question alpaca", reviewBadge: helpers.getGameplayReviewBadge("question", "jeopardy") }
              )}
            <span class="challenge-label">${helpers.escapeHtml(active.revealed ? (active.correct ? "checkpoint cleared" : "missed stop") : helpers.getGamePromptLabel("alpacapardy", question))}</span>
            ${helpers.renderGameNotes(question, "alpacapardy", {
              value: tile.value,
              cleared: helpers.countDoneTiles(experience.board),
              total: helpers.countTiles(experience.board)
            })}
          </aside>
          <div class="challenge-copy">
            ${helpers.renderPopupQuestionTimerPanel(question.prompt, active.timeRemaining, helpers.config.jeopardyAnswerTime, timerClass)}
            <div class="question-meta">
              <span class="meta-pill section">${helpers.escapeHtml(helpers.sectionById[question.sectionId].originalTitle)}</span>
              <span class="meta-pill section">Answering: ${helpers.escapeHtml(team.label)}</span>
              ${question.subjectIds.map((subjectId) => {
                const subject = helpers.subjectById[subjectId];
                return `<span class="meta-pill subject" style="--subject-color:${subject.color}; --subject-soft:${subject.soft}">${helpers.escapeHtml(subject.label)}</span>`;
              }).join("")}
            </div>
                <div class="options-grid answer-options-grid">
              ${question.options.map((option, index) => {
                let classes = "option-button";
                if (active.revealed) {
                  if (index === question.answerIndex) {
                    classes += " correct";
                  } else if (index === active.selectedIndex) {
                    classes += " wrong";
                  }
                  classes += " disabled";
                }
                return `
                  <button class="${classes}" data-jeopardy-option="${index}" ${!canAnswer || active.revealed ? "disabled" : ""}>
                    ${helpers.renderOptionToken(index)}
                    <span>${helpers.escapeHtml(option)}</span>
                  </button>
                `;
              }).join("")}
            </div>
            ${active.revealed ? `
              <article class="feedback-card ${active.correct ? "correct" : "wrong"}">
                ${helpers.renderCheckpointVisual(active.correct ? "success" : "fail")}
                <div>
                  <h3>${helpers.escapeHtml(active.correct ? `Checkpoint cleared, +${tile.value} to ${team.label}` : (active.timedOut ? `${team.label} missed the checkpoint on time` : `${team.label} went off track on this stop`))}</h3>
                  <p>${helpers.escapeHtml(question.explanation)}</p>
                  <div class="feedback-actions">
                    <button class="button primary" data-jeopardy-back ${!canClose ? "disabled" : ""}>${helpers.allTilesDone(experience.board) ? "Journey Summary" : "Return to the Board"}</button>
                  </div>
                </div>
              </article>
            ` : ""}
          </div>
        </div>
    `, "jeopardy", { showClose: false });
  }

  function renderSetup(experience, helpers) {
    const setupOptions = helpers.getSetupOptions();
    const playMode = experience.playMode || "solo";
    const live = helpers.live || {};
    const isMultiplayer = playMode === "multiplayer";
    const setupLocked = isMultiplayer && live.session && !live.isHost;
    const teamCountLocked = setupLocked || Boolean(live.session && live.players?.length > 1);
    const multiplayerLocked = !live.accessAllowed;

    const titleHtml = helpers.setupPanelTitleOptions?.hideSetupTitle ? "" : helpers.renderPanelTitle(
      "Alpacapardy",
      "Set the board, choose the teams, and launch the clue route.",
      `Guiding section: ${helpers.getTargetLabel()}`,
      helpers.setupPanelTitleOptions || {}
    );

    return `
      ${titleHtml}
      <div class="mode-shell">
        <article class="race-launch-panel card-panel alpacapardy-setup-card">
          <div class="setup-card-header">
            ${helpers.renderConfiguredMascotAsset(
              helpers.getGameplayAssetPath("launch", "jeopardy"),
              "wise",
              "medium",
              { alt: "Alpacapardy launch alpaca" }
            )}
            <div>
              <p class="challenge-label">Board setup</p>
              <h3>Choose the teams and build the four-category board.</h3>
            </div>
          </div>

          <div class="race-launch-pills">
            <span>One team chooses the next clue at a time.</span>
            <span>Correct answers score the clue value. Wrong turns or timeouts score nothing.</span>
            <span>After the clue resolves, the next team gets the route.</span>
          </div>

          ${helpers.showInlinePlayMode ? `<div class="setup-block">
            <strong>Play mode</strong>
            <p class="setup-helper">Solo keeps the current local game. Multiplayer creates or joins a live room.</p>
            <div class="setup-count-grid">
              <button
                class="setup-count-button ${playMode === "solo" ? "active" : ""}"
                type="button"
                data-jeopardy-play-mode="solo"
                ${live.session ? "disabled" : ""}
              >
                Solo
              </button>
              <button
                class="setup-count-button ${playMode === "multiplayer" ? "active" : ""}"
                type="button"
                data-jeopardy-play-mode="multiplayer"
                ${live.session || multiplayerLocked ? "disabled" : ""}
              >
                ${multiplayerLocked ? "Multiplayer · Available soon" : "Multiplayer"}
              </button>
            </div>
            ${multiplayerLocked ? `<p class="setup-helper">Available soon. Live multiplayer is currently limited to the admin test accounts.</p>` : ""}
          </div>` : ""}

          ${helpers.showInlinePlayMode && isMultiplayer ? renderLiveLobby(experience, helpers) : ""}

          <div class="setup-block">
            <strong>How many teams are playing?</strong>
            <div class="setup-count-grid">
              ${Array.from({ length: helpers.config.jeopardyMaxTeams - helpers.config.jeopardyMinTeams + 1 }, (_, offset) => {
                const count = helpers.config.jeopardyMinTeams + offset;
                return `
                  <button
                    class="setup-count-button ${experience.setupTeamCount === count ? "active" : ""}"
                    type="button"
                    data-jeopardy-set-teams="${count}"
                    ${teamCountLocked ? "disabled" : ""}
                  >
                    ${count} teams
                  </button>
                `;
              }).join("")}
            </div>
          </div>

          <div class="setup-block">
            <strong>Pick 4 ${helpers.escapeHtml(helpers.getLensCardPluralLabel(helpers.selectionLens))}</strong>
            <p class="setup-helper">${helpers.escapeHtml(experience.setupCategoryIds.length)} of 4 selected.</p>
            <div class="setup-option-grid race-target-grid">
              ${setupOptions.map((option) => `
                <button
                  class="setup-option-button race-target-button ${experience.setupCategoryIds.includes(option.id) ? "active" : ""}"
                  type="button"
                  data-jeopardy-toggle-category="${helpers.escapeHtml(option.id)}"
                  ${setupLocked ? "disabled" : ""}
                >
                  ${helpers.renderConfiguredMascotAsset(option.asset, option.mood, "small", {
                    alt: `${option.title} alpaca`
                  })}
                  <span>${helpers.escapeHtml(option.title)}</span>
                </button>
              `).join("")}
            </div>
          </div>

          <div class="panel-actions">
            ${helpers.showInlinePlayMode && isMultiplayer && live.session
              ? `<button class="button primary" data-jeopardy-live-start ${experience.setupCategoryIds.length !== helpers.config.jeopardyMinGroups || !live.canStart ? "disabled" : ""}>Start Live Board</button>`
              : `<button class="button primary" ${helpers.setupStartAttribute || "data-jeopardy-start"} ${experience.setupCategoryIds.length !== helpers.config.jeopardyMinGroups || (helpers.showInlinePlayMode && isMultiplayer) ? "disabled" : ""}>${helpers.escapeHtml(helpers.setupStartLabel || "En route")}</button>`}
          </div>
        </article>
      </div>
    `;
  }

  function renderLiveLobby(experience, helpers) {
    const live = helpers.live || {};
    const sessions = live.openSessions || [];
    const busy = live.status === "loading" || live.status === "joining" || live.status === "creating";

    if (!live.available) {
      return `
        <div class="live-lobby-panel">
          <strong>Multiplayer setup</strong>
          <p>Supabase live multiplayer is not configured yet on this build.</p>
        </div>
      `;
    }

    if (live.session) {
      return `
        <div class="live-lobby-panel">
          <div class="live-lobby-header">
            <div>
              <strong>Room ${helpers.escapeHtml(live.session.room_code || "")}</strong>
              <p>${helpers.escapeHtml(live.isHost ? "You are hosting. Choose the board, then start when players are ready." : "Waiting for the host to start the board.")}</p>
            </div>
            <button class="button secondary" type="button" data-jeopardy-live-leave>Leave room</button>
          </div>
          ${live.message ? `<p class="live-lobby-note">${helpers.escapeHtml(live.message)}</p>` : ""}
          ${live.error ? `<p class="live-lobby-error">${helpers.escapeHtml(live.error)}</p>` : ""}
        </div>
      `;
    }

    return `
      <div class="live-lobby-panel">
        <div class="live-lobby-header">
          <div>
            <strong>Awaiting games</strong>
            <p>Join an open Alpacapardy room, or create one as a guest/Alpaccount.</p>
          </div>
          <button class="button secondary" type="button" data-jeopardy-live-refresh ${busy ? "disabled" : ""}>Refresh</button>
        </div>
        ${live.message ? `<p class="live-lobby-note">${helpers.escapeHtml(live.message)}</p>` : ""}
        ${live.error ? `<p class="live-lobby-error">${helpers.escapeHtml(live.error)}</p>` : ""}
        <div class="panel-actions live-lobby-actions">
          <button class="button primary" type="button" data-jeopardy-live-create ${busy ? "disabled" : ""}>Create Live Room</button>
        </div>
        <div class="live-room-list">
          ${sessions.length ? sessions.map((session) => renderLiveRoomRow(session, helpers, busy)).join("") : `
            <p class="setup-helper">No open Alpacapardy rooms right now. Create one and it will appear here.</p>
          `}
        </div>
      </div>
    `;
  }

  function renderLiveRoomRow(session, helpers, busy) {
    const players = session.players || [];
    const playerCount = players.filter((player) => ["host", "player"].includes(player.role)).length;
    const maxPlayers = Number(session.max_players) || 2;
    const host = players.find((player) => player.role === "host");

    return `
      <article class="live-room-row">
        <div>
          <strong>${helpers.escapeHtml(session.room_code || "ROOM")}</strong>
          <span>Alpacapardy · waiting for ${Math.max(0, maxPlayers - playerCount)} alpaca${maxPlayers - playerCount === 1 ? "" : "s"}</span>
          <small>Host: ${helpers.escapeHtml(host?.display_name || "Guest host")} · ${playerCount}/${maxPlayers}</small>
        </div>
        <button class="button secondary" type="button" data-jeopardy-live-join="${helpers.escapeHtml(session.id)}" ${busy || playerCount >= maxPlayers ? "disabled" : ""}>Join</button>
      </article>
    `;
  }

  function renderLiveChat(experience, helpers) {
    const live = helpers.live || {};
    const messages = Array.isArray(experience.chat) ? experience.chat.slice(-8) : [];

    return `
      <aside class="live-chat-panel">
        <div class="live-lobby-header">
          <div>
            <strong>Live discussion</strong>
            <p>Only players in this room can see these messages.</p>
          </div>
        </div>
        <div class="live-chat-log" aria-live="polite">
          ${messages.length ? messages.map((message) => `
            <article class="live-chat-message ${message.userId === live.userId ? "self" : ""}">
              <strong>${helpers.escapeHtml(message.displayName || "Guest")}</strong>
              <span>${helpers.escapeHtml(message.message || "")}</span>
            </article>
          `).join("") : `<p class="setup-helper">No messages yet. Keep it friendly, alpacas.</p>`}
        </div>
        <form class="live-chat-form" data-jeopardy-live-chat-form>
          <input name="message" type="text" maxlength="300" autocomplete="off" placeholder="Message the room..." ${!live.canChat ? "disabled" : ""} />
          <button class="button secondary" type="submit" ${!live.canChat ? "disabled" : ""}>Send</button>
        </form>
      </aside>
    `;
  }

  function renderTeams(experience, helpers) {
    const standings = helpers.getStandings(experience.teams);
    const leader = standings[0];
    const controlsDisabled = Boolean(experience.active) || Boolean(helpers.live?.enabled);

    return `
      <div class="jeopardy-team-shell">
        <div class="jeopardy-team-grid">
          ${experience.teams.map((team, index) => `
            <button
              class="jeopardy-team-card ${index === experience.activeTeamIndex ? "active" : ""} ${team.id === leader.id ? "leader" : ""}"
              data-jeopardy-team="${index}"
              ${controlsDisabled ? "disabled" : ""}
            >
              <span class="team-label">${helpers.escapeHtml(team.label)}</span>
              <strong>${team.score}</strong>
              <span>${team.correct} correct · ${team.wrong} wrong</span>
            </button>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderCategoryHeader(label, helpers) {
    const lengthClass = label.length > 24 ? "compact" : label.length > 16 ? "tight" : "";
    const asset = helpers.getAssetValue(["boards", "alpacapardyCategoryHeader"]);
    const art = asset
      ? helpers.renderAssetImage(
        asset,
        `${label} category header`,
        "jeopardy-category-art",
        "jeopardy-category-art-image"
      )
      : "";

    return `
      <h3 class="jeopardy-category-heading">
        ${art}
        <span class="jeopardy-category-safe-area">
          <span class="jeopardy-category-label ${lengthClass}">${helpers.escapeHtml(label)}</span>
        </span>
      </h3>
    `;
  }

  function renderTileFace(tile, helpers) {
    const openAsset = helpers.getAssetValue(["boards", "alpacapardyTileOpen"]);
    const playedAsset = helpers.getAssetValue(["boards", "alpacapardyTilePlayed"]);
    const skin = tile.done ? playedAsset : openAsset;

    return `
      <span class="jeopardy-tile-face ${tile.done ? "done" : "open"}">
        ${skin ? helpers.renderAssetImage(
          skin,
          tile.done ? "Played tile skin" : "Open tile skin",
          "jeopardy-tile-art",
          "jeopardy-tile-art-image"
        ) : ""}
        ${!tile.done ? `
          <span class="jeopardy-tile-safe-area">
            <span class="jeopardy-tile-copy value">${helpers.escapeHtml(String(tile.value))}</span>
          </span>
        ` : ""}
      </span>
    `;
  }

  function renderResults(experience, helpers) {
    const standings = helpers.getStandings(experience.teams);
    const leader = standings[0];
    const runnerUp = standings[1];
    const tied = Boolean(runnerUp && runnerUp.score === leader.score && runnerUp.correct === leader.correct && runnerUp.wrong === leader.wrong);
    const timeoutCount = experience.answers.filter((answer) => answer.timedOut).length;
    const resultVisual = helpers.renderConfiguredMascotAsset(
      helpers.getResultAssetPath("jeopardy", "success"),
      "victory",
      "large",
      { alt: "Alpacapardy victory alpaca" }
    );

    return `
      ${helpers.renderPanelTitle("Board Cleared", "All clue stops completed.", `Board built from ${experience.board.length} ${helpers.getLensCardPluralLabel(helpers.selectionLens)} · ${experience.teams.length} teams`)}
      <article class="result-shell">
        ${helpers.renderExperienceCloseButton("result-close-button")}
        <div class="result-banner">
          <div class="result-visual">${resultVisual}</div>
          <div>
            <p class="challenge-label">${helpers.escapeHtml(tied ? "Shared lead" : "Leading team")}</p>
            <h2>${helpers.escapeHtml(tied ? `${leader.label} and ${runnerUp.label}` : leader.label)}</h2>
            <p>${helpers.escapeHtml(tied ? "The board ended level on both score and record." : `${leader.score} points with ${leader.correct} cleared stops.`)}</p>
          </div>
        </div>

        <div class="result-metrics">
          ${helpers.renderMetricCard("Final Score", String(leader.score))}
          ${helpers.renderMetricCard("Teams", String(experience.teams.length))}
          ${helpers.renderMetricCard("Board Cleared", String(helpers.countTiles(experience.board)))}
          ${helpers.renderMetricCard("Clock Losses", String(timeoutCount))}
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

        ${helpers.renderBreakdowns(experience.answers)}

        <div class="result-actions">
          <button class="button primary" data-replay-current>Take This Route Again</button>
        </div>
      </article>
    `;
  }

  window.WSC_ALPACAPARDY_RENDERER = Object.freeze({
    renderExperience,
    renderFocus,
    renderSetup,
    renderTeams,
    renderCategoryHeader,
    renderTileFace,
    renderResults
  });
}());
