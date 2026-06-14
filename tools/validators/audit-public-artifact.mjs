import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const artifactArg = process.argv[2];

if (!artifactArg) {
  throw new Error("Usage: node tools/validators/audit-public-artifact.mjs <artifact-dir>");
}

const artifactRoot = resolve(process.cwd(), artifactArg);

const requiredPaths = [
  "index.html",
  "app.js",
  "styles.css",
  "service-worker.js",
  "manifest.webmanifest",
  "generated/current-runtime/data.js",
  "generated/current-runtime/content/raw-content-overrides.js",
  "generated/current-runtime/content/alpacards.js",
  "content/debate/debate-lab-data.js",
  "content/debate/debate-judge-instructions.pdf",
  "src/app/app-entry-service.js",
  "src/ui/wizard-renderer.js",
  "src/features/campus-shared/data/rooms.js",
  "alpaca-campus-3d/index.html"
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
  /^src\/features\/alpaca-campus-3d\//,
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

const report = {
  artifactRoot,
  fileCount: files.length,
  missing,
  forbidden
};

console.log(JSON.stringify(report, null, 2));

if (missing.length || forbidden.length) {
  process.exitCode = 1;
}
