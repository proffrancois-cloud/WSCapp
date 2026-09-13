import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { onRequest as embedLibraryResource } from "../../functions/api/embed-library-resource.js";
import { onRequest as sendFeedbackEmail } from "../../functions/api/send-feedback-email.js";

const repoRoot = resolve(import.meta.dirname, "../..");
const wranglerSource = readFileSync(resolve(repoRoot, "wrangler.jsonc"), "utf8");
assert.match(wranglerSource, /"compatibility_flags"\s*:\s*\[\s*"nodejs_compat"\s*\]/);

const forbiddenFeedback = await sendFeedbackEmail({
  request: new Request("https://wscapp.app/api/send-feedback-email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://attacker.invalid" },
    body: JSON.stringify({ reportType: "problem", target: "Test", description: "Test" })
  }),
  env: {}
});
assert.equal(forbiddenFeedback.status, 403);
assert.equal(forbiddenFeedback.headers.get("access-control-allow-origin"), null);

const unconfiguredFeedback = await sendFeedbackEmail({
  request: new Request("https://wscapp.app/api/send-feedback-email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://wscapp.app" },
    body: JSON.stringify({ reportType: "problem", target: "Test", description: "Test" })
  }),
  env: {}
});
assert.equal(unconfiguredFeedback.status, 503);
assert.equal(unconfiguredFeedback.headers.get("access-control-allow-origin"), "https://wscapp.app");

const oversizedFeedback = await sendFeedbackEmail({
  request: new Request("https://wscapp.app/api/send-feedback-email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://wscapp.app" },
    body: JSON.stringify({ description: "x".repeat(33 * 1024) })
  }),
  env: {}
});
assert.equal(oversizedFeedback.status, 413);
assert.match(await oversizedFeedback.text(), /too large/i);

const invalidResource = await embedLibraryResource({
  request: new Request("https://wscapp.app/api/embed-library-resource?url=https%3A%2F%2Fattacker.invalid%2F"),
  env: {}
});
assert.equal(invalidResource.status, 400);
assert.match(await invalidResource.text(), /Unsupported library resource/);

console.log(JSON.stringify({
  pagesFunctions: ["/api/send-feedback-email", "/api/embed-library-resource"],
  nodeCompatibility: true,
  originBoundary: "enforced",
  adapterBodyLimitBytes: 32 * 1024,
  cloudflareEnvironmentBindings: "forwarded"
}, null, 2));
