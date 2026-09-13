import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  DEFAULTS,
  consumeChatRateLimit,
  consumeEventRateLimit,
  moderateChatMessage,
  sanitizeChatMessage,
  sanitizePlayerPayload,
  sanitizeRoomId,
  sanitizeStructuredPayload
} from "../src/index.js";

const loadSimulationSource = readFileSync(new URL("./load-simulation.mjs", import.meta.url), "utf8");

describe("WSCapp realtime worker helpers", () => {
  it("keeps the agreed multiplayer defaults", () => {
    assert.equal(DEFAULTS.MAX_PLAYERS_PER_ROOM, 50);
    assert.equal(DEFAULTS.MAX_MESSAGE_BYTES, 65536);
    assert.equal(DEFAULTS.MAX_COORDINATE_ABS, 10000);
    assert.equal(DEFAULTS.MOVEMENT_SEND_INTERVAL_MS, 200);
    assert.equal(DEFAULTS.SNAPSHOT_INTERVAL_MS, 100);
    assert.equal(DEFAULTS.CHAT_RATE_LIMIT_MAX_MESSAGES, 2);
    assert.equal(DEFAULTS.CHAT_RATE_LIMIT_WINDOW_MS, 3000);
    assert.equal(DEFAULTS.CHAT_MAX_LENGTH, 120);
    assert.equal(DEFAULTS.MESSAGE_RATE_LIMIT_MAX_MESSAGES, 60);
    assert.equal(DEFAULTS.MESSAGE_RATE_LIMIT_WINDOW_MS, 1000);
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

  it("blocks insulting language even when it is lightly obfuscated", () => {
    assert.equal(moderateChatMessage("Thanks, scholar!").allowed, true);
    assert.equal(moderateChatMessage("you are a connard").allowed, false);
    assert.equal(moderateChatMessage("f.u.c.k").allowed, false);
    assert.equal(moderateChatMessage("shiiithead").allowed, false);
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
      x: "999999",
      y: "-999999",
      direction: "sideways",
      colorId: "blue",
      schoolName: "Private School",
      country: "Private Country",
      idRewards: [{ rewardType: "forged" }]
    });
    assert.equal(player.clientId, "client-1");
    assert.equal(player.userId, null);
    assert.equal(player.email, undefined);
    assert.equal(player.schoolName, "");
    assert.equal(player.country, "");
    assert.deepEqual(player.idRewards, []);
    assert.equal(player.x, 10000);
    assert.equal(player.y, -10000);
    assert.equal(player.direction, "down");
  });

  it("rate-limits bursty non-chat event types", () => {
    let result = { timestamps: [] };
    for (let index = 0; index < 3; index += 1) {
      result = consumeEventRateLimit(result.timestamps, 3, 1000, 100 + index);
      assert.equal(result.allowed, true);
    }
    result = consumeEventRateLimit(result.timestamps, 3, 1000, 200);
    assert.equal(result.allowed, false);
    result = consumeEventRateLimit(result.timestamps, 3, 1000, 1200);
    assert.equal(result.allowed, true);
  });

  it("keeps the load simulator compatible with the Worker Origin boundary", () => {
    assert.match(loadSimulationSource, /WSC_REALTIME_ORIGIN/);
    assert.match(loadSimulationSource, /headers:\s*\{\s*Origin:\s*requestOrigin\s*\}/);
  });

  it("fits a complete 50-player, 30-question Challenge in the message budget", () => {
    const questions = Array.from({ length: 30 }, (_, index) => ({
      id: `question-${index}`,
      prompt: "p".repeat(220),
      options: Array.from({ length: 4 }, (_, optionIndex) => `option-${optionIndex}-${"o".repeat(60)}`),
      answerIndex: index % 4,
      rawLevel: 3,
      displayLevel: 300,
      sectionId: "science",
      guidingSection: "Reconstructing the Past",
      explanation: "e".repeat(180)
    }));
    const participants = Array.from({ length: DEFAULTS.MAX_PLAYERS_PER_ROOM }, (_, index) => ({
      clientId: `client-${index}`,
      userId: null,
      displayName: `Scholar ${index}`,
      colorId: "cream",
      joinedAtMs: 1
    }));
    const responses = Object.fromEntries(participants.map((participant) => [participant.clientId, {
      selectedAnswers: Object.fromEntries(questions.map((_, index) => [index, index % 4])),
      score: questions.length,
      answeredCount: questions.length,
      updatedAtMs: 1
    }]));
    const message = JSON.stringify({
      v: 1,
      type: "challenge",
      payload: {
        scholarsChallenge: {
          schema: "campus2d.scholars-challenge.v1",
          roomId: "debate-lab",
          sessionId: "session",
          hostClientId: "client-0",
          hostName: "Scholar 0",
          questionCount: questions.length,
          questions,
          participants,
          responses,
          status: "ended"
        }
      }
    });
    const messageBytes = Buffer.byteLength(message);

    assert.ok(messageBytes > 32768, "fixture must protect against the old 32 KiB regression");
    assert.ok(messageBytes <= DEFAULTS.MAX_MESSAGE_BYTES, `${messageBytes} bytes must fit the Worker budget`);
  });

  it("bounds nested realtime payloads and removes prototype keys", () => {
    const payload = sanitizeStructuredPayload({
      safe: "x".repeat(13000),
      nested: { value: Number.POSITIVE_INFINITY },
      list: Array.from({ length: 90 }, (_, index) => index),
      __proto__: { polluted: true },
      constructor: "blocked"
    });
    assert.equal(payload.safe.length, 12000);
    assert.equal(payload.nested.value, 0);
    assert.equal(payload.list.length, 64);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, "constructor"), false);
    assert.equal({}.polluted, undefined);
  });
});
