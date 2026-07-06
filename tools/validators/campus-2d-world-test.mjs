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
  "assets/campus-2d/alpaca-sprite.png": { width: 2387, height: 3072 },
  "assets/campus-2d/rewards/jac-khor.png": { width: 445, height: 503 },
  "assets/campus-2d/rewards/trophy.png": { width: 360, height: 500 },
  "assets/campus-2d/rewards/gold-medal.png": { width: 265, height: 522 },
  "assets/campus-2d/rewards/silver-medal.png": { width: 289, height: 521 },
  "assets/icons/ui/settings.png": { width: 1536, height: 1024 }
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

function readStylesheet(relativePath, seen = new Set()) {
  if (seen.has(relativePath)) {
    return "";
  }
  seen.add(relativePath);
  const source = readApp(relativePath);
  const imports = Array.from(source.matchAll(/@import\s+url\(["']?\.\/([^"')]+)["']?\)\s*;/g), (match) => match[1]);
  if (!imports.length) {
    return source;
  }
  return [
    source,
    ...imports.map((importPath) => readStylesheet(importPath, seen))
  ].join("\n");
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
    lobby: { blockedZones: 27, portals: 3, gameZones: 0, behindZones: 23, seats: 7 },
    courtyard: { blockedZones: 131, portals: 2, gameZones: 4, behindZones: 58, seats: 18 },
    library: { blockedZones: 47, portals: 1, gameZones: 9, behindZones: 37, seats: 39 },
    "debate-lab": { blockedZones: 60, portals: 1, gameZones: 1, behindZones: 20, seats: 71 }
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
    const rect = zone.zone || zone;
    for (const [field, expectedValue] of Object.entries(expected)) {
      if (rect[field] !== expectedValue) {
        failures.push(`${zoneId} ${field} should be ${expectedValue}; received ${rect[field]}.`);
      }
    }
  }
  function expectManifestEntry(room, key, entryId, expected) {
    const entry = room?.[key]?.find((candidate) => candidate.id === entryId);
    if (!entry) {
      failures.push(`Campus 2D manifest is missing ${key} entry ${entryId}.`);
      return;
    }
    for (const [field, expectedValue] of Object.entries(expected)) {
      if (entry[field] !== expectedValue) {
        failures.push(`${entryId} ${field} should be ${expectedValue}; received ${entry[field]}.`);
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
  if ((lobby?.hotspots || []).some((zone) => zone.id === "lobby-games")) {
    failures.push("Lobby must not keep the old invisible lobby-games hotspot around x593 y576.");
  }
  if ((lobby?.gameZones || []).some((zone) => zone.id === "lobby-game-2" || zone.mode === "game")) {
    failures.push("Lobby spawn area must not expose a clickable game zone.");
  }
  if ((lobby?.behindZones || []).some((zone) => zone.id === "lobby-behind-15")) {
    failures.push("Lobby must not keep the removed purple behind zone lobby-behind-15.");
  }
  expectManifestEntry(lobby, "npcs", "lobby-instructions-npc", { x: 578, y: 285, direction: "down", colorId: "red" });
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
  if ((library?.decorations || []).some((entry) => entry.id === "library-laptops" || String(entry.asset || "").includes("library-laptops"))) {
    failures.push("Library must not render the duplicate laptop/computer-station PNG decoration.");
  }
  expectManifestEntry(library, "npcs", "library-instructions-npc", { x: 586, y: 233, direction: "down", colorId: "red" });
  expectZoneRect(library, "blockedZones", "library-blocked-45", { x: 175, y: 291, width: 117, height: 27 });
  expectZoneRect(library, "blockedZones", "library-blocked-46", { x: 124, y: 335, width: 30, height: 77 });
  expectZoneRect(library, "blockedZones", "library-blocked-47", { x: 73, y: 544, width: 40, height: 247 });
  expectZoneRect(library, "blockedZones", "library-blocked-75", { x: 792, y: 143, width: 361, height: 84 });
  for (const gameZoneId of ["library-game-6", "library-game-7", "library-game-8", "library-game-9"]) {
    if (!library?.gameZones?.some((zone) => zone.id === gameZoneId)) {
      failures.push(`Library export is missing ${gameZoneId}.`);
    }
  }
  expectSeatPrefixDirection(library, "library-lounge-top", "down");
  expectSeatPrefixDirection(library, "library-lounge-left", "right");
  expectSeatPrefixDirection(library, "library-lounge-right", "left");
  expectSeatPrefixDirection(library, "library-table-top", "down");
  expectSeatPrefixDirection(library, "library-table-left", "right");
  expectSeatPrefixDirection(library, "library-table-right", "left");
  expectSeatPrefixDirection(library, "library-table-bottom", "up");
  expectSeatDirection(library, "library-seat-34", "down");
  expectSeatDirection(library, "library-seat-35", "right");
  expectSeatDirection(library, "library-seat-36", "left");
  expectSeatDirection(library, "library-seat-37", "down");
  expectSeatDirection(library, "library-seat-38", "down");
  expectSeatDirection(library, "library-seat-39", "down");
  expectSeatDirection(library, "library-seat-40", "down");
  expectSeatDirection(library, "library-classroom-a1", "up");
  for (let seatIndex = 20; seatIndex <= 33; seatIndex += 1) {
    expectSeatDirection(library, `library-seat-${seatIndex}`, "up");
  }
  const courtyard = manifest.roomsById?.courtyard;
  if ((courtyard?.behindZones || []).length < 15) {
    failures.push("Courtyard must include annotated behind zones.");
  }
  if ((courtyard?.blockedZones || []).length < 131) {
    failures.push("Courtyard must include the precise exported pink blocked zones.");
  }
  if (!courtyard?.portals?.some((portal) => portal.id === "courtyard-portal-2")) {
    failures.push("Courtyard must include the second exported portal zone.");
  }
  if ((courtyard?.seats || []).length < 15) {
    failures.push("Courtyard must include annotated sitting squares.");
  }
  if (!courtyard?.gameZones?.some((zone) => zone.id === "courtyard-board" && zone.mode === "play")) {
    failures.push("Courtyard board must open the courtyard game selection popup.");
  }
  if (!courtyard?.gameZones?.some((zone) => zone.id === "courtyard-game-2" && zone.mode === "play")) {
    failures.push("Courtyard maze must open the four-game selection popup.");
  }
  expectZoneRect(courtyard, "gameZones", "courtyard-track-games", { x: 128, y: 1194, width: 178, height: 82 });
  expectZoneRect(courtyard, "gameZones", "courtyard-swings-games", { x: 715, y: 1216, width: 112, height: 108 });
  expectZoneRect(courtyard, "blockedZones", "courtyard-blocked-126", { x: 141, y: 949, width: 12, height: 19 });
  expectZoneRect(courtyard, "blockedZones", "courtyard-blocked-134", { x: 665, y: 276, width: 22, height: 23 });
  expectZoneRect(courtyard, "behindZones", "courtyard-behind-53", { x: 946, y: 615, width: 12, height: 65 });
  expectZoneRect(courtyard, "behindZones", "courtyard-behind-63", { x: 354, y: 920, width: 36, height: 12 });
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
  if (!debateLab?.gameZones?.some((zone) => String(zone.label || "").includes("Collaborative Writing"))) {
    failures.push("Debate Lab orange zone must describe all four amphitheatre training tools.");
  }
  const debateStageModerator = (debateLab?.npcs || []).find((npc) => npc.id === "debate-stage-moderator-npc");
  if (!debateStageModerator || debateStageModerator.x !== 588 || debateStageModerator.y !== 309 || debateStageModerator.colorId !== "red") {
    failures.push("Debate Lab must include the red stage moderator NPC at x=588 y=309.");
  }
  if (!String(debateStageModerator?.dialogue?.body || "").includes("Welcome to the amphitheatre")) {
    failures.push("Debate Lab moderator NPC must use the amphitheatre welcome dialogue.");
  }
  expectZoneRect(debateLab, "blockedZones", "debate-lab-blocked-62", { x: 1036, y: 297, width: 30, height: 18 });
  expectZoneRect(debateLab, "behindZones", "debate-lab-behind-26", { x: 829, y: 434, width: 14, height: 19 });
  const wrongDebateSeats = (debateLab?.seats || []).filter((seat) => seat.direction !== "up");
  if (wrongDebateSeats.length) {
    failures.push(`Debate Lab blue seats and dragon stools should face up; wrong ids: ${wrongDebateSeats.map((seat) => seat.id).join(", ")}.`);
  }
  if (manifest.sprite?.width !== 2387 || manifest.sprite?.height !== 3072 || manifest.sprite?.columns !== 7 || manifest.sprite?.rows !== 8) {
    failures.push("Campus 2D alpaca sprite sheet must expose seven walk frames and four dedicated sitting rows, for 7x8 frames at 2387x3072.");
  }
}

const indexHtml = readApp("index.html");
for (const scriptPath of [
  "src/features/campus-2d/manifest.js",
  "src/features/campus-2d/realtime.js",
  "src/features/campus-2d/debate-lab-rules.js",
  "src/features/campus-2d/debate-lab-audio.js",
  "src/features/campus-2d/campus-2d.js"
]) {
  if (!indexHtml.includes(scriptPath)) {
    failures.push(`index.html does not load ${scriptPath}.`);
  }
}
if (indexHtml.indexOf("src/features/campus-2d/campus-2d.js") > indexHtml.indexOf("app.js")) {
  failures.push("Campus 2D runtime must load before app.js.");
}
if (indexHtml.includes("20260524coop2")) {
  failures.push("index.html still uses the stale 20260524coop2 PWA cache token.");
}
const pwaResetVersion = indexHtml.match(/window\.WSC_PWA_RESET_VERSION\s*=\s*"([^"]+)"/)?.[1];
if (!pwaResetVersion) {
  failures.push("index.html must declare WSC_PWA_RESET_VERSION.");
}
if (pwaResetVersion && !indexHtml.includes(`assets/icons/ui/settings.png?v=${pwaResetVersion}`)) {
  failures.push("Campus 2D menu Settings item must use the supplied Settings.png icon with the current cache token.");
}
if (indexHtml.includes('id="statsStrip"') || indexHtml.includes("Progress trackers")) {
  failures.push("Header must not render the retired achievement/progress tracker strip.");
}
const serviceWorker = readApp("service-worker.js");
if (!serviceWorker.includes("self.registration.unregister()")) {
  failures.push("Service worker must unregister itself so old GitHub Pages caches cannot pin stale app shells.");
}
if (serviceWorker.includes("cache.addAll") || serviceWorker.includes("STATIC_ASSETS")) {
  failures.push("Service worker must not precache the app shell or static assets.");
}
if (serviceWorker.includes('addEventListener("fetch"') || serviceWorker.includes("addEventListener('fetch'")) {
  failures.push("Service worker must not intercept fetches; GitHub Pages updates need to hit the network.");
}
const pwaRuntime = readApp("pwa.js");
if (!pwaRuntime.includes("getRegistrations") || !pwaRuntime.includes("unregisterRouteServiceWorkers")) {
  failures.push("pwa.js must unregister existing route service workers.");
}
if (pwaRuntime.includes(".register(")) {
  failures.push("pwa.js must not register a new service worker.");
}
const appShellCss = readApp("styles-app-shell.css");
const lateShellCss = readApp("styles-late-shell-overrides.css");
const onlineCss = readApp("styles-online-overrides.css");
if (!appShellCss.includes(".library-campus-card-grid-four") || !appShellCss.includes("repeat(2, minmax(190px, 260px))")) {
  failures.push("Four-card Campus menus must render as a 2x2 grid in the shared shell CSS.");
}
if (!onlineCss.includes(".campus2d-activity-mount .library-campus-card-grid-four") || !onlineCss.includes("repeat(2, minmax(0, 1fr)) !important")) {
  failures.push("Four-card Campus activity menus must stay 2x2 in the right panel.");
}
if (!onlineCss.includes(".library-id-choice-card-coming-soon") || !onlineCss.includes(".library-id-status-bubble")) {
  failures.push("Unavailable amphitheatre cards must show an inline Available soon bubble instead of opening the full unavailable popup.");
}
if (!onlineCss.includes("--campus2d-header-height: 104px") || !onlineCss.includes("body.is-campus2d-view .hero-layout")) {
  failures.push("Campus 2D must keep a compact app-bar header with a centered layout.");
}
if (/\.hero[^{]*\{[^}]*min-height:\s*190px\s*!important/.test(lateShellCss) || /body \.hero-copy\s*\{[^}]*top:\s*42%\s*!important/.test(lateShellCss)) {
  failures.push("Header must not reserve retired achievement/progress tracker space in late shell overrides.");
}

const appJs = readApp("app.js");
if (!appJs.includes("window.WSC_CAMPUS_2D.mount")) {
  failures.push("app.js does not mount WSC_CAMPUS_2D.");
}
if (/statsStrip|renderStats\(|renderOnlineScoreStrip|hero-progress-circles/.test(appJs)) {
  failures.push("Retired header achievement/progress tracker JS must stay removed from app.js.");
}
if (!appJs.includes("renderOnlineHomeGameGrid")) {
  failures.push("Online game card grid renderer must remain available.");
}
for (const appNeedle of [
  "isCampusActivityInlineActive",
  "data-campus2d-activity-mount",
  "getLibraryCampusInlineMount",
  "librarySectionPicker",
  "data-library-section-choice",
  "data-library-section-confirm",
  "renderLibraryCampusSectionPicker",
  "renderLibraryInlineTopbar",
  "LIBRARY_RESOURCE_PROXY_ENDPOINT",
  "proxyStrategy: \"rewrite-google-doc-links\"",
  "renderLibraryResourceProxyBootstrap",
  "handleLibraryResourceMessage",
  "wsc-library-open-embedded-doc",
  "DEBATE_LAB_ALONE_UNAVAILABLE_REASON",
  "Scholar's Bowl is available soon",
  "Scholar's Challenge is available soon",
  "libraryEmbeddedDoc",
  "data-library-resource-doc",
  "renderLibraryEmbeddedDocOverlay",
  "library-inline-game-shell",
  "Collaborative Writing",
  "library-campus-card-grid-four",
  "showComingSoonNotice",
  "CAMPUS_ACTIVITY_COMING_SOON_NOTICE",
  "disabled aria-disabled=\"true\"",
  "openCampus2DDebateLab"
]) {
  if (!appJs.includes(appNeedle)) {
    failures.push(`app.js is missing inline Campus 2D activity support: ${appNeedle}.`);
  }
}
const assetConfig = readApp("generated/current-runtime/assets-config.js");
if (!assetConfig.includes('"writing": "./assets/mascot/library/final-pack/Collaborative Writing.png"')) {
  failures.push("Assets config must map Collaborative Writing to its supplied card icon.");
}
const campusRuntime = readApp("src/features/campus-2d/campus-2d.js");
for (const runtimeNeedle of [
  "data-campus2d-portal",
  "campus2d-activity-panel",
  "campus2d-activity-mount",
  "data-campus2d-activity-mount",
  "campus2d-controls-panel",
  "campus2d-header-card-host",
  "campus2d-player-card",
  "campus2d-id-card online-glow-card",
  "createOnlineIdCardShell",
  "Alpaca name",
  "ID_REWARD_TYPES",
  "MAX_ID_REWARDS",
  "ID_REWARD_ROW_PATTERNS",
  "campus2d-id-reward",
  "campus2d-id-reward-tooltip",
  "data-campus2d-reward",
  "campus2d-decorations",
  "campus2d-decoration",
  "campus2d-npcs",
  "npcsLayer.append(element)",
  "renderDecorations",
  "renderNpcs",
  "online-glow-card",
  "campus2d-profile-art",
  "data-campus2d-color-toggle",
  "PLAYER_CARD_TILT_MAX_DEGREES",
  "updatePlayerCardTilt",
  "resetPlayerCardTilt",
  "headerCardHost.append(playerCard)",
  "activityPanel.append(activityMount, debugPanel)",
  "data-campus2d-report-open",
  "viewport.append(world, chatForm, reportButton, npcDialogueLayer)",
  "data-campus2d-open-self-card",
  "data-campus2d-report-form",
  "onFeedbackSubmit",
  "updateShellHeight",
  "typeNpcDialogueText(copy, cursor, message)",
  "campus2d-npc-dialogue is-text-only",
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
  "debatePanelOpen",
  "openDebateLabPanel",
  "campus2d-debate-topic-choices",
  "DEBATE_TOPIC_CHOICE_COUNT",
  "Join current debate",
  "Hosted by",
  "Tournament tools",
  "if (zones.length)",
  "findAnyZoneAtPoint",
  "Copy selected",
  "Paste",
  "CHAT_STACK_LIMIT",
  "campus2d-chat-stack",
  "data-campus2d-zone-copy",
  "Copy patch",
  "whole image walkable",
  "RETIRED_DEV_ZONE_IDS",
  "removeRetiredDevZones(data)",
  "setDebugEnabled(!debugEnabled)",
  "ALPACA_COLLISION_RADIUS",
  "WALK_FRAME_COLUMNS",
  "getWalkFrameColumn",
  "getFrame(direction, isSitting = false, isMoving = false, nowMs = 0)",
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
if (/joinCode|Join by code|Share the join code|Enter the host's join code|data-campus2d-debate-code-input|campus2d-debate-code-input/.test(campusRuntime)) {
  failures.push("Debate Lab should use the shared amphitheatre signup flow, not a join-code flow.");
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
if (!/const\s+WALK_FRAME_COLUMNS\s*=\s*7/.test(campusRuntime)) {
  failures.push("Campus 2D walking alpacas must use the seven-frame PNG walk strip.");
}
if (!/function\s+getFrame\(direction,\s*isSitting\s*=\s*false,\s*isMoving\s*=\s*false,\s*nowMs\s*=\s*0\)[\s\S]*isMoving\s*\?\s*getWalkFrameColumn\(nowMs\)\s*:\s*WALK_IDLE_FRAME/.test(campusRuntime)) {
  failures.push("Campus 2D walking alpacas must animate by switching sprite columns only while moving.");
}
if (!/function\s+stepMovement[\s\S]*canPlayerStandAt\(nextPoint[\s\S]*canPlayerStandAt\(\{\s*x:\s*nextPoint\.x,\s*y:\s*localPlayer\.y\s*\}[\s\S]*canPlayerStandAt\(\{\s*x:\s*localPlayer\.x,\s*y:\s*nextPoint\.y\s*\}/.test(campusRuntime)) {
  failures.push("Campus 2D movement must treat other alpacas as dynamic blockers with axis sliding.");
}
if (!/function\s+sitAtSeat[\s\S]*getSeatOccupant\(seat\)[\s\S]*is sitting there/.test(campusRuntime)) {
  failures.push("Campus 2D seats must reject sitting when another alpaca already occupies the spot.");
}
if (!/function\s+updatePlayerElement[\s\S]*const\s+isSitting\s*=\s*Boolean\(player\.seatId\)\s*&&\s*!player\.moving[\s\S]*const\s+isMoving\s*=\s*Boolean\(player\.moving\)\s*&&\s*!player\.seatId[\s\S]*getFrame\(player\.direction,\s*isSitting,\s*isMoving,\s*nowMs\)/.test(campusRuntime)) {
  failures.push("Campus 2D seated alpacas must render dedicated sitting direction frames.");
}
if (/function\s+tryPortal|tryPortal\(/.test(campusRuntime)) {
  failures.push("Campus 2D portals must be click-driven, not automatic walk-through triggers.");
}
if (!/function\s+getClickableGameZones[\s\S]*if\s*\(zones\.length\)\s*\{\s*return\s+zones;\s*\}/.test(campusRuntime)) {
  failures.push("Campus 2D game-zone clicks must prefer explicit orange zones so old hotspots cannot become undeletable click targets.");
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

const styles = readStylesheet("styles.css");
if (!styles.includes(".online-glow-card")) {
  failures.push("Online glow-card styles were removed.");
}
if (!styles.includes(".campus2d-root")) {
  failures.push("Campus 2D styles are missing.");
}
if ((styles.match(/background-size:\s*700%\s+800%/g) || []).length < 3) {
  failures.push("Campus 2D sprite styles must use the expanded seven-frame, 8-row alpaca sprite sheet.");
}
if (/\.campus2d-player\.is-sitting\s+\.campus2d-avatar\s*\{[^}]*scaleY/i.test(styles)) {
  failures.push("Campus 2D sitting visuals must use dedicated frames, not squashed standing sprites.");
}
if (/campus2d-leg-step|campus2d-in-place-step|campus2d-soft-walk|\.campus2d-player\.is-moving\s+\.campus2d-avatar(::before|::after)?\s*\{[^}]*animation/i.test(styles)) {
  failures.push("Campus 2D walk animation must come from the PNG sprite frames, not CSS overlays or body/head movement.");
}
for (const styleNeedle of [
  ".campus2d-activity-panel",
  ".campus2d-activity-mount",
  ".campus2d-controls-panel",
  ".campus2d-header-card-host",
  ".campus2d-decorations",
  ".campus2d-decoration",
  ".campus2d-npcs",
  ".campus2d-player-card",
  ".campus2d-player.is-npc",
  ".campus2d-profile-avatar",
  ".campus2d-profile-art",
  ".campus2d-player-card.online-glow-card.is-pointer-tilting",
  ".campus2d-id-card.online-glow-card",
  ".campus2d-id-content",
  ".campus2d-report-button",
  ".campus2d-feedback-layer",
  ".campus2d-id-rewards",
  ".campus2d-id-reward-grid",
  ".campus2d-id-reward-row",
  ".campus2d-id-reward",
  ".campus2d-id-reward-tooltip",
  ".campus2d-id-color-panel",
  ".campus2d-settings-panel[hidden]",
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
  ".campus2d-chat-stack",
  ".campus2d-npc-dialogue.is-text-only",
  ".library-inline-topbar",
  ".library-resource-iframe",
  ".library-embedded-doc-overlay",
  ".library-embedded-doc-iframe",
  ".library-inline-panel-title",
  ".library-inline-game-shell"
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
if (!/\.campus2d-root\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*var\(--campus2d-panel-width\)/i.test(styles)) {
  failures.push("Campus 2D layout must place the world first, then one wide right activity block.");
}
if (!/\.campus2d-root\.is-debug\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*var\(--campus2d-panel-width\)/i.test(styles)) {
  failures.push("Campus 2D dev mode must stay inside the wide right activity block instead of overlaying the room.");
}
if (!/\.campus2d-activity-panel\s*\{[^}]*background:\s*#030303/i.test(styles)) {
  failures.push("Campus 2D activity panel must sit in the black right block.");
}
if (!/\.campus2d-controls-panel\s*\{[^}]*display:\s*none/i.test(styles)) {
  failures.push("Campus 2D must not keep the old second controls column visible.");
}
if (!/\.campus2d-chat-form\s*\{[^}]*position:\s*absolute/i.test(styles)) {
  failures.push("Campus 2D message form must sit over the bottom-left of the map viewport.");
}
if (!/\.campus2d-header-card-host\s*\{[^}]*position:\s*absolute/i.test(styles)) {
  failures.push("Campus 2D Alpaca ID card must be mounted into the header.");
}
if (!/body\.is-online-mode\s+\.campus2d-header-card-host\s+\.campus2d-palette\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?top:\s*calc\(100%\s*\+\s*10px\)/i.test(styles)) {
  failures.push("Campus 2D header color palette must open downward below the Alpaca ID card.");
}
if (/\.campus2d-hud\s*\{[^}]*position:\s*absolute/i.test(styles)) {
  failures.push("Campus 2D HUD must not overlay the room viewport.");
}
if (!styles.includes(".library-experience-panel .learn-card-footer-nav") || !/\.library-experience-panel\s+\.panel-hub-link,[\s\S]*?display:\s*none\s*!important/i.test(styles)) {
  failures.push("Campus 2D learn experiences must hide cross-mode footer navigation.");
}
if (!/\.campus2d-activity-mount\s+\.library-section-picker-strip\.selected-section-chip-strip\s*\{[\s\S]*?grid-template-columns:\s*repeat\(5,\s*minmax\(46px,\s*1fr\)\)\s*!important/i.test(styles)) {
  failures.push("Campus 2D section picker must show all 15 guiding sections as a stable 5 by 3 grid.");
}
if (/openGameLauncher|campus2d-games-button|getGameLauncherHtml|data-campus2d-popup/.test(campusRuntime)) {
  failures.push("Campus 2D must not expose the old generic live-game launcher.");
}
if (/No verified rewards yet|Share achievements|data-campus2d-achievements-open|campus2d-id-trophies/.test(campusRuntime + styles)) {
  failures.push("Campus 2D ID cards must not render the retired achievements panel, empty reward message, or share-achievements form.");
}
if (/createIdCardField\("Account age"/.test(campusRuntime) || /createIdCardField\("Alpaca ID"/.test(campusRuntime)) {
  failures.push("Campus 2D alpaca click cards must show alpaca name, school, and optional WSC rewards without age or internal IDs.");
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
