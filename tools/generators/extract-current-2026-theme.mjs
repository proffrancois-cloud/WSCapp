import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const APP_DIR = path.join(ROOT, "app");
const THEME_DIR = path.join(ROOT, "content/themes/2026");

const RUNTIME_FILES = [
  "data.js",
  "knowledge-bank.js",
  "assets-config.js",
  "raw-content-bank.js",
  "alpaca-channel.js",
  "content/alpacards.js"
];

const CANONICAL_SECTION_ORDER = [
  "introductory-questions",
  "progress-not-regress",
  "more-to-do-than-can-ever-be-listed",
  "the-end-is-nearish",
  "theres-a-draft-in-here",
  "were-all-in-this-to-get-there",
  "where-the-sidewalk-starts",
  "monkey-see-monkey-prototype",
  "the-lovely-and-the-liminal",
  "going-pains",
  "home-and-wandering",
  "where-were-going-well-still-need-them",
  "call-of-duty-free",
  "next-year-in-futurism",
  "concluding-questions"
];

const SECTION_ALIASES = {
  "more-to-do": "more-to-do-than-can-ever-be-listed",
  "theres-a-draft": "theres-a-draft-in-here",
  "were-all-in-this": "were-all-in-this-to-get-there",
  "monkey-see": "monkey-see-monkey-prototype",
  "roads-and-futures": "where-were-going-well-still-need-them"
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function writeText(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, text.endsWith("\n") ? text : `${text}\n`);
}

function slugify(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

function canonicalSectionId(sectionId) {
  if (!sectionId) {
    return "";
  }
  return SECTION_ALIASES[sectionId] || sectionId;
}

function loadCurrentGlobals() {
  const context = {
    window: {},
    console
  };
  context.globalThis = context;
  vm.createContext(context);

  for (const relativeFile of RUNTIME_FILES) {
    const fullPath = path.join(APP_DIR, relativeFile);
    const source = fs.readFileSync(fullPath, "utf8");
    vm.runInContext(source, context, { filename: relativeFile });
  }

  return context.window;
}

function extractAssetPaths(value, out = new Set()) {
  if (!value) {
    return out;
  }

  if (typeof value === "string") {
    if (/^https?:\/\//.test(value)) {
      return out;
    }
    const matches = value.match(/(?:\.\/)?assets\/[^"'()<>\s]+/g) || [];
    for (const match of matches) {
      out.add(match.replace(/^\.\//, ""));
    }
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => extractAssetPaths(item, out));
    return out;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((item) => extractAssetPaths(item, out));
  }

  return out;
}

function assetIdFromPath(sectionId, assetPath, role = "asset") {
  const basename = path.basename(assetPath, path.extname(assetPath));
  return `asset.${sectionId}.${role}.${slugify(basename)}`;
}

function flattenAssetConfig(value, prefix = [], out = []) {
  if (!value) {
    return out;
  }

  if (typeof value === "string") {
    if (value.includes("assets/")) {
      out.push({
        id: `asset.config.${prefix.map(slugify).filter(Boolean).join(".")}`,
        role: prefix.join("."),
        path: value.replace(/^\.\//, "")
      });
    }
    return out;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenAssetConfig(item, [...prefix, String(index + 1)], out));
    return out;
  }

  if (typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      flattenAssetConfig(child, [...prefix, key], out);
    }
  }

  return out;
}

function groupedBySection(items, getSectionIds) {
  const grouped = new Map();
  for (const item of items || []) {
    const sectionIds = (getSectionIds(item) || [])
      .map(canonicalSectionId)
      .filter((sectionId) => CANONICAL_SECTION_ORDER.includes(sectionId));

    for (const sectionId of new Set(sectionIds)) {
      if (!grouped.has(sectionId)) {
        grouped.set(sectionId, []);
      }
      grouped.get(sectionId).push(item);
    }
  }
  return grouped;
}

function unassignedItems(items, getSectionIds) {
  return (items || []).filter((item) => {
    const sectionIds = (getSectionIds(item) || [])
      .map(canonicalSectionId)
      .filter((sectionId) => CANONICAL_SECTION_ORDER.includes(sectionId));
    return sectionIds.length === 0;
  });
}

function normalizeQuestion(question, generatedId, sourceType, sectionId, entryId = null) {
  const displayLevel = Number(question.displayLevel || (question.level ? question.level * 100 : 0));
  return {
    ...question,
    id: generatedId,
    sourceId: question.id || question.sourceQuestionId || null,
    sourceType,
    sectionId,
    entryId,
    displayLevel
  };
}

function buildSectionQuestions(sectionId, rawSection, fullVoyageQuestions) {
  const levels = {
    100: [],
    200: [],
    300: [],
    400: [],
    500: []
  };
  const entryQuestionIds = new Map();
  const counters = {
    100: 0,
    200: 0,
    300: 0,
    400: 0,
    500: 0
  };

  for (const [entryIndex, entry] of (rawSection.entries || []).entries()) {
    const entryId = `raw.${sectionId}.${String(entryIndex + 1).padStart(3, "0")}`;
    const questionIds = [];
    for (const question of entry.quizQuestions || []) {
      const displayLevel = Number(question.displayLevel || (question.level ? question.level * 100 : 100));
      const safeLevel = levels[displayLevel] ? displayLevel : 100;
      counters[safeLevel] += 1;
      const id = `question.${sectionId}.${safeLevel}.${String(counters[safeLevel]).padStart(3, "0")}`;
      levels[safeLevel].push(normalizeQuestion(question, id, "entry.quizQuestions", sectionId, entryId));
      questionIds.push(id);
    }
    entryQuestionIds.set(entryId, questionIds);
  }

  for (const question of rawSection.guideQuestions || []) {
    const displayLevel = Number(question.displayLevel || (question.level ? question.level * 100 : 300));
    const safeLevel = levels[displayLevel] ? displayLevel : 300;
    counters[safeLevel] += 1;
    const id = `question.${sectionId}.${safeLevel}.${String(counters[safeLevel]).padStart(3, "0")}`;
    levels[safeLevel].push(normalizeQuestion(question, id, "section.guideQuestions", sectionId));
  }

  for (const question of fullVoyageQuestions || []) {
    const questionSectionIds = (question.sectionIds || [question.sectionId])
      .map(canonicalSectionId)
      .filter(Boolean);
    if (!questionSectionIds.includes(sectionId)) {
      continue;
    }

    const displayLevel = Number(question.displayLevel || (question.level ? question.level * 100 : 400));
    const safeLevel = levels[displayLevel] ? displayLevel : 400;
    counters[safeLevel] += 1;
    const id = `question.${sectionId}.${safeLevel}.${String(counters[safeLevel]).padStart(3, "0")}`;
    levels[safeLevel].push(normalizeQuestion(question, id, "fullVoyageQuestions", sectionId));
  }

  return {
    questionSet: {
      id: `questions.${sectionId}`,
      sectionId,
      levels
    },
    entryQuestionIds
  };
}

function buildSectionMedia(sectionId, sectionPayload, alpacards, videos) {
  const mediaPaths = extractAssetPaths(sectionPayload);
  for (const card of alpacards) {
    extractAssetPaths(card, mediaPaths);
  }
  for (const video of videos) {
    extractAssetPaths(video, mediaPaths);
  }

  const assets = [...mediaPaths].sort().map((assetPath) => {
    let role = "asset";
    if (assetPath.includes("/raw-content/")) {
      role = "raw";
    } else if (assetPath.includes("/flashcards/")) {
      role = "alpacard";
    } else if (assetPath.includes("thumbnail") || assetPath.includes("thumb")) {
      role = "channel";
    }

    return {
      id: assetIdFromPath(sectionId, assetPath, role),
      type: "image",
      role,
      path: assetPath,
      alt: "",
      credit: ""
    };
  });

  return {
    id: `media.${sectionId}`,
    sectionId,
    assets
  };
}

function buildRawContent(sectionId, rawSection, entryQuestionIds) {
  return {
    id: `raw.${sectionId}`,
    sectionId,
    entries: (rawSection.entries || []).map((entry, index) => {
      const entryId = `raw.${sectionId}.${String(index + 1).padStart(3, "0")}`;
      const {
        quizQuestions: _quizQuestions,
        legacyQuizQuestions: _legacyQuizQuestions,
        v3QuestionGroups: _v3QuestionGroups,
        ...contentEntry
      } = entry;
      const mediaIds = [...extractAssetPaths(contentEntry)]
        .sort()
        .map((assetPath) => assetIdFromPath(sectionId, assetPath, assetPath.includes("/raw-content/") ? "raw" : "asset"));

      return {
        id: entryId,
        order: index + 1,
        sectionId,
        mediaIds,
        questionIds: entryQuestionIds.get(entryId) || [],
        ...contentEntry
      };
    })
  };
}

function enrichAlpacards(cards, sectionId) {
  return cards.map((card, index) => {
    const imagePath = card.imagePath || "";
    return {
      ...card,
      id: `alpacard.${sectionId}.${String(index + 1).padStart(3, "0")}`,
      sourceId: card.id || null,
      sectionId,
      canonicalSectionId: sectionId,
      assetId: imagePath ? assetIdFromPath(sectionId, imagePath, "alpacard") : null
    };
  });
}

function enrichVideos(videos, sectionId) {
  return videos.map((video, index) => {
    const imagePath = video.imagePath || video.thumbnailPath || video.thumbnail || "";
    return {
      ...video,
      id: `video.${sectionId}.${String(index + 1).padStart(3, "0")}`,
      sourceId: video.id || null,
      canonicalSectionId: sectionId,
      assetId: imagePath ? assetIdFromPath(sectionId, imagePath, "channel") : null
    };
  });
}

function enrichThemeWideAlpacards(cards) {
  return cards.map((card, index) => ({
    ...card,
    id: `alpacard.theme-wide.${String(index + 1).padStart(3, "0")}`,
    sourceId: card.id || null,
    sectionIds: (card.sectionIds || [card.sectionId]).filter(Boolean),
    assetId: card.imagePath ? assetIdFromPath("theme-wide", card.imagePath, "alpacard") : null
  }));
}

function enrichThemeWideVideos(videos) {
  return videos.map((video, index) => {
    const imagePath = video.imagePath || video.thumbnailPath || video.thumbnail || "";
    return {
      ...video,
      id: `video.theme-wide.${String(index + 1).padStart(3, "0")}`,
      sourceId: video.id || null,
      sectionIds: (video.sectionIds || [video.sectionId]).filter(Boolean),
      assetId: imagePath ? assetIdFromPath("theme-wide", imagePath, "channel") : null,
      needsSectionReview: true
    };
  });
}

function buildSectionJson(sectionId, rawSection, dataSection, order) {
  return {
    id: sectionId,
    title: rawSection.title || dataSection?.title || sectionId,
    shortTitle: dataSection?.title || rawSection.title || sectionId,
    originalTitle: dataSection?.originalTitle || rawSection.guidingSection || rawSection.title || "",
    order,
    themeId: "wsc-2026",
    blurb: dataSection?.blurb || "",
    angle: dataSection?.angle || "",
    subjectIds: [...new Set((rawSection.entries || []).flatMap((entry) => entry.subjects || []).map(slugify).filter(Boolean))],
    bigIdeaIds: [...new Set((rawSection.entries || []).flatMap((entry) => entry.bigIdeas || []).map(slugify).filter(Boolean))],
    legacyIds: Object.entries(SECTION_ALIASES)
      .filter(([, target]) => target === sectionId)
      .map(([alias]) => alias),
    assetIds: {
      cover: `asset.${sectionId}.card.cover`,
      icon: `asset.${sectionId}.icon`
    },
    contentRefs: {
      rawContent: `raw.${sectionId}`,
      questions: `questions.${sectionId}`,
      guide: `guide.${sectionId}`,
      media: `media.${sectionId}`,
      alpacards: `alpacards.${sectionId}`,
      channelVideos: `channel.${sectionId}`
    }
  };
}

function main() {
  const globals = loadCurrentGlobals();
  const data = globals.WSC_DATA || {};
  const knowledgeBank = globals.WSC_KNOWLEDGE_BANK || {};
  const raw = globals.WSC_RAW_CONTENT_BANK || {};
  const assetConfig = globals.WSC_ASSETS || {};
  const alpacaChannel = globals.WSC_ALPACA_CHANNEL || {};
  const alpacards = Array.isArray(globals.WSC_ALPACARDS)
    ? globals.WSC_ALPACARDS
    : globals.WSC_ALPACARDS?.cards || [];
  const videos = alpacaChannel.videos || [];

  const rawSections = raw.sections || {};
  const dataSectionsByCanonicalId = new Map((data.sections || []).map((section) => [canonicalSectionId(section.id), section]));
  const alpacardsBySection = groupedBySection(alpacards, (card) => [card.sectionId]);
  const videosBySection = groupedBySection(videos, (video) => video.sectionIds || [video.sectionId]);
  const themeWideAlpacards = enrichThemeWideAlpacards(unassignedItems(alpacards, (card) => [card.sectionId]));
  const themeWideVideos = enrichThemeWideVideos(unassignedItems(videos, (video) => video.sectionIds || [video.sectionId]));
  const fullVoyageQuestions = raw.fullVoyageQuestions || [];
  const manifestSections = [];
  const generatedAlpacardsIndex = [];
  const generatedVideoIndex = [];
  const migrationReport = {
    generatedAt: new Date().toISOString(),
    sourceFiles: RUNTIME_FILES.map((file) => `app/${file}`),
    sections: {},
    totals: {
      sections: 0,
      rawEntries: 0,
      activeQuestions: 0,
      legacyQuizQuestions: 0,
      v3QuestionGroups: 0,
      alpacards: alpacards.length,
      videos: videos.length,
      themeWideAlpacards: themeWideAlpacards.length,
      themeWideVideos: themeWideVideos.length,
      sectionVideoPlacements: 0,
      assetConfigEntries: 0
    }
  };

  fs.rmSync(THEME_DIR, { recursive: true, force: true });
  ensureDir(THEME_DIR);

  writeJson(path.join(THEME_DIR, "theme.json"), {
    id: "wsc-2026",
    year: 2026,
    title: data.theme?.title || "Are We There Yet?",
    subtitle: "WSC 2026 Study Routes",
    defaultLocale: "en",
    active: true,
    source: "generated-from-current-runtime"
  });

  writeJson(path.join(THEME_DIR, "aliases.json"), SECTION_ALIASES);
  writeJson(path.join(THEME_DIR, "compat", "wsc-data.json"), data);
  writeJson(path.join(THEME_DIR, "compat", "knowledge-bank.json"), knowledgeBank);
  writeJson(path.join(THEME_DIR, "compat", "assets-config.json"), assetConfig);
  writeJson(path.join(THEME_DIR, "compat", "raw-content-metadata.json"), Object.fromEntries(
    Object.entries(raw).filter(([key]) => !["sections", "fullVoyageQuestions"].includes(key))
  ));
  writeJson(path.join(THEME_DIR, "compat", "raw-section-order.json"), Object.keys(raw.sections || {}));
  writeJson(path.join(THEME_DIR, "compat", "full-voyage-order.json"), (raw.fullVoyageQuestions || []).map((question) => question.id || question.sourceQuestionId));
  writeJson(path.join(THEME_DIR, "compat", "alpaca-channel-metadata.json"), Object.fromEntries(
    Object.entries(alpacaChannel).filter(([key]) => key !== "videos")
  ));
  writeJson(path.join(THEME_DIR, "compat", "alpaca-channel-order.json"), videos.map((video) => video.id));
  writeJson(path.join(THEME_DIR, "compat", "alpacards-order.json"), alpacards.map((card) => card.id));

  for (const [index, sectionId] of CANONICAL_SECTION_ORDER.entries()) {
    const rawSection = rawSections[sectionId];
    if (!rawSection) {
      migrationReport.sections[sectionId] = { missingRawSection: true };
      continue;
    }

    const sectionDir = path.join(THEME_DIR, "sections", sectionId);
    const dataSection = dataSectionsByCanonicalId.get(sectionId) || null;
    const sectionCards = enrichAlpacards(alpacardsBySection.get(sectionId) || [], sectionId);
    const sectionVideos = enrichVideos(videosBySection.get(sectionId) || [], sectionId);
    const { questionSet, entryQuestionIds } = buildSectionQuestions(sectionId, rawSection, fullVoyageQuestions);
    const rawContent = buildRawContent(sectionId, rawSection, entryQuestionIds);
    const media = buildSectionMedia(sectionId, { rawSection, rawContent }, sectionCards, sectionVideos);
    const sectionJson = buildSectionJson(sectionId, rawSection, dataSection, index + 1);
    const regularGuide = rawSection.regularGuide || null;
    const guideHtml = regularGuide?.htmlContent || "";

    const activeQuestionCount = Object.values(questionSet.levels).reduce((total, list) => total + list.length, 0);
    const legacyQuestionCount = (rawSection.entries || []).reduce((total, entry) => total + (entry.legacyQuizQuestions || []).length, 0);
    const v3QuestionGroupCount = (rawSection.entries || []).reduce((total, entry) => total + (entry.v3QuestionGroups || []).length, 0);

    writeJson(path.join(sectionDir, "section.json"), sectionJson);
    writeJson(path.join(sectionDir, "raw-content.json"), rawContent);
    writeJson(path.join(sectionDir, "questions.json"), questionSet);
    writeText(path.join(sectionDir, "guide.html"), guideHtml || "<!-- No guide HTML found for this section. -->\n");
    writeJson(path.join(sectionDir, "guide.json"), {
      id: `guide.${sectionId}`,
      sectionId,
      title: regularGuide?.title || rawSection.title || sectionId,
      href: regularGuide?.href || "",
      pdfHref: regularGuide?.pdfHref || "",
      docxHref: regularGuide?.docxHref || "",
      hasInlineHtml: Boolean(guideHtml),
      htmlPath: "./guide.html"
    });
    writeJson(path.join(sectionDir, "media.json"), media);
    writeJson(path.join(sectionDir, "alpacards.json"), {
      id: `alpacards.${sectionId}`,
      sectionId,
      cards: sectionCards
    });
    writeJson(path.join(sectionDir, "channel-videos.json"), {
      id: `channel.${sectionId}`,
      sectionId,
      videos: sectionVideos
    });

    manifestSections.push({
      id: sectionId,
      title: sectionJson.title,
      path: `./sections/${sectionId}/section.json`,
      content: {
        rawContent: `./sections/${sectionId}/raw-content.json`,
        questions: `./sections/${sectionId}/questions.json`,
        guide: `./sections/${sectionId}/guide.json`,
        media: `./sections/${sectionId}/media.json`,
        alpacards: `./sections/${sectionId}/alpacards.json`,
        channelVideos: `./sections/${sectionId}/channel-videos.json`
      }
    });

    generatedAlpacardsIndex.push(...sectionCards.map((card) => ({ ...card, canonicalSectionId: sectionId })));
    generatedVideoIndex.push(...sectionVideos.map((video) => ({ ...video, canonicalSectionId: sectionId })));
    migrationReport.totals.sectionVideoPlacements += sectionVideos.length;

    migrationReport.sections[sectionId] = {
      title: sectionJson.title,
      rawEntries: rawContent.entries.length,
      activeQuestions: activeQuestionCount,
      legacyQuizQuestions: legacyQuestionCount,
      v3QuestionGroups: v3QuestionGroupCount,
      alpacards: sectionCards.length,
      channelVideos: sectionVideos.length,
      mediaAssets: media.assets.length
    };

    migrationReport.totals.sections += 1;
    migrationReport.totals.rawEntries += rawContent.entries.length;
    migrationReport.totals.activeQuestions += activeQuestionCount;
    migrationReport.totals.legacyQuizQuestions += legacyQuestionCount;
    migrationReport.totals.v3QuestionGroups += v3QuestionGroupCount;
  }

  writeJson(path.join(THEME_DIR, "theme-wide", "alpacards.json"), {
    id: "alpacards.theme-wide",
    themeId: "wsc-2026",
    cards: themeWideAlpacards
  });
  writeJson(path.join(THEME_DIR, "theme-wide", "channel-videos.json"), {
    id: "channel.theme-wide",
    themeId: "wsc-2026",
    videos: themeWideVideos
  });

  const configAssets = flattenAssetConfig(assetConfig)
    .filter((asset) => asset.id && asset.path)
    .sort((a, b) => a.id.localeCompare(b.id));
  migrationReport.totals.assetConfigEntries = configAssets.length;

  writeJson(path.join(THEME_DIR, "assets.json"), {
    id: "assets.wsc-2026",
    themeId: "wsc-2026",
    assets: configAssets
  });
  writeJson(path.join(THEME_DIR, "generated", "alpacards.index.json"), {
    id: "generated.alpacards.index",
    themeId: "wsc-2026",
    cards: [...generatedAlpacardsIndex, ...themeWideAlpacards]
  });
  writeJson(path.join(THEME_DIR, "generated", "channel-videos.index.json"), {
    id: "generated.channel-videos.index",
    themeId: "wsc-2026",
    videos: [...generatedVideoIndex, ...themeWideVideos]
  });
  writeJson(path.join(THEME_DIR, "generated", "assets.index.json"), {
    id: "generated.assets.index",
    themeId: "wsc-2026",
    assets: configAssets
  });

  writeJson(path.join(THEME_DIR, "manifest.json"), {
    themeId: "wsc-2026",
    generatedAt: migrationReport.generatedAt,
    sections: manifestSections,
    themeWide: {
      alpacards: "./theme-wide/alpacards.json",
      channelVideos: "./theme-wide/channel-videos.json"
    },
    generatedIndexes: {
      alpacards: "./generated/alpacards.index.json",
      channelVideos: "./generated/channel-videos.index.json",
      assets: "./generated/assets.index.json"
    }
  });

  writeJson(path.join(THEME_DIR, "migration-report.json"), migrationReport);
  console.log(`Generated ${migrationReport.totals.sections} sections in ${path.relative(ROOT, THEME_DIR)}`);
  console.log(JSON.stringify(migrationReport.totals, null, 2));
}

main();
