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
  "assets/campus-2d/alpaca-sprite.png": { width: 1024, height: 3072 }
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
  for (const color of manifest.colors || []) {
    if (!color.asset) {
      failures.push(`Campus 2D color ${color.id} is missing an alpaca sprite asset.`);
      continue;
    }
    const relativePath = color.asset.replace(/^\.\//, "");
    if (!existsSync(resolve(appRoot, relativePath))) {
      failures.push(`Campus 2D color ${color.id} references missing asset ${relativePath}.`);
      continue;
    }
    const actual = readPngSize(relativePath);
    if (actual && (actual.width !== expectedAssets["assets/campus-2d/alpaca-sprite.png"].width || actual.height !== expectedAssets["assets/campus-2d/alpaca-sprite.png"].height)) {
      failures.push(`Campus 2D color ${color.id} sprite should match alpaca-sprite.png dimensions; received ${actual.width}x${actual.height}.`);
    }
  }
  for (const roomId of ["lobby", "courtyard", "library", "debate-lab"]) {
    if (!roomIds.has(roomId)) {
      failures.push(`Campus 2D manifest is missing room ${roomId}.`);
    }
  }
  const expectedRoomZoneCounts = {
    lobby: { blockedZones: 24, portals: 3, gameZones: 1, behindZones: 22, seats: 7 },
    courtyard: { blockedZones: 132, portals: 2, gameZones: 2, behindZones: 49, seats: 18 },
    library: { blockedZones: 48, portals: 1, gameZones: 5, behindZones: 37, seats: 33 },
    "debate-lab": { blockedZones: 51, portals: 1, gameZones: 1, behindZones: 24, seats: 71 }
  };
  for (const [roomId, expectedCounts] of Object.entries(expectedRoomZoneCounts)) {
    const room = manifest.roomsById?.[roomId];
    for (const [key, expectedCount] of Object.entries(expectedCounts)) {
      const actualCount = room?.[key]?.length || 0;
      if (actualCount !== expectedCount) {
        failures.push(`${roomId} ${key} should match the exported count ${expectedCount}; received ${actualCount}.`);
      }
    }
  }
  function seatsByPrefix(room, prefix) {
    return (room?.seats || []).filter((seat) => seat.id.startsWith(prefix));
  }
  function expectSeatDirection(room, seatId, direction) {
    const seat = (room?.seats || []).find((entry) => entry.id === seatId);
    if (!seat) {
      failures.push(`Campus 2D manifest is missing seat ${seatId}.`);
    } else if (seat.direction !== direction) {
      failures.push(`Seat ${seatId} should face ${direction}; received ${seat.direction || "down"}.`);
    }
  }
  function expectSeatPrefixDirection(room, prefix, direction) {
    const seats = seatsByPrefix(room, prefix);
    if (!seats.length) {
      failures.push(`Campus 2D manifest is missing seats with prefix ${prefix}.`);
      return;
    }
    const wrongSeats = seats.filter((seat) => seat.direction !== direction);
    if (wrongSeats.length) {
      failures.push(`Seats ${prefix}* should face ${direction}; wrong ids: ${wrongSeats.map((seat) => seat.id).join(", ")}.`);
    }
  }
  function expectZoneRect(room, key, zoneId, expected) {
    const zone = room?.[key]?.find((entry) => entry.id === zoneId);
    if (!zone) {
      failures.push(`Campus 2D manifest is missing ${key} zone ${zoneId}.`);
      return;
    }
    for (const [field, expectedValue] of Object.entries(expected)) {
      if (zone[field] !== expectedValue) {
        failures.push(`${zoneId} ${field} should be ${expectedValue}; received ${zone[field]}.`);
      }
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
  if (!lobby?.gameZones?.some((zone) => zone.mode === "game")) {
    failures.push("Lobby must include an orange game zone for the game launcher.");
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
  if (!library?.gameZones?.some((zone) => zone.mode === "learn")) {
    failures.push("Library must include an orange learn game zone.");
  }
  expectZoneRect(library, "blockedZones", "library-blocked-45", { x: 175, y: 291, width: 117, height: 27 });
  expectZoneRect(library, "blockedZones", "library-blocked-46", { x: 124, y: 335, width: 30, height: 77 });
  expectZoneRect(library, "blockedZones", "library-blocked-47", { x: 310, y: 340, width: 30, height: 77 });
  if (seatsByPrefix(library, "library-lounge-left").length !== 2) {
    failures.push("Library left green couch must match the export with two sitting areas.");
  }
  expectSeatPrefixDirection(library, "library-lounge-top", "down");
  expectSeatPrefixDirection(library, "library-lounge-left", "right");
  expectSeatPrefixDirection(library, "library-lounge-right", "left");
  expectSeatPrefixDirection(library, "library-table-top", "down");
  expectSeatPrefixDirection(library, "library-table-left", "right");
  expectSeatPrefixDirection(library, "library-table-right", "left");
  expectSeatPrefixDirection(library, "library-table-bottom", "up");
  expectSeatDirection(library, "library-seat-34", "down");
  expectSeatDirection(library, "library-classroom-a1", "up");
  for (let seatIndex = 20; seatIndex <= 33; seatIndex += 1) {
    expectSeatDirection(library, `library-seat-${seatIndex}`, "up");
  }
  const courtyard = manifest.roomsById?.courtyard;
  if ((courtyard?.behindZones || []).length < 15) {
    failures.push("Courtyard must include annotated behind zones.");
  }
  if ((courtyard?.blockedZones || []).length < 132) {
    failures.push("Courtyard must include the precise exported pink blocked zones.");
  }
  if (!courtyard?.portals?.some((portal) => portal.id === "courtyard-portal-2")) {
    failures.push("Courtyard must include the second exported portal zone.");
  }
  if ((courtyard?.seats || []).length < 15) {
    failures.push("Courtyard must include annotated sitting squares.");
  }
  if (!courtyard?.gameZones?.some((zone) => zone.mode === "learn")) {
    failures.push("Courtyard must include an orange learn game zone.");
  }
  if (!courtyard?.gameZones?.some((zone) => zone.id === "courtyard-game-2" && zone.mode === "game")) {
    failures.push("Courtyard must include the exported orange game zone.");
  }
  expectZoneRect(courtyard, "blockedZones", "courtyard-blocked-126", { x: 141, y: 949, width: 12, height: 19 });
  expectZoneRect(courtyard, "blockedZones", "courtyard-blocked-134", { x: 665, y: 276, width: 22, height: 23 });
  expectZoneRect(courtyard, "behindZones", "courtyard-behind-53", { x: 946, y: 615, width: 12, height: 65 });
  expectSeatPrefixDirection(courtyard, "courtyard-class-benches", "up");
  expectSeatPrefixDirection(courtyard, "courtyard-class-stools", "up");
  expectSeatDirection(courtyard, "courtyard-seat-16", "up");
  expectSeatDirection(courtyard, "courtyard-seat-17", "up");
  expectSeatDirection(courtyard, "courtyard-seat-18", "up");
  const debateLab = manifest.roomsById?.["debate-lab"];
  if ((debateLab?.seats || []).length < 60) {
    failures.push("Debate Lab must include annotated sitting squares.");
  }
  if (!debateLab?.gameZones?.some((zone) => zone.mode === "train")) {
    failures.push("Debate Lab must include an orange train game zone.");
  }
  const wrongDebateSeats = (debateLab?.seats || []).filter((seat) => seat.direction !== "up");
  if (wrongDebateSeats.length) {
    failures.push(`Debate Lab blue seats and dragon stools should face up; wrong ids: ${wrongDebateSeats.map((seat) => seat.id).join(", ")}.`);
  }
  if (manifest.sprite?.height !== 3072 || manifest.sprite?.rows !== 8) {
    failures.push("Campus 2D alpaca sprite sheet must expose four dedicated sitting rows, for 8 total rows at 1024x3072.");
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
const campusRuntime = readApp("src/features/campus-2d/campus-2d.js");
for (const runtimeNeedle of [
  "data-campus2d-portal",
  "campus2d-side-panel",
  "campus2d-controls-panel",
  "campus2d-player-card",
  "online-glow-card",
  "campus2d-profile-art",
  "data-campus2d-color-toggle",
  "PLAYER_CARD_TILT_MAX_DEGREES",
  "updatePlayerCardTilt",
  "resetPlayerCardTilt",
  "controlsPanel.append(controlsHeader, debugPanel, chatForm)",
  "sidePanel.append(hud)",
  "campus2d-connected-count",
  "updateConnectedCount",
  "campus2d-debug-panel",
  "campus2d-debug-zone",
  "wscCampus2dDevZones",
  "data-campus2d-zone-copy-selected",
  "data-campus2d-zone-paste",
  "data-campus2d-seat-direction",
  "data-campus2d-game-zone",
  "gameZones",
  "orange game",
  "activateGameZone",
  "findAnyZoneAtPoint",
  "Copy selected",
  "Paste",
  "CHAT_STACK_LIMIT",
  "campus2d-chat-stack",
  "data-campus2d-zone-copy",
  "Copy patch",
  "whole image walkable",
  "setDebugEnabled(!debugEnabled)",
  "ALPACA_COLLISION_RADIUS",
  "getFrame(direction, isSitting = false)",
  "row: 4",
  "row: 5",
  "row: 6",
  "row: 7",
  "isPointBlockedByPlayers",
  "canPlayerStandAt",
  "getSeatZones",
  "getSeatDirection",
  "applySeatDirections",
  "getSeatOccupant",
  "findSeatExitPoint",
  "standUpFromSeat",
  "is-sitting"
]) {
  if (!campusRuntime.includes(runtimeNeedle)) {
    failures.push(`Campus 2D runtime is missing ${runtimeNeedle}.`);
  }
}
if (!/walkable:\s*inBounds\s*&&\s*!inBlockedZone\s*&&\s*!inSeat/.test(campusRuntime)) {
  failures.push("Campus 2D yellow seat zones must be non-walkable, not regular walking areas.");
}
if (!/function\s+stepMovement[\s\S]*standUpFromSeat\(normalized,\s*activeZones\)/.test(campusRuntime)) {
  failures.push("Campus 2D movement must push seated alpacas out of yellow zones before walking.");
}
if (!/function\s+getSeatDirection[\s\S]*baseSeats\.find[\s\S]*return\s+null/.test(campusRuntime)) {
  failures.push("Campus 2D Dev/localStorage seat overrides must inherit manifest seat facing without adding room-specific guesses.");
}
if (/targetRoom\?\.id\s*===\s*"debate-lab"\s*\?\s*"down"\s*:\s*null/.test(campusRuntime)) {
  failures.push("Campus 2D Dev/localStorage seat overrides must not force Debate Lab seats to face down.");
}
if (!/function\s+createZoneItem[\s\S]*type\s*===\s*"seat"[\s\S]*selectedSeatDirection[\s\S]*seat\.direction\s*=\s*direction/.test(campusRuntime)) {
  failures.push("Campus 2D Dev seat editor must assign the chosen facing direction to new yellow seat zones.");
}
if (!/function\s+handleSeatDirectionChange[\s\S]*zone\.direction\s*=\s*selectedSeatDirection[\s\S]*saveDevZones\("Saved locally"\)/.test(campusRuntime)) {
  failures.push("Campus 2D Dev seat direction control must save the selected facing direction.");
}
if (!/function\s+formatRectForManifest[\s\S]*type\s*===\s*"seat"[\s\S]*directionArg[\s\S]*zone\.direction/.test(campusRuntime)) {
  failures.push("Campus 2D zone patch export must preserve seat facing direction.");
}
if (!/const\s+CHAT_TTL_MS\s*=\s*10000/.test(campusRuntime)) {
  failures.push("Campus 2D chat bubbles must stay visible for 10 seconds.");
}
if (!/const\s+CHAT_STACK_LIMIT\s*=\s*10/.test(campusRuntime)) {
  failures.push("Campus 2D chat bubbles must keep the last 10 messages.");
}
if (!/function\s+showBubble[\s\S]*chatStack\.append\(bubble\)[\s\S]*chatStack\.children\.length\s*>\s*CHAT_STACK_LIMIT/.test(campusRuntime)) {
  failures.push("Campus 2D chat bubbles must stack new messages instead of replacing the previous one.");
}
if (/WALK_FRAME_COLUMNS|getWalkFrameColumn/.test(campusRuntime)) {
  failures.push("Campus 2D walking alpacas must keep the main body on the visible neutral sprite frame.");
}
if (!/function\s+stepMovement[\s\S]*canPlayerStandAt\(nextPoint[\s\S]*canPlayerStandAt\(\{\s*x:\s*nextPoint\.x,\s*y:\s*localPlayer\.y\s*\}[\s\S]*canPlayerStandAt\(\{\s*x:\s*localPlayer\.x,\s*y:\s*nextPoint\.y\s*\}/.test(campusRuntime)) {
  failures.push("Campus 2D movement must treat other alpacas as dynamic blockers with axis sliding.");
}
if (!/function\s+sitAtSeat[\s\S]*getSeatOccupant\(seat\)[\s\S]*is sitting there/.test(campusRuntime)) {
  failures.push("Campus 2D seats must reject sitting when another alpaca already occupies the spot.");
}
if (!/function\s+updatePlayerElement[\s\S]*const\s+isSitting\s*=\s*Boolean\(player\.seatId\)\s*&&\s*!player\.moving[\s\S]*getFrame\(player\.direction,\s*isSitting\)/.test(campusRuntime)) {
  failures.push("Campus 2D seated alpacas must render dedicated sitting direction frames.");
}
if (/function\s+tryPortal|tryPortal\(/.test(campusRuntime)) {
  failures.push("Campus 2D portals must be click-driven, not automatic walk-through triggers.");
}
if (/Reset room|data-campus2d-zone-reset|resetCurrentRoomZones/.test(campusRuntime)) {
  failures.push("Campus 2D dev zone editor must not expose a Reset room action.");
}
for (const forbiddenWalkingMask of [
  /room\.walkZones/,
  /\bwalkZones\b/,
  /\brestrictToWalkZones\b/,
  /outside walk zone/,
  /green walk/,
  /data-campus2d-zone-restrict-toggle/,
  /Restrict to walk zones/
]) {
  if (forbiddenWalkingMask.test(campusRuntime)) {
    failures.push("Campus 2D movement must treat the whole room PNG as walkable instead of using green walking masks.");
    break;
  }
}

const styles = readApp("styles.css");
if (!styles.includes(".online-glow-card")) {
  failures.push("Online glow-card styles were removed.");
}
if (!styles.includes(".campus2d-root")) {
  failures.push("Campus 2D styles are missing.");
}
if ((styles.match(/background-size:\s*300%\s+800%/g) || []).length < 3) {
  failures.push("Campus 2D sprite styles must use the expanded 8-row alpaca sprite sheet.");
}
if (/\.campus2d-player\.is-sitting\s+\.campus2d-avatar\s*\{[^}]*scaleY/i.test(styles)) {
  failures.push("Campus 2D sitting visuals must use dedicated frames, not squashed standing sprites.");
}
if (!/\.campus2d-player\.is-moving\s+\.campus2d-avatar::before[\s\S]*campus2d-leg-step-left/i.test(styles)) {
  failures.push("Campus 2D moving alpacas must animate only the left leg overlay.");
}
if (!/\.campus2d-player\.is-moving\s+\.campus2d-avatar::after[\s\S]*campus2d-leg-step-right/i.test(styles)) {
  failures.push("Campus 2D moving alpacas must animate only the right leg overlay.");
}
if (/campus2d-in-place-step|campus2d-soft-walk|\.campus2d-player\.is-moving\s+\.campus2d-avatar\s*\{[^}]*animation/i.test(styles)) {
  failures.push("Campus 2D walk animation must not move the whole body/head.");
}
for (const styleNeedle of [
  ".campus2d-side-panel",
  ".campus2d-controls-panel",
  ".campus2d-player-card",
  ".campus2d-profile-avatar",
  ".campus2d-profile-art",
  ".campus2d-player-card.online-glow-card.is-pointer-tilting",
  ".campus2d-connected-count",
  ".campus2d-portal",
  ".campus2d-debug-panel",
  ".campus2d-debug-controls",
  ".campus2d-debug-zone.is-blocked",
  ".campus2d-debug-zone.is-selected",
  ".campus2d-debug-zone.is-seat",
  ".campus2d-debug-zone.is-behind",
  ".campus2d-debug-zone.is-portal",
  ".campus2d-debug-zone.is-game",
  ".campus2d-game-zone",
  ".campus2d-zone-fields",
  ".campus2d-zone-direction",
  ".campus2d-chat-stack"
]) {
  if (!styles.includes(styleNeedle)) {
    failures.push(`Campus 2D styles are missing ${styleNeedle}.`);
  }
}
if (!/\.campus2d-chat-bubble\s*\{[^}]*background:\s*color-mix\(in srgb,\s*var\(--campus2d-color\)/i.test(styles)) {
  failures.push("Campus 2D world chat bubbles must use the speaking alpaca color.");
}
if (!/\.campus2d-chat-bubble\s*\{[^}]*color:\s*var\(--campus2d-bubble-text/.test(styles)) {
  failures.push("Campus 2D world chat bubbles must set readable text on alpaca-colored bubbles.");
}
if (!/\.campus2d-root\s*\{[^}]*grid-template-columns:\s*var\(--campus2d-side-width\)\s*minmax\(0,\s*1fr\)\s*var\(--campus2d-controls-width\)/i.test(styles)) {
  failures.push("Campus 2D layout must reserve left ID, center world, and right controls columns.");
}
if (!/\.campus2d-root\.is-debug\s*\{[^}]*grid-template-columns:\s*var\(--campus2d-side-width\)\s*minmax\(0,\s*1fr\)\s*var\(--campus2d-controls-width\)/i.test(styles)) {
  failures.push("Campus 2D dev mode must stay inside the right controls column instead of overlaying the room.");
}
if (!/\.campus2d-side-panel\s*\{[^}]*background:\s*#030303/i.test(styles)) {
  failures.push("Campus 2D user ID card must sit in the black left side panel.");
}
if (!/\.campus2d-controls-panel\s*\{[^}]*background:\s*#030303/i.test(styles)) {
  failures.push("Campus 2D message and dev controls must sit in the black right side panel.");
}
if (!/\.campus2d-chat-form\s*\{[^}]*position:\s*sticky/i.test(styles)) {
  failures.push("Campus 2D message form must stay anchored in the right controls panel.");
}
if (/\.campus2d-hud\s*\{[^}]*position:\s*absolute/i.test(styles)) {
  failures.push("Campus 2D HUD must not overlay the room viewport.");
}
if (/\.campus2d-chat-form\s*\{[^}]*position:\s*absolute/i.test(styles)) {
  failures.push("Campus 2D chat form must not overlay the bottom of the room viewport.");
}
if (/openGameLauncher|campus2d-games-button|getGameLauncherHtml|data-campus2d-popup/.test(campusRuntime)) {
  failures.push("Campus 2D must not expose the old generic live-game launcher.");
}
if (!/\.campus2d-entities\s*\{[^}]*pointer-events:\s*none/i.test(styles)) {
  failures.push("Campus 2D entity layer must not intercept seat or portal clicks.");
}
for (const layerSelector of [".campus2d-hotspots", ".campus2d-portals", ".campus2d-seats"]) {
  const escaped = layerSelector.replace(".", "\\.");
  if (!new RegExp(`${escaped}\\s*\\{[^}]*pointer-events:\\s*none`, "i").test(styles)) {
    failures.push(`Campus 2D layer ${layerSelector} must pass through empty-space clicks.`);
  }
}
for (const buttonSelector of [".campus2d-hotspot", ".campus2d-portal", ".campus2d-seat"]) {
  const escaped = buttonSelector.replace(".", "\\.");
  if (!new RegExp(`${escaped}\\s*\\{[^}]*pointer-events:\\s*auto`, "i").test(styles)) {
    failures.push(`Campus 2D button ${buttonSelector} must remain clickable.`);
  }
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
