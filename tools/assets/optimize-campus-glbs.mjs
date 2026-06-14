import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = resolve(import.meta.dirname, "../..");
const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const sourceRoot = getArgValue("--source") || "app/public/assets/campus-3d/props/custom";
const outputRoot = getArgValue("--out") || "app/public/assets/campus-3d/props/optimized";
const textureSize = getArgValue("--texture-size") || "1024";
const sourceDir = resolve(repoRoot, sourceRoot);
const outputDir = resolve(repoRoot, outputRoot);

function getArgValue(name) {
  const prefix = `${name}=`;
  return process.argv.slice(2).find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || "";
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getGlbFiles(root) {
  if (!existsSync(root)) {
    throw new Error(`Missing GLB source directory: ${relative(repoRoot, root)}`);
  }

  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".glb"))
    .map((entry) => join(root, entry.name))
    .sort();
}

const files = getGlbFiles(sourceDir);
if (!files.length) {
  throw new Error(`No GLB files found in ${relative(repoRoot, sourceDir)}`);
}

const plan = files.map((inputPath) => {
  const outputPath = join(outputDir, basename(inputPath));
  const command = [
    "npx",
    "--yes",
    "@gltf-transform/cli",
    "optimize",
    inputPath,
    outputPath,
    "--compress",
    "meshopt",
    "--texture-compress",
    "webp",
    "--texture-size",
    textureSize
  ];

  return {
    inputPath,
    outputPath,
    sourceBytes: statSync(inputPath).size,
    command
  };
});

console.log(JSON.stringify({
  mode: shouldWrite ? "write" : "dry-run",
  sourceRoot: relative(repoRoot, sourceDir),
  outputRoot: relative(repoRoot, outputDir),
  textureSize,
  files: plan.map((entry) => ({
    input: relative(repoRoot, entry.inputPath),
    output: relative(repoRoot, entry.outputPath),
    sourceSize: formatBytes(entry.sourceBytes)
  }))
}, null, 2));

if (!shouldWrite) {
  console.log("\nRe-run with --write to create optimized GLBs.");
  process.exit(0);
}

for (const entry of plan) {
  mkdirSync(dirname(entry.outputPath), { recursive: true });
  const result = spawnSync(entry.command[0], entry.command.slice(1), {
    stdio: "inherit"
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}
