import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const DEFAULT_THEME_DIR = path.join(ROOT, "content/themes/2026");
const THEME_DIR = path.resolve(process.argv[2] || DEFAULT_THEME_DIR);
const OUT_DIR = path.resolve(process.argv[3] || path.join(THEME_DIR, "questions"));

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function themePath(relativePath) {
  return path.join(THEME_DIR, relativePath.replace(/^\.\//, ""));
}

function questionKey(question) {
  return question.sourceId || question.sourceQuestionId || question.id;
}

function getWrongFeedback(question, answer) {
  const normalized = normalize(answer);
  return (question.visibleWrongExplanations || []).find((item) => (
    normalize(item.answer) === normalized ||
    normalize(item.text) === normalized
  ))?.explanation || "";
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function uniq(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeQuestion(question, sectionId, levelKey, sectionQuestionIndex, levelQuestionIndex) {
  const wrongAnswers = Array.isArray(question.wrongAnswers) ? question.wrongAnswers : [];
  const sectionIds = uniq([
    ...(Array.isArray(question.sectionIds) ? question.sectionIds : []),
    question.sectionId,
    sectionId
  ]);

  return {
    id: question.id,
    stableId: questionKey(question),
    sourceId: question.sourceId || question.sourceQuestionId || question.id,
    sourceQuestionId: question.sourceQuestionId || question.sourceId || question.id,
    sourceType: question.sourceType || "unknown",
    questionScope: question.questionScope || "",
    sectionId: question.sectionId || sectionId,
    sectionIds,
    entryId: question.entryId || null,
    level: Number(question.level),
    displayLevel: Number(question.displayLevel) || Number(levelKey),
    prompt: question.prompt || "",
    correctAnswer: question.correctAnswer || "",
    wrongAnswers,
    distractors: wrongAnswers.map((answer, index) => ({
      label: String.fromCharCode(66 + index),
      answer,
      feedback: getWrongFeedback(question, answer)
    })),
    explanation: question.explanation || "",
    visibleCorrectExplanation: question.visibleCorrectExplanation || question.explanation || "",
    visibleWrongExplanations: Array.isArray(question.visibleWrongExplanations)
      ? question.visibleWrongExplanations
      : [],
    visibleConnection: question.visibleConnection || "",
    visibleTakeaway: question.visibleTakeaway || "",
    sourceBank: question.sourceBank || "",
    sourceUrl: question.sourceUrl || "",
    sourceNote: question.sourceNote || "",
    sectionInferenceNote: question.sectionInferenceNote || "",
    guidingSectionPrimary: question.guidingSectionPrimary || "",
    guidingSectionSecondary: question.guidingSectionSecondary || "",
    sectionPlacementIds: [],
    placements: [
      {
        sectionId,
        levelKey: String(levelKey),
        sectionQuestionIndex,
        levelQuestionIndex,
        questionId: question.id,
        entryId: question.entryId || null,
        sourceType: question.sourceType || "unknown"
      }
    ]
  };
}

function mergeQuestion(existing, incoming) {
  existing.sectionIds = uniq([...existing.sectionIds, ...incoming.sectionIds]);
  existing.sectionPlacementIds = uniq([...existing.sectionPlacementIds, incoming.id]);
  existing.placements = existing.placements.concat(incoming.placements);

  if (!existing.entryId && incoming.entryId) {
    existing.entryId = incoming.entryId;
  }

  return existing;
}

function csvEscape(value) {
  const text = Array.isArray(value) ? value.join("|") : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(questions) {
  const columns = [
    "stableId",
    "id",
    "sourceType",
    "questionScope",
    "sectionIds",
    "entryId",
    "level",
    "displayLevel",
    "prompt",
    "correctAnswer",
    "distractorB",
    "distractorBFeedback",
    "distractorC",
    "distractorCFeedback",
    "distractorD",
    "distractorDFeedback",
    "visibleCorrectExplanation",
    "visibleConnection",
    "visibleTakeaway",
    "sourceUrl"
  ];

  const rows = questions.map((question) => {
    const distractors = question.distractors || [];
    const values = {
      ...question,
      sectionIds: question.sectionIds,
      distractorB: distractors[0]?.answer || "",
      distractorBFeedback: distractors[0]?.feedback || "",
      distractorC: distractors[1]?.answer || "",
      distractorCFeedback: distractors[1]?.feedback || "",
      distractorD: distractors[2]?.answer || "",
      distractorDFeedback: distractors[2]?.feedback || ""
    };
    return columns.map((column) => csvEscape(values[column])).join(",");
  });

  return `${columns.join(",")}\n${rows.join("\n")}\n`;
}

function build() {
  const manifest = readJson(path.join(THEME_DIR, "manifest.json"));
  const byStableId = new Map();
  let placementCount = 0;

  for (const section of manifest.sections || []) {
    const questionsPath = themePath(section.content?.questions || "");
    const sectionQuestions = readJson(questionsPath);
    let sectionQuestionIndex = 0;

    for (const [levelKey, list] of Object.entries(sectionQuestions.levels || {})) {
      for (const [levelQuestionIndex, question] of (list || []).entries()) {
        placementCount += 1;
        const normalized = normalizeQuestion(question, section.id, levelKey, sectionQuestionIndex, levelQuestionIndex);
        sectionQuestionIndex += 1;
        const key = normalized.stableId;
        if (byStableId.has(key)) {
          mergeQuestion(byStableId.get(key), normalized);
        } else {
          normalized.sectionPlacementIds = [normalized.id];
          byStableId.set(key, normalized);
        }
      }
    }
  }

  const questions = Array.from(byStableId.values()).sort((left, right) => {
    const leftPlacement = left.placements[0] || {};
    const rightPlacement = right.placements[0] || {};
    return (manifest.sections || []).findIndex((section) => section.id === leftPlacement.sectionId) -
      (manifest.sections || []).findIndex((section) => section.id === rightPlacement.sectionId) ||
      Number(left.displayLevel) - Number(right.displayLevel) ||
      left.stableId.localeCompare(right.stableId);
  });

  const bank = {
    id: `${manifest.themeId}.question-bank`,
    themeId: manifest.themeId,
    generatedAt: new Date().toISOString(),
    format: "wsc-question-bank.v1",
    source: "Built from content/themes/2026/sections/*/questions.json during the architecture migration.",
    counts: {
      uniqueQuestions: questions.length,
      sectionPlacements: placementCount,
      bySourceType: questions.reduce((acc, question) => {
        acc[question.sourceType] = (acc[question.sourceType] || 0) + 1;
        return acc;
      }, {})
    },
    questions
  };

  ensureDir(OUT_DIR);
  fs.writeFileSync(path.join(OUT_DIR, "question-bank.json"), `${JSON.stringify(bank, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, "question-bank.csv"), toCsv(questions));
  fs.writeFileSync(path.join(OUT_DIR, "README.md"), `# WSC 2026 Question Bank

This folder is the normalized question source for the 2026 theme.

- \`question-bank.json\` is the app-friendly source of truth: prompt, correct answer, distractors, feedback, source type, level, section links, and raw-content entry links live together.
- \`question-bank.csv\` is a generated review table for humans. Use it to audit wording, distractors, and feedback quickly.
- \`sections/*/questions.json\` still exists as a compatibility view during migration, but the runtime generator now prefers this central bank.

Current counts:

\`\`\`json
${JSON.stringify(bank.counts, null, 2)}
\`\`\`
`);

  console.log(JSON.stringify({
    outDir: path.relative(ROOT, OUT_DIR),
    uniqueQuestions: questions.length,
    sectionPlacements: placementCount,
    bySourceType: bank.counts.bySourceType
  }, null, 2));
}

build();
