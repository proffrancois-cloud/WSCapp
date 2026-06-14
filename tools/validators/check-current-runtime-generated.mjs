import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync
} from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const APP_DIR = resolve(ROOT, "app");
const THEME_DIR = resolve(ROOT, "content/themes/2026");
const COMMITTED_RUNTIME_DIR = resolve(APP_DIR, "generated/current-runtime");
const TEMP_RUNTIME_DIR = resolve(ROOT, "tmp/current-runtime-ci");
const GENERATOR = resolve(ROOT, "tools/generators/build-current-runtime-from-theme.mjs");
const RUNTIME_FILES = [
  "data.js",
  "knowledge-bank.js",
  "assets-config.js",
  "raw-content-bank.js",
  "alpaca-channel.js",
  "content/alpacards.js",
  "summary.json"
];

function toPosixPath(pathname) {
  return pathname.split("\\").join("/");
}

function walkFiles(dir, prefix = "") {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = resolve(dir, entry.name);

    if (entry.isDirectory()) {
      return walkFiles(absolutePath, relativePath);
    }

    return entry.isFile() ? [toPosixPath(relativePath)] : [];
  }).sort();
}

function runGenerator() {
  rmSync(TEMP_RUNTIME_DIR, { recursive: true, force: true });
  mkdirSync(dirname(TEMP_RUNTIME_DIR), { recursive: true });

  const result = spawnSync(process.execPath, [GENERATOR, THEME_DIR, TEMP_RUNTIME_DIR], {
    cwd: ROOT,
    encoding: "utf8"
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status !== 0) {
    throw new Error(`Runtime generator failed with exit code ${result.status}.`);
  }
}

function compareRuntimeTrees() {
  const errors = [];
  const committedFiles = walkFiles(COMMITTED_RUNTIME_DIR);
  const generatedFiles = walkFiles(TEMP_RUNTIME_DIR);
  const expectedFiles = [...RUNTIME_FILES].sort();

  const missingCommitted = expectedFiles.filter((file) => !existsSync(resolve(COMMITTED_RUNTIME_DIR, file)));
  const missingGenerated = expectedFiles.filter((file) => !existsSync(resolve(TEMP_RUNTIME_DIR, file)));
  if (missingCommitted.length) {
    errors.push(`Committed runtime is missing: ${missingCommitted.join(", ")}`);
  }
  if (missingGenerated.length) {
    errors.push(`Generated runtime is missing: ${missingGenerated.join(", ")}`);
  }

  const committedOnly = committedFiles.filter((file) => !generatedFiles.includes(file));
  const generatedOnly = generatedFiles.filter((file) => !committedFiles.includes(file));
  if (committedOnly.length) {
    errors.push(`Committed runtime has stale files: ${committedOnly.join(", ")}`);
  }
  if (generatedOnly.length) {
    errors.push(`Generated runtime has new files not committed: ${generatedOnly.join(", ")}`);
  }

  const comparableFiles = committedFiles.filter((file) => generatedFiles.includes(file));
  const changed = comparableFiles.filter((file) => {
    const committed = readFileSync(resolve(COMMITTED_RUNTIME_DIR, file));
    const generated = readFileSync(resolve(TEMP_RUNTIME_DIR, file));
    return !committed.equals(generated);
  });

  if (changed.length) {
    errors.push(`Runtime drift detected in: ${changed.join(", ")}`);
  }

  return {
    committedFiles,
    generatedFiles,
    missingCommitted,
    missingGenerated,
    committedOnly,
    generatedOnly,
    changed,
    errors
  };
}

function loadRuntimeScript(context, dir, file) {
  vm.runInContext(readFileSync(resolve(dir, file), "utf8"), context, {
    filename: resolve(dir, file)
  });
}

function computeRuntimeSummary(dir) {
  const context = { window: {}, console };
  context.globalThis = context;
  vm.createContext(context);

  loadRuntimeScript(context, dir, "raw-content-bank.js");
  loadRuntimeScript(context, dir, "alpaca-channel.js");
  loadRuntimeScript(context, dir, "content/alpacards.js");

  const rawContentBank = context.window.WSC_RAW_CONTENT_BANK || {};
  const alpacaChannel = context.window.WSC_ALPACA_CHANNEL || {};
  const alpacardsPayload = context.window.WSC_ALPACARDS || [];
  const alpacards = Array.isArray(alpacardsPayload)
    ? alpacardsPayload
    : alpacardsPayload.cards || [];
  let entries = 0;
  let quizQuestions = 0;
  let guideQuestions = 0;
  let gameOnlyQuestions = 0;

  for (const section of Object.values(rawContentBank.sections || {})) {
    entries += (section.entries || []).length;
    guideQuestions += (section.guideQuestions || []).length;
    for (const entry of section.entries || []) {
      quizQuestions += (entry.quizQuestions || []).length;
      gameOnlyQuestions += (entry.gameOnlyQuestions || []).length;
    }
  }

  return {
    sections: Object.keys(rawContentBank.sections || {}).length,
    entries,
    quizQuestions,
    guideQuestions,
    gameOnlyQuestions,
    fullVoyageQuestions: (rawContentBank.fullVoyageQuestions || []).length,
    videos: (alpacaChannel.videos || []).length,
    alpacards: alpacards.length
  };
}

function validateSummary(dir) {
  const summaryPath = resolve(dir, "summary.json");
  const declared = JSON.parse(readFileSync(summaryPath, "utf8"));
  const computed = computeRuntimeSummary(dir);
  const errors = [];

  for (const [key, computedValue] of Object.entries(computed)) {
    if (declared[key] !== computedValue) {
      errors.push(`${key} summary mismatch: declared=${declared[key]} computed=${computedValue}`);
    }
  }

  return {
    dir: toPosixPath(relative(ROOT, dir)),
    declared,
    computed,
    errors
  };
}

function main() {
  runGenerator();

  const treeReport = compareRuntimeTrees();
  const committedSummary = validateSummary(COMMITTED_RUNTIME_DIR);
  const generatedSummary = validateSummary(TEMP_RUNTIME_DIR);
  const errors = [
    ...treeReport.errors,
    ...committedSummary.errors.map((error) => `Committed ${error}`),
    ...generatedSummary.errors.map((error) => `Generated ${error}`)
  ];

  const report = {
    committedRuntimeDir: toPosixPath(relative(ROOT, COMMITTED_RUNTIME_DIR)),
    generatedRuntimeDir: toPosixPath(relative(ROOT, TEMP_RUNTIME_DIR)),
    changed: treeReport.changed,
    committedOnly: treeReport.committedOnly,
    generatedOnly: treeReport.generatedOnly,
    committedSummary,
    generatedSummary,
    errors
  };

  console.log(JSON.stringify(report, null, 2));

  if (errors.length) {
    console.error(
      "Runtime drift detected. Run `cd app && npm run theme:build-runtime`, review generated files, then commit them."
    );
    process.exit(1);
  }
}

main();
