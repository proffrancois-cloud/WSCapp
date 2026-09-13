export const MAX_NODE_HANDLER_BODY_BYTES = 32 * 1024;

async function readLimitedRequestBody(request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_NODE_HANDLER_BODY_BYTES) {
    const error = new Error("Request body is too large.");
    error.code = "REQUEST_BODY_TOO_LARGE";
    throw error;
  }

  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    totalBytes += value.byteLength;
    if (totalBytes > MAX_NODE_HANDLER_BODY_BYTES) {
      await reader.cancel("Request body is too large.").catch(() => {});
      const error = new Error("Request body is too large.");
      error.code = "REQUEST_BODY_TOO_LARGE";
      throw error;
    }
    chunks.push(value);
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

export async function runNodeHandler(handler, context) {
  const request = context.request;
  const method = String(request.method || "GET").toUpperCase();
  const headers = Object.fromEntries(request.headers.entries());
  let body;
  try {
    body = method === "GET" || method === "HEAD" ? undefined : await readLimitedRequestBody(request);
  } catch (error) {
    if (error?.code === "REQUEST_BODY_TOO_LARGE") {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 413,
        headers: { "content-type": "application/json; charset=utf-8" }
      });
    }
    throw error;
  }
  const nodeRequest = {
    method,
    url: request.url,
    headers,
    body,
    env: context.env || {},
    socket: {
      remoteAddress: headers["cf-connecting-ip"] || headers["x-forwarded-for"] || "cloudflare"
    }
  };

  const responseHeaders = new Headers();
  let statusCode = 200;
  let responseBody = "";
  let ended = false;
  const nodeResponse = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(value) {
      statusCode = Number(value) || 200;
    },
    setHeader(name, value) {
      responseHeaders.set(name, String(value));
    },
    getHeader(name) {
      return responseHeaders.get(name);
    },
    end(value = "") {
      responseBody = value === undefined || value === null ? "" : String(value);
      ended = true;
    }
  };

  await handler(nodeRequest, nodeResponse);
  if (!ended) {
    throw new Error("API handler completed without ending its response.");
  }

  return new Response(statusCode === 204 || method === "HEAD" ? null : responseBody, {
    status: statusCode,
    headers: responseHeaders
  });
}
