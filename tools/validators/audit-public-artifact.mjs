import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const artifactArg = process.argv[2];

if (!artifactArg) {
  throw new Error("Usage: node tools/validators/audit-public-artifact.mjs <artifact-dir>");
}

const artifactRoot = resolve(process.cwd(), artifactArg);

const requiredPaths = [
  "index.html",
  "deploy-version.json",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "_headers",
  "app.js",
  "realtime-config.js",
  "styles.css",
  "service-worker.js",
  "manifest.webmanifest",
  "generated/current-runtime/data.js",
  "generated/current-runtime/content/raw-content-overrides.js",
  "generated/current-runtime/content/alpacards.js",
  "content/debate/debate-lab-data.js",
  "content/debate/debate-judge-instructions.pdf",
  "src/app-lifecycle-controller.js",
  "src/ui/wizard-renderer.js",
  "src/features/campus-2d/manifest.js",
  "src/features/campus-2d/realtime.js",
  "src/features/campus-2d/campus-2d.js",
  "world-scholars-cup-prep/index.html",
  "wsc-practice/index.html",
  "wsc-2026-study-guide/index.html",
  "wsc-2026-practice/index.html",
  "debate-lab/index.html",
  "scholars-challenge/index.html",
  "alpacards/index.html",
  "multiplayer-campus/index.html",
  "assets/campus-2d/lobby.png",
  "assets/campus-2d/courtyard.png",
  "assets/campus-2d/library.png",
  "assets/campus-2d/debate-lab.png",
  "assets/campus-2d/alpaca-sprite.png"
];

const forbiddenPathPatterns = [
  /^package(?:-lock)?\.json$/,
  /^tsconfig\.json$/,
  /^vite\.config\.ts$/,
  /^\.vercelignore$/,
  /^supabase\//,
  /^desktop\//,
  /^artifacts\//,
  /^assets-source\//,
  /^public\//,
  /^node_modules\//,
  /^dist-(?:3d|pages|vercel)\//,
  /^\.vercel(?:\/|$)/,
  /^\.playwright-cli(?:\/|$)/,
  /^coverage\//,
  /^test-results\//,
  /^alpaca-campus-3d\//,
  /^assets\/campus-3d\//,
  /^src\/features\/alpaca-campus-3d\//,
  /^src\/features\/campus-shared\//,
  /^src\/.*\.(?:ts|tsx|md)$/,
  /\.sql$/,
  /\.map$/,
  /(?:^|\/)\.DS_Store$/
];

function toPosixPath(pathname) {
  return pathname.split("\\").join("/");
}

function walkFiles(dir, prefix = "") {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = `${dir}/${entry.name}`;

    if (entry.isDirectory()) {
      return walkFiles(absolutePath, relativePath);
    }

    if (entry.isFile()) {
      return [toPosixPath(relativePath)];
    }

    return [];
  });
}

if (!existsSync(artifactRoot) || !statSync(artifactRoot).isDirectory()) {
  throw new Error(`Artifact directory does not exist: ${artifactRoot}`);
}

const files = walkFiles(artifactRoot);
const missing = requiredPaths.filter((relativePath) => !existsSync(resolve(artifactRoot, relativePath)));
const forbidden = files.filter((relativePath) =>
  forbiddenPathPatterns.some((pattern) => pattern.test(relativePath))
);
const errors = [];

if (!missing.includes("deploy-version.json") && !missing.includes("index.html")) {
  try {
    const deployVersion = JSON.parse(readFileSync(resolve(artifactRoot, "deploy-version.json"), "utf8"));
    const indexHtml = readFileSync(resolve(artifactRoot, "index.html"), "utf8");
    if (!deployVersion.version || !String(deployVersion.version).startsWith("git-")) {
      errors.push("deploy-version.json must declare a git-* version.");
    }
    if (deployVersion.version && !indexHtml.includes(`window.WSC_PWA_RESET_VERSION = "${deployVersion.version}"`)) {
      errors.push("index.html must use the deploy-version token.");
    }
  } catch (error) {
    errors.push(`deploy-version.json could not be validated: ${error.message}`);
  }
}

const report = {
  artifactRoot,
  fileCount: files.length,
  missing,
  forbidden,
  errors
};

console.log(JSON.stringify(report, null, 2));

if (missing.length || forbidden.length || errors.length) {
  process.exitCode = 1;
}
