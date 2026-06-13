import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const artifactArg = args.find((arg) => !arg.startsWith("--")) || "dist-pages";
const baseArg = args.find((arg) => arg.startsWith("--base="));
const portArg = args.find((arg) => arg.startsWith("--port="));

const artifactRoot = resolve(process.cwd(), artifactArg);
const basePath = normalizeBasePath(baseArg ? baseArg.split("=")[1] : "/");
const port = Number(portArg ? portArg.split("=")[1] : process.env.PORT || 4174);
const host = "127.0.0.1";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  [".glb", "model/gltf-binary"],
  [".html", "text/html; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"]
]);

function normalizeBasePath(value) {
  const trimmed = String(value || "/").trim();
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8" });
  response.end(message);
}

function resolveRequestPath(requestUrl) {
  const url = new URL(requestUrl, `http://${host}:${port}`);
  const pathname = decodeURIComponent(url.pathname);

  if (!pathname.startsWith(basePath)) {
    return null;
  }

  const relativePath = pathname.slice(basePath.length) || "index.html";
  const normalizedRelativePath = normalize(relativePath);

  if (normalizedRelativePath.startsWith("..") || normalizedRelativePath.includes(`${sep}..${sep}`)) {
    return null;
  }

  let absolutePath = resolve(artifactRoot, normalizedRelativePath);
  if (!absolutePath.startsWith(artifactRoot)) {
    return null;
  }

  if (existsSync(absolutePath) && statSync(absolutePath).isDirectory()) {
    absolutePath = join(absolutePath, "index.html");
  }

  return absolutePath;
}

if (!Number.isInteger(port) || port <= 0) {
  throw new Error(`Invalid port: ${portArg}`);
}

if (!existsSync(artifactRoot) || !statSync(artifactRoot).isDirectory()) {
  throw new Error(`Artifact directory does not exist: ${artifactRoot}`);
}

const server = createServer((request, response) => {
  const absolutePath = resolveRequestPath(request.url || "/");
  if (!absolutePath || !existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
    sendText(response, 404, "Not found");
    return;
  }

  response.writeHead(200, {
    "content-type": contentTypes.get(extname(absolutePath)) || "application/octet-stream"
  });
  createReadStream(absolutePath).pipe(response);
});

server.listen(port, host, () => {
  const scriptPath = fileURLToPath(import.meta.url);
  console.log(`Serving ${artifactRoot} at http://${host}:${port}${basePath} (${scriptPath})`);
});
