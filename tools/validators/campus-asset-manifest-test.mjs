import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const checkedFiles = [
  "app/src/features/alpaca-campus-3d/avatar-assets.ts",
  "app/src/features/alpaca-campus-3d/environment-assets.ts",
  "app/src/features/alpaca-campus-3d/CampusScene.tsx"
];

function read(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

function stripQuery(pathname) {
  return pathname.split("?")[0];
}

function resolveSourceImport(fromFile, importPath) {
  return resolve(repoRoot, dirname(fromFile), stripQuery(importPath));
}

function resolvePublicAsset(publicPath) {
  const cleanPath = stripQuery(publicPath).replace(/^\/+/, "");
  return [
    resolve(repoRoot, "app/public", cleanPath),
    resolve(repoRoot, "app", cleanPath)
  ];
}

const importedAssets = [];
const publicAssets = [];
const publicRoots = new Map();

for (const relativeFile of checkedFiles) {
  const source = read(relativeFile);
  for (const match of source.matchAll(/from\s+["']([^"']+\.(?:glb|png|jpe?g|webp)\?url)["']/g)) {
    importedAssets.push({
      file: relativeFile,
      ref: match[1],
      candidates: [resolveSourceImport(relativeFile, match[1])]
    });
  }

  for (const match of source.matchAll(/const\s+(PUBLIC_[A-Z0-9_]+_ROOT)\s*=\s*toCampusPublicUrl\(["']([^"']+)["']\)/g)) {
    publicRoots.set(match[1], match[2]);
  }

  let resolvedDerivedRoot = true;
  while (resolvedDerivedRoot) {
    resolvedDerivedRoot = false;
    for (const match of source.matchAll(/const\s+(PUBLIC_[A-Z0-9_]+_ROOT)\s*=\s*`\$\{(PUBLIC_[A-Z0-9_]+_ROOT)\}\/([^`]+)`/g)) {
      const [, rootName, parentRootName, suffix] = match;
      if (!publicRoots.has(rootName) && publicRoots.has(parentRootName)) {
        publicRoots.set(rootName, `${publicRoots.get(parentRootName)}/${suffix}`);
        resolvedDerivedRoot = true;
      }
    }
  }

  for (const match of source.matchAll(/toCampusPublicUrl\(["']([^"']+\.(?:glb|png|jpe?g|webp)(?:\?[^"']*)?)["']\)/g)) {
    publicAssets.push({
      file: relativeFile,
      ref: match[1],
      candidates: resolvePublicAsset(match[1])
    });
  }
}

const environmentSource = read("app/src/features/alpaca-campus-3d/environment-assets.ts");
for (const match of environmentSource.matchAll(/`?\$\{(PUBLIC_[A-Z0-9_]+_ROOT)\}\/([^`"']+\.(?:glb|png|jpe?g|webp))`?/g)) {
  const root = publicRoots.get(match[1]);
  if (!root) {
    publicAssets.push({
      file: "app/src/features/alpaca-campus-3d/environment-assets.ts",
      ref: `${match[1]}/${match[2]}`,
      candidates: []
    });
    continue;
  }

  publicAssets.push({
    file: "app/src/features/alpaca-campus-3d/environment-assets.ts",
    ref: `${root}/${match[2]}`,
    candidates: resolvePublicAsset(`${root}/${match[2]}`)
  });
}

const missing = [...importedAssets, ...publicAssets].filter((entry) =>
  !entry.candidates.some((candidate) => existsSync(candidate))
);

const report = {
  importedAssets: importedAssets.length,
  publicAssets: publicAssets.length,
  missing: missing.map((entry) => ({
    file: entry.file,
    ref: entry.ref
  }))
};

console.log(JSON.stringify(report, null, 2));

if (missing.length) {
  process.exitCode = 1;
}
