import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const DEFAULT_THEME_DIR = path.join(ROOT, "content/themes/2026");
const THEME_DIR = path.resolve(process.argv[2] || DEFAULT_THEME_DIR);
const OUT_DIR = path.resolve(process.argv[3] || path.join(ROOT, "dist/generated/current-runtime"));

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJsonScript(filePath, globalName, data, declaration = "window") {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${declaration}.${globalName} = ${JSON.stringify(data, null, 2)};\n`);
}

function writeWindowScript(filePath, globalName, data) {
  writeJsonScript(filePath, globalName, data, "window");
}

function themePath(relativePath) {
  return path.join(THEME_DIR, relativePath.replace(/^\.\//, ""));
}

function compatQuestion(question) {
  const { sourceId, sourceType, entryId, ...rest } = question;
  return {
    ...rest,
    id: sourceId || question.id
  };
}

function sourceKey(question) {
  return question.sourceId || question.id;
}

function loadQuestionBank(manifest) {
  if (!manifest.questionBank) {
    return null;
  }

  const bankPath = themePath(manifest.questionBank);
  if (!fs.existsSync(bankPath)) {
    return null;
  }

  return readJson(bankPath);
}

function questionMatchesSection(question, sectionId) {
  return (question.placements || []).some((placement) => placement.sectionId === sectionId) ||
    question.sectionId === sectionId ||
    (question.sectionIds || []).includes(sectionId);
}

function questionsForSection(manifestSection, questionBank) {
  if (!questionBank?.questions) {
    return readJson(themePath(manifestSection.content.questions));
  }

  const levels = {};
  for (const question of questionBank.questions || []) {
    if (!questionMatchesSection(question, manifestSection.id)) {
      continue;
    }

    const placement = (question.placements || []).find((item) => item.sectionId === manifestSection.id);
    const levelKey = String(placement?.levelKey || question.displayLevel || Number(question.level) * 100);
    if (!levels[levelKey]) {
      levels[levelKey] = [];
    }
    levels[levelKey].push({
      ...question,
      wrongAnswers: question.wrongAnswers || (question.distractors || []).map((item) => item.answer),
      visibleWrongExplanations: question.visibleWrongExplanations || (question.distractors || []).map((item) => ({
        label: item.label,
        answer: item.answer,
        explanation: item.feedback
      }))
    });
  }

  for (const [levelKey, list] of Object.entries(levels)) {
    levels[levelKey] = list.sort((left, right) => {
      const leftPlacement = (left.placements || []).find((item) => item.sectionId === manifestSection.id);
      const rightPlacement = (right.placements || []).find((item) => item.sectionId === manifestSection.id);
      return Number(leftPlacement?.levelQuestionIndex ?? leftPlacement?.sectionQuestionIndex ?? 0) -
        Number(rightPlacement?.levelQuestionIndex ?? rightPlacement?.sectionQuestionIndex ?? 0);
    });
  }

  return {
    id: `questions.${manifestSection.id}`,
    sectionId: manifestSection.id,
    levels
  };
}

function buildRawContentBank(manifest) {
  const metadata = readJson(path.join(THEME_DIR, "compat/raw-content-metadata.json"));
  const sectionOrder = readJson(path.join(THEME_DIR, "compat/raw-section-order.json"));
  const fullVoyageOrder = readJson(path.join(THEME_DIR, "compat/full-voyage-order.json"));
  const manifestById = new Map((manifest.sections || []).map((section) => [section.id, section]));
  const questionBank = loadQuestionBank(manifest);
  const sections = {};
  const fullVoyageBySourceId = new Map();
  const regularGuides = [];

  for (const sectionId of sectionOrder) {
    const manifestSection = manifestById.get(sectionId);
    if (!manifestSection) {
      continue;
    }
    const section = readJson(themePath(manifestSection.path));
    const rawContent = readJson(themePath(manifestSection.content.rawContent));
    const questions = questionsForSection(manifestSection, questionBank);
    const guide = readJson(themePath(manifestSection.content.guide));
    const guideHtmlPath = path.join(path.dirname(themePath(manifestSection.content.guide)), guide.htmlPath || "./guide.html");
    const guideHtml = fs.existsSync(guideHtmlPath) ? fs.readFileSync(guideHtmlPath, "utf8") : "";

    const entryQuestionsByEntryId = new Map();
    const guideQuestions = [];

    for (const list of Object.values(questions.levels || {})) {
      for (const question of list || []) {
        if (question.sourceType === "entry.quizQuestions" && question.entryId) {
          if (!entryQuestionsByEntryId.has(question.entryId)) {
            entryQuestionsByEntryId.set(question.entryId, []);
          }
          entryQuestionsByEntryId.get(question.entryId).push(compatQuestion(question));
        } else if (question.sourceType === "section.guideQuestions") {
          guideQuestions.push(compatQuestion(question));
        } else if (question.sourceType === "fullVoyageQuestions") {
          const key = sourceKey(question);
          if (!fullVoyageBySourceId.has(key)) {
            fullVoyageBySourceId.set(key, compatQuestion(question));
          }
        }
      }
    }

    const entries = (rawContent.entries || []).map((entry) => {
      const {
        id: _generatedEntryId,
        order: _order,
        mediaIds: _mediaIds,
        questionIds: _questionIds,
        ...rest
      } = entry;
      return {
        ...rest,
        quizQuestions: entryQuestionsByEntryId.get(entry.id) || []
      };
    });

    const regularGuide = {
      id: guide.id,
      sectionId: section.id,
      title: guide.title || section.title,
      href: guide.href || "",
      pdfHref: guide.pdfHref || "",
      docxHref: guide.docxHref || "",
      htmlContent: guideHtml
    };
    regularGuides.push(regularGuide);

    sections[section.id] = {
      id: section.id,
      title: section.title,
      guidingSection: section.originalTitle || section.title,
      entries,
      guideQuestions,
      regularGuide
    };
  }

  const orderedFullVoyageQuestions = [];
  const emittedFullVoyage = new Set();
  for (const id of fullVoyageOrder) {
    const question = fullVoyageBySourceId.get(id);
    if (question) {
      orderedFullVoyageQuestions.push(question);
      emittedFullVoyage.add(id);
    }
  }
  for (const [id, question] of fullVoyageBySourceId.entries()) {
    if (!emittedFullVoyage.has(id)) {
      orderedFullVoyageQuestions.push(question);
    }
  }

  return {
    ...metadata,
    sections,
    regularGuides,
    fullVoyageQuestions: orderedFullVoyageQuestions
  };
}

function buildAlpacaChannel(manifest) {
  const metadata = readJson(path.join(THEME_DIR, "compat/alpaca-channel-metadata.json"));
  const order = readJson(path.join(THEME_DIR, "compat/alpaca-channel-order.json"));
  const generatedIndex = readJson(themePath(manifest.generatedIndexes.channelVideos));
  const videosBySourceId = new Map();
  for (const video of generatedIndex.videos || []) {
    const key = video.sourceId || video.id;
    if (!videosBySourceId.has(key)) {
      const { sourceId, canonicalSectionId, assetId, needsSectionReview, ...rest } = video;
      videosBySourceId.set(key, {
        ...rest,
        id: sourceId || video.id
      });
    }
  }

  const videos = [];
  const emitted = new Set();
  for (const id of order) {
    const video = videosBySourceId.get(id);
    if (video) {
      videos.push(video);
      emitted.add(id);
    }
  }
  for (const [id, video] of videosBySourceId.entries()) {
    if (!emitted.has(id)) {
      videos.push(video);
    }
  }

  return {
    ...metadata,
    videos
  };
}

function buildAlpacards(manifest) {
  const order = readJson(path.join(THEME_DIR, "compat/alpacards-order.json"));
  const generatedIndex = readJson(themePath(manifest.generatedIndexes.alpacards));
  const cardsBySourceId = new Map();
  for (const card of generatedIndex.cards || []) {
    const key = card.sourceId || card.id;
    if (!cardsBySourceId.has(key)) {
    const { sourceId, canonicalSectionId, assetId, ...rest } = card;
      cardsBySourceId.set(key, {
      ...rest,
      id: sourceId || card.id
      });
    }
  }

  const cards = [];
  const emitted = new Set();
  for (const id of order) {
    const card = cardsBySourceId.get(id);
    if (card) {
      cards.push(card);
      emitted.add(id);
    }
  }
  for (const [id, card] of cardsBySourceId.entries()) {
    if (!emitted.has(id)) {
      cards.push(card);
    }
  }
  return cards;
}

function summarize(rawContentBank, alpacaChannel, alpacards) {
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

function main() {
  const manifest = readJson(path.join(THEME_DIR, "manifest.json"));
  const wscData = readJson(path.join(THEME_DIR, "compat/wsc-data.json"));
  const knowledgeBank = readJson(path.join(THEME_DIR, "compat/knowledge-bank.json"));
  const assetConfig = readJson(path.join(THEME_DIR, "compat/assets-config.json"));
  const rawContentBank = buildRawContentBank(manifest);
  const alpacaChannel = buildAlpacaChannel(manifest);
  const alpacards = buildAlpacards(manifest);

  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  ensureDir(path.join(OUT_DIR, "content"));

  writeWindowScript(path.join(OUT_DIR, "data.js"), "WSC_DATA", wscData);
  writeWindowScript(path.join(OUT_DIR, "knowledge-bank.js"), "WSC_KNOWLEDGE_BANK", knowledgeBank);
  writeWindowScript(path.join(OUT_DIR, "assets-config.js"), "WSC_ASSETS", assetConfig);
  writeWindowScript(path.join(OUT_DIR, "raw-content-bank.js"), "WSC_RAW_CONTENT_BANK", rawContentBank);
  writeWindowScript(path.join(OUT_DIR, "alpaca-channel.js"), "WSC_ALPACA_CHANNEL", alpacaChannel);
  writeWindowScript(path.join(OUT_DIR, "content/alpacards.js"), "WSC_ALPACARDS", alpacards);
  fs.writeFileSync(
    path.join(OUT_DIR, "summary.json"),
    `${JSON.stringify(summarize(rawContentBank, alpacaChannel, alpacards), null, 2)}\n`
  );

  console.log(`Generated compatibility runtime in ${path.relative(ROOT, OUT_DIR)}`);
  console.log(fs.readFileSync(path.join(OUT_DIR, "summary.json"), "utf8"));
}

main();
