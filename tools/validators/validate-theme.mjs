import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const DEFAULT_THEME_DIR = path.join(ROOT, "content/themes/2026");
const THEME_DIR = path.resolve(process.argv[2] || DEFAULT_THEME_DIR);
const APP_DIR = path.join(ROOT, "app");
const VALID_LEVELS = new Set(["100", "200", "300", "400", "500"]);

const errors = [];
const warnings = [];

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`Cannot parse JSON: ${relative(filePath)} (${error.message})`);
    return null;
  }
}

function relative(filePath) {
  return path.relative(ROOT, filePath);
}

function exists(filePath, label) {
  if (!fs.existsSync(filePath)) {
    errors.push(`Missing ${label}: ${relative(filePath)}`);
    return false;
  }
  return true;
}

function resolveThemePath(relativePath) {
  return path.join(THEME_DIR, relativePath.replace(/^\.\//, ""));
}

function questionSourceKey(question) {
  return question?.stableId || question?.sourceId || question?.sourceQuestionId || question?.id;
}

function assetPathExists(assetPath, sectionDir = null) {
  if (!assetPath || /^https?:\/\//.test(assetPath)) {
    return true;
  }

  const candidates = [];
  if (assetPath.startsWith("./") && sectionDir) {
    candidates.push(path.join(sectionDir, assetPath));
  }
  if (assetPath.startsWith("assets/")) {
    candidates.push(path.join(APP_DIR, assetPath));
  }
  if (assetPath.startsWith("./assets/")) {
    candidates.push(path.join(APP_DIR, assetPath.replace(/^\.\//, "")));
  }
  candidates.push(path.join(ROOT, assetPath));

  return candidates.some((candidate) => fs.existsSync(candidate));
}

function validate() {
  exists(THEME_DIR, "theme directory");
  const manifestPath = path.join(THEME_DIR, "manifest.json");
  if (!exists(manifestPath, "manifest")) {
    return;
  }

  const manifest = readJson(manifestPath);
  if (!manifest) {
    return;
  }

  const sectionIds = new Set();
  const questionIds = new Set();
  const sectionQuestionSourceKeys = new Set();
  const alpacardIds = new Set();
  const videoIds = new Set();
  let questionCount = 0;
  let mediaAssetCount = 0;
  let questionBankCount = 0;
  let questionBankPlacementCount = 0;
  let questionBankSourceKeys = new Set();

  const manifestQuestionBankPath = manifest.questionBank ? resolveThemePath(manifest.questionBank) : null;
  if (manifestQuestionBankPath) {
    if (exists(manifestQuestionBankPath, "central question bank")) {
      const questionBank = readJson(manifestQuestionBankPath);
      if (questionBank) {
        questionBankCount = Array.isArray(questionBank.questions) ? questionBank.questions.length : 0;
        for (const question of questionBank.questions || []) {
          const key = questionSourceKey(question);
          if (!key) {
            errors.push("Question bank entry without stable/source id");
            continue;
          }
          if (questionBankSourceKeys.has(key)) {
            errors.push(`Duplicate central question key: ${key}`);
          }
          questionBankSourceKeys.add(key);
          questionBankPlacementCount += Array.isArray(question.placements) ? question.placements.length : 1;
          if (!question.prompt || !question.correctAnswer) {
            errors.push(`Central question missing prompt/correct answer: ${key}`);
          }
          const wrongAnswers = question.wrongAnswers || (question.distractors || []).map((item) => item.answer);
          if (!Array.isArray(wrongAnswers) || wrongAnswers.length < 3) {
            warnings.push(`Central question has fewer than 3 distractors: ${key}`);
          }
        }
      }
    }
  }

  for (const section of manifest.sections || []) {
    if (!section.id) {
      errors.push("Manifest section without id");
      continue;
    }
    if (sectionIds.has(section.id)) {
      errors.push(`Duplicate section id: ${section.id}`);
    }
    sectionIds.add(section.id);

    const sectionPath = resolveThemePath(section.path);
    const sectionDir = path.dirname(sectionPath);
    exists(sectionPath, `section file for ${section.id}`);
    const sectionJson = readJson(sectionPath);
    if (sectionJson && sectionJson.id !== section.id) {
      errors.push(`Section id mismatch for ${section.id}: ${sectionJson.id}`);
    }

    for (const [contentKey, relativePath] of Object.entries(section.content || {})) {
      exists(resolveThemePath(relativePath), `${contentKey} for ${section.id}`);
    }

    const rawContent = readJson(resolveThemePath(section.content?.rawContent || ""));
    const questions = readJson(resolveThemePath(section.content?.questions || ""));
    const media = readJson(resolveThemePath(section.content?.media || ""));
    const alpacards = readJson(resolveThemePath(section.content?.alpacards || ""));
    const channelVideos = readJson(resolveThemePath(section.content?.channelVideos || ""));

    const sectionQuestionIds = new Set();
    for (const [level, list] of Object.entries(questions?.levels || {})) {
      if (!VALID_LEVELS.has(level)) {
        errors.push(`Invalid question level ${level} in ${section.id}`);
      }
      for (const question of list || []) {
        questionCount += 1;
        if (!question.id) {
          errors.push(`Question without id in ${section.id} level ${level}`);
          continue;
        }
        if (questionIds.has(question.id)) {
          errors.push(`Duplicate question id: ${question.id}`);
        }
        questionIds.add(question.id);
        sectionQuestionSourceKeys.add(questionSourceKey(question));
        sectionQuestionIds.add(question.id);
        if (String(question.displayLevel) !== level) {
          warnings.push(`Question displayLevel mismatch: ${question.id} has ${question.displayLevel}, stored under ${level}`);
        }
      }
    }

    for (const entry of rawContent?.entries || []) {
      for (const questionId of entry.questionIds || []) {
        if (!sectionQuestionIds.has(questionId)) {
          errors.push(`Raw entry ${entry.id} references missing question ${questionId}`);
        }
      }
      if (entry.quizQuestions || entry.legacyQuizQuestions || entry.v3QuestionGroups) {
        errors.push(`Raw entry ${entry.id} still contains embedded question arrays`);
      }
    }

    for (const asset of media?.assets || []) {
      mediaAssetCount += 1;
      if (!asset.id) {
        errors.push(`Media asset without id in ${section.id}`);
      }
      if (!assetPathExists(asset.path, sectionDir)) {
        warnings.push(`Asset path not found yet for ${section.id}: ${asset.path}`);
      }
    }

    for (const card of alpacards?.cards || []) {
      if (!card.id) {
        errors.push(`Alpacard without id in ${section.id}`);
        continue;
      }
      if (alpacardIds.has(card.id)) {
        errors.push(`Duplicate alpacard id: ${card.id}`);
      }
      alpacardIds.add(card.id);
    }

    for (const video of channelVideos?.videos || []) {
      if (!video.id) {
        errors.push(`Channel video without id in ${section.id}`);
        continue;
      }
      if (videoIds.has(video.id)) {
        errors.push(`Duplicate channel video id: ${video.id}`);
      }
      videoIds.add(video.id);
    }
  }

  for (const [key, relativePath] of Object.entries(manifest.themeWide || {})) {
    exists(resolveThemePath(relativePath), `theme-wide ${key}`);
  }
  const generatedIndexCounts = {};
  for (const [key, relativePath] of Object.entries(manifest.generatedIndexes || {})) {
    const indexPath = resolveThemePath(relativePath);
    if (exists(indexPath, `generated index ${key}`)) {
      const indexData = readJson(indexPath);
      generatedIndexCounts[key] = Array.isArray(indexData?.cards)
        ? indexData.cards.length
        : Array.isArray(indexData?.videos)
          ? indexData.videos.length
          : Array.isArray(indexData?.assets)
            ? indexData.assets.length
            : 0;
    }
  }

  if (questionBankSourceKeys.size) {
    for (const key of sectionQuestionSourceKeys) {
      if (!questionBankSourceKeys.has(key)) {
        errors.push(`Central question bank is missing section question source key: ${key}`);
      }
    }
    for (const key of questionBankSourceKeys) {
      if (!sectionQuestionSourceKeys.has(key)) {
        warnings.push(`Central question bank has question not present in section compatibility files: ${key}`);
      }
    }
  }

  const assets = readJson(path.join(THEME_DIR, "assets.json"));
  for (const asset of assets?.assets || []) {
    if (!asset.id || !asset.path) {
      errors.push("Global asset entry missing id or path");
      continue;
    }
    if (!assetPathExists(asset.path)) {
      warnings.push(`Global asset path not found yet: ${asset.path}`);
    }
  }

  const summary = {
    themeDir: relative(THEME_DIR),
    sections: sectionIds.size,
    questions: questionCount,
    questionBankQuestions: questionBankCount,
    questionBankPlacements: questionBankPlacementCount,
    mediaAssets: mediaAssetCount,
    alpacards: alpacardIds.size,
    sectionChannelVideoPlacements: videoIds.size,
    generatedIndexes: generatedIndexCounts,
    errors: errors.length,
    warnings: warnings.length
  };

  console.log(JSON.stringify(summary, null, 2));
  if (warnings.length) {
    console.log("\nWarnings:");
    warnings.slice(0, 100).forEach((warning) => console.log(`- ${warning}`));
    if (warnings.length > 100) {
      console.log(`- ... ${warnings.length - 100} more warnings`);
    }
  }
  if (errors.length) {
    console.error("\nErrors:");
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }
}

validate();
