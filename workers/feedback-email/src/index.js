const SUPPORT_ADDRESS = "support@wscapp.app";
const SUPPORT_SENDER = Object.freeze({
  email: SUPPORT_ADDRESS,
  name: "WSCapp Support"
});
const MAX_PAYLOAD_BYTES = 28 * 1024;

function cleanText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function json(payload, status = 200) {
  return Response.json(payload, { status });
}

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return json({ error: "Method not allowed." }, 405);
    }
    if (!env.EMAIL || typeof env.EMAIL.send !== "function" || !isEmail(env.WSC_REPORT_DESTINATION)) {
      return json({ error: "Email service is not configured." }, 503);
    }

    const declaredLength = Number(request.headers.get("content-length") || 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_PAYLOAD_BYTES) {
      return json({ error: "Email payload is too large." }, 413);
    }

    let payload;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_PAYLOAD_BYTES) {
        return json({ error: "Email payload is too large." }, 413);
      }
      payload = JSON.parse(raw || "{}");
    } catch {
      return json({ error: "Invalid email payload." }, 400);
    }

    const subject = cleanText(payload.subject, 240);
    const text = cleanText(payload.text, 8000);
    const html = cleanText(payload.html, 16000);
    if (!subject || (!text && !html)) {
      return json({ error: "Email subject and content are required." }, 400);
    }

    const message = {
      to: env.WSC_REPORT_DESTINATION,
      from: SUPPORT_SENDER,
      subject,
      ...(text ? { text } : {}),
      ...(html ? { html } : {}),
      ...(isEmail(payload.replyTo) ? { replyTo: payload.replyTo } : {})
    };

    try {
      const result = await env.EMAIL.send(message);
      return json({ ok: true, id: result?.messageId || null });
    } catch (error) {
      console.error("Feedback email delivery failed", error?.code || "UNKNOWN", error?.message || error);
      return json({ error: "Cloudflare could not send this message." }, 502);
    }
  }
};
