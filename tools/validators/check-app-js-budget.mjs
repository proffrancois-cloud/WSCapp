import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const appRoot = resolve(repoRoot, "app");
const indexSource = readFileSync(resolve(appRoot, "index.html"), "utf8");

function localScriptPaths() {
  return [...indexSource.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)]
    .map((match) => match[1].split("?")[0])
    .filter((source) => source.startsWith("./"))
    .map((source) => resolve(appRoot, source));
}

function walkFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}

function fileSize(path) {
  return statSync(path).size;
}

const scriptPaths = localScriptPaths();
const initialScriptBytes = scriptPaths.reduce((total, path) => total + fileSize(path), 0);
const mainPath = resolve(appRoot, "src/app/app-main.js");
const mainSource = readFileSync(mainPath, "utf8");
const rawContentPath = resolve(appRoot, "generated/current-runtime/raw-content-bank.js");
const debatePath = resolve(appRoot, "content/debate/debate-lab-data.js");
const stylePaths = readdirSync(appRoot)
  .filter((name) => /^styles.*\.css$/i.test(name))
  .map((name) => resolve(appRoot, name));
const assetPaths = walkFiles(resolve(appRoot, "assets"));
const assetBytes = assetPaths.reduce((total, path) => total + fileSize(path), 0);
const largestAsset = assetPaths
  .map((path) => ({ path, bytes: fileSize(path) }))
  .sort((left, right) => right.bytes - left.bytes)[0];

const budgets = {
  bootstrapLines: 100,
  mainLines: 23500,
  mainBytes: 840000,
  rawContentBytes: 4500000,
  debateBytes: 2550000,
  initialScriptBytes: 9200000,
  initialScriptCount: 54,
  rootStyleBytes: 730000,
  assetBytes: 380000000,
  largestAssetBytes: 16000000
};

const measurements = {
  bootstrapLines: readFileSync(resolve(appRoot, "app.js"), "utf8").split(/\r?\n/).length,
  mainLines: mainSource.split(/\r?\n/).length,
  mainBytes: fileSize(mainPath),
  rawContentBytes: fileSize(rawContentPath),
  debateBytes: fileSize(debatePath),
  initialScriptBytes,
  initialScriptCount: scriptPaths.length,
  rootStyleBytes: stylePaths.reduce((total, path) => total + fileSize(path), 0),
  assetBytes,
  largestAssetBytes: largestAsset.bytes
};

const failures = Object.entries(budgets)
  .filter(([metric, limit]) => measurements[metric] > limit)
  .map(([metric, limit]) => `${metric}: ${measurements[metric]} > ${limit}`);

console.log(JSON.stringify({
  measurements,
  budgets,
  initialScripts: scriptPaths.map((path) => basename(path)),
  largestAsset: {
    path: largestAsset.path.replace(`${repoRoot}/`, ""),
    bytes: largestAsset.bytes,
    extension: extname(largestAsset.path)
  },
  architecturalTargets: {
    initialScriptBytes: "Split route-specific data so the first visit can move below 3 MB.",
    assetBytes: "Generate responsive WebP/AVIF derivatives and keep archival originals out of public artifacts.",
    mainLines: "Continue extracting tested feature modules from app-main.js."
  }
}, null, 2));

if (failures.length) {
  console.error(`Application budget exceeded:\n- ${failures.join("\n- ")}`);
  process.exitCode = 1;
}
