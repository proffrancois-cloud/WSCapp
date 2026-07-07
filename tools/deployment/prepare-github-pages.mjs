import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../..");
const appRoot = join(repoRoot, "app");
const targetName = getTargetName();
const publicDistRoot = join(appRoot, targetName === "vercel" ? "dist-vercel" : "dist-pages");

const topLevelRuntimeFiles = [
  "index.html",
  "cache-reset.html",
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
  "generated/current-runtime/content/raw-content-overrides.js",
  "generated/current-runtime/content/alpacards.js"
];

const publicContentEntries = [
  "content/debate/debate-lab-data.js",
  "content/debate/debate-judge-instructions.pdf",
  "content/regular-guides/pdf",
  "content/regular-guides/docx"
];

const runtimeScriptDirs = [
  "src"
];

const publicAssetDirs = [
  "app-icons",
  "assets"
];

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

function removeLocalMetadataFiles(dir) {
  if (!existsSync(dir)) {
    return;
  }

  readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const absolutePath = join(dir, entry.name);
    if (entry.isDirectory()) {
      removeLocalMetadataFiles(absolutePath);
      return;
    }

    if (entry.isFile() && entry.name === ".DS_Store") {
      rmSync(absolutePath, { force: true });
    }
  });
}

function getGitCommitSha() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch (_error) {
    return "";
  }
}

function getDeployVersion() {
  const rawVersion = process.env.WSC_DEPLOY_VERSION || process.env.GITHUB_SHA || getGitCommitSha() || String(Date.now());
  const normalized = rawVersion.trim().replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 40);
  return `git-${normalized || Date.now()}`;
}

function walkTextRuntimeFiles(dir, prefix = "") {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = join(dir, entry.name);

    if (entry.isDirectory()) {
      return walkTextRuntimeFiles(absolutePath, relativePath);
    }

    if (entry.isFile() && /\.(?:css|html|js|json|webmanifest)$/.test(entry.name)) {
      return [absolutePath];
    }

    return [];
  });
}

function stampDeployVersion() {
  const indexPath = join(publicDistRoot, "index.html");
  const indexHtml = readFileSync(indexPath, "utf8");
  const sourceVersion = indexHtml.match(/window\.WSC_PWA_RESET_VERSION\s*=\s*"([^"]+)"/)?.[1];

  if (!sourceVersion) {
    throw new Error("Could not find WSC_PWA_RESET_VERSION in copied index.html.");
  }

  const deployVersion = getDeployVersion();
  for (const filePath of walkTextRuntimeFiles(publicDistRoot)) {
    const current = readFileSync(filePath, "utf8");
    if (current.includes(sourceVersion)) {
      writeFileSync(filePath, current.split(sourceVersion).join(deployVersion));
    }
  }

  writeFileSync(
    join(publicDistRoot, "deploy-version.json"),
    `${JSON.stringify({
      version: deployVersion,
      sourceVersion,
      target: targetName
    }, null, 2)}\n`
  );
}

rmSync(publicDistRoot, { recursive: true, force: true });
mkdirSync(publicDistRoot, { recursive: true });

copyRuntimeAllowlist();
assertNoNestedOutputCopies();
stampDeployVersion();

removeLocalMetadataFiles(publicDistRoot);

writeFileSync(join(publicDistRoot, ".gitignore"), "*\n");

if (targetName === "pages") {
  writeFileSync(join(publicDistRoot, ".nojekyll"), "\n");
}

console.log(`Prepared ${targetName} public artifact in ${relative(repoRoot, publicDistRoot)}.`);
