(function initLegacyLiveRoomRenderer(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC legacy live room renderer missing function dependency: " + name);
    }
    return value;
  }

  function createLegacyLiveRoomRenderer(options = {}) {
    const {
      appState: state,
      appDomService,
      onlineModeController,
      documentRef = global.document,
      windowRef = global,
      constants = {},
      helpers = {},
      callbacks = {}
    } = options;

    if (!state) {
      throw new Error("WSC legacy live room renderer missing app state.");
    }
    if (!appDomService) {
      throw new Error("WSC legacy live room renderer missing app DOM service.");
    }
    if (!onlineModeController) {
      throw new Error("WSC legacy live room renderer missing online mode controller.");
    }

    const document = documentRef;
    const window = windowRef;
    const LIVE_GAME_TYPES = constants.LIVE_GAME_TYPES || {};
    const LIVE_GAME_ORDER = constants.LIVE_GAME_ORDER || [];
    const LIVE_ALPACA_COLORS = constants.LIVE_ALPACA_COLORS || [];
    const GAME_CONFIG = constants.GAME_CONFIG || {};
    const ALPACA_RUN_ROUTE = constants.ALPACA_RUN_ROUTE || [];
    const syncActiveModalFocus = requiredFunction(callbacks, "syncActiveModalFocus");
    const escapeHtml = requiredFunction(helpers, "escapeHtml");
    const canAccessLegacyLiveRooms = requiredFunction(helpers, "canAccessLegacyLiveRooms");
    const getLegacyLiveRoomsDisabledMessage = requiredFunction(helpers, "getLegacyLiveRoomsDisabledMessage");
    const getAlpacapardyLiveIdentityContext = requiredFunction(helpers, "getAlpacapardyLiveIdentityContext");
    const getAlpacapardyLiveRenderContext = requiredFunction(helpers, "getAlpacapardyLiveRenderContext");
    const normalizeLiveGameType = requiredFunction(helpers, "normalizeLiveGameType");
    const getCurrentLiveGameType = requiredFunction(helpers, "getCurrentLiveGameType");
    const getLiveGameLabel = requiredFunction(helpers, "getLiveGameLabel");
    const getLivePlayablePlayers = requiredFunction(helpers, "getLivePlayablePlayers");
    const getAssetValue = requiredFunction(helpers, "getAssetValue");
    const getWizardCardAsset = requiredFunction(helpers, "getWizardCardAsset");
    const renderConfiguredMascotAsset = requiredFunction(helpers, "renderConfiguredMascotAsset");
    const renderJeopardyExperience = requiredFunction(helpers, "renderJeopardyExperience");
    const renderJeopardySetup = requiredFunction(helpers, "renderJeopardySetup");
    const canStartSelectedLiveGame = requiredFunction(helpers, "canStartSelectedLiveGame");
    const getLiveWaitingVideos = requiredFunction(helpers, "getLiveWaitingVideos");
    const getLiveWaitingVideoIndex = requiredFunction(helpers, "getLiveWaitingVideoIndex");
    const getEmbeddableVideo = requiredFunction(helpers, "getEmbeddableVideo");
    const getVideoPreview = requiredFunction(helpers, "getVideoPreview");
    const getAlpacaChannelDomain = requiredFunction(helpers, "getAlpacaChannelDomain");
    const normalizeVideoUrl = requiredFunction(helpers, "normalizeVideoUrl");
    const getModeAssetPath = requiredFunction(helpers, "getModeAssetPath");
    const getArcadeState = requiredFunction(helpers, "getArcadeState");
    const getLiveRunSetupColorId = requiredFunction(helpers, "getLiveRunSetupColorId");
    const renderRunMapBackground = requiredFunction(helpers, "renderRunMapBackground");
    const renderRunMapStop = requiredFunction(helpers, "renderRunMapStop");
    const getRunMapTop = requiredFunction(helpers, "getRunMapTop");
    const renderOptionToken = requiredFunction(helpers, "renderOptionToken");
    const getArcadeLeaderboard = requiredFunction(helpers, "getArcadeLeaderboard");
    const renderRaceLivesIcon = requiredFunction(helpers, "renderRaceLivesIcon");

function renderAlpacaOnlineHub() {
  if (!canAccessLegacyLiveRooms()) {
    return renderLegacyLiveRoomsDisabled();
  }

  const busy = ["loading", "joining", "creating", "starting"].includes(state.live.status);
  const currentSession = state.live.currentSession;
  const roster = getAlpacaOnlineRoster();
  const roomPlayers = state.live.players || [];
  const isHost = getAlpacapardyLiveIdentityContext().isHost;
  const canStart = getAlpacapardyLiveRenderContext().canStart;
  const onGamePage = Boolean(currentSession || state.live.onlineView === "game");

  return `
    <section class="online-hub-shell ${onGamePage ? "online-hub-shell-game" : "online-hub-shell-home"}">
      <aside class="online-hub-column online-hub-left">
        ${renderOnlineLiveSidebar({ busy, currentSession, roomPlayers, roster })}
      </aside>

      <main class="online-hub-main ${onGamePage ? "" : "online-hub-main-wide"}">
        ${onGamePage
          ? renderOnlineCreateGamePanel({ currentSession, roomPlayers, isHost, canStart, busy })
          : renderOnlineHomeGameGrid()}
      </main>
    </section>
  `;
}

function renderLegacyLiveRoomsDisabled() {
  return `
    <section class="online-hub-shell online-hub-shell-home">
      <main class="online-hub-main online-hub-main-wide">
        <article class="online-hub-card online-feature-card online-create-game-panel">
          <div class="online-create-heading">
            <div class="online-create-title-copy">
              <p class="challenge-label">Legacy live game rooms</p>
              <h2>Disabled for public review</h2>
            </div>
          </div>
          <p class="setup-helper">${escapeHtml(getLegacyLiveRoomsDisabledMessage())}</p>
          <p class="setup-helper">Use 3D Campus Preview for the public online path. Live rooms need separate RPC, RLS, persistence, and moderation review before they are reopened.</p>
          <div class="panel-actions">
            <button class="button primary" type="button" data-open-alpaca-online-campus>${escapeHtml(onlineModeController.getCampusPreviewActionLabel())}</button>
            <button class="button secondary" type="button" data-online-back-local>Study solo</button>
          </div>
        </article>
      </main>
    </section>
  `;
}

function getLiveOverlayRenderContext() {
  const busy = ["loading", "joining", "creating", "starting"].includes(state.live.status);
  const currentSession = state.live.currentSession;
  const roomPlayers = state.live.players || [];
  const isHost = getAlpacapardyLiveIdentityContext().isHost;
  const canStart = getAlpacapardyLiveRenderContext().canStart;
  return { currentSession, roomPlayers, isHost, canStart, busy };
}

function getLiveOverlayMount() {
  return appDomService.ensureBodyMount({ documentRef: document, id: "liveOverlayMount" });
}

function renderLiveOverlayMount() {
  const mount = getLiveOverlayMount();
  const html = state.ui.appShellMode === "online"
    ? renderLiveOverlayLayer(getLiveOverlayRenderContext())
    : "";

  if (!html) {
    appDomService.clearHtml(mount);
    syncActiveModalFocus();
    return;
  }

  const nextOverlay = appDomService.parseFirstElement(html, document);
  if (!nextOverlay) {
    appDomService.clearHtml(mount);
    syncActiveModalFocus();
    return;
  }

  const currentOverlay = mount.firstElementChild;
  if (canPatchLiveWaitingOverlay(currentOverlay, nextOverlay)) {
    patchLiveWaitingOverlay(currentOverlay, nextOverlay);
    syncActiveModalFocus();
    return;
  }

  appDomService.replaceChildren(mount, nextOverlay);
  syncActiveModalFocus();
}

function canPatchLiveWaitingOverlay(currentOverlay, nextOverlay) {
  if (!currentOverlay || !nextOverlay) {
    return false;
  }
  if (!currentOverlay.classList.contains("live-waiting-overlay") || !nextOverlay.classList.contains("live-waiting-overlay")) {
    return false;
  }
  if (currentOverlay.dataset.liveWaitingSessionId !== nextOverlay.dataset.liveWaitingSessionId) {
    return false;
  }
  const currentVideoKey = currentOverlay.querySelector("[data-live-waiting-video-card]")?.dataset.liveWaitingVideoKey || "";
  const nextVideoKey = nextOverlay.querySelector("[data-live-waiting-video-card]")?.dataset.liveWaitingVideoKey || "";
  return Boolean(currentVideoKey && currentVideoKey === nextVideoKey);
}

function patchLiveWaitingOverlay(currentOverlay, nextOverlay) {
  const overlayScrollTop = currentOverlay.scrollTop;
  replaceLiveWaitingPart(currentOverlay, nextOverlay, ".live-waiting-top");
  replaceLiveWaitingPart(currentOverlay, nextOverlay, ".live-player-grid");
  replaceLiveWaitingPart(currentOverlay, nextOverlay, ".live-color-picker", ".live-waiting-channel");
  replaceLiveWaitingPart(currentOverlay, nextOverlay, ".live-waiting-actions");
  currentOverlay.scrollTop = overlayScrollTop;
  window.requestAnimationFrame(() => {
    currentOverlay.scrollTop = overlayScrollTop;
  });
}

function replaceLiveWaitingPart(currentOverlay, nextOverlay, selector, beforeSelector = null) {
  const currentPart = currentOverlay.querySelector(selector);
  const nextPart = nextOverlay.querySelector(selector);
  if (currentPart && nextPart) {
    currentPart.replaceWith(nextPart);
    return;
  }
  if (currentPart && !nextPart) {
    currentPart.remove();
    return;
  }
  if (!currentPart && nextPart) {
    const waitingWindow = currentOverlay.querySelector(".live-waiting-window");
    const beforeNode = beforeSelector ? currentOverlay.querySelector(beforeSelector) : null;
    if (waitingWindow) {
      waitingWindow.insertBefore(nextPart, beforeNode || null);
    }
  }
}

function renderOnlineLiveSidebar({ busy, currentSession, roomPlayers, roster }) {
  const connectedCount = getAlpacaOnlineConnectedCount(roster);
  return `
    <div class="online-hub-card online-live-sidebar-card">
      <p class="online-connected-count">Alpacas connected: ${connectedCount}</p>
      <p class="challenge-label">Live game</p>
      ${renderOnlineJoinForm(busy || Boolean(currentSession))}
      ${currentSession ? renderOnlineCurrentGameSummary(currentSession, roomPlayers) : ""}
      ${renderOnlineOpenRoomsList(busy || Boolean(currentSession))}
    </div>
  `;
}

function renderOnlineCurrentGameSummary(currentSession, roomPlayers) {
  const gameType = normalizeLiveGameType(currentSession.game_type);
  const game = LIVE_GAME_TYPES[gameType] || LIVE_GAME_TYPES.alpacapardy;
  const players = getLivePlayablePlayers(roomPlayers);
  return `
    <article class="online-current-room">
      <div>
        <strong>${escapeHtml(game.label)}</strong>
        <span>${escapeHtml(currentSession.status || "lobby")} session</span>
        <small>Room ${escapeHtml(currentSession.room_code || "ROOM")} · ${players.length}/${Number(currentSession.max_players) || game.maxPlayers} alpacas</small>
      </div>
    </article>
  `;
}

function getAlpacaOnlineConnectedCount(roster) {
  return Array.isArray(roster) ? roster.length : 0;
}

function renderOnlineJoinForm(busy) {
  return `
    <form class="online-join-form compact" data-online-join-code-form>
      <input
        name="room_code"
        type="text"
        maxlength="12"
        autocomplete="off"
        placeholder="Room code"
        value="${escapeHtml(state.live.joinCodeDraft || "")}"
        data-online-room-code-input
        ${busy ? "disabled" : ""}
      />
      <button class="button secondary" type="submit" ${busy ? "disabled" : ""}>Join</button>
    </form>
  `;
}

function renderOnlineOpenRoomsList(busy) {
  const roomsByGame = getOpenLiveRoomsByGame(state.live.openSessions || []);
  const roomCount = Object.values(roomsByGame).reduce((sum, rooms) => sum + rooms.length, 0);

  if (!roomCount) {
    return `<p class="online-room-empty">No open rooms yet.</p>`;
  }

  return `
    <div class="online-room-list-compact">
      ${LIVE_GAME_ORDER.map((gameType) => {
        const rooms = roomsByGame[gameType] || [];
        if (!rooms.length) {
          return "";
        }
        return `
          <section class="online-room-game-group">
            <h4>${escapeHtml(getLiveGameLabel(gameType))}</h4>
            ${rooms.map((room) => renderOnlineRoomListItem(room, busy)).join("")}
          </section>
        `;
      }).join("")}
    </div>
  `;
}

function renderOnlineCreateGamePanel({ currentSession, roomPlayers, isHost, canStart, busy }) {
  const currentGameType = getCurrentLiveGameType();
  return `
    <article class="online-hub-card online-feature-card online-create-game-panel">
      <div class="online-create-heading">
        <div class="online-create-title-copy">
          <p class="challenge-label">${currentSession ? "Live room" : "Create a game"}</p>
          <h2>${escapeHtml(getLiveGameLabel(currentGameType))}</h2>
        </div>
        ${currentSession ? "" : `<button class="button secondary small online-return-hub-button" type="button" data-online-return-hub>Return to hub</button>`}
      </div>
      ${state.live.error ? `<p class="live-lobby-error">${escapeHtml(state.live.error)}</p>` : ""}
      ${renderSelectedOnlineGameBody({ currentSession, roomPlayers, isHost, canStart, busy })}
    </article>
  `;
}

function renderOnlineHomeGameGrid() {
  return `
    <section class="online-home-game-board">
      <div class="online-home-heading">
        <p class="challenge-label">Choose a live game</p>
        <h2>Alpaca Online</h2>
      </div>
      <div class="online-home-game-grid">
        ${LIVE_GAME_ORDER.map((gameType) => renderOnlineHomeGameCard(gameType)).join("")}
      </div>
    </section>
  `;
}

function renderOnlineHomeGameCard(gameType) {
  const game = LIVE_GAME_TYPES[gameType];
  const asset = getAssetValue(["contexts", "modes", game.modeId]);
  const openRoomCount = getOpenRoomsForGame(gameType).length;
  return `
    <button class="online-mode-card online-glow-card" type="button" data-online-game-choice="${escapeHtml(gameType)}">
      <span class="online-card-container noselect">
        <span class="online-card-canvas">
          ${Array.from({ length: 9 }, (_, index) => `<span class="tracker tr-${index + 1}" aria-hidden="true"></span>`).join("")}
          <span class="online-card-frame">
            <span class="card-content">
              <span class="card-glare" aria-hidden="true"></span>
              <span class="cyber-lines" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
              </span>
              <span class="online-card-prompt">LIVE ROUTE</span>
              <span class="online-card-art">
                ${renderConfiguredMascotAsset(
                  getWizardCardAsset(asset),
                  gameType === "quiz" || gameType === "alpaquiz" ? "excited" : "determined",
                  "small",
                  {
                    alt: `${game.label} alpaca`,
                    slotClass: "online-card-image-slot",
                    imageClass: "online-card-image"
                  }
                )}
              </span>
              <span class="title">${escapeHtml(game.label)}</span>
              <span class="glowing-elements" aria-hidden="true">
                <span class="glow-1"></span>
                <span class="glow-2"></span>
                <span class="glow-3"></span>
              </span>
              <span class="subtitle">
                <span>${escapeHtml(getOnlineGameCardDescription(gameType))}</span>
                <span class="highlight">${openRoomCount} open ${openRoomCount === 1 ? "room" : "rooms"}</span>
              </span>
              <span class="card-particles" aria-hidden="true">
                <span></span><span></span><span></span><span></span><span></span><span></span>
              </span>
              <span class="corner-elements" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
              </span>
              <span class="scan-line" aria-hidden="true"></span>
            </span>
          </span>
        </span>
      </span>
    </button>
  `;
}

function getOnlineGameCardDescription(gameType) {
  const descriptions = {
    alpacapardy: "Shared clue board, team strategy, and quick answers.",
    run: "Two alpacas race across the map toward Yale.",
    quiz: "Timed live questions with a fast leaderboard.",
    race: "Sudden-death survival with lives on the line.",
    alpaquiz: "Buzz first, answer fast, and control the turn."
  };

  return descriptions[gameType] || "Create a live alpaca game room.";
}

function renderSelectedOnlineGameBody({ currentSession, roomPlayers, isHost, canStart, busy }) {
  const gameType = getCurrentLiveGameType();
  if (gameType === "alpacapardy") {
    if (!currentSession) {
      return renderOnlineAlpacapardySetup();
    }
    if (currentSession.status === "playing" || state.experience?.started) {
      return renderOnlineAlpacapardyLiveGame();
    }
    return renderOnlineWaitingPopup({ currentSession, roomPlayers, isHost, canStart, busy });
  }

  if (!currentSession) {
    return renderOnlineArcadeSetup(gameType, busy);
  }

  if (currentSession.status === "lobby") {
    return renderOnlineArcadeWaitingRoom({ currentSession, roomPlayers, isHost, busy });
  }

  return renderOnlineArcadeGame({ currentSession, roomPlayers, isHost, busy });
}

function renderOnlineAlpacapardyLiveGame() {
  if (!state.experience?.started) {
    return `
      <div class="online-waiting-popup" role="status">
        <h3>Loading Alpacapardy board</h3>
        <p>The live room has started. Syncing the board now.</p>
      </div>
    `;
  }

  return `<div class="online-alpacapardy-live-board">${renderJeopardyExperience()}</div>`;
}

function renderOnlineArcadeSetup(gameType, busy) {
  const game = LIVE_GAME_TYPES[gameType] || LIVE_GAME_TYPES.run;
  const rules = {
    run: "2 players. Each alpaca gets different all-theme questions and races across the shared progress map.",
    quiz: "2-4 players. Kahoot-style shared questions, timed answers, and a leaderboard after every question.",
    race: "2 players. Sudden death, 3 lives each, one alpaca answers per turn.",
    alpaquiz: "2-4 players. Everyone sees the same all-theme question. First buzz controls the answer."
  };

  return `
    <section class="online-arcade-setup">
      <p>${escapeHtml(rules[gameType] || "Create a live game room.")}</p>
      <div class="race-launch-pills">
        <span>${game.minPlayers}-${game.maxPlayers} alpacas</span>
        <span>All themes</span>
        <span>Live room code</span>
      </div>
      ${gameType === "run" ? renderLiveRunSetupColorPicker() : ""}
      <div class="panel-actions">
        <button class="button primary" type="button" data-live-create-game ${busy ? "disabled" : ""}>Create ${escapeHtml(game.label)}</button>
      </div>
    </section>
  `;
}

function renderOnlineAlpacapardySetup() {
  if (!state.experience || state.experience.type !== "jeopardy") {
    return `<p class="online-muted">Alpacapardy setup is loading.</p>`;
  }

  return `
    <div class="online-alpacapardy-setup">
      ${renderJeopardySetup(state.experience)}
    </div>
  `;
}

function renderOnlineWaitingPopup({ currentSession, roomPlayers, isHost, canStart, busy }) {
  return `
    <div class="online-waiting-popup" role="status">
      <div>
        <p class="challenge-label">Room ${escapeHtml(currentSession.room_code || "ROOM")}</p>
        <h3>Waiting for alpacas to join</h3>
        <p>${escapeHtml(isHost ? "You are hosting. Share the room code, then start when enough alpacas arrive." : "Waiting for the host to start the game.")}</p>
      </div>
      <div class="panel-actions">
        <button class="button primary" type="button" data-jeopardy-live-start ${!canStart || busy ? "disabled" : ""}>Start Alpacapardy</button>
        <button class="button secondary" type="button" data-jeopardy-live-leave>Cancel the game</button>
      </div>
    </div>
  `;
}

function renderOnlineArcadeWaitingRoom({ currentSession, roomPlayers, isHost, busy }) {
  const gameType = getCurrentLiveGameType();
  const game = LIVE_GAME_TYPES[gameType] || LIVE_GAME_TYPES.run;
  const canStart = canStartSelectedLiveGame();

  return `
    <div class="online-waiting-popup" role="status">
      <div>
        <p class="challenge-label">Room ${escapeHtml(currentSession.room_code || "ROOM")}</p>
        <h3>Waiting for alpacas to join</h3>
        <p>${escapeHtml(isHost ? `You are hosting ${game.label}. Share the room code, then start when enough alpacas arrive.` : `Waiting for the host to start ${game.label}.`)}</p>
      </div>
      <div class="panel-actions">
        ${isHost ? `<button class="button primary" type="button" data-live-start-game ${!canStart || busy ? "disabled" : ""}>Start ${escapeHtml(game.label)}</button>` : ""}
        <button class="button secondary" type="button" data-jeopardy-live-leave>Cancel the game</button>
      </div>
    </div>
  `;
}

function renderLiveOverlayLayer({ currentSession, roomPlayers, isHost, canStart, busy }) {
  if (state.live.launchCountdownText) {
    return renderLiveLaunchCountdownOverlay();
  }

  if (!currentSession || currentSession.status !== "lobby") {
    return "";
  }

  return renderLiveWaitingOverlay({ currentSession, roomPlayers, isHost, canStart, busy });
}

function renderLiveLaunchCountdownOverlay() {
  return `
    <div class="live-launch-overlay" role="status" aria-live="assertive">
      <div class="live-launch-number">${escapeHtml(state.live.launchCountdownText)}</div>
    </div>
  `;
}

function renderLiveWaitingOverlay({ currentSession, roomPlayers, isHost, canStart, busy }) {
  const gameType = normalizeLiveGameType(currentSession.game_type);
  const game = LIVE_GAME_TYPES[gameType] || LIVE_GAME_TYPES.alpacapardy;
  const players = getLivePlayablePlayers(roomPlayers);
  const waitingVideos = getLiveWaitingVideos(currentSession.id);
  const launchCopy = canStart
    ? "Enough alpacas are here. Launching automatically..."
    : `Waiting for ${Math.max(0, game.minPlayers - players.length)} more alpaca${game.minPlayers - players.length === 1 ? "" : "s"}.`;

  return `
    <div
      class="live-waiting-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Waiting for alpacas"
      data-live-waiting-session-id="${escapeHtml(currentSession.id || "")}"
    >
      <article class="live-waiting-window">
        <div class="live-waiting-top">
          <p class="challenge-label">Room ${escapeHtml(currentSession.room_code || "ROOM")}</p>
          <h2>Waiting for alpacas to join</h2>
          <p>${escapeHtml(`${game.label} · ${players.length}/${Number(currentSession.max_players) || game.maxPlayers} alpacas connected. ${launchCopy}`)}</p>
        </div>
        ${renderLiveWaitingVideoRail(waitingVideos)}
        <div class="panel-actions live-waiting-actions">
          ${isHost && gameType === "alpacapardy" ? `<button class="button primary" type="button" data-jeopardy-live-start ${!canStart || busy ? "disabled" : ""}>Start now</button>` : ""}
          ${isHost && gameType !== "alpacapardy" ? `<button class="button primary" type="button" data-live-start-game ${!canStart || busy ? "disabled" : ""}>Start now</button>` : ""}
          <button class="button secondary" type="button" data-jeopardy-live-leave>Cancel the game</button>
        </div>
      </article>
    </div>
  `;
}

function renderLiveWaitingVideoRail(videos) {
  if (!videos.length) {
    return "";
  }

  const currentIndex = getLiveWaitingVideoIndex(videos);
  const current = videos[currentIndex];
  const previous = videos[(currentIndex - 1 + videos.length) % videos.length];
  const next = videos[(currentIndex + 1) % videos.length];
  const embeddedVideo = getEmbeddableVideo(current.url);
  const videoPreview = getVideoPreview(current.url);
  const canEmbedVideo = Boolean(embeddedVideo) && !window.WSC_DESKTOP_APP;
  const singleVideo = videos.length <= 1;
  const channelDomain = getAlpacaChannelDomain(current.sectionTitle || current.sectionTitles?.[0] || getLiveGameLabel());
  const description = current.description || current.verdict || current.channel || "Short Alpaca Channel video while the room fills.";
  const videoKey = normalizeVideoUrl(current.url);

  return `
    <section class="live-waiting-channel channel-shell">
      <article
        class="channel-browser live-waiting-channel-browser"
        aria-label="Alpaca Channel while you wait"
        data-live-waiting-video-card
        data-live-waiting-video-key="${escapeHtml(videoKey)}"
      >
        <div class="channel-browser-bar">
          <div class="channel-window-dots" aria-hidden="true">
            <span></span><span></span><span></span>
          </div>
          <div class="channel-address-pill">
            <span>${escapeHtml(channelDomain)}</span>
          </div>
        </div>
        <div class="channel-youtube-copy">
          <div class="channel-brand-row">
            ${renderConfiguredMascotAsset(getModeAssetPath("channel"), "excited", "small", {
              alt: "Alpaca Channel logo",
              slotClass: "channel-brand-icon-slot",
              imageClass: "channel-brand-icon"
            })}
            <span>Alpaca Channel while you wait</span>
          </div>
          <h2>${escapeHtml(current.title || "Alpaca Channel video")}</h2>
        </div>
        <div class="channel-video-frame">
          ${canEmbedVideo ? `
            <iframe
              class="channel-video-iframe"
              src="${escapeHtml(embeddedVideo.embedUrl)}"
              title="${escapeHtml(current.title || "Alpaca Channel video")}"
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
            <a class="channel-open-link" href="${escapeHtml(current.url)}" target="_blank" rel="noreferrer">Open on YouTube</a>
          ` : videoPreview ? `
            <a class="channel-video-fallback" href="${escapeHtml(current.url)}" target="_blank" rel="noreferrer">
              <img src="${escapeHtml(videoPreview.thumbnailUrl)}" alt="${escapeHtml(current.title || "Alpaca Channel video")}" loading="lazy" referrerpolicy="no-referrer" />
              <span>Open video</span>
            </a>
          ` : `
            <a class="channel-video-fallback no-thumb" href="${escapeHtml(current.url)}" target="_blank" rel="noreferrer">
              <span>Open video</span>
            </a>
          `}
        </div>
        <div class="channel-description">
          <h3>Description</h3>
          <p>${escapeHtml(description)}</p>
        </div>
        <div class="channel-video-count">${currentIndex + 1} / ${videos.length}</div>
      </article>
      <div class="channel-actions live-waiting-channel-actions">
        <button class="button secondary" type="button" data-live-waiting-video-nav="prev" ${singleVideo ? "disabled" : ""}>
          <span>Previous</span>
          <small>${escapeHtml(previous.title || "Video")}</small>
        </button>
        <button class="button primary" type="button" data-live-waiting-video-nav="next" ${singleVideo ? "disabled" : ""}>
          <span>Next</span>
          <small>${escapeHtml(next.title || "Video")}</small>
        </button>
      </div>
    </section>
  `;
}

function renderOnlineArcadeGame({ currentSession, roomPlayers, isHost }) {
  const gameType = getCurrentLiveGameType();
  const arcadeState = getArcadeState(gameType);
  if (!arcadeState.started) {
    return renderOnlineArcadeWaitingRoom({ currentSession, roomPlayers, isHost, busy: false });
  }

  if (gameType === "run") {
    return renderLiveRunGame(arcadeState, roomPlayers);
  }
  if (gameType === "quiz") {
    return renderLiveQuizGame(arcadeState, roomPlayers, isHost);
  }
  if (gameType === "race") {
    return renderLiveRaceGame(arcadeState, roomPlayers);
  }
  if (gameType === "alpaquiz") {
    return renderLiveAlpaquizGame(arcadeState, roomPlayers, isHost);
  }

  return `<p class="online-muted">This live game is loading.</p>`;
}

function renderLivePlayerCard(player) {
  return `
    <article class="live-player-card ${player.user_id === state.auth.session?.user?.id ? "self" : ""}">
      <span>${escapeHtml(player.role === "host" ? "Host" : `Team ${Number(player.team_index) + 1}`)}</span>
      <strong>${escapeHtml(player.display_name)}</strong>
      <small>${escapeHtml(player.is_guest ? "Guest" : "Alpaccount")} · ${escapeHtml(player.connection_status || "online")}</small>
    </article>
  `;
}

function renderLiveRunSetupColorPicker() {
  const selectedColor = getLiveRunSetupColorId();

  return `
    <section class="live-color-picker live-run-setup-color-picker" aria-label="Choose your Alpaca Run color">
      <strong>Choose your alpaca color</strong>
      <div class="live-color-grid">
        ${LIVE_ALPACA_COLORS.map((color) => {
          const selected = color.id === selectedColor;
          return `
            <button
              class="live-color-chip ${selected ? "active" : ""}"
              type="button"
              data-live-run-setup-color="${escapeHtml(color.id)}"
              aria-pressed="${selected ? "true" : "false"}"
              title="${escapeHtml(color.label)}"
            >
              ${renderLiveRunAlpacaToken(color.id, "small")}
              <span>${escapeHtml(color.label)}</span>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderLiveRunColorPicker(roomPlayers) {
  const arcadeState = getArcadeState("run");
  const colorsByUserId = arcadeState.colorsByUserId || {};
  const usedColors = new Set(Object.values(colorsByUserId));
  const userId = state.auth.session?.user?.id || "";

  return `
    <section class="live-color-picker">
      <strong>Choose your alpaca color</strong>
      <div class="live-color-grid">
        ${LIVE_ALPACA_COLORS.map((color) => {
          const owner = roomPlayers.find((player) => colorsByUserId[player.user_id] === color.id);
          const selected = colorsByUserId[userId] === color.id;
          const disabled = Boolean(owner && owner.user_id !== userId);
          return `
            <button
              class="live-color-chip ${selected ? "active" : ""}"
              type="button"
              data-live-color-select="${escapeHtml(color.id)}"
              ${disabled ? "disabled" : ""}
              title="${escapeHtml(disabled ? `${owner.display_name} chose ${color.label}` : color.label)}"
            >
              ${renderLiveRunAlpacaToken(color.id, "small")}
              <span>${escapeHtml(color.label)}</span>
            </button>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderLiveRunGame(arcadeState, roomPlayers) {
  const userId = state.auth.session?.user?.id || "";
  const players = getLivePlayablePlayers(roomPlayers).slice(0, 2);
  const selfPlayer = players.find((player) => player.user_id === userId) || players[0] || null;

  return `
    <section class="live-run-shell">
      ${renderLiveRunMap(arcadeState, players)}
      <div class="live-run-player-area">
        ${selfPlayer ? renderLiveRunPlayerPanel(selfPlayer, arcadeState) : `<p class="online-muted">Waiting for your alpaca profile.</p>`}
        <div class="live-run-opponent-status">
          ${players.filter((player) => player.user_id !== userId).map((player) => {
            const playerProgress = arcadeState.progress?.[player.user_id] || {};
            const colorId = arcadeState.colorsByUserId?.[player.user_id] || "cream";
            return `
              <article>
                ${renderLiveRunAlpacaToken(colorId, "small")}
                <div>
                  <strong>${escapeHtml(player.display_name)}</strong>
                  <span>${getLiveRunRouteIndex(playerProgress)} / ${ALPACA_RUN_ROUTE.length - 1} stops</span>
                </div>
              </article>
            `;
          }).join("") || `<p class="online-muted">Waiting for the other alpaca.</p>`}
        </div>
      </div>
    </section>
  `;
}

function renderLiveRunMap(arcadeState, players) {
  const progress = arcadeState.progress || {};
  const routeIndexes = players.map((player) => getLiveRunRouteIndex(progress[player.user_id] || {}));
  const currentIndex = Math.max(0, ...routeIndexes);

  return `
    <div class="run-map-stage live-run-map-stage">
      ${renderRunMapBackground()}
      ${ALPACA_RUN_ROUTE.map((stop, index) => renderRunMapStop(stop, index, currentIndex)).join("")}
      ${players.map((player, index) => {
        const playerProgress = progress[player.user_id] || {};
        const routeIndex = getLiveRunRouteIndex(playerProgress);
        const stop = ALPACA_RUN_ROUTE[routeIndex] || ALPACA_RUN_ROUTE[0];
        const colorId = arcadeState.colorsByUserId?.[player.user_id] || "cream";
        const offset = index === 0 ? -18 : 18;
        return `
          <div
            class="run-travel-marker live-run-player-marker"
            style="left:${stop.x}%; top:${getRunMapTop(stop)}; --live-run-offset:${offset}px;"
          >
            ${renderLiveRunAlpacaToken(colorId, "map")}
            <span>${escapeHtml(player.display_name)}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function getLiveRunRouteIndex(playerProgress) {
  const stage = Math.max(0, Number(playerProgress.stage) || 0);
  const maxLiveStage = Math.max(1, GAME_CONFIG.runRegionalLevelOneCount);
  const maxRouteIndex = Math.max(0, ALPACA_RUN_ROUTE.length - 1);
  return Math.min(maxRouteIndex, Math.round((stage / maxLiveStage) * maxRouteIndex));
}

function renderLiveRunPlayerPanel(player, arcadeState) {
  const playerProgress = arcadeState.progress?.[player.user_id] || {};
  const questions = arcadeState.questionsByUserId?.[player.user_id] || [];
  const index = Number(playerProgress.index) || 0;
  const question = questions[index] || null;
  const answered = Boolean(playerProgress.revealed);
  const selectedIndex = playerProgress.selectedIndex;

  return `
    <article class="live-question-panel self">
      <div class="live-question-head">
        <strong>${escapeHtml(player.display_name)}</strong>
        <span>${getLiveRunRouteIndex(playerProgress)} stops cleared</span>
      </div>
      ${question ? `
        <h3>${escapeHtml(question.prompt)}</h3>
        <div class="raw-quiz-options">
          ${question.options.map((option, optionIndex) => {
            let classes = "raw-quiz-option option-button";
            if (answered) {
              if (optionIndex === question.answerIndex) {
                classes += " correct";
              } else if (optionIndex === selectedIndex) {
                classes += " wrong";
              }
              classes += " disabled";
            }
            return `
              <button class="${classes}" type="button" data-live-answer="${optionIndex}" ${answered || arcadeState.finished ? "disabled" : ""}>
                ${renderOptionToken(optionIndex)}
                <span>${escapeHtml(option)}</span>
              </button>
            `;
          }).join("")}
        </div>
        ${answered ? `<button class="button primary small" type="button" data-live-next>Continue</button>` : ""}
      ` : `<p class="online-muted">${arcadeState.finished ? "Finished." : "Waiting for the next question."}</p>`}
    </article>
  `;
}

function renderLiveQuizGame(arcadeState, roomPlayers, isHost) {
  const players = getLivePlayablePlayers(roomPlayers);
  const question = arcadeState.questions?.[arcadeState.questionIndex] || null;
  const revealed = arcadeState.revealed || arcadeState.finished;
  const answers = arcadeState.answers?.[arcadeState.questionIndex] || {};
  const userAnswer = answers[state.auth.session?.user?.id || ""];
  const leaderboard = getArcadeLeaderboard(arcadeState, players);
  const remaining = Math.max(0, Number(arcadeState.revealAt || 0) - Date.now());
  const secondsLeft = Math.ceil(remaining / 1000);

  return `
    <section class="live-kahoot-shell">
      <div class="live-kahoot-question">
        <p class="challenge-label">Question ${arcadeState.questionIndex + 1}/${arcadeState.questions.length}</p>
        <h3>${escapeHtml(question?.prompt || "Loading question...")}</h3>
        <strong class="live-timer-pill">${revealed ? "Answers locked" : `${secondsLeft}s`}</strong>
      </div>
      ${question ? `
        <div class="live-kahoot-options">
          ${question.options.map((option, optionIndex) => `
            <button
              class="live-kahoot-option ${userAnswer?.optionIndex === optionIndex ? "active" : ""} ${revealed && optionIndex === question.answerIndex ? "correct" : ""}"
              type="button"
              data-live-answer="${optionIndex}"
              ${revealed || userAnswer ? "disabled" : ""}
            >
              ${renderOptionToken(optionIndex)}
              <span>${escapeHtml(option)}</span>
            </button>
          `).join("")}
        </div>
      ` : ""}
      ${revealed ? renderLiveQuizRoundResults(arcadeState, players, question, answers, leaderboard) : renderLiveAnswerStatus(players, answers)}
      ${isHost && (revealed || secondsLeft <= 0 || Object.keys(answers).length >= players.length) ? `
        <div class="panel-actions">
          <button class="button primary" type="button" data-live-next>${arcadeState.questionIndex >= arcadeState.questions.length - 1 ? "Final leaderboard" : "Next question"}</button>
        </div>
      ` : ""}
    </section>
  `;
}

function renderLiveRaceGame(arcadeState, roomPlayers) {
  const players = getLivePlayablePlayers(roomPlayers).slice(0, 2);
  const activeUserId = arcadeState.activeUserId;
  const question = arcadeState.questions?.[arcadeState.questionIndex] || null;
  const userId = state.auth.session?.user?.id || "";
  const canAnswer = userId === activeUserId && !arcadeState.revealed && !arcadeState.finished;

  return `
    <section class="live-race-shell">
      <div class="live-race-lives">
        ${players.map((player) => `
          <article class="${player.user_id === activeUserId ? "active" : ""}">
            <strong>${escapeHtml(player.display_name)}</strong>
            <div class="race-lives-row">${renderLiveRaceLives(arcadeState.livesByUserId?.[player.user_id] ?? 3)}</div>
          </article>
        `).join("")}
      </div>
      ${arcadeState.finished ? renderLiveWinnerCard(arcadeState, players) : `
        <article class="live-question-panel self">
          <p class="challenge-label">${escapeHtml(players.find((player) => player.user_id === activeUserId)?.display_name || "Next alpaca")} answers now</p>
          <h3>${escapeHtml(question?.prompt || "Loading question...")}</h3>
          <div class="raw-quiz-options">
            ${(question?.options || []).map((option, optionIndex) => `
              <button class="raw-quiz-option option-button ${arcadeState.revealed && optionIndex === question.answerIndex ? "correct" : ""}" type="button" data-live-answer="${optionIndex}" ${canAnswer ? "" : "disabled"}>
                ${renderOptionToken(optionIndex)}
                <span>${escapeHtml(option)}</span>
              </button>
            `).join("")}
          </div>
          ${arcadeState.revealed ? `<button class="button primary small" type="button" data-live-next>Next turn</button>` : ""}
        </article>
      `}
    </section>
  `;
}

function renderLiveAlpaquizGame(arcadeState, roomPlayers, isHost) {
  const players = getLivePlayablePlayers(roomPlayers);
  const question = arcadeState.questions?.[arcadeState.questionIndex] || null;
  const buzzedPlayer = players.find((player) => player.user_id === arcadeState.buzzedUserId);
  const userId = state.auth.session?.user?.id || "";
  const canBuzz = !arcadeState.buzzedUserId && !arcadeState.revealed && !arcadeState.finished;
  const answerPending = Number.isInteger(arcadeState.selectedIndex) && !arcadeState.revealed;
  const answerSecondsLeft = arcadeState.buzzedUserId && arcadeState.answerDeadlineAt
    ? Math.max(0, Math.ceil((Number(arcadeState.answerDeadlineAt) - Date.now()) / 1000))
    : 0;
  const canAnswer = arcadeState.buzzedUserId === userId &&
    !arcadeState.revealed &&
    !answerPending &&
    (!arcadeState.answerDeadlineAt || answerSecondsLeft > 0);
  const timerLabel = answerPending
    ? "Checking..."
    : buzzedPlayer
      ? `${buzzedPlayer.display_name} · ${answerSecondsLeft}s`
      : "Press space or Buzz";

  return `
    <section class="live-alpaquiz-shell">
      <div class="live-kahoot-question">
        <p class="challenge-label">Alpaquiz · Question ${arcadeState.questionIndex + 1}/${arcadeState.questions.length}</p>
        <h3>${escapeHtml(question?.prompt || "Loading question...")}</h3>
        <strong class="live-timer-pill">${escapeHtml(timerLabel)}</strong>
      </div>
      <button class="button primary live-buzz-button" type="button" data-live-buzz ${canBuzz ? "" : "disabled"}>Buzz</button>
      <div class="raw-quiz-options">
        ${(question?.options || []).map((option, optionIndex) => {
          let classes = "raw-quiz-option option-button";
          if (optionIndex === arcadeState.selectedIndex) {
            classes += " active";
          }
          if (arcadeState.revealed && optionIndex === question.answerIndex) {
            classes += " correct";
          } else if (arcadeState.revealed && optionIndex === arcadeState.selectedIndex) {
            classes += " wrong";
          }
          return `
            <button class="${classes}" type="button" data-live-answer="${optionIndex}" ${canAnswer ? "" : "disabled"}>
              ${renderOptionToken(optionIndex)}
              <span>${escapeHtml(option)}</span>
            </button>
          `;
        }).join("")}
      </div>
      ${answerPending ? `<p class="online-muted">Answer locked. Revealing in 2 seconds...</p>` : ""}
      ${arcadeState.revealed && Number.isInteger(arcadeState.selectedIndex) ? `
        <p class="live-answer-feedback ${arcadeState.lastCorrect ? "correct" : "wrong"}">
          ${escapeHtml(arcadeState.lastCorrect ? "Correct answer!" : "Wrong turn. The green answer was correct.")}
        </p>
      ` : ""}
      ${renderLiveLeaderboard(getArcadeLeaderboard(arcadeState, players))}
      ${isHost && arcadeState.revealed ? `
        <div class="panel-actions">
          <button class="button primary" type="button" data-live-next>${arcadeState.questionIndex >= arcadeState.questions.length - 1 ? "Final leaderboard" : "Next question"}</button>
        </div>
      ` : ""}
    </section>
  `;
}

function renderLiveRunAlpacaToken(colorId, size = "small") {
  const color = LIVE_ALPACA_COLORS.find((entry) => entry.id === colorId) || LIVE_ALPACA_COLORS[0];
  const asset = getAssetValue(["run", "travelMarker"]) || "./app-icons/icon-192.png";
  return `
    <span class="live-alpaca-token ${escapeHtml(size)}" style="--alpaca-color:${escapeHtml(color.hex)}; --alpaca-filter:${escapeHtml(color.filter)};">
      <img src="${escapeHtml(asset)}" alt="" aria-hidden="true" />
    </span>
  `;
}

function renderLiveRaceLives(lives) {
  return Array.from({ length: 3 }, (_, index) => {
    const state = index < lives ? (lives === 1 ? "warning" : "full") : "empty";
    return `<span class="race-life ${state}">${renderRaceLivesIcon(state)}</span>`;
  }).join("");
}

function renderLiveAnswerStatus(players, answers) {
  return `
    <div class="live-answer-status-grid">
      ${players.map((player) => `
        <article class="${answers[player.user_id] ? "answered" : ""}">
          <strong>${escapeHtml(player.display_name)}</strong>
          <span>${answers[player.user_id] ? "Locked" : "Thinking"}</span>
        </article>
      `).join("")}
    </div>
  `;
}

function renderLiveQuizRoundResults(arcadeState, players, question, answers, leaderboard) {
  return `
    <section class="live-round-results">
      ${players.map((player) => {
        const answer = answers[player.user_id];
        const label = Number.isInteger(answer?.optionIndex) ? question.options[answer.optionIndex] : "No answer";
        return `
          <article class="${answer?.correct ? "correct" : "wrong"}">
            <strong>${escapeHtml(player.display_name)}</strong>
            <span>${escapeHtml(label)}</span>
          </article>
        `;
      }).join("")}
      ${renderLiveLeaderboard(leaderboard)}
    </section>
  `;
}

function renderLiveLeaderboard(leaderboard) {
  return `
    <div class="live-leaderboard">
      ${leaderboard.map((row, index) => `
        <article class="${index === 0 ? "leader" : ""}">
          <span>${index + 1}</span>
          <strong>${escapeHtml(row.name)}</strong>
          <em>${row.score} pts</em>
        </article>
      `).join("")}
    </div>
  `;
}

function renderLiveWinnerCard(arcadeState, players) {
  const winner = players.find((player) => player.user_id === arcadeState.winnerUserId);
  return `
    <article class="live-winner-card">
      <p class="challenge-label">Winner</p>
      <h3>${escapeHtml(winner?.display_name || "Winning alpaca")}</h3>
      <p>The other alpaca ran out of lives.</p>
    </article>
  `;
}

function renderOnlineRoomListItem(room, busy) {
  const players = room.players || [];
  const playerCount = players.filter((player) => ["host", "player"].includes(player.role)).length;
  const maxPlayers = Number(room.max_players) || 2;
  const gameType = normalizeLiveGameType(room.game_type);

  return `
    <article class="online-room-mini">
      <div>
        <strong>${escapeHtml(room.room_code || "ROOM")}</strong>
        <span>${escapeHtml(getLiveGameLabel(gameType))} · ${playerCount}/${maxPlayers} alpacas waiting</span>
      </div>
      <button class="button secondary" type="button" data-jeopardy-live-join="${escapeHtml(room.id)}" ${busy || playerCount >= maxPlayers ? "disabled" : ""}>Join</button>
    </article>
  `;
}

function getAlpacaOnlineRoster() {
  const byId = new Map();
  const addPlayer = (player, detail) => {
    if (!player?.display_name) {
      return;
    }
    byId.set(player.user_id || player.id || player.display_name, {
      name: player.display_name,
      detail
    });
  };

  (state.live.players || []).forEach((player) => addPlayer(player, player.role === "host" ? "Hosting room" : "In your room"));
  (state.live.openSessions || []).forEach((room) => {
    (room.players || []).forEach((player) => addPlayer(player, `Waiting in ${room.room_code || "room"}`));
  });

  return Array.from(byId.values());
}

function getOpenLiveRoomsByGame(rooms = []) {
  return rooms.reduce((groups, room) => {
    const gameType = normalizeLiveGameType(room.game_type);
    groups[gameType] = groups[gameType] || [];
    groups[gameType].push(room);
    return groups;
  }, {});
}

function getOpenRoomsForGame(gameType) {
  const normalized = normalizeLiveGameType(gameType);
  return (state.live.openSessions || []).filter((room) => normalizeLiveGameType(room.game_type) === normalized);
}

    return Object.freeze({
      renderAlpacaOnlineHub,
      renderLegacyLiveRoomsDisabled,
      getLiveOverlayRenderContext,
      getLiveOverlayMount,
      renderLiveOverlayMount,
      canPatchLiveWaitingOverlay,
      patchLiveWaitingOverlay,
      replaceLiveWaitingPart,
      renderOnlineLiveSidebar,
      renderOnlineCurrentGameSummary,
      getAlpacaOnlineConnectedCount,
      renderOnlineJoinForm,
      renderOnlineOpenRoomsList,
      renderOnlineCreateGamePanel,
      renderOnlineHomeGameGrid,
      renderOnlineHomeGameCard,
      getOnlineGameCardDescription,
      renderSelectedOnlineGameBody,
      renderOnlineAlpacapardyLiveGame,
      renderOnlineArcadeSetup,
      renderOnlineAlpacapardySetup,
      renderOnlineWaitingPopup,
      renderOnlineArcadeWaitingRoom,
      renderLiveOverlayLayer,
      renderLiveLaunchCountdownOverlay,
      renderLiveWaitingOverlay,
      renderLiveWaitingVideoRail,
      renderOnlineArcadeGame,
      renderLivePlayerCard,
      renderLiveRunSetupColorPicker,
      renderLiveRunColorPicker,
      renderLiveRunGame,
      renderLiveRunMap,
      getLiveRunRouteIndex,
      renderLiveRunPlayerPanel,
      renderLiveQuizGame,
      renderLiveRaceGame,
      renderLiveAlpaquizGame,
      renderLiveRunAlpacaToken,
      renderLiveRaceLives,
      renderLiveAnswerStatus,
      renderLiveQuizRoundResults,
      renderLiveLeaderboard,
      renderLiveWinnerCard,
      renderOnlineRoomListItem,
      getAlpacaOnlineRoster,
      getOpenLiveRoomsByGame,
      getOpenRoomsForGame
    });
  }

  global.WSC_CREATE_LEGACY_LIVE_ROOM_RENDERER = createLegacyLiveRoomRenderer;
})(window);
