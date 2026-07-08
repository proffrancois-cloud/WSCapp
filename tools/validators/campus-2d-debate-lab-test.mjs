import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const repoRoot = resolve(import.meta.dirname, "../..");
const appRoot = resolve(repoRoot, "app");

function readApp(relativePath) {
  return readFileSync(resolve(appRoot, relativePath), "utf8");
}

function loadClassicScript(relativePath, sandbox) {
  vm.runInContext(readApp(relativePath), sandbox, { filename: relativePath });
}

function createDebateState({ speakerCount = 2, judgeMode = true, startedAtMs = 1000 } = {}) {
  const pro = Array.from({ length: speakerCount }, (_value, index) => ({
    clientId: `pro-${index + 1}`,
    displayName: `Pro ${index + 1}`
  }));
  const con = Array.from({ length: speakerCount }, (_value, index) => ({
    clientId: `con-${index + 1}`,
    displayName: `Con ${index + 1}`
  }));
  return {
    status: "running",
    startedAtMs,
    teams: { pro, con },
    judgeMode,
    judge: judgeMode ? { clientId: "judge-1", displayName: "Judge One" } : null
  };
}

const rulesSandbox = vm.createContext({
  window: {},
  navigator: {},
  Date
});
loadClassicScript("src/features/campus-2d/debate-lab-rules.js", rulesSandbox);
const rules = rulesSandbox.window.WSC_CAMPUS_2D_DEBATE_RULES;

assert.equal(rules.MIN_TEAM_SIZE, 2);
assert.equal(rules.MAX_TEAM_SIZE, 3);
assert.deepEqual(
  Array.from(rules.getStartIssues({
    status: "setup",
    teams: {
      pro: [{ clientId: "pro-1" }],
      con: [{ clientId: "con-1" }]
    },
    judgeMode: true,
    judge: null
  })),
  ["Need 1 more PRO speaker.", "Need 1 more CON speaker.", "Judge mode needs a judge."]
);

const judgedState = createDebateState({ speakerCount: 2, judgeMode: true, startedAtMs: 1000 });
assert.equal(rules.buildTimeline(judgedState).length, 10);
assert.equal(rules.getClock(judgedState, 1000).phase.id, "prep");
assert.equal(rules.getClock(judgedState, 1000 + 300000 + 60000).phase.id, "pro-1");
assert.equal(rules.getClock(judgedState, 1000 + ((300 + 60 + 180 + 60 + 180 + 60 + 180 + 60 + 180) * 1000)).phase.id, "judge-final");

const prepRoute = rules.createAudioRoute(judgedState, "pro-1", 1000);
assert.equal(prepRoute.mode, "team");
assert.equal(prepRoute.canSend, true);
assert.equal(prepRoute.hear, "team");
assert.equal(rules.shouldHearPeer(prepRoute, "pro-2"), true);
assert.equal(rules.shouldHearPeer(prepRoute, "con-1"), false);
assert.equal(rules.shouldConnectPeer(prepRoute, "pro-2"), true);
assert.equal(rules.shouldConnectPeer(prepRoute, "con-1"), false);

const speechRoute = rules.createAudioRoute(judgedState, "pro-1", 1000 + 360000);
assert.equal(speechRoute.mode, "speaker");
assert.equal(speechRoute.canSend, true);
assert.equal(speechRoute.speakerClientId, "pro-1");
assert.equal(rules.shouldConnectPeer(speechRoute, "con-1"), true);
assert.equal(rules.shouldHearPeer(speechRoute, "con-1"), false);
const speechListenerRoute = rules.createAudioRoute(judgedState, "con-1", 1000 + 360000);
assert.equal(speechListenerRoute.canSend, false);
assert.equal(rules.shouldHearPeer(speechListenerRoute, "pro-1"), true);
assert.equal(rules.shouldConnectPeer(speechListenerRoute, "pro-1"), true);
assert.equal(rules.shouldConnectPeer(speechListenerRoute, "con-2"), false);

const noJudgeState = createDebateState({ speakerCount: 3, judgeMode: false, startedAtMs: 5000 });
assert.equal(rules.buildTimeline(noJudgeState).length, 14);
const noJudgeFinalOffsetSeconds = 300 + ((60 + 180 + 60 + 180) * 3);
const openRoute = rules.createAudioRoute(noJudgeState, "audience-1", 5000 + (noJudgeFinalOffsetSeconds * 1000));
assert.equal(openRoute.mode, "open");
assert.equal(openRoute.canSend, true);
assert.equal(openRoute.hear, "everyone");
assert.equal(rules.shouldConnectPeer(openRoute, "pro-1"), true);

const sentMessages = [];
const realtimeSandbox = vm.createContext({
  window: {},
  Date,
  Math,
  Promise
});
loadClassicScript("src/features/campus-2d/realtime.js", realtimeSandbox);
const realtime = realtimeSandbox.window.WSC_CAMPUS_2D_REALTIME;
assert.equal(realtime.EVENTS.debateSignal, "campus2d.debate.signal");
assert.equal(realtime.DEFAULTS.MAX_PLAYERS_PER_ROOM, 50);
assert.equal(realtime.DEFAULTS.MOVEMENT_SEND_INTERVAL_MS, 200);
assert.equal(realtime.DEFAULTS.SNAPSHOT_INTERVAL_MS, 100);
assert.equal(realtime.DEFAULTS.CHAT_RATE_LIMIT_MAX_MESSAGES, 2);
assert.equal(realtime.DEFAULTS.CHAT_RATE_LIMIT_WINDOW_MS, 3000);
assert.equal(realtime.DEFAULTS.CHAT_MAX_LENGTH, 120);
assert.equal(realtime.MOVEMENT_PAYLOAD_FIELDS.includes("email"), false);
assert.equal(realtime.MOVEMENT_PAYLOAD_FIELDS.includes("displayName"), false);
const filteredPresenceClientIds = Array.from(realtime.flattenPresenceState({
    local: [{ clientId: "local-1", roomId: "room-a", updatedAtMs: 3 }],
    sameA: [{ clientId: "same-a", roomId: "room-a", updatedAtMs: 2 }],
    sameB: [{ clientId: "same-b", roomId: "room-a", updatedAtMs: 4 }],
    other: [{ clientId: "other-room", roomId: "room-b", updatedAtMs: 5 }]
  }, "local-1", { roomId: "room-a", maxPlayers: 2 }), (presence) => presence.clientId);
assert.deepEqual(
  filteredPresenceClientIds,
  ["same-b"]
);

const audioSandbox = vm.createContext({
  window: {
    WSC_DEBATE_AUDIO_CONFIG: {
      iceServers: [
        { urls: "turn:paid.example.test:3478" },
        { urls: "stun:free.example.test:3478" }
      ]
    },
    RTCPeerConnection: null
  },
  navigator: {}
});
loadClassicScript("src/features/campus-2d/debate-lab-audio.js", audioSandbox);
const audio = audioSandbox.window.WSC_CAMPUS_2D_DEBATE_AUDIO;
assert.deepEqual(audio.getIceServers(), [{ urls: "stun:free.example.test:3478" }]);
audioSandbox.window.WSC_DEBATE_AUDIO_CONFIG.allowTurn = true;
assert.deepEqual(audio.getIceServers(), [
  { urls: "turn:paid.example.test:3478" },
  { urls: "stun:free.example.test:3478" }
]);
audioSandbox.window.WSC_DEBATE_AUDIO_CONFIG = { iceServers: [] };
assert.deepEqual(audio.getIceServers(), []);

const fakeChannel = {
  handlers: [],
  on(type, config, handler) {
    this.handlers.push({ type, config, handler });
    return this;
  },
  subscribe(callback) {
    callback("SUBSCRIBED");
    return this;
  },
  track() {
    return Promise.resolve();
  },
  presenceState() {
    return {};
  },
  send(message) {
    sentMessages.push(message);
    return Promise.resolve(message);
  },
  untrack() {
    return Promise.resolve();
  }
};

const channel = realtime.createRoomChannel({
  client: {
    channel() {
      return fakeChannel;
    },
    removeChannel() {}
  },
  roomId: "debate-lab",
  localPlayer: {
    clientId: "local-1",
    displayName: "Local",
    userId: "user-1"
  }
});
channel.subscribe();
await channel.sendMovement({
  x: 12,
  y: 34,
  direction: "left",
  moving: true,
  seatId: "seat-1",
  colorId: "sky",
  seq: 7,
  displayName: "Should not send",
  email: "private@example.test",
  schoolName: "Private School",
  idRewards: [{ city: "Hidden" }]
});
await channel.sendChat({
  x: 12,
  y: 34,
  direction: "left",
  colorId: "sky",
  message: ` ${"x".repeat(160)} `
});
await channel.sendChat({ message: "   " });
await channel.sendDebateSignal({
  debateSignal: {
    sessionId: "session-1",
    fromClientId: "local-1",
    toClientId: "remote-1",
    type: "offer",
    description: { type: "offer", sdp: "fake" }
  }
});

assert.equal(sentMessages.length, 3);
assert.equal(sentMessages[0].event, "campus2d.avatar.move");
assert.equal(sentMessages[0].payload.x, 12);
assert.equal(sentMessages[0].payload.seq, 7);
assert.equal(sentMessages[0].payload.displayName, undefined);
assert.equal(sentMessages[0].payload.email, undefined);
assert.equal(sentMessages[0].payload.schoolName, undefined);
assert.equal(sentMessages[0].payload.idRewards, undefined);
assert.equal(sentMessages[1].event, "campus2d.chat.message");
assert.equal(sentMessages[1].payload.message.length, 120);
assert.equal(sentMessages[2].event, "campus2d.debate.signal");
assert.equal(sentMessages[2].payload.debateSignal.toClientId, "remote-1");
assert.equal(sentMessages[2].payload.debateSignal.type, "offer");

let roomFullPayload = null;
const fullPresenceState = Object.fromEntries(Array.from({ length: 49 }, (_value, index) => [
  `remote-${index}`,
  [{ clientId: `remote-${index}`, roomId: "debate-lab", updatedAtMs: index }]
]));
const fullChannel = {
  on() {
    return this;
  },
  subscribe(callback) {
    callback("SUBSCRIBED");
    return this;
  },
  track() {
    return Promise.resolve();
  },
  presenceState() {
    return fullPresenceState;
  },
  send() {
    return Promise.resolve();
  },
  untrack() {
    return Promise.resolve();
  }
};
const fullRoom = realtime.createRoomChannel({
  client: {
    channel() {
      return fullChannel;
    }
  },
  roomId: "debate-lab",
  localPlayer: { clientId: "local-full" },
  handlers: {
    onRoomFull(payload) {
      roomFullPayload = payload;
    }
  }
});
fullRoom.subscribe();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(roomFullPayload, null);

const overCapacityPresenceState = Object.fromEntries(Array.from({ length: 50 }, (_value, index) => [
  `remote-${index}`,
  [{ clientId: `remote-${index}`, roomId: "debate-lab", updatedAtMs: index }]
]));
const overCapacityChannel = {
  on() {
    return this;
  },
  subscribe(callback) {
    callback("SUBSCRIBED");
    return this;
  },
  track() {
    return Promise.resolve();
  },
  presenceState() {
    return overCapacityPresenceState;
  },
  send() {
    return Promise.resolve();
  },
  untrack() {
    return Promise.resolve();
  }
};
const overCapacityRoom = realtime.createRoomChannel({
  client: {
    channel() {
      return overCapacityChannel;
    }
  },
  roomId: "debate-lab",
  localPlayer: { clientId: "local-full" },
  handlers: {
    onRoomFull(payload) {
      roomFullPayload = payload;
    }
  }
});
overCapacityRoom.subscribe();
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(roomFullPayload?.maxPlayers, 50);
assert.equal(roomFullPayload?.playerCount, 51);

let realtimeError = null;
const errorRoom = realtime.createRoomChannel({
  client: {
    channel() {
      return {
        on() {
          return this;
        },
        subscribe(callback) {
          callback("CHANNEL_ERROR");
          return this;
        },
        presenceState() {
          return {};
        }
      };
    }
  },
  roomId: "debate-lab",
  localPlayer: { clientId: "local-error" },
  handlers: {
    onError(error) {
      realtimeError = error;
    }
  }
});
errorRoom.subscribe();
assert.equal(realtimeError?.status, "CHANNEL_ERROR");

console.log(JSON.stringify({
  rules: {
    judgedTimelinePhases: rules.buildTimeline(judgedState).length,
    noJudgeTimelinePhases: rules.buildTimeline(noJudgeState).length,
    openRoute: openRoute.mode
  },
  realtime: {
    movementEvent: sentMessages[0].event,
    chatLength: sentMessages[1].payload.message.length,
    signalEvent: sentMessages[2].event,
    targetedTo: sentMessages[2].payload.debateSignal.toClientId,
    roomFull: roomFullPayload?.playerCount,
    errorStatus: realtimeError?.status
  },
  audio: {
    freeIceServers: audio.getIceServers().length
  }
}, null, 2));
