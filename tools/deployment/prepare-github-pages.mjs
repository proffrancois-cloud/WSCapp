import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "../..");
const appRoot = join(repoRoot, "app");
const campusDistRoot = join(appRoot, "dist-3d");
const pagesDistRoot = join(appRoot, "dist-pages");

const ignoredAppEntries = new Set([
  ".playwright-cli",
  ".vercel",
  "artifacts",
  "assets-source",
  "coverage",
  "desktop",
  "dist-3d",
  "dist-pages",
  "node_modules",
  "public",
  "test-results"
]);

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

function copyAppEntry(entryName) {
  if (ignoredAppEntries.has(entryName)) {
    return;
  }

  cpSync(join(appRoot, entryName), join(pagesDistRoot, entryName), {
    recursive: true,
    dereference: false
  });
}

if (!existsSync(campusDistRoot)) {
  throw new Error("Missing dist-3d. Run vite build before prepare-github-pages.");
}

rmSync(pagesDistRoot, { recursive: true, force: true });
mkdirSync(pagesDistRoot, { recursive: true });

readdirSync(appRoot).forEach(copyAppEntry);

rmSync(join(pagesDistRoot, "assets", "campus-3d"), { recursive: true, force: true });
rmSync(join(pagesDistRoot, "alpaca-campus-3d"), { recursive: true, force: true });
cpSync(join(campusDistRoot, "alpaca-campus-3d"), join(pagesDistRoot, "alpaca-campus-3d"), { recursive: true });
cpSync(join(campusDistRoot, "assets"), join(pagesDistRoot, "assets"), { recursive: true });

const campusCustomPropsRoot = join(pagesDistRoot, "assets", "campus-3d", "props", "custom");
if (existsSync(campusCustomPropsRoot)) {
  readdirSync(campusCustomPropsRoot).forEach((fileName) => {
    if (!requiredCampusCustomProps.has(fileName)) {
      rmSync(join(campusCustomPropsRoot, fileName), { recursive: true, force: true });
    }
  });
}

writeFileSync(join(pagesDistRoot, ".nojekyll"), "\n");

console.log("Prepared GitHub Pages artifact in app/dist-pages.");
