import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const scanEntries = [
  "app/app.js",
  "app/index.html",
  "app/alpaca-campus-3d",
  "app/src"
];

const approvedSinkFiles = new Set([
  "app/src/app/app-dom-service.js"
]);

const ignoredDirNames = new Set([
  "dist-3d",
  "dist-pages",
  "dist-vercel",
  "node_modules",
  "playwright-report",
  "test-results"
]);

const sourceExtensions = new Set([".html", ".js", ".jsx", ".ts", ".tsx"]);
const sinkPatterns = [
  { name: "innerHTML assignment", pattern: /\.innerHTML\s*=/g },
  { name: "outerHTML assignment", pattern: /\.outerHTML\s*=/g },
  { name: "insertAdjacentHTML", pattern: /\.insertAdjacentHTML\s*\(/g },
  { name: "dangerouslySetInnerHTML", pattern: /\bdangerouslySetInnerHTML\b/g }
];

function toPosixPath(pathname) {
  return pathname.split("\\").join("/");
}

function getExtension(filePath) {
  const dotIndex = filePath.lastIndexOf(".");
  return dotIndex === -1 ? "" : filePath.slice(dotIndex);
}

function walkFiles(absolutePath) {
  if (!existsSync(absolutePath)) {
    return [];
  }

  const stat = statSync(absolutePath);
  if (stat.isFile()) {
    return sourceExtensions.has(getExtension(absolutePath)) ? [absolutePath] : [];
  }

  if (!stat.isDirectory()) {
    return [];
  }

  return readdirSync(absolutePath, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirNames.has(entry.name)) {
      return [];
    }

    return walkFiles(resolve(absolutePath, entry.name));
  });
}

function findLineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

const files = scanEntries.flatMap((entry) => walkFiles(resolve(repoRoot, entry)));
const findings = [];

for (const absolutePath of files) {
  const relativePath = toPosixPath(relative(repoRoot, absolutePath));
  const source = readFileSync(absolutePath, "utf8");

  for (const sink of sinkPatterns) {
    sink.pattern.lastIndex = 0;
    for (const match of source.matchAll(sink.pattern)) {
      if (approvedSinkFiles.has(relativePath)) {
        continue;
      }

      findings.push({
        file: relativePath,
        line: findLineNumber(source, match.index || 0),
        sink: sink.name
      });
    }
  }
}

const report = {
  scannedFiles: files.length,
  approvedSinkFiles: [...approvedSinkFiles],
  findings
};

console.log(JSON.stringify(report, null, 2));

if (findings.length) {
  process.exitCode = 1;
}
