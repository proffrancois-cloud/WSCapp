(function () {
  const SCHEMA = "campus2d.debate.rules.v1";
  const MIN_TEAM_SIZE = 2;
  const MAX_TEAM_SIZE = 3;
  const MAX_DEBATERS = 6;
  const TEAM_SIDES = Object.freeze(["pro", "con"]);
  const PHASE_DURATIONS = Object.freeze({
    prep: 300,
    transition: 60,
    speech: 180,
    judgeFinal: 60,
    noJudgeFinal: 120
  });

  function normalizeSide(side) {
    return side === "con" ? "con" : "pro";
  }

  function getSideLabel(side) {
    return normalizeSide(side) === "con" ? "CON" : "PRO";
  }

  function getParticipantName(participant) {
    return participant?.displayName || "Guest";
  }

  function getAllDebaters(state) {
    return TEAM_SIDES.flatMap((side) => state?.teams?.[side] || []);
  }

  function getAllRegisteredParticipants(state) {
    const participants = getAllDebaters(state);
    if (state?.judge) {
      participants.push(state.judge);
    }
    return participants;
  }

  function getLocalRole(state, clientId) {
    if (!state || !clientId) {
      return "";
    }
    if ((state.teams?.pro || []).some((participant) => participant.clientId === clientId)) {
      return "pro";
    }
    if ((state.teams?.con || []).some((participant) => participant.clientId === clientId)) {
      return "con";
    }
    if (state.judge?.clientId === clientId) {
      return "judge";
    }
    return "audience";
  }

  function getLocalParticipant(state, clientId) {
    const role = getLocalRole(state, clientId);
    if (role === "judge") {
      return state?.judge || null;
    }
    if (TEAM_SIDES.includes(role)) {
      return (state.teams?.[role] || []).find((participant) => participant.clientId === clientId) || null;
    }
    return null;
  }

  function isHost(state, clientId) {
    return Boolean(state?.hostClientId && state.hostClientId === clientId);
  }

  function isBlocking(state) {
    return Boolean(state && ["setup", "running"].includes(state.status));
  }

  function getStartIssues(state) {
    if (!state) {
      return ["Create a Debate Lab room first."];
    }
    const proCount = state.teams?.pro?.length || 0;
    const conCount = state.teams?.con?.length || 0;
    const totalDebaters = proCount + conCount;
    const issues = [];
    if (proCount < MIN_TEAM_SIZE) {
      issues.push(`Need ${MIN_TEAM_SIZE - proCount} more PRO speaker${MIN_TEAM_SIZE - proCount === 1 ? "" : "s"}.`);
    }
    if (conCount < MIN_TEAM_SIZE) {
      issues.push(`Need ${MIN_TEAM_SIZE - conCount} more CON speaker${MIN_TEAM_SIZE - conCount === 1 ? "" : "s"}.`);
    }
    if (proCount > MAX_TEAM_SIZE || conCount > MAX_TEAM_SIZE || totalDebaters > MAX_DEBATERS) {
      issues.push("Teams are over the Debate Lab limit.");
    }
    if (state.judgeMode && !state.judge) {
      issues.push("Judge mode needs a judge.");
    }
    return issues;
  }

  function buildTimeline(state) {
    if (!state || state.status !== "running") {
      return [];
    }
    const phases = [
      { id: "prep", label: "5mn preparation", duration: PHASE_DURATIONS.prep, kind: "prep" }
    ];
    const speakerCount = Math.min(state.teams?.pro?.length || 0, state.teams?.con?.length || 0, MAX_TEAM_SIZE);
    for (let index = 0; index < Math.min(MAX_TEAM_SIZE, speakerCount); index += 1) {
      phases.push({ id: `transition-pro-${index + 1}`, label: "Transition", duration: PHASE_DURATIONS.transition, kind: "transition" });
      phases.push({
        id: `pro-${index + 1}`,
        label: `PRO speaker ${index + 1}: ${getParticipantName(state.teams.pro[index])}`,
        duration: PHASE_DURATIONS.speech,
        kind: "speech",
        side: "pro",
        speaker: state.teams.pro[index]
      });
      phases.push({ id: `transition-con-${index + 1}`, label: "Transition", duration: PHASE_DURATIONS.transition, kind: "transition" });
      phases.push({
        id: `con-${index + 1}`,
        label: `CON speaker ${index + 1}: ${getParticipantName(state.teams.con[index])}`,
        duration: PHASE_DURATIONS.speech,
        kind: "speech",
        side: "con",
        speaker: state.teams.con[index]
      });
    }
    phases.push(state.judgeMode && state.judge
      ? { id: "judge-final", label: `Judge ${getParticipantName(state.judge)}`, duration: PHASE_DURATIONS.judgeFinal, kind: "judge-final", speaker: state.judge }
      : { id: "no-judge-final", label: "Audience opinions", duration: PHASE_DURATIONS.noJudgeFinal, kind: "no-judge-final" });
    return phases;
  }

  function getClock(state, nowMs = Date.now()) {
    if (!state || state.status !== "running" || !state.startedAtMs) {
      return null;
    }
    const phases = buildTimeline(state);
    const elapsed = Math.max(0, Math.floor((nowMs - state.startedAtMs) / 1000));
    const total = phases.reduce((sum, phase) => sum + phase.duration, 0);
    let cursor = 0;
    for (const phase of phases) {
      if (elapsed < cursor + phase.duration) {
        return {
          phase,
          elapsed,
          total,
          phaseElapsed: elapsed - cursor,
          remaining: cursor + phase.duration - elapsed,
          totalRemaining: total - elapsed
        };
      }
      cursor += phase.duration;
    }
    return {
      phase: { id: "complete", label: "Complete", duration: 0, kind: "complete" },
      elapsed,
      total,
      phaseElapsed: 0,
      remaining: 0,
      totalRemaining: 0
    };
  }

  function getClockKey(clock, state = null) {
    return clock ? `${clock.phase.id}:${clock.phase.speaker?.clientId || ""}` : `${state?.status || "none"}`;
  }

  function getTeamClientIds(state, side) {
    return (state?.teams?.[normalizeSide(side)] || []).map((participant) => participant.clientId).filter(Boolean);
  }

  function createAudioRoute(state, localClientId, nowMs = Date.now()) {
    const role = getLocalRole(state, localClientId);
    const clock = getClock(state, nowMs);
    const base = {
      schema: SCHEMA,
      role,
      phase: clock?.phase || null,
      mode: "silent",
      label: "Audio idle",
      canSend: false,
      hear: "none",
      targetClientIds: [],
      speakerClientId: ""
    };
    if (!state || state.status !== "running" || !clock || clock.phase.kind === "complete") {
      return base;
    }
    if (clock.phase.kind === "prep" || clock.phase.kind === "transition") {
      if (!TEAM_SIDES.includes(role)) {
        return { ...base, label: "Team audio only" };
      }
      return {
        ...base,
        mode: "team",
        label: `${getSideLabel(role)} team audio`,
        canSend: true,
        hear: "team",
        targetClientIds: getTeamClientIds(state, role)
      };
    }
    if (clock.phase.kind === "speech") {
      const speakerClientId = clock.phase.speaker?.clientId || "";
      return {
        ...base,
        mode: "speaker",
        label: clock.phase.label,
        canSend: Boolean(localClientId && localClientId === speakerClientId),
        hear: "everyone",
        targetClientIds: [],
        speakerClientId
      };
    }
    if (clock.phase.kind === "judge-final") {
      const speakerClientId = state.judge?.clientId || "";
      return {
        ...base,
        mode: "judge",
        label: clock.phase.label,
        canSend: Boolean(localClientId && localClientId === speakerClientId),
        hear: "everyone",
        targetClientIds: [],
        speakerClientId
      };
    }
    if (clock.phase.kind === "no-judge-final") {
      return {
        ...base,
        mode: "open",
        label: "Open floor",
        canSend: true,
        hear: "everyone",
        targetClientIds: []
      };
    }
    return base;
  }

  function shouldHearPeer(route, peerClientId) {
    if (!route || !peerClientId || route.hear === "none") {
      return false;
    }
    if (route.mode === "speaker" || route.mode === "judge") {
      return peerClientId === route.speakerClientId;
    }
    if (route.hear === "everyone") {
      return true;
    }
    if (route.hear === "team") {
      return route.targetClientIds.includes(peerClientId);
    }
    return false;
  }

  function shouldConnectPeer(route, peerClientId) {
    if (!route || !peerClientId || route.hear === "none") {
      return false;
    }
    if (route.mode === "speaker" || route.mode === "judge") {
      return Boolean(route.canSend) || peerClientId === route.speakerClientId;
    }
    return shouldHearPeer(route, peerClientId);
  }

  window.WSC_CAMPUS_2D_DEBATE_RULES = Object.freeze({
    SCHEMA,
    MIN_TEAM_SIZE,
    MAX_TEAM_SIZE,
    MAX_DEBATERS,
    TEAM_SIDES,
    PHASE_DURATIONS,
    normalizeSide,
    getSideLabel,
    getParticipantName,
    getAllDebaters,
    getAllRegisteredParticipants,
    getLocalRole,
    getLocalParticipant,
    isHost,
    isBlocking,
    getStartIssues,
    buildTimeline,
    getClock,
    getClockKey,
    createAudioRoute,
    shouldHearPeer,
    shouldConnectPeer
  });
}());
