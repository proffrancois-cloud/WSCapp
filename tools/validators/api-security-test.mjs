import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sendFeedbackEmail = require("../../api/send-feedback-email.js");
const embedLibraryResource = require("../../api/embed-library-resource.js");

const ALLOWED_ORIGIN = "http://127.0.0.1:4173";
const ALLOWED_RESOURCE_URL = "https://pwaapwaarevolution.pwaaapwaarevolution.workers.dev/library";
const BODY_LIMIT = 32 * 1024;

function createResponse() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: undefined,
    ended: false,
    setHeader(name, value) {
      headers.set(String(name).toLowerCase(), value);
    },
    getHeader(name) {
      return headers.get(String(name).toLowerCase());
    },
    end(body) {
      this.body = body;
      this.ended = true;
    }
  };
}

function createFeedbackRequest({
  origin = ALLOWED_ORIGIN,
  body = {},
  ip = "test-client",
  authorization = ""
} = {}) {
  return {
    method: "POST",
    body,
    headers: {
      origin,
      "x-forwarded-for": ip,
      ...(authorization ? { authorization } : {})
    },
    socket: { remoteAddress: ip }
  };
}

function createLibraryRequest(rawUrl, { probe = false, method = "GET" } = {}) {
  const query = new URLSearchParams({ url: rawUrl });
  if (probe) {
    query.set("probe", "1");
  }
  return {
    method,
    url: `/api/embed-library-resource?${query.toString()}`,
    headers: {}
  };
}

function parseJsonResponse(response) {
  return JSON.parse(String(response.body || "{}"));
}

async function withMockFetch(mock, callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock;
  try {
    return await callback();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

async function run(name, test) {
  await test();
  console.log(`PASS ${name}`);
}

const originalEnvironment = {
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  WSC_FEEDBACK_FROM_EMAIL: process.env.WSC_FEEDBACK_FROM_EMAIL,
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY
};

process.env.RESEND_API_KEY = "test_resend_key";
process.env.WSC_FEEDBACK_FROM_EMAIL = "WSC Test <test@example.test>";
delete process.env.SUPABASE_PUBLISHABLE_KEY;

try {
  await run("feedback rejects a disallowed origin", async () => {
    const response = createResponse();
    let fetchCalls = 0;
    await withMockFetch(async () => {
      fetchCalls += 1;
      throw new Error("Unexpected fetch");
    }, () => sendFeedbackEmail(createFeedbackRequest({
      origin: "https://attacker.example",
      ip: "origin-test"
    }), response));

    assert.equal(response.statusCode, 403);
    assert.equal(parseJsonResponse(response).error, "Origin not allowed.");
    assert.equal(response.getHeader("access-control-allow-origin"), undefined);
    assert.equal(fetchCalls, 0);
  });

  await run("feedback enforces the object body size limit", async () => {
    const response = createResponse();
    const request = createFeedbackRequest({
      ip: "large-object-test",
      body: { description: "x".repeat(BODY_LIMIT + 1) }
    });
    await withMockFetch(async () => {
      throw new Error("Unexpected fetch");
    }, () => sendFeedbackEmail(request, response));

    assert.equal(response.statusCode, 400);
    assert.match(parseJsonResponse(response).error, /too large/i);
  });

  await run("feedback enforces the string body size limit", async () => {
    const response = createResponse();
    const request = createFeedbackRequest({
      ip: "large-string-test",
      body: JSON.stringify({ description: "x".repeat(BODY_LIMIT + 1) })
    });
    await withMockFetch(async () => {
      throw new Error("Unexpected fetch");
    }, () => sendFeedbackEmail(request, response));

    assert.equal(response.statusCode, 400);
    assert.match(parseJsonResponse(response).error, /too large/i);
  });

  await run("feedback requires authentication for a person report", async () => {
    const response = createResponse();
    const request = createFeedbackRequest({
      ip: "person-auth-test",
      body: {
        reportType: "person",
        target: "Test player",
        description: "A deterministic test report"
      }
    });
    await withMockFetch(async () => {
      throw new Error("Unexpected fetch");
    }, () => sendFeedbackEmail(request, response));

    assert.equal(response.statusCode, 401);
    assert.match(parseJsonResponse(response).error, /sign in/i);
  });

  await run("feedback rejects a filled honeypot", async () => {
    const response = createResponse();
    const request = createFeedbackRequest({
      ip: "honeypot-test",
      body: {
        reportType: "problem",
        target: "Test target",
        description: "A deterministic test report",
        website: "https://spam.example"
      }
    });
    await withMockFetch(async () => {
      throw new Error("Unexpected fetch");
    }, () => sendFeedbackEmail(request, response));

    assert.equal(response.statusCode, 400);
    assert.equal(parseJsonResponse(response).error, "Invalid report.");
  });

  await run("library proxy rejects an unsupported target URL", async () => {
    const response = createResponse();
    let fetchCalls = 0;
    await withMockFetch(async () => {
      fetchCalls += 1;
      throw new Error("Unexpected fetch");
    }, () => embedLibraryResource(
      createLibraryRequest("https://attacker.example/resource"),
      response
    ));

    assert.equal(response.statusCode, 400);
    assert.match(String(response.body), /unsupported/i);
    assert.equal(fetchCalls, 0);
  });

  await run("library proxy rejects a redirect to an unsupported host", async () => {
    const response = createResponse();
    let fetchCalls = 0;
    await withMockFetch(async () => {
      fetchCalls += 1;
      return new Response(null, {
        status: 302,
        headers: { location: "https://attacker.example/redirected" }
      });
    }, () => embedLibraryResource(
      createLibraryRequest(ALLOWED_RESOURCE_URL),
      response
    ));

    assert.equal(response.statusCode, 502);
    assert.match(String(response.body), /unsupported/i);
    assert.equal(fetchCalls, 1);
  });

  await run("library proxy probe performs an upstream fetch", async () => {
    const response = createResponse();
    const fetchedUrls = [];
    await withMockFetch(async (url, options) => {
      fetchedUrls.push({ url, options });
      return new Response("<!doctype html><html><body>Probe</body></html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }, () => embedLibraryResource(
      createLibraryRequest(ALLOWED_RESOURCE_URL, { probe: true }),
      response
    ));

    assert.equal(response.statusCode, 204);
    assert.equal(fetchedUrls.length, 1);
    assert.equal(fetchedUrls[0].url, ALLOWED_RESOURCE_URL);
    assert.equal(fetchedUrls[0].options.redirect, "manual");
  });

  await run("library proxy emits sandboxed HTML security headers", async () => {
    const response = createResponse();
    await withMockFetch(async () => new Response(
      "<!doctype html><html><head><title>Library</title></head><body>Resource</body></html>",
      {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" }
      }
    ), () => embedLibraryResource(
      createLibraryRequest(ALLOWED_RESOURCE_URL),
      response
    ));

    assert.equal(response.statusCode, 200);
    assert.match(String(response.body), /<base href=/i);
    assert.match(String(response.body), /window\.parent\.postMessage/);
    assert.match(String(response.getHeader("content-security-policy")), /(?:^|;)\s*sandbox\b/i);
    assert.equal(response.getHeader("x-content-type-options"), "nosniff");
    assert.equal(response.getHeader("referrer-policy"), "no-referrer");
  });

  console.log("API security validation passed.");
} finally {
  for (const [name, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
}
