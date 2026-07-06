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
    displayName: "Local"
  }
});
channel.subscribe();
await channel.sendDebateSignal({
  debateSignal: {
    sessionId: "session-1",
    fromClientId: "local-1",
    toClientId: "remote-1",
    type: "offer",
    description: { type: "offer", sdp: "fake" }
  }
});

assert.equal(sentMessages.length, 1);
assert.equal(sentMessages[0].event, "campus2d.debate.signal");
assert.equal(sentMessages[0].payload.debateSignal.toClientId, "remote-1");
assert.equal(sentMessages[0].payload.debateSignal.type, "offer");

console.log(JSON.stringify({
  rules: {
    judgedTimelinePhases: rules.buildTimeline(judgedState).length,
    noJudgeTimelinePhases: rules.buildTimeline(noJudgeState).length,
    openRoute: openRoute.mode
  },
  realtime: {
    signalEvent: sentMessages[0].event,
    targetedTo: sentMessages[0].payload.debateSignal.toClientId
  }
}, null, 2));
