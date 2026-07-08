import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DEFAULTS,
  consumeChatRateLimit,
  sanitizeChatMessage,
  sanitizePlayerPayload,
  sanitizeRoomId
} from "../src/index.js";

describe("WSCapp realtime worker helpers", () => {
  it("keeps the agreed multiplayer defaults", () => {
    assert.equal(DEFAULTS.MAX_PLAYERS_PER_ROOM, 50);
    assert.equal(DEFAULTS.MOVEMENT_SEND_INTERVAL_MS, 200);
    assert.equal(DEFAULTS.SNAPSHOT_INTERVAL_MS, 100);
    assert.equal(DEFAULTS.CHAT_RATE_LIMIT_MAX_MESSAGES, 2);
    assert.equal(DEFAULTS.CHAT_RATE_LIMIT_WINDOW_MS, 3000);
    assert.equal(DEFAULTS.CHAT_MAX_LENGTH, 120);
  });

  it("normalizes safe room ids", () => {
    assert.equal(sanitizeRoomId(" Debate Lab!! "), "debate-lab");
    assert.equal(sanitizeRoomId("../secrets"), "secrets");
    assert.equal(sanitizeRoomId(""), "");
  });

  it("trims chat to 120 characters and rejects empty text", () => {
    assert.equal(sanitizeChatMessage("  hello   scholars  "), "hello scholars");
    assert.equal(sanitizeChatMessage(" ".repeat(8)), "");
    assert.equal(sanitizeChatMessage("x".repeat(180)).length, 120);
  });

  it("enforces 2 chat messages per 3 seconds", () => {
    const first = consumeChatRateLimit([], 1000);
    assert.equal(first.allowed, true);
    const second = consumeChatRateLimit(first.timestamps, 1800);
    assert.equal(second.allowed, true);
    const third = consumeChatRateLimit(second.timestamps, 2200);
    assert.equal(third.allowed, false);
    const fourth = consumeChatRateLimit(third.timestamps, 4201);
    assert.equal(fourth.allowed, true);
  });

  it("removes private fields from public player payloads", () => {
    const player = sanitizePlayerPayload({
      clientId: "client-1",
      userId: "user-1",
      email: "private@example.com",
      roomId: "lobby",
      displayName: "Scholar",
      x: "42",
      y: "7",
      direction: "sideways",
      colorId: "blue"
    });
    assert.equal(player.clientId, "client-1");
    assert.equal(player.email, undefined);
    assert.equal(player.x, 42);
    assert.equal(player.y, 7);
    assert.equal(player.direction, "down");
  });
});
