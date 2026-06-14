(function initLegacyLiveRoomController(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC legacy live room controller missing function dependency: " + name);
    }
    return value;
  }

  function createLegacyLiveRoomController(options = {}) {
    const {
      appState: state,
      appStateService,
      authController,
      alpacaChannelCatalog = { videos: [] },
      alpacapardyLive = null,
      alpacapardyLiveSupabaseService = null,
      alpacapardyEngine = null,
      windowRef = global,
      constants = {},
      callbacks = {}
    } = options;

    if (!state) {
      throw new Error("WSC legacy live room controller missing app state.");
    }
    if (!appStateService) {
      throw new Error("WSC legacy live room controller missing app state service.");
    }
    if (!authController) {
      throw new Error("WSC legacy live room controller missing auth controller.");
    }

    const LEGACY_LIVE_ROOMS_PUBLIC_ENABLED = Boolean(constants.LEGACY_LIVE_ROOMS_PUBLIC_ENABLED);
    const MULTIPLAYER_ALLOWED_EMAILS = constants.MULTIPLAYER_ALLOWED_EMAILS || new Set();
    const MULTIPLAYER_ALLOWED_EMAIL_DOMAINS = constants.MULTIPLAYER_ALLOWED_EMAIL_DOMAINS || new Set();
    const LIVE_GAME_TYPES = constants.LIVE_GAME_TYPES || {};
    const LIVE_ALPACA_COLORS = constants.LIVE_ALPACA_COLORS || [];
    const LIVE_SYNC_INTERVAL_MS = constants.LIVE_SYNC_INTERVAL_MS || 900;
    const GAME_CONFIG = constants.GAME_CONFIG || {};
    const window = windowRef;

    const hasSupabaseConfig = requiredFunction(authController, "hasSupabaseConfig");
    const hasAuthSession = requiredFunction(authController, "hasAuthSession");
    const getCurrentUserEmail = requiredFunction(authController, "getCurrentUserEmail");
    const getSupabaseClient = requiredFunction(authController, "getSupabaseClient");
    const isAnonymousUser = requiredFunction(authController, "isAnonymousUser");
    const ensureAuthSessionForLive = requiredFunction(authController, "ensureLiveAuthSession");
    const getSelectedLiveGameType = requiredFunction(appStateService, "getSelectedLiveGameType");
    const buildConfiguredJeopardyBoard = requiredFunction(callbacks, "buildConfiguredJeopardyBoard");
    const buildJeopardyExperience = requiredFunction(callbacks, "buildJeopardyExperience");
    const buildPatternQuestionSequence = requiredFunction(callbacks, "buildPatternQuestionSequence");
    const buildRawQuestionPoolsFromEntries = requiredFunction(callbacks, "buildRawQuestionPoolsFromEntries");
    const createStandaloneAlpacaChannelVideo = requiredFunction(callbacks, "createStandaloneAlpacaChannelVideo");
    const finalizeSessionStats = requiredFunction(callbacks, "finalizeSessionStats");
    const getBestStreakFromAnswers = requiredFunction(callbacks, "getBestStreakFromAnswers");
    const getEmbeddableVideo = requiredFunction(callbacks, "getEmbeddableVideo");
    const getHighestTeamScore = requiredFunction(callbacks, "getHighestTeamScore");
    const getRawEntriesForRouteSelection = requiredFunction(callbacks, "getRawEntriesForRouteSelection");
    const loadGuestAlpacaName = requiredFunction(callbacks, "loadGuestAlpacaName");
    const render = requiredFunction(callbacks, "render");
    const renderLiveSurfaces = requiredFunction(callbacks, "renderLiveSurfaces");
    const shuffle = requiredFunction(callbacks, "shuffle");
    const startJeopardyTimer = requiredFunction(callbacks, "startJeopardyTimer");
    let liveLaunchCountdownTimerId = null;

    function canAccessLegacyLiveRooms() {
      if (!LEGACY_LIVE_ROOMS_PUBLIC_ENABLED) {
        return false;
      }

      const email = getCurrentUserEmail();
      const domain = email.includes("@") ? email.split("@").pop() : "";
      return Boolean(MULTIPLAYER_ALLOWED_EMAILS.has(email) || MULTIPLAYER_ALLOWED_EMAIL_DOMAINS.has(domain));
    }

    function getLegacyLiveRoomsDisabledMessage() {
      return LEGACY_LIVE_ROOMS_PUBLIC_ENABLED
        ? "Legacy live game rooms are limited to approved internal test accounts."
        : "Legacy live game rooms are disabled in this public build until the Supabase RPC/RLS path is reviewed.";
    }

    function canAccessMultiplayer() {
      return canAccessLegacyLiveRooms();
    }

    async function ensureLiveAuthSession() {
      return ensureAuthSessionForLive();
    }

    function getLiveDisplayName() {
      if (state.auth.profile?.alpaca_name && !isAnonymousUser()) {
        return state.auth.profile.alpaca_name;
      }
      return state.live.guestName || "Guest";
    }

    function resetAlpacapardyLiveState({ keepGuestName = true } = {}) {
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
        state.live.guestName = loadGuestAlpacaName();
      }
    }

    function returnToAlpacaOnlineHub() {
      if (state.live.currentSession) {
        return;
      }
      state.live.onlineView = "hub";
      state.live.selectedGameType = "alpacapardy";
      state.live.arcadeState = null;
      state.live.error = "";
      if (!state.experience || state.experience.type !== "jeopardy") {
        state.experience = buildJeopardyExperience();
        state.experience.playMode = "multiplayer";
      }
      renderLiveSurfaces();
    }

    function getLiveWaitingVideoIndex(videos) {
      if (!videos.length) {
        return 0;
      }

      if (!Number.isInteger(state.live.waitingVideoIndex)) {
        state.live.waitingVideoIndex = 0;
      }
      state.live.waitingVideoIndex = (state.live.waitingVideoIndex + videos.length) % videos.length;
      return state.live.waitingVideoIndex;
    }

    function navigateLiveWaitingVideo(direction) {
      if (!state.live.currentSession) {
        return;
      }

      const videos = getLiveWaitingVideos(state.live.currentSession.id);
      if (videos.length <= 1) {
        return;
      }

      const currentIndex = getLiveWaitingVideoIndex(videos);
      state.live.waitingVideoIndex = direction === "prev"
        ? (currentIndex - 1 + videos.length) % videos.length
        : (currentIndex + 1) % videos.length;
      renderLiveSurfaces();
    }

    function getLiveWaitingVideos(sessionId) {
      if (state.live.waitingVideoSessionId !== sessionId || !state.live.waitingVideos.length) {
        const videos = (alpacaChannelCatalog.videos || [])
          .filter(isShortLiveWaitingVideo)
          .map((video) => createStandaloneAlpacaChannelVideo(video));
        state.live.waitingVideoSessionId = sessionId;
        state.live.waitingVideos = shuffle(videos).slice();
        state.live.waitingVideoIndex = 0;
      }

      return state.live.waitingVideos;
    }

    function isShortLiveWaitingVideo(video) {
      return Boolean(video?.url && getVideoDurationSeconds(video.duration) < 120 && getEmbeddableVideo(video.url));
    }

    function getVideoDurationSeconds(duration) {
      const text = String(duration || "").trim();
      if (!text) {
        return Infinity;
      }

      const parts = text.split(":").map((part) => Number(part));
      if (!parts.length || parts.some((part) => !Number.isFinite(part))) {
        return Infinity;
      }

      return parts.reduce((total, part) => total * 60 + part, 0);
    }

    function getLiveRunSetupColorId() {
      const requested = state.live.pendingRunColor;
      return LIVE_ALPACA_COLORS.some((color) => color.id === requested)
        ? requested
        : LIVE_ALPACA_COLORS[0]?.id || "cream";
    }

    function selectLiveRunSetupColor(colorId) {
      if (!LIVE_ALPACA_COLORS.some((color) => color.id === colorId)) {
        return;
      }
      state.live.pendingRunColor = colorId;
      renderLiveSurfaces();
    }

    function normalizeLiveGameType(gameType) {
      const normalized = String(gameType || "").trim().toLowerCase();
      return LIVE_GAME_TYPES[normalized] ? normalized : "alpacapardy";
    }

    function getCurrentLiveGameType() {
      return normalizeLiveGameType(getSelectedLiveGameType(state, "alpacapardy"));
    }

    function getLiveGameLabel(gameType = getCurrentLiveGameType()) {
      return LIVE_GAME_TYPES[normalizeLiveGameType(gameType)]?.label || "Live game";
    }

    function compareLivePlayers(left, right) {
      return Number(left.team_index ?? 99) - Number(right.team_index ?? 99) ||
        String(left.display_name || "").localeCompare(String(right.display_name || ""));
    }

    function getLivePlayablePlayers(players = state.live.players) {
      return (players || []).filter((player) => ["host", "player"].includes(player.role)).sort(compareLivePlayers);
    }

    function createEmptyArcadeState(gameType) {
      return {
        gameType,
        started: false,
        finished: false,
        colorsByUserId: {},
        scoresByUserId: {},
        answers: {}
      };
    }

    function getArcadeState(gameType = getCurrentLiveGameType()) {
      if (!state.live.arcadeState || state.live.arcadeState.gameType !== gameType) {
        state.live.arcadeState = createEmptyArcadeState(gameType);
      }
      return state.live.arcadeState;
    }

    function chooseOnlineGameType(gameType) {
      const normalized = normalizeLiveGameType(gameType);
      if (state.live.currentSession) {
        return;
      }
      state.live.selectedGameType = normalized;
      state.live.onlineView = "game";
      state.live.arcadeState = normalized === "alpacapardy" ? null : createEmptyArcadeState(normalized);
      if (normalized === "alpacapardy" && (!state.experience || state.experience.type !== "jeopardy")) {
        state.experience = buildJeopardyExperience();
        state.experience.playMode = "multiplayer";
      }
      renderLiveSurfaces();
    }

    function getAlpacapardyLiveRenderContext() {
      const experience = state.experience;
      const enabled = Boolean(experience?.playMode === "multiplayer" && state.live.currentSession);
      const user = state.auth.session?.user || null;
      const isHost = Boolean(state.live.currentSession && user && state.live.currentSession.host_user_id === user.id);
      const playerCount = state.live.players.filter((player) => ["host", "player"].includes(player.role)).length;
      const maxPlayers = Number(state.live.currentSession?.max_players || experience?.setupTeamCount || GAME_CONFIG.jeopardyDefaultTeams);

      return {
        available: Boolean(hasSupabaseConfig() && alpacapardyLiveSupabaseService && alpacapardyLive),
        accessAllowed: canAccessMultiplayer(),
        enabled,
        session: state.live.currentSession,
        player: state.live.currentPlayer,
        players: state.live.players,
        openSessions: state.live.openSessions,
        status: state.live.status,
        message: state.live.message,
        error: state.live.error,
        disabledReason: getLegacyLiveRoomsDisabledMessage(),
        userId: user?.id || null,
        isHost,
        isGuest: Boolean(user && isAnonymousUser(user)),
        canStart: Boolean(isHost && playerCount >= 2 && playerCount <= maxPlayers),
        canOpenTile: enabled ? canOpenAlpacapardyLiveTile() : true,
        canAnswerFocus: enabled ? canAnswerAlpacapardyLiveFocus() : true,
        canCloseFocus: enabled ? canCloseAlpacapardyLiveFocus() : true,
        canChat: Boolean(enabled && state.live.currentPlayer)
      };
    }

    function isAlpacapardyLiveActive() {
      return Boolean(
        state.experience?.type === "jeopardy" &&
        state.experience.playMode === "multiplayer" &&
        state.live.currentSession &&
        normalizeLiveGameType(state.live.currentSession.game_type) === "alpacapardy"
      );
    }

    function guardMultiplayerAccess() {
      if (canAccessMultiplayer()) {
        return true;
      }
      state.live.error = getLegacyLiveRoomsDisabledMessage();
      renderLiveSurfaces();
      return false;
    }

    function canOpenAlpacapardyLiveTile() {
      return alpacapardyLive?.canOpenTile
        ? alpacapardyLive.canOpenTile(state.experience, getAlpacapardyLiveIdentityContext())
        : false;
    }

    function canAnswerAlpacapardyLiveFocus() {
      return alpacapardyLive?.canAnswerFocus
        ? alpacapardyLive.canAnswerFocus(state.experience, getAlpacapardyLiveIdentityContext())
        : false;
    }

    function canCloseAlpacapardyLiveFocus() {
      return alpacapardyLive?.canCloseFocus
        ? alpacapardyLive.canCloseFocus(state.experience, getAlpacapardyLiveIdentityContext())
        : false;
    }

    function getAlpacapardyLiveIdentityContext() {
      const user = state.auth.session?.user || null;
      return {
        enabled: isAlpacapardyLiveActive(),
        userId: user?.id || null,
        playerId: state.live.currentPlayer?.id || null,
        isHost: Boolean(state.live.currentSession && user && state.live.currentSession.host_user_id === user.id)
      };
    }

    function clearAlpacapardyLiveHeartbeat() {
      if (state.live.heartbeatId) {
        window.clearInterval(state.live.heartbeatId);
        state.live.heartbeatId = null;
      }
    }

    function clearAlpacapardyLiveSync() {
      if (state.live.syncId) {
        window.clearInterval(state.live.syncId);
        state.live.syncId = null;
      }
      state.live.syncBusy = false;
    }

    function clearLiveLaunchCountdown() {
      if (liveLaunchCountdownTimerId) {
        window.clearTimeout(liveLaunchCountdownTimerId);
        liveLaunchCountdownTimerId = null;
      }
    }

    function clearAlpacapardyLiveSubscriptions() {
      const client = getSupabaseClient();
      if (state.live.sessionChannel) {
        alpacapardyLiveSupabaseService?.removeChannel(client, state.live.sessionChannel);
        state.live.sessionChannel = null;
      }
      if (state.live.lobbyChannel) {
        alpacapardyLiveSupabaseService?.removeChannel(client, state.live.lobbyChannel);
        state.live.lobbyChannel = null;
      }
    }

    async function refreshAlpacapardyLiveLobby() {
      if (!guardMultiplayerAccess() || !alpacapardyLiveSupabaseService) {
        return;
      }

      try {
        await ensureLiveAuthSession();
        const client = getSupabaseClient();
        state.live.status = "loading";
        state.live.error = "";
        renderLiveSurfaces();
        const { data: sessions, error } = await alpacapardyLiveSupabaseService.listOpenSessions(client);
        if (error) {
          throw error;
        }
        state.live.openSessions = sessions || [];
        state.live.status = "idle";
        subscribeAlpacapardyLobby();
        startAlpacapardyLiveSync();
      } catch (error) {
        state.live.status = "idle";
        state.live.error = error.message || "Unable to load live rooms.";
      }

      renderLiveSurfaces();
    }

    function subscribeAlpacapardyLobby() {
      const client = getSupabaseClient();
      if (!client || state.live.lobbyChannel || !alpacapardyLiveSupabaseService) {
        return;
      }

      state.live.lobbyChannel = alpacapardyLiveSupabaseService.subscribeToLobby(client, {
        onSessionsChanged: () => refreshAlpacapardyLiveLobbySilently(),
        onPlayersChanged: () => refreshAlpacapardyLiveLobbySilently()
      });
    }

    async function refreshAlpacapardyLiveLobbySilently() {
      if (!canAccessMultiplayer() || !alpacapardyLiveSupabaseService || !hasAuthSession()) {
        return;
      }

      const client = getSupabaseClient();
      const { data: sessions, error } = await alpacapardyLiveSupabaseService.listOpenSessions(client);
      if (!error) {
        state.live.openSessions = sessions || [];
        renderLiveSurfaces();
      }
    }

    function startAlpacapardyLiveSync() {
      if (state.live.syncId) {
        return;
      }

      const sync = () => {
        syncAlpacapardyLiveNow({ renderAfter: true });
      };
      sync();
      state.live.syncId = window.setInterval(sync, LIVE_SYNC_INTERVAL_MS);
    }

    async function syncAlpacapardyLiveNow({ renderAfter = false } = {}) {
      if (
        state.live.syncBusy ||
        !canAccessMultiplayer() ||
        !alpacapardyLiveSupabaseService ||
        !hasAuthSession()
      ) {
        return;
      }

      if (!state.live.currentSession && state.ui.appShellMode !== "online") {
        return;
      }

      state.live.syncBusy = true;
      try {
        if (state.live.currentSession) {
          await refreshAlpacapardyLiveSessionState({ renderAfter });
          await maybeAutoRevealTimedLiveGame();
          await maybeAutoResolveTimedAlpaquiz();
        } else {
          await refreshAlpacapardyLiveLobbySilently();
        }
      } finally {
        state.live.syncBusy = false;
      }
    }

    async function maybeAutoRevealTimedLiveGame() {
      if (!getAlpacapardyLiveIdentityContext().isHost || getCurrentLiveGameType() !== "quiz") {
        return;
      }
      const arcadeState = getArcadeState("quiz");
      if (!arcadeState.started || arcadeState.finished || arcadeState.revealed) {
        return;
      }
      if (Number(arcadeState.revealAt || 0) > Date.now()) {
        return;
      }
      await emitLiveEvent({ type: "quiz.revealed", payload: {} });
    }

    async function maybeAutoResolveTimedAlpaquiz() {
      if (!getAlpacapardyLiveIdentityContext().isHost || getCurrentLiveGameType() !== "alpaquiz") {
        return;
      }
      const arcadeState = getArcadeState("alpaquiz");
      if (!arcadeState.started || arcadeState.finished || arcadeState.revealed || !arcadeState.buzzedUserId) {
        return;
      }
      if (arcadeState.pendingRevealAt && Number(arcadeState.pendingRevealAt) <= Date.now()) {
        await emitLiveEvent({ type: "alpaquiz.revealed", payload: {} });
        return;
      }
      if (!Number.isInteger(arcadeState.selectedIndex) && Number(arcadeState.answerDeadlineAt || 0) > 0 && Number(arcadeState.answerDeadlineAt) <= Date.now()) {
        await emitLiveEvent({
          type: "alpaquiz.answered",
          payload: {
            userId: arcadeState.buzzedUserId,
            optionIndex: -1
          }
        });
      }
    }

    async function refreshAlpacapardyLiveSessionState({ renderAfter = false } = {}) {
      if (!state.live.currentSession || !alpacapardyLiveSupabaseService || !hasAuthSession()) {
        return;
      }

      const client = getSupabaseClient();
      const sessionId = state.live.currentSession.id;
      const [sessionResponse, playersResponse, eventsResponse] = await Promise.all([
        alpacapardyLiveSupabaseService.fetchSession(client, sessionId),
        alpacapardyLiveSupabaseService.fetchPlayers(client, sessionId),
        alpacapardyLiveSupabaseService.fetchEventsSince(client, sessionId, state.live.revision)
      ]);

      let shouldRender = false;
      if (!sessionResponse.error && sessionResponse.data) {
        const previousStatus = state.live.currentSession?.status;
        state.live.currentSession = sessionResponse.data;
        state.live.selectedGameType = normalizeLiveGameType(sessionResponse.data.game_type);
        if (state.live.selectedGameType === "alpacapardy" && sessionResponse.data.settings) {
          applyAlpacapardyLiveSettings(sessionResponse.data.settings);
        }
        maybeStartLiveLaunchCountdown(previousStatus, sessionResponse.data);
        shouldRender = true;
      }

      if (!playersResponse.error) {
        state.live.players = (playersResponse.data || []).sort(compareLivePlayers);
        state.live.currentPlayer =
          state.live.players.find((player) => player.user_id === state.auth.session?.user?.id) ||
          state.live.currentPlayer;
        maybeAutoStartReadyLiveGame();
        shouldRender = true;
      }

      if (!eventsResponse.error) {
        (eventsResponse.data || []).forEach((event) => applyLiveEvent(event));
      } else if (eventsResponse.error.message) {
        state.live.error = eventsResponse.error.message;
      }

      if (renderAfter && shouldRender) {
        renderLiveSurfaces();
      }
    }

    async function createSelectedLiveGameRoom() {
      const gameType = getCurrentLiveGameType();
      if (gameType === "alpacapardy") {
        createAlpacapardyLiveRoom();
        return;
      }
      await createArcadeLiveRoom(gameType);
    }

    async function createArcadeLiveRoom(gameType) {
      if (!guardMultiplayerAccess() || !alpacapardyLiveSupabaseService) {
        return;
      }

      const game = LIVE_GAME_TYPES[gameType] || LIVE_GAME_TYPES.run;
      const selectedRunColor = gameType === "run" ? getLiveRunSetupColorId() : "";
      try {
        const session = await ensureLiveAuthSession();
        const client = getSupabaseClient();
        const user = session.user;
        state.live.status = "creating";
        state.live.error = "";
        state.live.message = `Creating ${game.label} room...`;
        renderLiveSurfaces();

        const created = await alpacapardyLiveSupabaseService.createSession(client, {
          gameType,
          hostUserId: user.id,
          maxPlayers: game.maxPlayers,
          settings: {
            gameType,
            label: game.label,
            allThemes: true,
            ...(selectedRunColor ? { runHostColor: selectedRunColor } : {})
          }
        });
        if (created.error) {
          throw created.error;
        }

        const joined = await alpacapardyLiveSupabaseService.joinSession(client, {
          sessionId: created.data.id,
          userId: user.id,
          displayName: getLiveDisplayName(),
          role: "host",
          teamIndex: 0,
          isGuest: isAnonymousUser(user)
        });
        if (joined.error) {
          throw joined.error;
        }

        state.live.currentSession = created.data;
        state.live.currentPlayer = joined.data;
        state.live.selectedGameType = "alpacapardy";
        state.live.onlineView = "game";
        state.live.arcadeState = createEmptyArcadeState(gameType);
        if (gameType === "run") {
          state.live.arcadeState.colorsByUserId = {
            [user.id]: selectedRunColor || getLiveRunSetupColorId()
          };
        }
        state.live.players = [joined.data];
        state.live.selectedGameType = gameType;
        state.live.revision = 0;
        state.live.status = "idle";
        state.live.message = `Waiting for alpacas to join. Room ${created.data.room_code}.`;
        subscribeAlpacapardySession(created.data.id);
        startAlpacapardyLiveHeartbeat();
        startAlpacapardyLiveSync();
        if (gameType === "run" && selectedRunColor) {
          await emitLiveEvent({
            type: "run.color_selected",
            payload: {
              userId: user.id,
              colorId: selectedRunColor
            }
          });
        }
        await refreshAlpacapardyLiveSessionState({ renderAfter: true });
        refreshAlpacapardyLiveLobbySilently();
      } catch (error) {
        state.live.status = "idle";
        state.live.error = error.message || `Unable to create ${game.label} room.`;
      }

      renderLiveSurfaces();
    }

    async function createAlpacapardyLiveRoom() {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy" || experience.started || !guardMultiplayerAccess()) {
        return;
      }

      try {
        const session = await ensureLiveAuthSession();
        const client = getSupabaseClient();
        const user = session.user;
        state.live.status = "creating";
        state.live.error = "";
        state.live.message = "Creating live room...";
        renderLiveSurfaces();

        const created = await alpacapardyLiveSupabaseService.createSession(client, {
          hostUserId: user.id,
          maxPlayers: experience.setupTeamCount,
          settings: buildAlpacapardyLiveSettings(experience)
        });
        if (created.error) {
          throw created.error;
        }

        const joined = await alpacapardyLiveSupabaseService.joinSession(client, {
          sessionId: created.data.id,
          userId: user.id,
          displayName: getLiveDisplayName(),
          role: "host",
          teamIndex: 0,
          isGuest: isAnonymousUser(user)
        });
        if (joined.error) {
          throw joined.error;
        }

        state.live.currentSession = created.data;
        state.live.currentPlayer = joined.data;
        state.live.players = [joined.data];
        state.live.selectedGameType = "alpacapardy";
        state.live.onlineView = "game";
        state.live.revision = 0;
        state.live.status = "idle";
        state.live.message = `Waiting for alpacas to join. Room ${created.data.room_code}.`;
        subscribeAlpacapardySession(created.data.id);
        startAlpacapardyLiveHeartbeat();
        startAlpacapardyLiveSync();
        await refreshAlpacapardyLiveSessionState({ renderAfter: true });
        refreshAlpacapardyLiveLobbySilently();
      } catch (error) {
        state.live.status = "idle";
        state.live.error = error.message || "Unable to create live room.";
      }

      renderLiveSurfaces();
    }

    async function joinAlpacapardyLiveRoom(sessionId) {
      const experience = state.experience;
      if (!guardMultiplayerAccess()) {
        return;
      }

      try {
        const authSession = await ensureLiveAuthSession();
        const client = getSupabaseClient();
        state.live.status = "joining";
        state.live.error = "";
        state.live.message = "Joining live room...";
        renderLiveSurfaces();

        const sessionResponse = await alpacapardyLiveSupabaseService.fetchSession(client, sessionId);
        if (sessionResponse.error) {
          throw sessionResponse.error;
        }
        const liveSession = sessionResponse.data;
        if (!liveSession || liveSession.status !== "lobby" || liveSession.is_open === false) {
          throw new Error("This room is no longer open.");
        }
        const gameType = normalizeLiveGameType(liveSession.game_type);
        if (gameType === "alpacapardy" && (!experience || experience.type !== "jeopardy" || experience.started)) {
          throw new Error("Alpacapardy setup is not ready.");
        }

        const players = liveSession.players || [];
        const teamIndex = alpacapardyLiveSupabaseService.findNextTeamIndex(players, liveSession.max_players);
        if (teamIndex < 0) {
          throw new Error("This room is already full.");
        }

        const joined = await alpacapardyLiveSupabaseService.joinSession(client, {
          sessionId: liveSession.id,
          userId: authSession.user.id,
          displayName: getLiveDisplayName(),
          role: "player",
          teamIndex,
          isGuest: isAnonymousUser(authSession.user)
        });
        if (joined.error) {
          throw joined.error;
        }

        state.live.currentSession = liveSession;
        state.live.currentPlayer = joined.data;
        state.live.selectedGameType = gameType;
        state.live.onlineView = "game";
        state.live.arcadeState = gameType === "alpacapardy" ? null : createEmptyArcadeState(gameType);
        state.live.players = players
          .filter((player) => player.user_id !== authSession.user.id)
          .concat(joined.data)
          .sort(compareLivePlayers);
        state.live.revision = 0;
        state.live.status = "idle";
        state.live.message = `Joined room ${liveSession.room_code}. Waiting for the host.`;
        if (gameType === "alpacapardy") {
          applyAlpacapardyLiveSettings(liveSession.settings || {});
        }
        subscribeAlpacapardySession(liveSession.id);
        startAlpacapardyLiveHeartbeat();
        startAlpacapardyLiveSync();
        await refreshAlpacapardyLiveSessionState({ renderAfter: true });
      } catch (error) {
        state.live.status = "idle";
        state.live.error = error.message || "Unable to join live room.";
      }

      renderLiveSurfaces();
    }

    async function joinAlpacapardyLiveRoomByCode(formData) {
      if (!guardMultiplayerAccess() || !alpacapardyLiveSupabaseService) {
        return;
      }

      const roomCode = alpacapardyLiveSupabaseService.normalizeRoomCode(formData.get("room_code"));
      state.live.joinCodeDraft = roomCode;
      if (!roomCode) {
        state.live.error = "Enter a room code.";
        render();
        return;
      }

      try {
        await ensureLiveAuthSession();
        const client = getSupabaseClient();
        state.live.status = "joining";
        state.live.error = "";
        state.live.message = `Looking for room ${roomCode}...`;
        render();

        const response = await alpacapardyLiveSupabaseService.findSessionByRoomCode(client, roomCode);
        if (response.error) {
          throw response.error;
        }
        if (!response.data) {
          throw new Error(`No open room found for ${roomCode}.`);
        }

        await joinAlpacapardyLiveRoom(response.data.id);
        state.live.joinCodeDraft = "";
      } catch (error) {
        state.live.status = "idle";
        state.live.error = error.message || "Unable to join that room.";
        render();
      }
    }

    function buildAlpacapardyLiveSettings(experience) {
      return {
        setupTeamCount: experience.setupTeamCount,
        setupCategoryIds: experience.setupCategoryIds || [],
        selectionLens: state.selection.lens,
        targetId: state.selection.targetId,
        targetIds: state.selection.targetIds || []
      };
    }

    function applyAlpacapardyLiveSettings(settings = {}) {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy") {
        return;
      }

      if (Number.isInteger(settings.setupTeamCount)) {
        experience.setupTeamCount = settings.setupTeamCount;
      }
      if (Array.isArray(settings.setupCategoryIds) && settings.setupCategoryIds.length) {
        experience.setupCategoryIds = settings.setupCategoryIds.slice(0, GAME_CONFIG.jeopardyMinGroups);
      }
    }

    async function syncAlpacapardyLiveSettings() {
      if (!state.live.currentSession || !getAlpacapardyLiveIdentityContext().isHost) {
        return;
      }

      const client = getSupabaseClient();
      const response = await alpacapardyLiveSupabaseService.updateSession(client, state.live.currentSession.id, {
        max_players: state.experience.setupTeamCount,
        settings: buildAlpacapardyLiveSettings(state.experience)
      });
      if (!response.error) {
        state.live.currentSession = response.data;
      }
    }

    function subscribeAlpacapardySession(sessionId) {
      const client = getSupabaseClient();
      if (!client || !sessionId || !alpacapardyLiveSupabaseService) {
        return;
      }

      if (state.live.sessionChannel) {
        alpacapardyLiveSupabaseService.removeChannel(client, state.live.sessionChannel);
      }

      state.live.sessionChannel = alpacapardyLiveSupabaseService.subscribeToSession(client, sessionId, {
        onEvent: (event) => {
          applyLiveEvent(event);
          syncAlpacapardyLiveNow({ renderAfter: true });
        },
        onPlayersChanged: () => {
          refreshAlpacapardyLivePlayers();
          syncAlpacapardyLiveNow({ renderAfter: true });
        },
        onSessionChanged: (session) => {
          const previousStatus = state.live.currentSession?.status;
          state.live.currentSession = session;
          state.live.selectedGameType = normalizeLiveGameType(session.game_type);
          if (normalizeLiveGameType(session.game_type) === "alpacapardy" && session.settings) {
            applyAlpacapardyLiveSettings(session.settings);
          }
          maybeStartLiveLaunchCountdown(previousStatus, session);
          syncAlpacapardyLiveNow({ renderAfter: true });
          renderLiveSurfaces();
        }
      });
    }

    async function refreshAlpacapardyLivePlayers() {
      if (!state.live.currentSession || !alpacapardyLiveSupabaseService) {
        return;
      }

      const client = getSupabaseClient();
      const { data: players, error } = await alpacapardyLiveSupabaseService.fetchPlayers(client, state.live.currentSession.id);
      if (error) {
        return;
      }

      state.live.players = (players || []).sort(compareLivePlayers);
      state.live.currentPlayer = state.live.players.find((player) => player.user_id === state.auth.session?.user?.id) || state.live.currentPlayer;
      maybeAutoStartReadyLiveGame();
      renderLiveSurfaces();
    }

    function startAlpacapardyLiveHeartbeat() {
      clearAlpacapardyLiveHeartbeat();
      const beat = async () => {
        if (!state.live.currentSession || !state.live.currentPlayer || !alpacapardyLiveSupabaseService) {
          return;
        }

        const client = getSupabaseClient();
        await alpacapardyLiveSupabaseService.heartbeatPlayer(client, state.live.currentPlayer.id);
        if (getAlpacapardyLiveIdentityContext().isHost) {
          const response = await alpacapardyLiveSupabaseService.heartbeatHost(client, state.live.currentSession.id);
          if (!response.error && response.data) {
            state.live.currentSession = response.data;
          }
        }
      };

      beat();
      state.live.heartbeatId = window.setInterval(beat, 25000);
    }

    function maybeStartLiveLaunchCountdown(previousStatus, session) {
      if (
        !session ||
        session.status !== "playing" ||
        previousStatus === "playing" ||
        state.live.launchCountdownSessionId === session.id
      ) {
        return;
      }

      startLiveLaunchCountdown(session.id);
    }

    function startLiveLaunchCountdown(sessionId) {
      clearLiveLaunchCountdown();
      state.live.launchCountdownSessionId = sessionId;
      const steps = ["3", "2", "1", "Let's go"];
      let index = 0;

      const advance = () => {
        state.live.launchCountdownText = steps[index] || "";
        renderLiveSurfaces();
        index += 1;
        if (index <= steps.length) {
          liveLaunchCountdownTimerId = window.setTimeout(advance, index === steps.length ? 1000 : 850);
          return;
        }
        state.live.launchCountdownText = "";
        liveLaunchCountdownTimerId = null;
        renderLiveSurfaces();
      };

      advance();
    }

    function maybeAutoStartReadyLiveGame() {
      if (
        state.live.autoStartBusy ||
        !state.live.currentSession ||
        state.live.currentSession.status !== "lobby" ||
        !getAlpacapardyLiveIdentityContext().isHost
      ) {
        return;
      }

      const gameType = getCurrentLiveGameType();
      const canStart = gameType === "alpacapardy"
        ? getAlpacapardyLiveRenderContext().canStart
        : canStartSelectedLiveGame();
      if (!canStart) {
        return;
      }

      state.live.autoStartBusy = true;
      window.setTimeout(async () => {
        if (!state.live.currentSession || state.live.currentSession.status !== "lobby") {
          state.live.autoStartBusy = false;
          return;
        }
        if (getCurrentLiveGameType() === "alpacapardy") {
          await startAlpacapardyLiveGame();
        } else {
          await startSelectedLiveGame();
        }
        state.live.autoStartBusy = false;
      }, 900);
    }

    async function syncAlpacapardyLiveEvents() {
      if (!state.live.currentSession || !alpacapardyLiveSupabaseService) {
        return;
      }

      const client = getSupabaseClient();
      const { data: events, error } = await alpacapardyLiveSupabaseService.fetchEventsSince(
        client,
        state.live.currentSession.id,
        state.live.revision
      );
      if (error) {
        state.live.error = error.message;
        return;
      }

      (events || []).forEach((event) => applyLiveEvent(event));
    }

    function applyLiveEvent(row) {
      if (!row || row.revision <= state.live.revision) {
        return;
      }

      if (String(row.event_type || "").startsWith("alpacapardy.")) {
        applyAlpacapardyLiveEvent(row);
        return;
      }

      applyArcadeLiveEvent(row);
    }

    function applyAlpacapardyLiveEvent(row) {
      if (!row || !alpacapardyLive || row.revision <= state.live.revision) {
        return;
      }

      const liveState = alpacapardyLive.reduce(extractAlpacapardyLiveState(state.experience), {
        type: row.event_type,
        payload: row.payload || {}
      }, {
        afterFinished: (nextState) => {
          finalizeSessionStats(nextState.answers, getBestStreakFromAnswers(nextState.answers), {
            type: "jeopardy",
            score: getHighestTeamScore(nextState.teams),
            teamOneScore: Number(nextState.teams[0]?.score) || 0
          });
        }
      });

      state.live.revision = row.revision;
      mergeAlpacapardyLiveState(liveState);
      render();
      if (state.experience?.active && !state.experience.active.revealed) {
        startJeopardyTimer();
      }
    }

    function extractAlpacapardyLiveState(experience) {
      return alpacapardyLive.createState({
        board: experience?.board || [],
        teams: experience?.teams || [],
        activeTeamIndex: experience?.activeTeamIndex || 0,
        active: experience?.active || null,
        answers: experience?.answers || [],
        chat: experience?.chat || [],
        finished: experience?.finished || false,
        forfeit: experience?.forfeit || null
      });
    }

    function mergeAlpacapardyLiveState(liveState) {
      const experience = state.experience;
      if (!experience || experience.type !== "jeopardy") {
        return;
      }

      experience.started = liveState.started;
      experience.finished = liveState.finished;
      experience.board = liveState.board || [];
      experience.teams = liveState.teams || [];
      experience.activeTeamIndex = liveState.activeTeamIndex || 0;
      experience.active = liveState.active || null;
      experience.answers = liveState.answers || [];
      experience.chat = liveState.chat || experience.chat || [];
      experience.forfeit = liveState.forfeit || null;
    }

    async function emitAlpacapardyLiveEvent(event) {
      return emitLiveEvent(event);
    }

    async function emitLiveEvent(event) {
      if (!state.live.currentSession || !state.live.currentPlayer || !event || !alpacapardyLiveSupabaseService) {
        return null;
      }

      const client = getSupabaseClient();
      const response = await alpacapardyLiveSupabaseService.appendEventWithNextRevision(client, {
        sessionId: state.live.currentSession.id,
        playerId: state.live.currentPlayer.id,
        type: event.type,
        payload: event.payload
      });

      if (response.error) {
        state.live.error = response.error.message;
        renderLiveSurfaces();
        return null;
      }

      applyLiveEvent(response.data);
      return response.data;
    }

    function applyArcadeLiveEvent(row) {
      const eventType = String(row.event_type || "");
      const gameType = normalizeLiveGameType(eventType.split(".")[0]);
      state.live.selectedGameType = gameType;
      state.live.arcadeState = reduceArcadeLiveState(getArcadeState(gameType), {
        type: eventType,
        payload: row.payload || {}
      });
      state.live.revision = row.revision;
      renderLiveSurfaces();
    }

    function reduceArcadeLiveState(currentState, event) {
      const next = clonePlain(currentState || createEmptyArcadeState(event.type.split(".")[0]));
      const payload = event.payload || {};
      const gameType = next.gameType;

      if (event.type.endsWith(".color_selected")) {
        next.colorsByUserId = {
          ...(next.colorsByUserId || {}),
          [payload.userId]: payload.colorId
        };
        return next;
      }

      if (event.type.endsWith(".started")) {
        return {
          ...createEmptyArcadeState(gameType),
          ...payload.state,
          gameType,
          started: true,
          finished: false
        };
      }

      if (gameType === "run") {
        return reduceLiveRunState(next, event);
      }
      if (gameType === "quiz") {
        return reduceLiveQuizState(next, event);
      }
      if (gameType === "race") {
        return reduceLiveRaceState(next, event);
      }
      if (gameType === "alpaquiz") {
        return reduceLiveAlpaquizState(next, event);
      }

      return next;
    }

    function reduceLiveRunState(stateValue, event) {
      const next = stateValue;
      const payload = event.payload || {};
      const userId = payload.userId;
      const progress = next.progress?.[userId] || { index: 0, stage: 0, score: 0 };
      const question = next.questionsByUserId?.[userId]?.[progress.index];

      if (event.type === "run.answered" && userId && question && !progress.revealed) {
        const correct = payload.optionIndex === question.answerIndex;
        next.progress = {
          ...(next.progress || {}),
          [userId]: {
            ...progress,
            selectedIndex: payload.optionIndex,
            revealed: true,
            lastCorrect: correct,
            stage: correct ? Math.min((progress.stage || 0) + 1, GAME_CONFIG.runRegionalLevelOneCount) : Math.max(0, (progress.stage || 0) - 1),
            score: (progress.score || 0) + (correct ? 1 : 0)
          }
        };
        return next;
      }

      if (event.type === "run.continued" && userId) {
        const updated = next.progress?.[userId] || progress;
        const nextIndex = (updated.index || 0) + 1;
        const finished = nextIndex >= (next.questionsByUserId?.[userId] || []).length ||
          (updated.stage || 0) >= GAME_CONFIG.runRegionalLevelOneCount;
        next.progress = {
          ...(next.progress || {}),
          [userId]: {
            ...updated,
            index: nextIndex,
            revealed: false,
            selectedIndex: null,
            lastCorrect: null,
            finished
          }
        };
        next.finished = Object.values(next.progress).some((entry) => entry.finished);
        next.winnerUserId = Object.entries(next.progress).sort((left, right) => (right[1].stage || 0) - (left[1].stage || 0))[0]?.[0] || null;
        return next;
      }

      return next;
    }

    function reduceLiveQuizState(stateValue, event) {
      const next = stateValue;
      const payload = event.payload || {};
      const question = next.questions?.[next.questionIndex];
      const answers = next.answers?.[next.questionIndex] || {};

      if (event.type === "quiz.answered" && payload.userId && question && !answers[payload.userId] && !next.revealed) {
        const correct = payload.optionIndex === question.answerIndex;
        next.answers = {
          ...(next.answers || {}),
          [next.questionIndex]: {
            ...answers,
            [payload.userId]: { optionIndex: payload.optionIndex, correct }
          }
        };
        next.scoresByUserId = {
          ...(next.scoresByUserId || {}),
          [payload.userId]: (next.scoresByUserId?.[payload.userId] || 0) + (correct ? 100 : 0)
        };
        return next;
      }

      if (event.type === "quiz.revealed") {
        next.revealed = true;
        return next;
      }

      if (event.type === "quiz.next_question") {
        if (next.questionIndex >= next.questions.length - 1) {
          next.finished = true;
          next.revealed = true;
          return next;
        }
        next.questionIndex += 1;
        next.revealed = false;
        next.revealAt = Number(payload.revealAt) || Date.now() + ((LIVE_GAME_TYPES.quiz.timerSeconds || 20) * 1000);
        return next;
      }

      return next;
    }

    function reduceLiveRaceState(stateValue, event) {
      const next = stateValue;
      const payload = event.payload || {};
      const question = next.questions?.[next.questionIndex];

      if (event.type === "race.answered" && payload.userId === next.activeUserId && question && !next.revealed && !next.finished) {
        const correct = payload.optionIndex === question.answerIndex;
        const lives = next.livesByUserId?.[payload.userId] ?? 3;
        const nextLives = correct ? lives : Math.max(0, lives - 1);
        next.selectedIndex = payload.optionIndex;
        next.lastCorrect = correct;
        next.revealed = true;
        next.livesByUserId = {
          ...(next.livesByUserId || {}),
          [payload.userId]: nextLives
        };
        if (nextLives <= 0) {
          next.finished = true;
          next.winnerUserId = (next.playerOrder || []).find((userId) => userId !== payload.userId) || null;
        }
        return next;
      }

      if (event.type === "race.next_turn" && !next.finished) {
        const order = next.playerOrder || [];
        const currentIndex = Math.max(0, order.indexOf(next.activeUserId));
        next.activeUserId = order[(currentIndex + 1) % Math.max(1, order.length)] || next.activeUserId;
        next.questionIndex = (next.questionIndex + 1) % Math.max(1, next.questions.length);
        next.revealed = false;
        next.selectedIndex = null;
        next.lastCorrect = null;
        return next;
      }

      return next;
    }

    function reduceLiveAlpaquizState(stateValue, event) {
      const next = stateValue;
      const payload = event.payload || {};
      const question = next.questions?.[next.questionIndex];

      if (event.type === "alpaquiz.buzzed" && payload.userId && !next.buzzedUserId && !next.revealed) {
        next.buzzedUserId = payload.userId;
        next.answerDeadlineAt = Date.now() + ((LIVE_GAME_TYPES.alpaquiz.answerSeconds || 4) * 1000);
        next.selectedIndex = null;
        next.pendingRevealAt = null;
        return next;
      }

      if (event.type === "alpaquiz.answered" && payload.userId === next.buzzedUserId && question && !next.revealed && !Number.isInteger(next.selectedIndex)) {
        const correct = payload.optionIndex === question.answerIndex;
        next.selectedIndex = payload.optionIndex;
        next.lastCorrect = correct;
        next.pendingRevealAt = Date.now() + 2000;
        next.answerDeadlineAt = null;
        const scores = { ...(next.scoresByUserId || {}) };
        if (correct) {
          scores[payload.userId] = (scores[payload.userId] || 0) + 100;
        } else {
          (next.playerOrder || []).filter((userId) => userId !== payload.userId).forEach((userId) => {
            scores[userId] = (scores[userId] || 0) + 100;
          });
        }
        next.scoresByUserId = scores;
        return next;
      }

      if (event.type === "alpaquiz.revealed" && Number.isInteger(next.selectedIndex)) {
        next.revealed = true;
        next.pendingRevealAt = null;
        next.answerDeadlineAt = null;
        return next;
      }

      if (event.type === "alpaquiz.next_question") {
        if (next.questionIndex >= next.questions.length - 1) {
          next.finished = true;
          next.revealed = true;
          return next;
        }
        next.questionIndex += 1;
        next.buzzedUserId = null;
        next.selectedIndex = null;
        next.lastCorrect = null;
        next.answerDeadlineAt = null;
        next.pendingRevealAt = null;
        next.revealed = false;
        return next;
      }

      return next;
    }

    function canStartSelectedLiveGame() {
      if (!state.live.currentSession || !getAlpacapardyLiveIdentityContext().isHost) {
        return false;
      }
      const gameType = getCurrentLiveGameType();
      const game = LIVE_GAME_TYPES[gameType] || LIVE_GAME_TYPES.run;
      const players = getLivePlayablePlayers();
      if (players.length < game.minPlayers || players.length > game.maxPlayers) {
        return false;
      }
      return true;
    }

    async function startSelectedLiveGame() {
      const gameType = getCurrentLiveGameType();
      if (gameType === "alpacapardy") {
        startAlpacapardyLiveGame();
        return;
      }
      if (!canStartSelectedLiveGame()) {
        state.live.error = `${getLiveGameLabel(gameType)} needs enough alpacas before starting.`;
        renderLiveSurfaces();
        return;
      }

      state.live.status = "starting";
      state.live.error = "";
      renderLiveSurfaces();

      const players = getLivePlayablePlayers();
      const statePayload = buildArcadeStartState(gameType, players);
      const event = await emitLiveEvent({
        type: `${gameType}.started`,
        payload: { state: statePayload }
      });

      if (!event) {
        state.live.status = "idle";
        renderLiveSurfaces();
        return;
      }

      const client = getSupabaseClient();
      const updated = await alpacapardyLiveSupabaseService.updateSession(client, state.live.currentSession.id, {
        status: "playing",
        is_open: false,
        current_state: statePayload,
        settings: {
          ...(state.live.currentSession.settings || {}),
          gameType,
          allThemes: true
        }
      });
      if (!updated.error) {
        const previousStatus = state.live.currentSession?.status;
        state.live.currentSession = updated.data;
        maybeStartLiveLaunchCountdown(previousStatus, updated.data);
      } else {
        state.live.error = updated.error.message || "Unable to start live game.";
      }
      await refreshAlpacapardyLiveSessionState({ renderAfter: true });
      state.live.status = "idle";
      renderLiveSurfaces();
    }

    function getLiveRunColorAssignments(players) {
      const existing = { ...(getArcadeState("run").colorsByUserId || {}) };
      const assignments = {};
      const used = new Set();
      const palette = LIVE_ALPACA_COLORS.map((color) => color.id);
      const fallbackColor = palette[0] || "cream";
      const currentUserId = state.auth.session?.user?.id || "";
      const hostUserId = state.live.currentSession?.host_user_id || currentUserId;
      const preferredByUserId = {
        ...(hostUserId ? { [hostUserId]: getLiveRunSetupColorId() } : {}),
        ...(currentUserId ? { [currentUserId]: getLiveRunSetupColorId() } : {})
      };

      players.forEach((player) => {
        const preferred = existing[player.user_id] || preferredByUserId[player.user_id] || "";
        const colorId = palette.includes(preferred) && !used.has(preferred)
          ? preferred
          : palette.find((candidate) => !used.has(candidate)) || fallbackColor;
        assignments[player.user_id] = colorId;
        used.add(colorId);
      });

      return assignments;
    }

    function buildArcadeStartState(gameType, players) {
      const playerOrder = players.map((player) => player.user_id);
      const scoresByUserId = Object.fromEntries(playerOrder.map((userId) => [userId, 0]));
      if (gameType === "run") {
        const questionsByUserId = Object.fromEntries(players.map((player, index) => [
          player.user_id,
          buildAllThemeQuestionSequence([1, 1, 2, 2, 3, 3, 4, 4, 5, 5], true, index)
        ]));
        return {
          ...getArcadeState("run"),
          gameType,
          started: true,
          colorsByUserId: getLiveRunColorAssignments(players),
          questionsByUserId,
          progress: Object.fromEntries(playerOrder.map((userId) => [userId, { index: 0, stage: 0, score: 0, revealed: false }])),
          playerOrder
        };
      }

      if (gameType === "quiz") {
        return {
          gameType,
          started: true,
          finished: false,
          questionIndex: 0,
          revealed: false,
          revealAt: Date.now() + ((LIVE_GAME_TYPES.quiz.timerSeconds || 20) * 1000),
          questions: buildAllThemeQuestionSequence([1, 2, 3, 4, 5, 1, 2, 3, 4, 5], true),
          answers: {},
          scoresByUserId,
          playerOrder
        };
      }

      if (gameType === "race") {
        return {
          gameType,
          started: true,
          finished: false,
          questionIndex: 0,
          activeUserId: playerOrder[0],
          playerOrder,
          questions: buildAllThemeQuestionSequence(Array.from({ length: 24 }, (_, index) => (index % 5) + 1), true),
          livesByUserId: Object.fromEntries(playerOrder.map((userId) => [userId, 3])),
          scoresByUserId
        };
      }

      return {
        gameType: "alpaquiz",
        started: true,
        finished: false,
        questionIndex: 0,
        questions: buildAllThemeQuestionSequence(Array.from({ length: LIVE_GAME_TYPES.alpaquiz.questionCount }, (_, index) => (index % 5) + 1), true),
        scoresByUserId,
        playerOrder,
        buzzedUserId: null,
        answerDeadlineAt: null,
        pendingRevealAt: null,
        selectedIndex: null,
        lastCorrect: null,
        revealed: false
      };
    }

    function buildAllThemeQuestionSequence(pattern, allowReuse = true, salt = 0) {
      const pools = buildRawQuestionPoolsFromEntries(getRawEntriesForRouteSelection("section", "all"));
      const rotatedPattern = pattern.slice(salt).concat(pattern.slice(0, salt));
      return buildPatternQuestionSequence(rotatedPattern, pools, allowReuse);
    }

    async function selectLiveAlpacaColor(colorId) {
      if (getCurrentLiveGameType() !== "run" || !state.live.currentPlayer) {
        return;
      }
      const color = LIVE_ALPACA_COLORS.find((entry) => entry.id === colorId);
      if (!color) {
        return;
      }
      const colors = getArcadeState("run").colorsByUserId || {};
      const usedByOther = Object.entries(colors).some(([userId, usedColor]) =>
        userId !== state.auth.session?.user?.id && usedColor === colorId
      );
      if (usedByOther) {
        return;
      }
      await emitLiveEvent({
        type: "run.color_selected",
        payload: {
          userId: state.auth.session?.user?.id || null,
          colorId
        }
      });
    }

    async function answerSelectedLiveGame(optionIndex) {
      const gameType = getCurrentLiveGameType();
      const userId = state.auth.session?.user?.id || null;
      if (!userId || !Number.isInteger(optionIndex)) {
        return;
      }

      const arcadeState = getArcadeState(gameType);
      if (gameType === "run") {
        const progress = arcadeState.progress?.[userId] || {};
        if (progress.revealed || progress.finished) {
          return;
        }
      }
      if (gameType === "quiz" && (arcadeState.revealed || arcadeState.answers?.[arcadeState.questionIndex]?.[userId])) {
        return;
      }
      if (gameType === "race" && (arcadeState.activeUserId !== userId || arcadeState.revealed || arcadeState.finished)) {
        return;
      }
      if (gameType === "alpaquiz" && (
        arcadeState.buzzedUserId !== userId ||
        arcadeState.revealed ||
        arcadeState.finished ||
        Number.isInteger(arcadeState.selectedIndex)
      )) {
        return;
      }

      await emitLiveEvent({
        type: `${gameType}.answered`,
        payload: {
          userId,
          optionIndex
        }
      });
    }

    async function advanceSelectedLiveGame() {
      const gameType = getCurrentLiveGameType();
      const arcadeState = getArcadeState(gameType);
      const userId = state.auth.session?.user?.id || null;
      if (gameType === "run") {
        await emitLiveEvent({ type: "run.continued", payload: { userId } });
        return;
      }
      if (gameType === "quiz") {
        await emitLiveEvent({
          type: arcadeState.revealed ? "quiz.next_question" : "quiz.revealed",
          payload: arcadeState.revealed ? { revealAt: Date.now() + ((LIVE_GAME_TYPES.quiz.timerSeconds || 20) * 1000) } : {}
        });
        return;
      }
      if (gameType === "race") {
        await emitLiveEvent({ type: "race.next_turn", payload: {} });
        return;
      }
      if (gameType === "alpaquiz") {
        await emitLiveEvent({ type: "alpaquiz.next_question", payload: {} });
      }
    }

    async function buzzSelectedLiveGame() {
      if (getCurrentLiveGameType() !== "alpaquiz") {
        return;
      }
      const userId = state.auth.session?.user?.id || null;
      const arcadeState = getArcadeState("alpaquiz");
      if (!userId || arcadeState.buzzedUserId || arcadeState.revealed || arcadeState.finished) {
        return;
      }
      await emitLiveEvent({ type: "alpaquiz.buzzed", payload: { userId } });
    }

    function getArcadeLeaderboard(arcadeState, players) {
      return players.map((player) => ({
        userId: player.user_id,
        name: player.display_name,
        score: Number(arcadeState.scoresByUserId?.[player.user_id]) || 0
      })).sort((left, right) => right.score - left.score || left.name.localeCompare(right.name));
    }

    function clonePlain(value) {
      return JSON.parse(JSON.stringify(value || {}));
    }

    async function startAlpacapardyLiveGame() {
      const experience = state.experience;
      if (!isAlpacapardyLiveActive() || !getAlpacapardyLiveIdentityContext().isHost || experience.started) {
        return;
      }

      try {
        state.live.status = "starting";
        state.live.error = "";
        renderLiveSurfaces();
        await refreshAlpacapardyLiveSessionState({ renderAfter: true });
        if (experience.started) {
          state.live.status = "idle";
          renderLiveSurfaces();
          return;
        }

        const players = state.live.players.filter((player) => ["host", "player"].includes(player.role)).sort(compareLivePlayers);
        if (players.length < 2 || players.length > GAME_CONFIG.jeopardyMaxTeams) {
          state.live.status = "idle";
          state.live.error = "Live Alpacapardy needs 2 to 4 players.";
          renderLiveSurfaces();
          return;
        }

        const board = buildConfiguredJeopardyBoard(experience.setupCategoryIds);
        const teams = alpacapardyEngine.createTeamsFromPlayers(players);
        const startedEvent = await emitAlpacapardyLiveEvent(alpacapardyLive.createBoardStartedEvent({ board, teams, activeTeamIndex: 0 }));
        if (!startedEvent) {
          state.live.status = "idle";
          renderLiveSurfaces();
          return;
        }

        const client = getSupabaseClient();
        const updated = await alpacapardyLiveSupabaseService.updateSession(client, state.live.currentSession.id, {
          status: "playing",
          is_open: false,
          board_state: { board },
          current_state: { activeTeamIndex: 0 },
          settings: buildAlpacapardyLiveSettings(experience)
        });
        if (!updated.error) {
          const previousStatus = state.live.currentSession?.status;
          state.live.currentSession = updated.data;
          state.live.selectedGameType = "alpacapardy";
          maybeStartLiveLaunchCountdown(previousStatus, updated.data);
        } else {
          state.live.error = updated.error.message || "Unable to mark the room as playing.";
        }
        await refreshAlpacapardyLiveSessionState({ renderAfter: true });
        state.live.status = "idle";
        renderLiveSurfaces();
      } catch (error) {
        state.live.status = "idle";
        state.live.error = error.message || "Unable to start Alpacapardy.";
        renderLiveSurfaces();
      }
    }

    async function sendAlpacapardyLiveChat(formData) {
      if (!isAlpacapardyLiveActive() || !state.live.currentPlayer) {
        return;
      }

      const message = String(formData.get("message") || "").trim();
      if (!message) {
        return;
      }

      await emitAlpacapardyLiveEvent(alpacapardyLive.createChatMessageEvent({
        playerId: state.live.currentPlayer.id,
        userId: state.auth.session?.user?.id || null,
        displayName: state.live.currentPlayer.display_name || getLiveDisplayName(),
        message
      }));
    }

    async function leaveAlpacapardyLiveRoom() {
      if (!state.live.currentSession || !state.live.currentPlayer || !alpacapardyLiveSupabaseService) {
        resetAlpacapardyLiveState();
        renderLiveSurfaces();
        return;
      }

      const client = getSupabaseClient();
      const userId = state.auth.session?.user?.id || null;
      const isHost = getAlpacapardyLiveIdentityContext().isHost;
      const gameType = getCurrentLiveGameType();
      const wasStarted = gameType === "alpacapardy"
        ? Boolean(state.experience?.started && !state.experience?.finished)
        : Boolean(state.live.currentSession?.status === "playing" && !state.live.arcadeState?.finished);

      try {
        if (isHost) {
          if (wasStarted) {
            const winner = state.live.players.find((player) => player.user_id !== userId && ["host", "player"].includes(player.role));
            if (winner && gameType === "alpacapardy") {
              await emitAlpacapardyLiveEvent(alpacapardyLive.createSessionForfeitedEvent({
                forfeitingUserId: userId,
                winnerUserId: winner.user_id,
                reason: "host_left"
              }));
            }
            await alpacapardyLiveSupabaseService.closeSession(client, state.live.currentSession.id, {
              status: "finished",
              reason: "host_left"
            });
          } else {
            await alpacapardyLiveSupabaseService.closeSession(client, state.live.currentSession.id, {
              status: "abandoned",
              reason: "host_left_lobby"
            });
          }
        } else {
          await alpacapardyLiveSupabaseService.leaveSession(client, state.live.currentPlayer.id);
        }
      } catch (error) {
        state.live.error = error.message || "Unable to leave room cleanly.";
      }

      resetAlpacapardyLiveState();
      if (state.experience?.type === "jeopardy") {
        const playMode = state.experience.playMode || "multiplayer";
        state.experience = buildJeopardyExperience();
        state.experience.playMode = playMode;
      }
      render();
    }

    return {
      canAccessLegacyLiveRooms,
      getLegacyLiveRoomsDisabledMessage,
      canAccessMultiplayer,
      ensureLiveAuthSession,
      getLiveDisplayName,
      resetAlpacapardyLiveState,
      returnToAlpacaOnlineHub,
      getLiveWaitingVideoIndex,
      navigateLiveWaitingVideo,
      getLiveWaitingVideos,
      isShortLiveWaitingVideo,
      getVideoDurationSeconds,
      getLiveRunSetupColorId,
      selectLiveRunSetupColor,
      normalizeLiveGameType,
      getCurrentLiveGameType,
      getLiveGameLabel,
      compareLivePlayers,
      getLivePlayablePlayers,
      createEmptyArcadeState,
      getArcadeState,
      chooseOnlineGameType,
      getAlpacapardyLiveRenderContext,
      isAlpacapardyLiveActive,
      guardMultiplayerAccess,
      canOpenAlpacapardyLiveTile,
      canAnswerAlpacapardyLiveFocus,
      canCloseAlpacapardyLiveFocus,
      getAlpacapardyLiveIdentityContext,
      clearAlpacapardyLiveHeartbeat,
      clearAlpacapardyLiveSync,
      clearLiveLaunchCountdown,
      clearAlpacapardyLiveSubscriptions,
      refreshAlpacapardyLiveLobby,
      subscribeAlpacapardyLobby,
      refreshAlpacapardyLiveLobbySilently,
      startAlpacapardyLiveSync,
      syncAlpacapardyLiveNow,
      maybeAutoRevealTimedLiveGame,
      maybeAutoResolveTimedAlpaquiz,
      refreshAlpacapardyLiveSessionState,
      createSelectedLiveGameRoom,
      createArcadeLiveRoom,
      createAlpacapardyLiveRoom,
      joinAlpacapardyLiveRoom,
      joinAlpacapardyLiveRoomByCode,
      buildAlpacapardyLiveSettings,
      applyAlpacapardyLiveSettings,
      syncAlpacapardyLiveSettings,
      subscribeAlpacapardySession,
      refreshAlpacapardyLivePlayers,
      startAlpacapardyLiveHeartbeat,
      maybeStartLiveLaunchCountdown,
      startLiveLaunchCountdown,
      maybeAutoStartReadyLiveGame,
      syncAlpacapardyLiveEvents,
      applyLiveEvent,
      applyAlpacapardyLiveEvent,
      extractAlpacapardyLiveState,
      mergeAlpacapardyLiveState,
      emitAlpacapardyLiveEvent,
      emitLiveEvent,
      applyArcadeLiveEvent,
      reduceArcadeLiveState,
      reduceLiveRunState,
      reduceLiveQuizState,
      reduceLiveRaceState,
      reduceLiveAlpaquizState,
      canStartSelectedLiveGame,
      startSelectedLiveGame,
      getLiveRunColorAssignments,
      buildArcadeStartState,
      buildAllThemeQuestionSequence,
      selectLiveAlpacaColor,
      answerSelectedLiveGame,
      advanceSelectedLiveGame,
      buzzSelectedLiveGame,
      getArcadeLeaderboard,
      clonePlain,
      startAlpacapardyLiveGame,
      sendAlpacapardyLiveChat,
      leaveAlpacapardyLiveRoom
    };
  }

  global.WSC_CREATE_LEGACY_LIVE_ROOM_CONTROLLER = createLegacyLiveRoomController;
})(window);
