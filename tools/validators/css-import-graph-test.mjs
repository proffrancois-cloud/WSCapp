import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const expectedImports = [
  "styles-app-shell.css",
  "styles-route-builder.css",
  "styles-experience-shared.css",
  "styles-play-live-modes.css",
  "styles-raw-content.css",
  "styles-late-shell-overrides.css",
  "styles-route-builder-overrides.css",
  "styles-learn-mode-overrides.css",
  "styles-online-overrides.css"
];

const artifactArgIndex = process.argv.indexOf("--artifact");
const artifactDir = artifactArgIndex === -1 ? null : process.argv[artifactArgIndex + 1];

if (artifactArgIndex !== -1 && !artifactDir) {
  throw new Error("Usage: node css-import-graph-test.mjs [--artifact <artifact-dir>]");
}

const appRoot = artifactDir
  ? resolve(process.cwd(), artifactDir)
  : resolve(process.cwd());

function readText(relativePath) {
  const absolutePath = resolve(appRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing required CSS file: ${absolutePath}`);
  }
  return readFileSync(absolutePath, "utf8");
}

function extractImports(stylesheetText) {
  const importPattern = /@import\s+url\(["']?([^"')]+)["']?\)\s*;/g;
  return Array.from(stylesheetText.matchAll(importPattern), (match) => {
    const href = match[1];
    const pathname = href.split("?")[0];
    return {
      href,
      pathname,
      fileName: basename(pathname)
    };
  });
}

function listCssChunks() {
  return readdirSync(appRoot)
    .filter((fileName) => /^styles-.+\.css$/.test(fileName))
    .sort();
}

const stylesheetText = readText("styles.css");
const actualImportEntries = extractImports(stylesheetText);
const actualImports = actualImportEntries.map((entry) => entry.fileName);
const sourceChunks = listCssChunks();

const missingImports = expectedImports.filter((fileName) => !actualImports.includes(fileName));
const unexpectedImports = actualImports.filter((fileName) => !expectedImports.includes(fileName));
const orderMatches = JSON.stringify(actualImports) === JSON.stringify(expectedImports);
const missingFiles = expectedImports.filter((fileName) => !existsSync(resolve(appRoot, fileName)));
const unreferencedChunks = sourceChunks.filter((fileName) => !expectedImports.includes(fileName));
const unexpectedPaths = actualImportEntries
  .filter((entry) => entry.pathname !== `./${entry.fileName}`)
  .map((entry) => entry.href);

const report = {
  root: appRoot,
  mode: artifactDir ? "artifact" : "source",
  expectedImports,
  actualImports,
  actualImportHrefs: actualImportEntries.map((entry) => entry.href),
  sourceChunks,
  orderMatches,
  missingImports,
  unexpectedImports,
  unexpectedPaths,
  missingFiles,
  unreferencedChunks
};

console.log(JSON.stringify(report, null, 2));

if (
  !orderMatches ||
  missingImports.length ||
  unexpectedImports.length ||
  unexpectedPaths.length ||
  missingFiles.length ||
  unreferencedChunks.length
) {
  process.exitCode = 1;
}
