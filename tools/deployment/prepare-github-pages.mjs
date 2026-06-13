import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../..");
const appRoot = join(repoRoot, "app");
const campusDistRoot = join(appRoot, "dist-3d");
const targetName = getTargetName();
const publicDistRoot = join(appRoot, targetName === "vercel" ? "dist-vercel" : "dist-pages");

const topLevelRuntimeFiles = [
  "index.html",
  "manifest.webmanifest",
  "service-worker.js",
  "pwa.js",
  "app.js",
  "supabase-config.js"
];

const generatedRuntimeFiles = [
  "generated/current-runtime/data.js",
  "generated/current-runtime/knowledge-bank.js",
  "generated/current-runtime/assets-config.js",
  "generated/current-runtime/raw-content-bank.js",
  "generated/current-runtime/alpaca-channel.js",
  "generated/current-runtime/content/alpacards.js"
];

const publicContentEntries = [
  "content/debate/debate-lab-data.js",
  "content/debate/debate-judge-instructions.pdf",
  "content/regular-guides/pdf",
  "content/regular-guides/docx"
];

const runtimeScriptDirs = [
  "src/app",
  "src/services",
  "src/theme",
  "src/ui",
  "src/modes",
  "src/features/campus-shared"
];

const publicAssetDirs = [
  "app-icons",
  "assets"
];

const requiredCampusCustomProps = new Set([
  "alhambra-pattern-ii.glb",
  "alhambra-study-ii.glb",
  "anime-classroom.glb",
  "antique-wooden-pedestal-stand-type-a.glb",
  "arab-majlis.glb",
  "church-bench.glb",
  "cour-du-chateau-de-chambord.glb",
  "debatelab.glb",
  "fine-persian-esfahan-carpet.glb",
  "long-table.glb",
  "masjid-al-aqsa-dome-of-the-rock.glb",
  "middle-aged-ottoman-table.glb",
  "old-wooden-door.glb",
  "oriental-fountain.glb",
  "ottoman-pillow-and-carpets.glb",
  "reception-desk.glb",
  "school-locker.glb",
  "sm-door.glb",
  "whiteboard.glb"
]);

function getTargetName() {
  const targetArg = process.argv.find((arg) => arg.startsWith("--target="));
  const parsedTarget = targetArg ? targetArg.split("=")[1] : "pages";
  if (parsedTarget !== "pages" && parsedTarget !== "vercel") {
    throw new Error(`Unsupported public artifact target: ${parsedTarget}`);
  }
  return parsedTarget;
}

function copyAppPath(relativePath) {
  const source = join(appRoot, relativePath);
  const destination = join(publicDistRoot, relativePath);
  if (!existsSync(source)) {
    throw new Error(`Missing runtime artifact source: ${relativePath}`);
  }

  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, {
    recursive: true,
    dereference: false
  });
}

function copyTopLevelStyles() {
  readdirSync(appRoot)
    .filter((entryName) => entryName === "styles.css" || /^styles-[\w-]+\.css$/.test(entryName))
    .forEach(copyAppPath);
}

function copyRuntimeScriptDirectory(relativeDir) {
  const absoluteDir = join(appRoot, relativeDir);
  if (!existsSync(absoluteDir)) {
    throw new Error(`Missing runtime script directory: ${relativeDir}`);
  }

  readdirSync(absoluteDir, { withFileTypes: true }).forEach((entry) => {
    const relativePath = `${relativeDir}/${entry.name}`;
    if (entry.isDirectory()) {
      copyRuntimeScriptDirectory(relativePath);
      return;
    }

    if (entry.isFile() && entry.name.endsWith(".js")) {
      copyAppPath(relativePath);
    }
  });
}

function copyRuntimeAllowlist() {
  topLevelRuntimeFiles.forEach(copyAppPath);
  copyTopLevelStyles();
  generatedRuntimeFiles.forEach(copyAppPath);
  publicContentEntries.forEach(copyAppPath);
  publicAssetDirs.forEach(copyAppPath);
  runtimeScriptDirs.forEach(copyRuntimeScriptDirectory);
}

function assertNoNestedOutputCopies() {
  const relativeOutput = relative(appRoot, publicDistRoot);
  const nestedOutput = join(publicDistRoot, relativeOutput);
  if (existsSync(nestedOutput) && statSync(nestedOutput).isDirectory()) {
    throw new Error(`Nested public artifact output was copied unexpectedly: ${nestedOutput}`);
  }
}

if (!existsSync(campusDistRoot)) {
  throw new Error("Missing dist-3d. Run vite build before prepare-github-pages.");
}

rmSync(publicDistRoot, { recursive: true, force: true });
mkdirSync(publicDistRoot, { recursive: true });

copyRuntimeAllowlist();
assertNoNestedOutputCopies();

rmSync(join(publicDistRoot, "assets", "campus-3d"), { recursive: true, force: true });
rmSync(join(publicDistRoot, "alpaca-campus-3d"), { recursive: true, force: true });
cpSync(join(campusDistRoot, "alpaca-campus-3d"), join(publicDistRoot, "alpaca-campus-3d"), { recursive: true });
cpSync(join(campusDistRoot, "assets"), join(publicDistRoot, "assets"), { recursive: true });

const campusCustomPropsRoot = join(publicDistRoot, "assets", "campus-3d", "props", "custom");
if (existsSync(campusCustomPropsRoot)) {
  readdirSync(campusCustomPropsRoot).forEach((fileName) => {
    if (!requiredCampusCustomProps.has(fileName)) {
      rmSync(join(campusCustomPropsRoot, fileName), { recursive: true, force: true });
    }
  });
}

writeFileSync(join(publicDistRoot, ".gitignore"), "*\n");

if (targetName === "pages") {
  writeFileSync(join(publicDistRoot, ".nojekyll"), "\n");
}

console.log(`Prepared ${targetName} public artifact in ${relative(repoRoot, publicDistRoot)}.`);
