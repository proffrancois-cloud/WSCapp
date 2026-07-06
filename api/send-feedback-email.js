const DEFAULT_ADMIN_EMAIL = "frenchease.admin@gmail.com";
const DEFAULT_SUPABASE_URL = "https://bwogymstqrrmoxlwlhio.supabase.co";
const MAX_BODY_BYTES = 32 * 1024;

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function cleanText(value, maxLength = 1200) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, maxLength);
}

function escapeHtml(value) {
  return cleanText(value, 5000)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br />");
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }
  if (request.body && typeof request.body === "string") {
    return JSON.parse(request.body || "{}");
  }

  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error("Request body is too large.");
    }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function getSupabaseUserFromToken(token) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.WSC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!token || !publishableKey || !supabaseUrl) {
    return null;
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${token}`
    }
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

function buildReporter(payload, supabaseUser) {
  const reporter = payload.reporter && typeof payload.reporter === "object" ? payload.reporter : {};
  const userEmail = cleanText(supabaseUser?.email || reporter.email || payload.reporterContact || "", 240);
  return {
    userId: cleanText(supabaseUser?.id || reporter.userId || "", 120),
    email: userEmail,
    alpacaName: cleanText(reporter.alpacaName || reporter.displayName || "", 120),
    displayName: cleanText(reporter.displayName || reporter.alpacaName || "", 120),
    schoolName: cleanText(reporter.schoolName || "", 160),
    country: cleanText(reporter.country || "", 80),
    contact: cleanText(payload.reporterContact || userEmail || reporter.alpacaName || reporter.displayName || "", 240)
  };
}

function formatReporterLines(reporter) {
  return [
    `Contact: ${reporter.contact || "Unknown"}`,
    `Email: ${reporter.email || "Unknown"}`,
    `Alpaca ID: ${reporter.alpacaName || "Unknown"}`,
    `User ID: ${reporter.userId || "Unknown"}`,
    `School: ${reporter.schoolName || "Unknown"}`,
    `Country: ${reporter.country || "Unknown"}`
  ];
}

function buildEmail(payload, reporter) {
  const category = cleanText(payload.category, 80);
  const room = cleanText(payload.roomTitle || payload.roomId || "", 160);
  const context = payload.context && typeof payload.context === "object" ? payload.context : {};
  const contextLines = [
    `Room: ${room || "Unknown"}`,
    `URL: ${cleanText(context.url, 500) || "Unknown"}`,
    `App mode: ${cleanText(context.appMode, 80) || "Unknown"}`,
    `Online view: ${cleanText(context.onlineView, 80) || "Unknown"}`
  ];

  const reportType = cleanText(payload.reportType, 40) === "problem" ? "problem" : "person";
  const target = cleanText(payload.target, 240);
  const description = cleanText(payload.description, 1800);
  if (!target || !description) {
    return { error: "Please include the report target and description." };
  }

  const typeLabel = reportType === "problem" ? "Problem report" : "Person report";
  const subject = `[WSC App] ${typeLabel}: ${target}`;
  const text = [
    typeLabel,
    "",
    ...formatReporterLines(reporter),
    "",
    `Target/person/room: ${target}`,
    "",
    "Description:",
    description,
    "",
    ...contextLines
  ].join("\n");
  const html = `
    <h2>${escapeHtml(typeLabel)}</h2>
    <h3>Reporter</h3>
    <p>${formatReporterLines(reporter).map(escapeHtml).join("<br />")}</p>
    <h3>Target/person/room</h3>
    <p>${escapeHtml(target)}</p>
    <h3>Description</h3>
    <p>${escapeHtml(description)}</p>
    <h3>Context</h3>
    <p>${contextLines.map(escapeHtml).join("<br />")}</p>
  `;
  return { subject, text, html };
}

module.exports = async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (request.method === "OPTIONS") {
    return sendJson(response, 204, {});
  }
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  const resendApiKey = process.env.RESEND_API_KEY || "";
  const adminEmail = process.env.WSC_ADMIN_EMAIL || process.env.FEEDBACK_TO_EMAIL || DEFAULT_ADMIN_EMAIL;
  const fromEmail = process.env.WSC_FEEDBACK_FROM_EMAIL || process.env.FEEDBACK_FROM_EMAIL || "";
  if (!resendApiKey || !fromEmail) {
    return sendJson(response, 503, {
      error: "Email sending is not configured yet. Add RESEND_API_KEY and WSC_FEEDBACK_FROM_EMAIL to the deployment environment."
    });
  }

  try {
    const payload = await readJsonBody(request);
    const authHeader = request.headers.authorization || request.headers.Authorization || "";
    const token = String(authHeader).startsWith("Bearer ") ? String(authHeader).slice(7) : "";
    const supabaseUser = await getSupabaseUserFromToken(token);
    const reporter = buildReporter(payload, supabaseUser);
    const email = buildEmail(payload, reporter);
    if (email.error) {
      return sendJson(response, 400, { error: email.error });
    }

    const resendPayload = {
      from: fromEmail,
      to: [adminEmail],
      subject: email.subject,
      text: email.text,
      html: email.html
    };
    if (isEmail(reporter.email)) {
      resendPayload.reply_to = reporter.email;
    }

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(resendPayload)
    });
    const resendResult = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      return sendJson(response, 502, {
        error: resendResult.message || "The email provider could not send this message."
      });
    }

    return sendJson(response, 200, { ok: true, id: resendResult.id || null });
  } catch (error) {
    return sendJson(response, 400, { error: error.message || "Invalid request." });
  }
};
