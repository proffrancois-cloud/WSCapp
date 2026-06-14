import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const vercelConfig = JSON.parse(fs.readFileSync(path.join(repoRoot, "vercel.json"), "utf8"));
const rootHeader = vercelConfig.headers?.find((entry) => entry.source === "/(.*)");
const headerMap = new Map((rootHeader?.headers || []).map((header) => [header.key, header.value]));
const requiredHeaders = [
  "Content-Security-Policy",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "X-Frame-Options"
];

const failures = [];
if (vercelConfig.outputDirectory !== "app/dist-vercel") {
  failures.push("Vercel outputDirectory must stay app/dist-vercel.");
}
if (!String(vercelConfig.buildCommand || "").includes("npm run build:vercel")) {
  failures.push("Vercel buildCommand must use npm run build:vercel.");
}
for (const key of requiredHeaders) {
  if (!headerMap.has(key)) {
    failures.push(`Missing Vercel security header: ${key}`);
  }
}

const csp = headerMap.get("Content-Security-Policy") || "";
for (const directive of [
  "default-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "https://cdn.jsdelivr.net",
  "https://*.supabase.co",
  "wss://*.supabase.co"
]) {
  if (!csp.includes(directive)) {
    failures.push(`CSP is missing ${directive}`);
  }
}
if (headerMap.get("X-Content-Type-Options") !== "nosniff") {
  failures.push("X-Content-Type-Options must be nosniff.");
}
if (headerMap.get("X-Frame-Options") !== "DENY") {
  failures.push("X-Frame-Options must be DENY.");
}

if (failures.length) {
  console.error(`Vercel header validation failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(JSON.stringify({
  outputDirectory: vercelConfig.outputDirectory,
  headers: requiredHeaders
}, null, 2));
