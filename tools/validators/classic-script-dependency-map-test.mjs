import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const appRoot = resolve(repoRoot, "app");
const indexPath = resolve(appRoot, "index.html");
const campusRuntimeLoaderPath = resolve(appRoot, "src/features/alpaca-campus-3d/campus-runtime-loader.ts");

const mainProviderRoots = [
  "src/app",
  "src/services",
  "src/modes",
  "src/ui",
  "src/theme"
];

const allowedExternalGlobals = new Set([
  "WSC_DESKTOP_APP",
  "WSC_PWA_RESET_VERSION"
]);

const campusOptionalGlobals = new Set([
  "WSC_ALPACA_CAMPUS_ROOMS"
]);

const inlineProviders = new Set([
  "WSC_PWA_RESET_VERSION"
]);

function toPosixPath(pathname) {
  return pathname.split("\\").join("/");
}

function normalizeScriptPath(scriptPath) {
  const withoutQuery = scriptPath.split("?")[0];
  return withoutQuery.replace(/^\.\//, "");
}

function isRemoteScript(scriptPath) {
  return /^https?:\/\//.test(scriptPath) || scriptPath.startsWith("//");
}

function readText(relativePath) {
  const absolutePath = resolve(appRoot, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing classic script file: ${relativePath}`);
  }
  return readFileSync(absolutePath, "utf8");
}

function listLocalScriptsFromIndex() {
  const html = readFileSync(indexPath, "utf8");
  return Array.from(html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g), (match) => match[1])
    .filter((scriptPath) => !isRemoteScript(scriptPath))
    .map(normalizeScriptPath);
}

function listCampusContentScripts() {
  const source = readFileSync(campusRuntimeLoaderPath, "utf8");
  const arrayMatch = source.match(/const\s+CAMPUS_CONTENT_SCRIPT_PATHS\s*=\s*\[([\s\S]*?)\]\s+as\s+const/);
  if (!arrayMatch) {
    throw new Error("Could not find CAMPUS_CONTENT_SCRIPT_PATHS in campus-runtime-loader.ts.");
  }

  return Array.from(arrayMatch[1].matchAll(/["']([^"']+\.js)["']/g), (match) => match[1]);
}

function walkJsFiles(relativeDir) {
  const absoluteDir = resolve(appRoot, relativeDir);
  if (!existsSync(absoluteDir)) {
    return [];
  }

  return readdirSync(absoluteDir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = `${relativeDir}/${entry.name}`;
    const absolutePath = resolve(appRoot, relativePath);

    if (entry.isDirectory()) {
      return walkJsFiles(relativePath);
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      return [toPosixPath(relativePath)];
    }

    return [];
  });
}

function findLineNumber(source, index) {
  return source.slice(0, index).split("\n").length;
}

function scanGlobals(relativePath) {
  const source = readText(relativePath);
  const references = [];
  const pattern = /\b(?:window|global)\.(WSC_[A-Z0-9_]+)\b/g;

  for (const match of source.matchAll(pattern)) {
    const globalName = match[1];
    const afterName = source.slice((match.index || 0) + match[0].length);
    const isAssignment = /^\s*=(?!=)/.test(afterName);
    references.push({
      globalName,
      type: isAssignment ? "provider" : "consumer",
      line: findLineNumber(source, match.index || 0)
    });
  }

  return references;
}

function buildProviderIndex(scriptPaths) {
  const providerIndex = new Map();

  for (const globalName of inlineProviders) {
    providerIndex.set(globalName, {
      scriptIndex: -1,
      path: "(inline)",
      line: 0
    });
  }

  scriptPaths.forEach((relativePath, scriptIndex) => {
    scanGlobals(relativePath)
      .filter((reference) => reference.type === "provider")
      .forEach((reference) => {
        if (!providerIndex.has(reference.globalName)) {
          providerIndex.set(reference.globalName, {
            scriptIndex,
            path: relativePath,
            line: reference.line
          });
        }
      });
  });

  return providerIndex;
}

function validateScriptOrder(label, scriptPaths, options = {}) {
  const failures = [];
  const duplicates = scriptPaths.filter((scriptPath, index) => scriptPaths.indexOf(scriptPath) !== index);
  const missingFiles = scriptPaths.filter((scriptPath) => !existsSync(resolve(appRoot, scriptPath)));
  const providerIndex = buildProviderIndex(scriptPaths);
  const allowedMissingGlobals = new Set([
    ...allowedExternalGlobals,
    ...(options.allowedMissingGlobals || [])
  ]);

  duplicates.forEach((scriptPath) => {
    failures.push(`${label}: duplicate script path ${scriptPath}`);
  });

  missingFiles.forEach((scriptPath) => {
    failures.push(`${label}: missing script file ${scriptPath}`);
  });

  scriptPaths.forEach((relativePath, scriptIndex) => {
    scanGlobals(relativePath)
      .filter((reference) => reference.type === "consumer")
      .forEach((reference) => {
        if (allowedMissingGlobals.has(reference.globalName)) {
          return;
        }

        const provider = providerIndex.get(reference.globalName);
        if (!provider) {
          failures.push(`${label}: ${relativePath}:${reference.line} consumes ${reference.globalName}, but no earlier script provides it`);
          return;
        }

        if (provider.scriptIndex > scriptIndex) {
          failures.push(`${label}: ${relativePath}:${reference.line} consumes ${reference.globalName} before ${provider.path}:${provider.line} provides it`);
        }
      });
  });

  return {
    label,
    scriptCount: scriptPaths.length,
    providerCount: providerIndex.size,
    providers: Object.fromEntries([...providerIndex.entries()].sort(([left], [right]) => left.localeCompare(right))),
    duplicates,
    missingFiles,
    failures
  };
}

function validateMainProviderCoverage(scriptPaths) {
  const loaded = new Set(scriptPaths);
  const uncovered = [];

  mainProviderRoots.flatMap(walkJsFiles).forEach((relativePath) => {
    const providers = scanGlobals(relativePath).filter((reference) => reference.type === "provider");
    if (!providers.length || loaded.has(relativePath)) {
      return;
    }

    uncovered.push({
      path: relativePath,
      providers: providers.map((provider) => provider.globalName)
    });
  });

  return uncovered;
}

const mainScripts = listLocalScriptsFromIndex();
const campusScripts = listCampusContentScripts();
const mainOrderReport = validateScriptOrder("main-index", mainScripts);
const campusOrderReport = validateScriptOrder("campus-content-loader", campusScripts, {
  allowedMissingGlobals: campusOptionalGlobals
});
const uncoveredMainProviders = validateMainProviderCoverage(mainScripts);

const appScriptIndex = mainScripts.indexOf("app.js");
if (appScriptIndex === -1) {
  mainOrderReport.failures.push("main-index: app.js is not loaded by app/index.html");
}

const report = {
  indexPath: toPosixPath(relative(repoRoot, indexPath)),
  main: {
    label: mainOrderReport.label,
    scriptCount: mainOrderReport.scriptCount,
    providerCount: mainOrderReport.providerCount,
    duplicateCount: mainOrderReport.duplicates.length,
    missingFileCount: mainOrderReport.missingFiles.length,
    failureCount: mainOrderReport.failures.length,
    failures: mainOrderReport.failures
  },
  campus: {
    label: campusOrderReport.label,
    scriptCount: campusOrderReport.scriptCount,
    providerCount: campusOrderReport.providerCount,
    duplicateCount: campusOrderReport.duplicates.length,
    missingFileCount: campusOrderReport.missingFiles.length,
    failureCount: campusOrderReport.failures.length,
    failures: campusOrderReport.failures
  },
  uncoveredMainProviders
};

console.log(JSON.stringify(report, null, 2));

if (
  mainOrderReport.failures.length ||
  campusOrderReport.failures.length ||
  uncoveredMainProviders.length
) {
  process.exitCode = 1;
}
