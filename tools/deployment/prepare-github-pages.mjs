import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../..");
const appRoot = join(repoRoot, "app");
const distRoot = join(appRoot, "dist-3d");

const requiredRuntimePaths = [
  "supabase-config.js",
  "generated/current-runtime",
  "alpaca-channel.js",
  "content/debate",
  "src/features/campus-shared",
  "assets/flashcards",
  "assets/raw-content",
  "assets/scholars-bowl"
];

function copyRuntimePath(relativePath) {
  const source = join(appRoot, relativePath);
  const target = join(distRoot, relativePath);

  if (!existsSync(source)) {
    throw new Error(`Missing Pages runtime path: ${relativePath}`);
  }

  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true });
}

if (!existsSync(distRoot)) {
  throw new Error("Missing dist-3d. Run vite build before prepare-github-pages.");
}

requiredRuntimePaths.forEach(copyRuntimePath);

writeFileSync(join(distRoot, ".nojekyll"), "\n");
writeFileSync(
  join(distRoot, "index.html"),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="refresh" content="0; url=./alpaca-campus-3d/" />
    <title>WSC App</title>
  </head>
  <body>
    <p><a href="./alpaca-campus-3d/">Open WSC App</a></p>
  </body>
</html>
`
);

console.log("Prepared GitHub Pages artifact in app/dist-3d.");
