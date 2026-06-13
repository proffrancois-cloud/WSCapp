import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";

const repoRoot = resolve(import.meta.dirname, "../..");
const typescriptPath = resolve(repoRoot, "app/node_modules/typescript/lib/typescript.js");
const ts = await import(pathToFileURL(typescriptPath));

function read(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function loadTypeScriptModule(relativePath, requireMap = {}) {
  const source = read(relativePath);
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    },
    fileName: relativePath
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    console,
    exports: module.exports,
    module,
    TextEncoder,
    require(specifier) {
      if (specifier in requireMap) {
        return requireMap[specifier];
      }
      throw new Error(`Unexpected require from ${relativePath}: ${specifier}`);
    }
  };

  vm.runInNewContext(transpiled, sandbox, { filename: relativePath });
  return module.exports;
}

const networkContract = loadTypeScriptModule("app/src/features/alpaca-campus-3d/network-contract.ts");
const guardrails = loadTypeScriptModule("app/src/features/alpaca-campus-3d/campus-network-guardrails.ts", {
  "./network-contract": networkContract
});

const failures = [];

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
  }
}

const baseFrame = {
  roomId: "campus-courtyard",
  x: 10,
  y: 20,
  locomotion: "idle"
};

assert(
  guardrails.shouldSendMovementFrame({
    previous: null,
    next: baseFrame,
    nowMs: 0,
    lastSentAtMs: 0
  }).reason === "initial",
  "First movement frame should be sent."
);

const throttledDecision = guardrails.shouldSendMovementFrame({
  previous: baseFrame,
  next: { ...baseFrame, x: 11 },
  nowMs: 50,
  lastSentAtMs: 0
});
assert(!throttledDecision.shouldSend && throttledDecision.reason === "throttle", "Small movement before send interval should be throttled.");

const deltaDecision = guardrails.shouldSendMovementFrame({
  previous: baseFrame,
  next: { ...baseFrame, x: 15 },
  nowMs: 150,
  lastSentAtMs: 0
});
assert(deltaDecision.shouldSend && deltaDecision.reason === "delta", "Movement beyond min delta should be sent after send interval.");

const heartbeatDecision = guardrails.shouldSendMovementFrame({
  previous: baseFrame,
  next: baseFrame,
  nowMs: 1000,
  lastSentAtMs: 0
});
assert(heartbeatDecision.shouldSend && heartbeatDecision.reason === "heartbeat", "Idle heartbeat should send when due.");

const remotePlayers = Array.from({ length: 36 }, (_entry, index) => ({
  clientId: `remote-${index % 30}`,
  updatedAtMs: Date.now() - index
}));
const selectedPlayers = guardrails.selectRenderedRemotePlayers(remotePlayers, 24);
assert(selectedPlayers.length === 24, "Remote player selection should enforce max rendered count.");
assert(new Set(selectedPlayers.map((player) => player.clientId)).size === 24, "Remote player selection should dedupe by clientId.");

assert(
  !guardrails.isPayloadWithinByteLimit({ blob: "x".repeat(700) }, networkContract.CAMPUS_MOVEMENT_POLICY.maxPayloadBytes),
  "Oversized movement payload should fail byte limit."
);

const roomChannelSandbox = {
  console,
  Date,
  Math,
  Number,
  Object,
  Promise,
  String,
  TextEncoder,
  window: {}
};
vm.createContext(roomChannelSandbox);
vm.runInContext(read("app/src/features/campus-shared/realtime/room-channel.js"), roomChannelSandbox);

const realtime = roomChannelSandbox.window.WSC_ALPACA_CAMPUS_REALTIME;
const sentPayloads = [];
const trackedPayloads = [];
const fakeChannel = {
  on() {
    return this;
  },
  subscribe(callback) {
    void callback("SUBSCRIBED");
  },
  track(payload) {
    trackedPayloads.push(payload);
    return Promise.resolve({ ok: true });
  },
  send(payload) {
    sentPayloads.push(payload);
    return Promise.resolve({ ok: true });
  },
  presenceState() {
    return {};
  }
};
const fakeClient = {
  channel() {
    return fakeChannel;
  },
  removeChannel() {}
};

const channel = realtime.createCampusRoomChannel({
  client: fakeClient,
  roomId: "campus-courtyard",
  localPlayer: {
    clientId: "local",
    userId: "local-user",
    displayName: "Local",
    alpacaName: "Local",
    avatar: { id: "light-brown" },
    x: 10,
    y: 20
  }
});

channel.subscribe();
await Promise.resolve();
assert(trackedPayloads.length === 1, "Subscribe should track initial presence.");

await channel.sendMovement({ kind: "move", seq: 1, x: 10, y: 20, locomotion: "idle" });
assert(sentPayloads.length === 1, "Normal movement payload should be sent.");
assert(!("avatar" in sentPayloads[0].payload), "Movement payload should not include avatar blobs.");
assert(!("displayName" in sentPayloads[0].payload), "Movement payload should not include display names.");

const oversizedMove = await channel.sendMovement({ kind: "move", seq: 2, x: 10, y: 20, blob: "x".repeat(1000) });
assert(oversizedMove?.ok === false && oversizedMove.reason === "payload-too-large", "Oversized movement payload should be rejected.");
assert(sentPayloads.length === 1, "Rejected movement payload should not be sent.");

const oversizedPresence = await channel.updatePresence({ displayName: "x".repeat(2000) });
assert(oversizedPresence?.ok === false && oversizedPresence.reason === "payload-too-large", "Oversized presence payload should be rejected.");

const presenceState = Object.fromEntries(
  Array.from({ length: 40 }, (_entry, index) => [`key-${index}`, [{ clientId: `remote-${index}`, userId: `user-${index}`, onlineAt: String(index) }]])
);
assert(
  realtime.flattenPresenceState(presenceState, "local").length === realtime.NETWORK_LIMITS.maxRenderedRemotePlayers,
  "Flattened presence should be capped to max rendered remote players."
);

if (failures.length) {
  console.error(`Campus network guardrails failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(JSON.stringify({
  selectedRemotePlayers: selectedPlayers.length,
  sentPayloads: sentPayloads.length,
  trackedPayloads: trackedPayloads.length,
  movementLimitBytes: networkContract.CAMPUS_MOVEMENT_POLICY.maxPayloadBytes,
  maxRenderedRemotePlayers: realtime.NETWORK_LIMITS.maxRenderedRemotePlayers
}, null, 2));
