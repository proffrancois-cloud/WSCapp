import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const CURRENT_DIR = path.resolve(process.argv[2] || path.join(ROOT, "app"));
const GENERATED_DIR = path.resolve(process.argv[3] || path.join(ROOT, "dist/generated/current-runtime"));
const profileArgIndex = process.argv.findIndex((arg) => arg === "--profile" || arg.startsWith("--profile="));
const PROFILE = profileArgIndex >= 0
  ? (
      process.argv[profileArgIndex].includes("=")
        ? process.argv[profileArgIndex].split("=").slice(1).join("=")
        : process.argv[profileArgIndex + 1]
    )
  : "strict";
const FILES = [
  "data.js",
  "knowledge-bank.js",
  "assets-config.js",
  "raw-content-bank.js",
  "alpaca-channel.js",
  "content/alpacards.js"
];

function loadRuntime(dir) {
  const context = { window: {}, console };
  context.globalThis = context;
  vm.createContext(context);
  for (const file of FILES) {
    vm.runInContext(fs.readFileSync(path.join(dir, file), "utf8"), context, {
      filename: path.join(dir, file)
    });
  }
  return context.window;
}

function summarize(runtime) {
  const raw = runtime.WSC_RAW_CONTENT_BANK || {};
  const sections = Object.values(raw.sections || {});
  const cards = Array.isArray(runtime.WSC_ALPACARDS)
    ? runtime.WSC_ALPACARDS
    : runtime.WSC_ALPACARDS?.cards || [];

  let entries = 0;
  let quizQuestions = 0;
  let legacyQuizQuestions = 0;
  let v3QuestionGroups = 0;
  let guideQuestions = 0;

  for (const section of sections) {
    entries += (section.entries || []).length;
    guideQuestions += (section.guideQuestions || []).length;
    for (const entry of section.entries || []) {
      quizQuestions += (entry.quizQuestions || []).length;
      legacyQuizQuestions += (entry.legacyQuizQuestions || []).length;
      v3QuestionGroups += (entry.v3QuestionGroups || []).length;
    }
  }

  return {
    dataSections: runtime.WSC_DATA?.sections?.length || 0,
    knowledgeSections: runtime.WSC_KNOWLEDGE_BANK?.sections?.length || 0,
    rawSectionIds: Object.keys(raw.sections || {}),
    entries,
    quizQuestions,
    legacyQuizQuestions,
    v3QuestionGroups,
    guideQuestions,
    fullVoyageQuestions: raw.fullVoyageQuestions?.length || 0,
    videos: runtime.WSC_ALPACA_CHANNEL?.videos?.length || 0,
    alpacards: cards.length,
    firstRawQuestion: sections[0]?.entries?.[0]?.quizQuestions?.[0]?.id || null,
    firstGuideQuestion: sections[0]?.guideQuestions?.[0]?.id || null,
    firstFullVoyage: raw.fullVoyageQuestions?.[0]?.id || null,
    firstVideo: runtime.WSC_ALPACA_CHANNEL?.videos?.[0]?.id || null,
    firstCard: cards[0]?.id || null
  };
}

const ALL_COMPARE_KEYS = [
  "dataSections",
  "knowledgeSections",
  "rawSectionIds",
  "entries",
  "quizQuestions",
  "guideQuestions",
  "fullVoyageQuestions",
  "videos",
  "alpacards",
  "firstRawQuestion",
  "firstGuideQuestion",
  "firstFullVoyage",
  "firstVideo",
  "firstCard"
];

const ACTIVE_RUNTIME_ACCEPTED_DELTAS = Object.freeze({
  fullVoyageQuestions: "The published app intentionally excludes full-voyage level 400/500 questions from the active runtime.",
  firstGuideQuestion: "Legacy root runtime and generated runtime preserve different guide-question ordering; counts still match.",
  firstFullVoyage: "The published app has no active full-voyage question list, while the generated compatibility artifact can report one."
});

function getCompareKeys(profile) {
  if (profile === "strict") {
    return ALL_COMPARE_KEYS;
  }

  if (profile === "active-runtime" || profile === "legacy-audit") {
    return ALL_COMPARE_KEYS.filter((key) => !ACTIVE_RUNTIME_ACCEPTED_DELTAS[key]);
  }

  throw new Error(`Unknown compare-runtime profile: ${profile}`);
}

function assertEqual(label, current, generated, errors) {
  const currentValue = JSON.stringify(current);
  const generatedValue = JSON.stringify(generated);
  if (currentValue !== generatedValue) {
    errors.push(`${label} mismatch: current=${currentValue} generated=${generatedValue}`);
  }
}

const current = summarize(loadRuntime(CURRENT_DIR));
const generated = summarize(loadRuntime(GENERATED_DIR));
const errors = [];
const acceptedDifferences = [];

for (const key of getCompareKeys(PROFILE)) {
  assertEqual(key, current[key], generated[key], errors);
}

if (PROFILE !== "strict") {
  Object.entries(ACTIVE_RUNTIME_ACCEPTED_DELTAS).forEach(([key, reason]) => {
    if (JSON.stringify(current[key]) !== JSON.stringify(generated[key])) {
      acceptedDifferences.push({
        key,
        current: current[key],
        generated: generated[key],
        reason
      });
    }
  });
}

if (generated.legacyQuizQuestions !== 0) {
  errors.push(`generated legacyQuizQuestions should be 0, got ${generated.legacyQuizQuestions}`);
}
if (generated.v3QuestionGroups !== 0) {
  errors.push(`generated v3QuestionGroups should be 0, got ${generated.v3QuestionGroups}`);
}

const result = {
  profile: PROFILE,
  currentDir: path.relative(ROOT, CURRENT_DIR),
  generatedDir: path.relative(ROOT, GENERATED_DIR),
  current,
  generated,
  expectedDifferences: {
    legacyQuizQuestionsRemoved: current.legacyQuizQuestions,
    v3QuestionGroupsRemoved: current.v3QuestionGroups
  },
  acceptedDifferences,
  errors
};

console.log(JSON.stringify(result, null, 2));

if (errors.length) {
  process.exit(1);
}
