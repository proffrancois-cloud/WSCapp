import assert from "node:assert/strict";

import worker from "../src/index.js";

const destination = "verified-destination@example.test";

async function run(name, test) {
  await test();
  console.log(`PASS ${name}`);
}

await run("rejects requests when the destination is not configured", async () => {
  const response = await worker.fetch(new Request("https://internal/send", { method: "POST" }), {
    EMAIL: { send: async () => ({ messageId: "unexpected" }) }
  });
  assert.equal(response.status, 503);
});

await run("sends only the fixed support sender to the configured destination", async () => {
  const messages = [];
  const response = await worker.fetch(new Request("https://internal/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      subject: "[WSC App] Problem report",
      text: "A report",
      html: "<p>A report</p>",
      replyTo: "reporter@example.test"
    })
  }), {
    WSC_REPORT_DESTINATION: destination,
    EMAIL: {
      async send(message) {
        messages.push(message);
        return { messageId: "cloudflare-message-id" };
      }
    }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, id: "cloudflare-message-id" });
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0].from, {
    email: "support@wscapp.app",
    name: "WSCapp Support"
  });
  assert.equal(messages[0].to, destination);
  assert.equal(messages[0].replyTo, "reporter@example.test");
});

await run("does not accept an arbitrary sender or destination from the request", async () => {
  const messages = [];
  await worker.fetch(new Request("https://internal/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      from: "attacker@example.test",
      to: "attacker@example.test",
      subject: "Report",
      text: "A report"
    })
  }), {
    WSC_REPORT_DESTINATION: destination,
    EMAIL: {
      async send(message) {
        messages.push(message);
        return { messageId: "safe-message-id" };
      }
    }
  });

  assert.equal(messages[0].from.email, "support@wscapp.app");
  assert.equal(messages[0].to, destination);
});

console.log("Feedback email Worker validation passed.");
