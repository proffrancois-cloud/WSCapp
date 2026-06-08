(function () {
  const TABLES = Object.freeze({
    sessions: "alpacapardy_live_sessions",
    players: "alpacapardy_live_players",
    events: "alpacapardy_live_events",
    snapshots: "alpacapardy_live_snapshots"
  });
  const SUPPORTED_GAME_TYPES = new Set(["alpacapardy", "run", "quiz", "race", "alpaquiz"]);

  function normalizeRoomCode(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 12);
  }

  function createRoomCode(length = 6) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    const size = Math.max(4, Math.min(12, Number(length) || 6));
    for (let index = 0; index < size; index += 1) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
  }

  function createSession(client, session) {
    const gameType = normalizeGameType(session.gameType || session.game_type || "alpacapardy");
    return client
      .from(TABLES.sessions)
      .insert({
        room_code: normalizeRoomCode(session.roomCode || createRoomCode()),
        game_type: gameType,
        host_user_id: session.hostUserId,
        status: session.status || "lobby",
        visibility: session.visibility || "public",
        max_players: clampPlayerCount(session.maxPlayers),
        is_open: session.isOpen !== false,
        theme_year: session.themeYear || 2026,
        settings: session.settings || {},
        board_state: session.boardState || {},
        current_state: session.currentState || {},
        host_last_seen_at: new Date().toISOString()
      })
      .select("*")
      .single();
  }

  function listOpenSessions(client, { limit = 20, gameType = null } = {}) {
    let query = client
      .from(TABLES.sessions)
      .select(`
        *,
        players:${TABLES.players} (
          id,
          user_id,
          display_name,
          role,
          team_index,
          is_guest,
          connection_status,
          joined_at,
          last_seen_at
        )
      `)
      .eq("visibility", "public")
      .eq("status", "lobby")
      .eq("is_open", true)
      .order("updated_at", { ascending: false });

    const normalizedGameType = gameType ? normalizeGameType(gameType) : "";
    if (normalizedGameType) {
      query = query.eq("game_type", normalizedGameType);
    }

    return query.limit(Math.max(1, Math.min(50, Number(limit) || 20)));
  }

  function findSessionByRoomCode(client, roomCode) {
    return client
      .from(TABLES.sessions)
      .select(`
        *,
        players:${TABLES.players} (
          id,
          user_id,
          display_name,
          role,
          team_index,
          is_guest,
          connection_status,
          joined_at,
          last_seen_at
        )
      `)
      .eq("room_code", normalizeRoomCode(roomCode))
      .maybeSingle();
  }

  function fetchSession(client, sessionId) {
    return client
      .from(TABLES.sessions)
      .select(`
        *,
        players:${TABLES.players} (
          id,
          user_id,
          display_name,
          role,
          team_index,
          is_guest,
          connection_status,
          joined_at,
          last_seen_at
        )
      `)
      .eq("id", sessionId)
      .maybeSingle();
  }

  function fetchPlayers(client, sessionId) {
    return client
      .from(TABLES.players)
      .select("*")
      .eq("session_id", sessionId)
      .order("team_index", { ascending: true });
  }

  function joinSession(client, player) {
    return client
      .from(TABLES.players)
      .upsert({
        session_id: player.sessionId,
        user_id: player.userId,
        display_name: player.displayName,
        role: player.role || "player",
        team_index: Number.isInteger(player.teamIndex) ? player.teamIndex : null,
        is_guest: Boolean(player.isGuest),
        connection_status: "online",
        last_seen_at: new Date().toISOString()
      }, { onConflict: "session_id,user_id" })
      .select("*")
      .single();
  }

  function heartbeatPlayer(client, playerId) {
    return client
      .from(TABLES.players)
      .update({
        connection_status: "online",
        last_seen_at: new Date().toISOString()
      })
      .eq("id", playerId)
      .select("*")
      .maybeSingle();
  }

  function heartbeatHost(client, sessionId) {
    return client
      .from(TABLES.sessions)
      .update({
        host_last_seen_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .select("*")
      .maybeSingle();
  }

  function updateSession(client, sessionId, patch) {
    return client
      .from(TABLES.sessions)
      .update({
        ...patch,
        updated_at: new Date().toISOString()
      })
      .eq("id", sessionId)
      .select("*")
      .single();
  }

  function closeSession(client, sessionId, { status = "abandoned", reason = "host_left" } = {}) {
    return updateSession(client, sessionId, {
      status,
      is_open: false,
      closed_reason: reason
    });
  }

  function leaveSession(client, playerId) {
    return client
      .from(TABLES.players)
      .update({
        connection_status: "offline",
        last_seen_at: new Date().toISOString()
      })
      .eq("id", playerId)
      .select("*")
      .maybeSingle();
  }

  function appendEvent(client, event) {
    return client
      .from(TABLES.events)
      .insert({
        session_id: event.sessionId,
        player_id: event.playerId || null,
        revision: event.revision,
        event_type: event.type,
        payload: event.payload || {}
      })
      .select("*")
      .single();
  }

  async function appendEventWithNextRevision(client, event, retryCount = 1) {
    const latest = await client
      .from(TABLES.events)
      .select("revision")
      .eq("session_id", event.sessionId)
      .order("revision", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest.error) {
      return latest;
    }

    const revision = Number(latest.data?.revision || 0) + 1;
    const inserted = await appendEvent(client, { ...event, revision });
    if (!inserted.error || retryCount <= 0) {
      return inserted;
    }

    return appendEventWithNextRevision(client, event, retryCount - 1);
  }

  function fetchEventsSince(client, sessionId, revision = 0) {
    return client
      .from(TABLES.events)
      .select("*")
      .eq("session_id", sessionId)
      .gt("revision", revision)
      .order("revision", { ascending: true });
  }

  function upsertSnapshot(client, snapshot) {
    return client
      .from(TABLES.snapshots)
      .upsert({
        session_id: snapshot.sessionId,
        revision: snapshot.revision,
        state: snapshot.state || {},
        updated_at: new Date().toISOString()
      }, { onConflict: "session_id" })
      .select("*")
      .single();
  }

  function fetchSnapshot(client, sessionId) {
    return client
      .from(TABLES.snapshots)
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();
  }

  function findNextTeamIndex(players = [], maxPlayers = 4) {
    const used = new Set(players
      .filter((player) => ["host", "player"].includes(player.role))
      .map((player) => Number(player.team_index))
      .filter(Number.isInteger));
    const max = clampPlayerCount(maxPlayers);
    for (let index = 0; index < max; index += 1) {
      if (!used.has(index)) {
        return index;
      }
    }
    return -1;
  }

  function normalizeGameType(gameType) {
    const normalized = String(gameType || "").trim().toLowerCase();
    return SUPPORTED_GAME_TYPES.has(normalized) ? normalized : "alpacapardy";
  }

  function subscribeToSession(client, sessionId, handlers = {}) {
    if (!client?.channel || !sessionId) {
      return null;
    }

    return client
      .channel(`alpacapardy-live:${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: TABLES.events,
        filter: `session_id=eq.${sessionId}`
      }, (payload) => handlers.onEvent?.(payload.new))
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: TABLES.players,
        filter: `session_id=eq.${sessionId}`
      }, (payload) => handlers.onPlayersChanged?.(payload))
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: TABLES.sessions,
        filter: `id=eq.${sessionId}`
      }, (payload) => handlers.onSessionChanged?.(payload.new))
      .subscribe((status) => handlers.onStatus?.(status));
  }

  function subscribeToLobby(client, handlers = {}) {
    if (!client?.channel) {
      return null;
    }

    return client
      .channel("alpacapardy-live:lobby")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: TABLES.sessions
      }, (payload) => handlers.onSessionsChanged?.(payload))
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: TABLES.players
      }, (payload) => handlers.onPlayersChanged?.(payload))
      .subscribe((status) => handlers.onStatus?.(status));
  }

  function removeChannel(client, channel) {
    if (!client || !channel || typeof client.removeChannel !== "function") {
      return null;
    }
    return client.removeChannel(channel);
  }

  function clampPlayerCount(value) {
    return Math.max(2, Math.min(4, Number(value) || 2));
  }

  window.WSC_ALPACAPARDY_LIVE_SUPABASE_SERVICE = Object.freeze({
    TABLES,
    supportedGameTypes: Array.from(SUPPORTED_GAME_TYPES),
    normalizeGameType,
    normalizeRoomCode,
    createRoomCode,
    createSession,
    listOpenSessions,
    findSessionByRoomCode,
    fetchSession,
    fetchPlayers,
    joinSession,
    heartbeatPlayer,
    heartbeatHost,
    updateSession,
    closeSession,
    leaveSession,
    appendEvent,
    appendEventWithNextRevision,
    fetchEventsSince,
    fetchSnapshot,
    findNextTeamIndex,
    subscribeToSession,
    subscribeToLobby,
    removeChannel,
    upsertSnapshot
  });
}());
