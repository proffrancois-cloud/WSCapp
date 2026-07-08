import { performance } from "node:perf_hooks";

const endpoint = process.env.WSC_REALTIME_WS_URL || "ws://localhost:8787/room/load-test";
const batches = (process.env.WSC_LOAD_BATCHES || "10,25,50")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isInteger(value) && value > 0);
const durationMs = Number(process.env.WSC_LOAD_DURATION_MS || 10000);
const movementIntervalMs = 200;

if (typeof WebSocket !== "function") {
  throw new Error("This load simulation requires a Node runtime with global WebSocket support.");
}

function percentile(values, p) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function send(ws, type, payload) {
  if (ws.readyState !== WebSocket.OPEN) {
    return;
  }
  ws.send(JSON.stringify({
    type,
    payload,
    sentAtMs: Date.now()
  }));
}

async function runBatch(size) {
  const sockets = [];
  const latencies = [];
  let snapshots = 0;
  let opens = 0;
  let closes = 0;
  let errors = 0;

  await Promise.all(Array.from({ length: size }, async (_value, index) => {
    const url = new URL(endpoint);
    url.searchParams.set("clientId", `load-${size}-${index}`);
    const ws = new WebSocket(url);
    sockets.push(ws);
    ws.addEventListener("open", () => {
      opens += 1;
      send(ws, "join", {
        clientId: `load-${size}-${index}`,
        roomId: "load-test",
        displayName: `Load ${index}`,
        x: 80 + index,
        y: 120 + index,
        direction: "down",
        colorId: "cream"
      });
    });
    ws.addEventListener("close", () => {
      closes += 1;
    });
    ws.addEventListener("error", () => {
      errors += 1;
    });
    ws.addEventListener("message", (event) => {
      const receivedAt = Date.now();
      try {
        const envelope = JSON.parse(event.data);
        if (envelope.type === "snapshot") {
          snapshots += 1;
          const serverTime = Number(envelope.payload?.serverTimeMs || envelope.sentAtMs || 0);
          if (serverTime > 0) {
            latencies.push(Math.max(0, receivedAt - serverTime));
          }
        }
      } catch (_error) {}
    });
  }));

  await wait(1400);
  const startedAt = performance.now();
  let tick = 0;
  const interval = setInterval(() => {
    tick += 1;
    sockets.forEach((ws, index) => {
      send(ws, "movement", {
        x: 80 + index + (tick % 30),
        y: 120 + index + (tick % 20),
        direction: tick % 2 ? "right" : "down",
        moving: true,
        colorId: "cream",
        seq: tick
      });
    });
  }, movementIntervalMs);

  await wait(durationMs);
  clearInterval(interval);
  sockets.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close(1000, "load simulation complete");
    }
  });
  await wait(1000);

  return {
    players: size,
    durationMs: Math.round(performance.now() - startedAt),
    opens,
    closes,
    errors,
    snapshots,
    snapshotRatePerSecond: Number((snapshots / Math.max(1, durationMs / 1000)).toFixed(2)),
    p95SnapshotLatencyMs: percentile(latencies, 95)
  };
}

const results = [];
for (const batch of batches) {
  results.push(await runBatch(batch));
}

console.log(JSON.stringify({
  endpoint,
  movementIntervalMs,
  results
}, null, 2));

const failed = results.filter((result) => result.opens < result.players || result.errors > 0);
if (failed.length) {
  process.exitCode = 1;
}

setTimeout(() => process.exit(process.exitCode || 0), 0);
