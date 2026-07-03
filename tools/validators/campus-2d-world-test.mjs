import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const repoRoot = resolve(import.meta.dirname, "../..");
const appRoot = resolve(repoRoot, "app");
const failures = [];

const expectedAssets = {
  "assets/campus-2d/lobby.png": { width: 1183, height: 1329 },
  "assets/campus-2d/courtyard.png": { width: 1023, height: 1537 },
  "assets/campus-2d/library.png": { width: 1173, height: 1341 },
  "assets/campus-2d/debate-lab.png": { width: 1182, height: 1330 },
  "assets/campus-2d/alpaca-sprite.png": { width: 1024, height: 1536 }
};

const forbiddenPaths = [
  "alpaca-campus-3d",
  "assets/campus-3d",
  "public/assets/campus-3d",
  "src/features/alpaca-campus-3d",
  "src/features/campus-shared",
  "dist-3d",
  "vite.config.ts",
  "tsconfig.json"
];

function readApp(relativePath) {
  return readFileSync(resolve(appRoot, relativePath), "utf8");
}

function readPngSize(relativePath) {
  const buffer = readFileSync(resolve(appRoot, relativePath));
  if (buffer.toString("ascii", 1, 4) !== "PNG") {
    failures.push(`${relativePath} is not a PNG file.`);
    return null;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}

for (const [relativePath, expected] of Object.entries(expectedAssets)) {
  const absolutePath = resolve(appRoot, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing campus 2D asset: ${relativePath}`);
    continue;
  }
  if (!statSync(absolutePath).isFile()) {
    failures.push(`Campus 2D asset is not a file: ${relativePath}`);
    continue;
  }
  const actual = readPngSize(relativePath);
  if (actual && (actual.width !== expected.width || actual.height !== expected.height)) {
    failures.push(`${relativePath} should be ${expected.width}x${expected.height}; received ${actual.width}x${actual.height}.`);
  }
}

for (const relativePath of forbiddenPaths) {
  if (existsSync(resolve(appRoot, relativePath))) {
    failures.push(`Forbidden 3D-era app path still exists: ${relativePath}`);
  }
}

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(readApp("src/features/campus-2d/manifest.js"), sandbox, { filename: "manifest.js" });
const manifest = sandbox.window.WSC_CAMPUS_2D_MANIFEST;
if (!manifest) {
  failures.push("WSC_CAMPUS_2D_MANIFEST was not registered.");
} else {
  const roomIds = new Set((manifest.rooms || []).map((room) => room.id));
  for (const roomId of ["lobby", "courtyard", "library", "debate-lab"]) {
    if (!roomIds.has(roomId)) {
      failures.push(`Campus 2D manifest is missing room ${roomId}.`);
    }
  }
  const lobby = manifest.roomsById?.lobby;
  if (!lobby?.portals?.some((portal) => portal.targetRoomId === "courtyard")) {
    failures.push("Lobby must have a portal to Courtyard.");
  }
  if (!lobby?.portals?.some((portal) => portal.targetRoomId === "library")) {
    failures.push("Lobby must have a portal to Library.");
  }
  if (!lobby?.portals?.some((portal) => portal.targetRoomId === "debate-lab")) {
    failures.push("Lobby must have a portal to Debate Lab.");
  }
  if ((lobby?.behindZones || []).length < 5) {
    failures.push("Lobby must include annotated behind zones.");
  }
  if ((lobby?.seats || []).length < 7) {
    failures.push("Lobby must include annotated sitting squares.");
  }
  const library = manifest.roomsById?.library;
  if ((library?.behindZones || []).length < 10) {
    failures.push("Library must include annotated behind zones.");
  }
  if ((library?.seats || []).length < 30) {
    failures.push("Library must include annotated sitting squares.");
  }
  const courtyard = manifest.roomsById?.courtyard;
  if ((courtyard?.behindZones || []).length < 15) {
    failures.push("Courtyard must include annotated behind zones.");
  }
  if ((courtyard?.seats || []).length < 15) {
    failures.push("Courtyard must include annotated sitting squares.");
  }
  const debateLab = manifest.roomsById?.["debate-lab"];
  if ((debateLab?.seats || []).length < 60) {
    failures.push("Debate Lab must include annotated sitting squares.");
  }
}

const indexHtml = readApp("index.html");
for (const scriptPath of [
  "src/features/campus-2d/manifest.js",
  "src/features/campus-2d/realtime.js",
  "src/features/campus-2d/campus-2d.js"
]) {
  if (!indexHtml.includes(scriptPath)) {
    failures.push(`index.html does not load ${scriptPath}.`);
  }
}
if (indexHtml.indexOf("src/features/campus-2d/campus-2d.js") > indexHtml.indexOf("app.js")) {
  failures.push("Campus 2D runtime must load before app.js.");
}

const appJs = readApp("app.js");
if (!appJs.includes("window.WSC_CAMPUS_2D.mount")) {
  failures.push("app.js does not mount WSC_CAMPUS_2D.");
}
if (!appJs.includes("renderOnlineHomeGameGrid")) {
  failures.push("Online game card grid renderer must remain available.");
}

const styles = readApp("styles.css");
if (!styles.includes(".online-glow-card")) {
  failures.push("Online glow-card styles were removed.");
}
if (!styles.includes(".campus2d-root")) {
  failures.push("Campus 2D styles are missing.");
}

const packageJson = JSON.parse(readApp("package.json"));
const scriptText = JSON.stringify(packageJson.scripts || {});
if (/3d|vite|campus-glb/i.test(scriptText)) {
  failures.push("package.json scripts still reference 3D/Vite campus tooling.");
}
const dependencyText = JSON.stringify({
  dependencies: packageJson.dependencies || {},
  devDependencies: packageJson.devDependencies || {}
});
if (/@react-three|three|react-dom|react"|vite|zustand/.test(dependencyText)) {
  failures.push("package.json still includes removed 3D/React/Vite dependencies.");
}

if (failures.length) {
  console.error(`Campus 2D world test failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(JSON.stringify({
  assets: expectedAssets,
  rooms: manifest.rooms.map((room) => room.id),
  scriptCount: (indexHtml.match(/src\/features\/campus-2d/g) || []).length
}, null, 2));
