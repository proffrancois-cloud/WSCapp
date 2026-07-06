const ALLOWED_RESOURCE_HOSTS = new Set([
  "pwaapwaarevolution.pwaaapwaarevolution.workers.dev"
]);
const MAX_RESOURCE_HTML_BYTES = 512 * 1024;

function sendText(response, statusCode, body, headers = {}) {
  response.statusCode = statusCode;
  Object.entries(headers).forEach(([key, value]) => response.setHeader(key, value));
  response.end(body);
}

function getRequestUrl(request) {
  return new URL(request.url || "/", "https://wsc.local");
}

function getAllowedTargetUrl(rawUrl) {
  const targetUrl = new URL(String(rawUrl || ""));
  if (targetUrl.protocol !== "https:" || !ALLOWED_RESOURCE_HOSTS.has(targetUrl.hostname)) {
    throw new Error("Unsupported library resource.");
  }
  return targetUrl;
}

function escapeHtmlAttribute(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getBaseHref(targetUrl) {
  const baseUrl = new URL(targetUrl.toString());
  baseUrl.hash = "";
  return baseUrl.toString();
}

function getProxyScript() {
  return `
<script>
(function () {
  function isGoogleDocumentUrl(value) {
    try {
      var url = new URL(value, document.baseURI);
      var parts = url.pathname.split("/").filter(Boolean);
      return url.hostname === "docs.google.com" && parts[0] === "document" && parts[1] === "d" && Boolean(parts[2]);
    } catch (error) {
      return false;
    }
  }

  document.addEventListener("click", function (event) {
    var anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!anchor) {
      return;
    }

    var href = anchor.getAttribute("href") || "";
    if (!isGoogleDocumentUrl(href)) {
      return;
    }

    var url = new URL(href, document.baseURI);
    event.preventDefault();
    event.stopPropagation();
    window.parent.postMessage({
      type: "wsc-library-open-embedded-doc",
      url: url.toString(),
      label: (anchor.textContent || "Resource").trim().slice(0, 160)
    }, window.location.origin);
  }, true);
})();
</script>
  `.trim();
}

function injectIntoHtml(html, targetUrl) {
  const baseTag = `<base href="${escapeHtmlAttribute(getBaseHref(targetUrl))}">`;
  const script = getProxyScript();
  const withBase = /<head[^>]*>/i.test(html)
    ? html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`)
    : `${baseTag}${html}`;

  if (/<\/body>/i.test(withBase)) {
    return withBase.replace(/<\/body>/i, `${script}</body>`);
  }
  return `${withBase}${script}`;
}

async function readLimitedText(fetchResponse) {
  const reader = fetchResponse.body?.getReader?.();
  if (!reader) {
    const text = await fetchResponse.text();
    if (Buffer.byteLength(text, "utf8") > MAX_RESOURCE_HTML_BYTES) {
      throw new Error("Library resource is too large.");
    }
    return text;
  }

  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    size += value.byteLength;
    if (size > MAX_RESOURCE_HTML_BYTES) {
      throw new Error("Library resource is too large.");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

module.exports = async function handler(request, response) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return sendText(response, 405, "Method not allowed.", {
      Allow: "GET, HEAD",
      "Content-Type": "text/plain; charset=utf-8"
    });
  }

  const requestUrl = getRequestUrl(request);
  let targetUrl;
  try {
    targetUrl = getAllowedTargetUrl(requestUrl.searchParams.get("url"));
  } catch (error) {
    return sendText(response, 400, error.message, {
      "Content-Type": "text/plain; charset=utf-8"
    });
  }

  if (request.method === "HEAD" || requestUrl.searchParams.get("probe") === "1") {
    response.statusCode = 204;
    response.end();
    return undefined;
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      headers: {
        "User-Agent": "WSC-App-Library-Embed/1.0"
      }
    });
    if (!upstream.ok) {
      return sendText(response, upstream.status, "Unable to load library resource.", {
        "Content-Type": "text/plain; charset=utf-8"
      });
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return sendText(response, 415, "Library resource must be HTML.", {
        "Content-Type": "text/plain; charset=utf-8"
      });
    }

    const html = await readLimitedText(upstream);
    return sendText(response, 200, injectIntoHtml(html, targetUrl), {
      "Cache-Control": "public, max-age=300",
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex"
    });
  } catch (error) {
    return sendText(response, 502, error.message || "Unable to load library resource.", {
      "Content-Type": "text/plain; charset=utf-8"
    });
  }
};
