import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";

const repoRoot = path.resolve(import.meta.dirname, "../..");
const appDir = path.join(repoRoot, "app");

function loadPlaywright() {
  const appRequire = createRequire(path.join(appDir, "package.json"));
  return appRequire("playwright");
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const smokeHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Debate Lab audio smoke</title>
</head>
<body>
  <div id="status" aria-live="polite">Loading Debate Lab audio smoke...</div>
  <script src="/src/features/campus-2d/debate-lab-rules.js"></script>
  <script src="/src/features/campus-2d/debate-lab-audio.js"></script>
</body>
</html>`;

function createServer() {
  return http.createServer((request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    if (url.pathname === "/smoke.html") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(smokeHtml);
      return;
    }
    const candidate = path.normalize(path.join(appDir, decodeURIComponent(url.pathname)));
    if (!candidate.startsWith(appDir)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    if (!fs.existsSync(candidate)) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, { "content-type": mime[path.extname(candidate)] || "application/octet-stream" });
    fs.createReadStream(candidate).pipe(response);
  });
}

function closeServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

async function main() {
  const { chromium } = loadPlaywright();
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--autoplay-policy=no-user-gesture-required",
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream"
    ]
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 960, height: 640 },
      permissions: ["microphone"]
    });
    const page = await context.newPage();
    const severe = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        severe.push(message.text());
      }
    });
    page.on("pageerror", (error) => severe.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/smoke.html`, { waitUntil: "domcontentloaded", timeout: 30000 });

    const result = await page.evaluate(async () => {
      const rules = window.WSC_CAMPUS_2D_DEBATE_RULES;
      const audio = window.WSC_CAMPUS_2D_DEBATE_AUDIO;
      if (!rules?.createAudioRoute || !audio?.createManager) {
        throw new Error("Debate Lab rules/audio globals did not load.");
      }
      window.WSC_DEBATE_AUDIO_CONFIG = { iceServers: [] };

      const sessionId = "debate-audio-smoke-session";
      const nowMs = Date.now();
      const debateState = {
        status: "running",
        sessionId,
        startedAtMs: nowMs,
        teams: {
          pro: [
            { clientId: "smoke-host", displayName: "Host Smoke" },
            { clientId: "smoke-mate", displayName: "Pro Mate" }
          ],
          con: [
            { clientId: "smoke-con", displayName: "Con One" },
            { clientId: "smoke-con-two", displayName: "Con Two" }
          ]
        },
        judgeMode: false,
        judge: null
      };
      const clients = [
        { id: "smoke-host", name: "Host Smoke" },
        { id: "smoke-mate", name: "Pro Mate" },
        { id: "smoke-con", name: "Con One" }
      ];
      const clientMap = new Map();
      const signals = [];

      function getPresenceRows(localId) {
        return clients
          .filter((client) => client.id !== localId)
          .map((client) => ({
            clientId: client.id,
            displayName: client.name,
            debateAudio: {
              enabled: Boolean(client.status?.enabled),
              sessionId,
              muted: Boolean(client.status?.muted)
            }
          }));
      }

      function updateRoutes(state, routeNowMs = Date.now()) {
        clients.forEach((client) => {
          client.route = rules.createAudioRoute(state, client.id, routeNowMs);
          client.manager.update({
            sessionId,
            debateStatus: state.status,
            route: client.route,
            peers: getPresenceRows(client.id)
          });
        });
      }

      function waitFor(predicate, label, timeoutMs = 25000) {
        const startedAt = Date.now();
        return new Promise((resolve, reject) => {
          const tick = () => {
            if (predicate()) {
              resolve();
              return;
            }
            if (Date.now() - startedAt > timeoutMs) {
              reject(new Error(`Timed out waiting for ${label}`));
              return;
            }
            setTimeout(tick, 100);
          };
          tick();
        });
      }

      clients.forEach((client) => {
        client.manager = audio.createManager({
          localClientId: client.id,
          sendSignal(payload) {
            const signal = {
              roomId: "debate-lab",
              sessionId,
              fromClientId: client.id,
              ...payload
            };
            signals.push({
              type: signal.type,
              fromClientId: signal.fromClientId,
              toClientId: signal.toClientId,
              sessionId: signal.sessionId
            });
            const target = clientMap.get(signal.toClientId);
            if (target) {
              setTimeout(() => {
                target.manager.handleSignal(signal);
              }, 0);
            }
            return Promise.resolve(signal);
          },
          shouldHearPeer: rules.shouldHearPeer,
          shouldConnectPeer: rules.shouldConnectPeer,
          onStatusChange(status) {
            client.status = status;
          }
        });
        clientMap.set(client.id, client);
      });

      updateRoutes(debateState, nowMs);
      await Promise.all(clients.map((client) => client.manager.enable()));
      updateRoutes(debateState, nowMs);
      await waitFor(
        () => clients.every((client) => client.status?.enabled) &&
          clients[0].status.peerCount === 1 &&
          clients[1].status.peerCount === 1 &&
          clients[2].status.peerCount === 0,
        "prep audio to connect only same-team peers"
      );
      await waitFor(
        () => document.querySelectorAll("[data-campus2d-debate-audio-peer]").length >= 2,
        "same-team prep WebRTC audio tracks"
      );

      const prepStatuses = Object.fromEntries(clients.map((client) => [client.id, {
        label: client.status.routeLabel,
        canSend: client.status.canSend,
        peerCount: client.status.peerCount
      }]));

      clients[0].manager.setMuted(true);
      if (!clients[0].status.muted || clients[0].status.canSend) {
        throw new Error("Muting the host did not update the local send policy.");
      }
      clients[0].manager.setMuted(false);

      const proSpeechMs = nowMs + ((rules.PHASE_DURATIONS.prep + rules.PHASE_DURATIONS.transition + 2) * 1000);
      updateRoutes(debateState, proSpeechMs);
      await waitFor(
        () => clients[0].status.peerCount === 2 &&
          clients[1].status.peerCount === 1 &&
          clients[2].status.peerCount === 1 &&
          document.querySelectorAll("[data-campus2d-debate-audio-peer]").length >= 4,
        "speaker audio to connect speaker and listeners"
      );
      const speechStatuses = Object.fromEntries(clients.map((client) => [client.id, {
        label: client.status.routeLabel,
        canSend: client.status.canSend,
        mode: client.route.mode,
        hear: client.route.hear
      }]));

      const finalOffsetSeconds = rules.buildTimeline(debateState)
        .filter((phase) => phase.kind !== "no-judge-final")
        .reduce((sum, phase) => sum + phase.duration, 0) + 2;
      updateRoutes(debateState, nowMs + (finalOffsetSeconds * 1000));
      await waitFor(
        () => clients.every((client) => client.status.peerCount === 2) &&
          document.querySelectorAll("[data-campus2d-debate-audio-peer]").length >= 6,
        "open-floor audio mesh"
      );
      const finalStatuses = Object.fromEntries(clients.map((client) => [client.id, {
        label: client.status.routeLabel,
        canSend: client.status.canSend,
        mode: client.route.mode,
        hear: client.route.hear
      }]));

      const result = {
        enabledClientCount: clients.filter((client) => client.status.enabled).length,
        remoteAudioElementCount: document.querySelectorAll("[data-campus2d-debate-audio-peer]").length,
        prepStatuses,
        speechStatuses,
        finalStatuses,
        targetedSignals: signals.every((signal) => signal.sessionId === sessionId && signal.fromClientId && signal.toClientId),
        signalTypes: Array.from(new Set(signals.map((signal) => signal.type))).sort()
      };

      clients.forEach((client) => client.manager.destroy());
      return result;
    });

    console.log(JSON.stringify({ ...result, severeConsoleMessages: severe }, null, 2));
    if (
      severe.length ||
      result.enabledClientCount !== 3 ||
      result.remoteAudioElementCount < 6 ||
      !result.targetedSignals ||
      !result.signalTypes.includes("offer") ||
      !result.signalTypes.includes("answer") ||
      !result.signalTypes.includes("ice") ||
      !result.prepStatuses["smoke-host"].canSend ||
      result.prepStatuses["smoke-host"].peerCount !== 1 ||
      result.prepStatuses["smoke-con"].peerCount !== 0 ||
      result.speechStatuses["smoke-mate"].canSend ||
      !result.speechStatuses["smoke-host"].canSend ||
      !Object.values(result.finalStatuses).every((status) => status.canSend && status.mode === "open")
    ) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
