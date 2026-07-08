import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { resolve } from "node:path";

const DEFAULT_PROJECT_REF = "bwogymstqrrmoxlwlhio";
const DEFAULT_TOKEN_PATH = "~/.config/wscapp/supabase-management-token";
const DEFAULT_SITE_URL = "https://wscapp.app";
const REQUIRED_REDIRECT_URLS = [
  "https://wscapp.app/**",
  "https://www.wscapp.app/**",
  "https://proffrancois-cloud.github.io/WSCapp/**",
  "http://localhost:4173/**"
];

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const replaceRedirects = args.has("--replace-redirects");
const projectRef = getArgValue("--project-ref") || process.env.SUPABASE_PROJECT_REF || DEFAULT_PROJECT_REF;
const siteUrl = getArgValue("--site-url") || process.env.SUPABASE_SITE_URL || DEFAULT_SITE_URL;
const tokenPath = getArgValue("--token-path") || process.env.SUPABASE_TOKEN_PATH || DEFAULT_TOKEN_PATH;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || readTokenFile(tokenPath);

if (!accessToken) {
  throw new Error(
    `Missing Supabase Management API token. Set SUPABASE_ACCESS_TOKEN or save it to ${tokenPath}.`
  );
}

const authConfigUrl = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
const currentConfig = await fetchJson(authConfigUrl, {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});

const existingRedirectUrls = parseUriAllowList(currentConfig.uri_allow_list);
const redirectUrls = replaceRedirects
  ? REQUIRED_REDIRECT_URLS
  : mergeUnique([...REQUIRED_REDIRECT_URLS, ...existingRedirectUrls]);

const updateBody = {
  site_url: siteUrl,
  uri_allow_list: redirectUrls.join(",")
};

if (dryRun) {
  console.log(JSON.stringify({
    projectRef,
    dryRun: true,
    previous: {
      site_url: currentConfig.site_url,
      uri_allow_list: currentConfig.uri_allow_list
    },
    next: updateBody
  }, null, 2));
  process.exit(0);
}

const updatedConfig = await fetchJson(authConfigUrl, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(updateBody)
});

console.log(JSON.stringify({
  projectRef,
  site_url: updatedConfig.site_url,
  uri_allow_list: updatedConfig.uri_allow_list
}, null, 2));

function getArgValue(name) {
  const prefix = `${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : "";
}

function readTokenFile(pathValue) {
  const expandedPath = pathValue.startsWith("~/") ? resolve(homedir(), pathValue.slice(2)) : resolve(pathValue);
  if (!existsSync(expandedPath)) {
    return "";
  }

  return readFileSync(expandedPath, "utf8").trim();
}

function parseUriAllowList(value) {
  if (!value || typeof value !== "string") {
    return [];
  }

  return value
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function mergeUnique(values) {
  return [...new Set(values)];
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || JSON.stringify(data);
    throw new Error(`Supabase API request failed (${response.status}): ${errorMessage}`);
  }

  return data;
}
