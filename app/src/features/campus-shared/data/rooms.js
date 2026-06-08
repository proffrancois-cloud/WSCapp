(function () {
  // Shared room blueprint source for solo/runtime and Alpaca Campus 3D.
  // The 3D app normalizes these rooms through app/src/features/alpaca-campus-3d/map-source/index.ts.
  // Edit room topology, doors, NPCs, spawn points, collision zones, and interaction zones here.
  const CAMPUS_WORLD_SCALE = 1.65;
  const sections = Array.isArray(window.WSC_DATA?.sections) ? window.WSC_DATA.sections : [];
  const alpacards = Array.isArray(window.WSC_ALPACARDS) ? window.WSC_ALPACARDS : [];
  const channelVideos = Array.isArray(window.WSC_ALPACA_CHANNEL?.videos) ? window.WSC_ALPACA_CHANNEL.videos : [];
  const guideLabels = sections.length
    ? sections.map((section, index) => section.title || section.label || `Guide ${index + 1}`)
    : [
      "Introductory Questions", "Progress, Not Regress", "More To Do", "There's a Draft",
      "Going Pains", "Home and Wandering", "Where the Sidewalk Starts", "Call of Duty-Free",
      "The Lovely and the Liminal", "Monkey See, Monkey Prototype", "Next Year in Futurism",
      "The End is Nearish", "Where We're Going", "We're All in This", "Concluding Questions"
    ];

  function point(x, y) {
    return { x, y };
  }

  function rect(id, x, y, width, height) {
    return { id, x, y, width, height };
  }

  function runtimeNumber(value) {
    return value / CAMPUS_WORLD_SCALE;
  }

  function runtimePoint(x, y) {
    return point(runtimeNumber(x), runtimeNumber(y));
  }

  function runtimeRect(id, x, y, width, height) {
    return rect(id, runtimeNumber(x), runtimeNumber(y), runtimeNumber(width), runtimeNumber(height));
  }

  function runtimeLineRect(id, x1, y1, x2, y2, thickness = 36) {
    const horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1);
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);

    return horizontal
      ? runtimeRect(id, left, y1 - thickness / 2, Math.abs(x2 - x1), thickness)
      : runtimeRect(id, x1 - thickness / 2, top, thickness, Math.abs(y2 - y1));
  }

  function runtimeRing(id, centerX, centerY, radius, thickness = 48) {
    return {
      id,
      shape: "ring",
      x: runtimeNumber(centerX - radius),
      y: runtimeNumber(centerY - radius),
      width: runtimeNumber(radius * 2),
      height: runtimeNumber(radius * 2),
      center: runtimePoint(centerX, centerY),
      radius: runtimeNumber(radius),
      thickness: runtimeNumber(thickness)
    };
  }

  function runtimePath(id, points, thickness = 46) {
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const halfThickness = thickness / 2;
    const minX = Math.min(...xs) - halfThickness;
    const minY = Math.min(...ys) - halfThickness;
    const maxX = Math.max(...xs) + halfThickness;
    const maxY = Math.max(...ys) + halfThickness;

    return {
      id,
      shape: "path",
      x: runtimeNumber(minX),
      y: runtimeNumber(minY),
      width: runtimeNumber(maxX - minX),
      height: runtimeNumber(maxY - minY),
      points: points.map(([x, y]) => runtimePoint(x, y)),
      thickness: runtimeNumber(thickness)
    };
  }

  function smoothPathPoints(points, samplesPerSegment = 12) {
    if (!Array.isArray(points) || points.length < 3) {
      return points;
    }

    const sampled = [];
    for (let index = 0; index < points.length - 1; index += 1) {
      const p0 = points[Math.max(0, index - 1)];
      const p1 = points[index];
      const p2 = points[index + 1];
      const p3 = points[Math.min(points.length - 1, index + 2)];

      for (let step = 0; step <= samplesPerSegment; step += 1) {
        if (index > 0 && step === 0) {
          continue;
        }
        const t = step / samplesPerSegment;
        const t2 = t * t;
        const t3 = t2 * t;
        sampled.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }

    return sampled;
  }

  function runtimeSmoothPath(id, points, thickness = 46, samplesPerSegment = 12) {
    return runtimePath(id, smoothPathPoints(points, samplesPerSegment), thickness);
  }

  function polygon(id, points) {
    return { id, points };
  }

  function scaleNumber(value, scale) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * scale) : value;
  }

  function scalePoint(value, scale) {
    return value ? point(scaleNumber(value.x, scale), scaleNumber(value.y, scale)) : value;
  }

  function scaleRect(value, scale) {
    return value ? {
      ...value,
      x: scaleNumber(value.x, scale),
      y: scaleNumber(value.y, scale),
      width: scaleNumber(value.width, scale),
      height: scaleNumber(value.height, scale)
    } : value;
  }

  function scaleZone(zone, scale) {
    if (Array.isArray(zone?.points)) {
      return {
        ...scaleRect(zone, scale),
        points: zone.points.map((entry) => scalePoint(entry, scale)),
        thickness: scaleNumber(zone.thickness, scale)
      };
    }

    if (zone?.shape === "ring") {
      return {
        ...scaleRect(zone, scale),
        center: scalePoint(zone.center, scale),
        radius: scaleNumber(zone.radius, scale),
        thickness: scaleNumber(zone.thickness, scale)
      };
    }

    return scaleRect(zone, scale);
  }

  function scaleItem(item, scale) {
    return {
      ...item,
      x: scaleNumber(item.x, scale),
      y: scaleNumber(item.y, scale),
      width: scaleNumber(item.width, scale),
      height: scaleNumber(item.height, scale),
      proximity: scaleNumber(item.proximity, scale),
      interactionPoint: scalePoint(item.interactionPoint, scale),
      sitPoint: scalePoint(item.sitPoint, scale)
    };
  }

  function scaleRoom(room, scale = CAMPUS_WORLD_SCALE) {
    return {
      ...room,
      layoutScale: scale,
      designWorld: { ...room.world },
      world: {
        width: scaleNumber(room.world.width, scale),
        height: scaleNumber(room.world.height, scale)
      },
      spawnPoints: Object.fromEntries(Object.entries(room.spawnPoints || {}).map(([id, spawn]) => [id, scalePoint(spawn, scale)])),
      walkBounds: scaleRect(room.walkBounds, scale),
      walkZones: (room.walkZones || []).map((zone) => scaleZone(zone, scale)),
      blockedZones: (room.blockedZones || []).map((zone) => scaleZone(zone, scale)),
      sittingZones: (room.sittingZones || []).map((zone) => scaleZone(zone, scale)),
      portals: (room.portals || []).map((entry) => scaleItem(entry, scale)),
      objects: (room.objects || []).map((entry) => scaleItem(entry, scale)),
      seats: (room.seats || []).map((entry) => scaleItem(entry, scale))
    };
  }

  function portal(id, label, x, y, width, height, targetRoomId, targetSpawnId, options = {}) {
    return {
      id,
      kind: "portal",
      label,
      x,
      y,
      width,
      height,
      targetRoomId,
      targetSpawnId,
      interactionPoint: options.interactionPoint || point(x, y + height / 2 + 42),
      proximity: options.proximity || 105,
      status: options.status || "open",
      statusLabel: options.statusLabel || "",
      panel: options.panel || null
    };
  }

  function object(id, kind, label, x, y, width, height, panel, options = {}) {
    return {
      id,
      kind,
      label,
      x,
      y,
      width,
      height,
      panel,
      interactionPoint: options.interactionPoint || point(x, y + height / 2 + 42),
      proximity: options.proximity || 120,
      questId: options.questId || null,
      contentId: options.contentId ?? null,
      sectionIndex: options.sectionIndex,
      modeId: options.modeId || null,
      pathId: options.pathId || null,
      eventKey: options.eventKey || null,
      avatar: options.avatar || null,
      statusLabel: options.statusLabel || null
    };
  }

  function seat(id, label, x, y, type = "seat", options = {}) {
    return {
      id,
      kind: "seat",
      seatType: type,
      label,
      x,
      y,
      width: options.width || 58,
      height: options.height || 50,
      interactionPoint: options.interactionPoint || point(x, y + 54),
      sitPoint: options.sitPoint || point(x, y),
      proximity: options.proximity || 95,
      group: options.group || "",
      panel: options.panel || null
    };
  }

  function rowSeats(prefix, label, count, x, y, gapX, type, options = {}) {
    return Array.from({ length: count }, (_item, index) => seat(
      `${prefix}-${index + 1}`,
      `${label} ${index + 1}`,
      x + index * gapX,
      y,
      type,
      options
    ));
  }

  function seatsFromPoints(prefix, label, points, type, options = {}) {
    return points.map((entry, index) => seat(
      `${prefix}-${index + 1}`,
      `${label} ${index + 1}`,
      entry.x,
      entry.y,
      type,
      {
        ...options,
        group: entry.group || options.group || prefix,
        width: entry.width || options.width,
        height: entry.height || options.height,
        interactionPoint: entry.interactionPoint || options.interactionPoint || point(entry.x, entry.y + 56),
        sitPoint: entry.sitPoint || options.sitPoint || point(entry.x, entry.y)
      }
    ));
  }

  function makeLibraryShelves() {
    const rowXs = [450, 735, 1020, 1305, 1590];
    const rowYs = [420, 640, 860];
    const shelfPositions = rowYs.flatMap((y) =>
      rowXs.map((x) => [x, y, x, y + 82])
    );

    return shelfPositions.map(([x, y, ix, iy], index) => object(
      `guide-shelf-${index + 1}`,
      "shelf",
      guideLabels[index] || `Guide ${index + 1}`,
      x,
      y,
      190,
      70,
      "guide-section",
      { sectionIndex: index, interactionPoint: point(ix, iy), proximity: 135 }
    ));
  }

  function makeDebateRoom(index) {
    const id = `debate-room-${index}`;
    const theme = ["blue", "gold", "red"][index - 1] || "blue";
    return {
      id,
      title: `Debate Room ${index}`,
      subtitle: `${theme[0].toUpperCase()}${theme.slice(1)} classroom`,
      backgroundStyle: "classroom",
      world: { width: 1500, height: 980 },
      spawnPoints: {
        default: point(760, 850),
        "debate-lab": point(760, 850)
      },
      walkBounds: { x: 85, y: 125, width: 1330, height: 760 },
      walkZones: [
        rect("debate-classroom-floor", 95, 185, 1310, 620),
        rect("debate-classroom-front-approach", 250, 140, 1000, 230),
        rect("debate-classroom-bottom-entry", 490, 760, 540, 125),
        rect("debate-classroom-left-aisle", 100, 275, 190, 530),
        rect("debate-classroom-right-aisle", 1210, 275, 190, 530),
        rect("debate-classroom-center-aisle", 675, 320, 150, 540),
        rect("debate-classroom-bottom-aisle", 100, 795, 1300, 90)
      ],
      blockedZones: [
        rect("teacher-desk-block", 300, 230, 230, 120),
        rect("lectern-block", 690, 225, 120, 140),
        rect("front-cabinet-block", 1040, 230, 180, 100),
        rect("student-desk-a", 245, 405, 230, 95),
        rect("student-desk-b", 590, 405, 230, 95),
        rect("student-desk-c", 935, 405, 230, 95),
        rect("student-desk-d", 140, 550, 230, 95),
        rect("student-desk-e", 485, 550, 230, 95),
        rect("student-desk-f", 830, 550, 230, 95),
        rect("student-desk-g", 1175, 550, 230, 95),
        rect("student-desk-h", 245, 700, 230, 95),
        rect("student-desk-i", 590, 700, 230, 95),
        rect("student-desk-j", 935, 700, 230, 95)
      ],
      portals: [
        portal(`${id}-exit`, "Debate Lab", 700, 894, 120, 70, "debate-lab", `room-${index}`, {
          interactionPoint: point(760, 838)
        })
      ],
      objects: [
        object(`${id}-whiteboard`, "board", "Debate Whiteboard", 750, 145, 430, 78, "debate", {
          interactionPoint: point(750, 330),
          proximity: 140
        }),
        object(`${id}-lectern`, "control", "Speaker Lectern", 750, 285, 125, 110, "debate", {
          interactionPoint: point(750, 415),
          proximity: 140
        }),
        object(`${id}-moderator-desk`, "npc", "Moderator Desk", 410, 280, 210, 92, "debate", {
          interactionPoint: point(410, 430),
          proximity: 145
        })
      ],
      seats: seatsFromPoints(`${id}-student`, "Debate Seat", [
        { x: 300, y: 500, interactionPoint: point(300, 540) },
        { x: 420, y: 500, interactionPoint: point(420, 540) },
        { x: 645, y: 500, interactionPoint: point(645, 540) },
        { x: 765, y: 500, interactionPoint: point(765, 540) },
        { x: 990, y: 500, interactionPoint: point(990, 540) },
        { x: 1110, y: 500, interactionPoint: point(1110, 540) },
        { x: 195, y: 645, interactionPoint: point(195, 685) },
        { x: 315, y: 645, interactionPoint: point(315, 685) },
        { x: 540, y: 645, interactionPoint: point(540, 685) },
        { x: 660, y: 645, interactionPoint: point(660, 685) },
        { x: 885, y: 645, interactionPoint: point(885, 685) },
        { x: 1005, y: 645, interactionPoint: point(1005, 685) },
        { x: 1230, y: 645, interactionPoint: point(1230, 685) },
        { x: 1350, y: 645, interactionPoint: point(1350, 685) },
        { x: 300, y: 800, interactionPoint: point(300, 865) },
        { x: 420, y: 800, interactionPoint: point(420, 865) },
        { x: 645, y: 800, interactionPoint: point(645, 865) },
        { x: 765, y: 800, interactionPoint: point(765, 865) },
        { x: 990, y: 800, interactionPoint: point(990, 865) },
        { x: 1110, y: 800, interactionPoint: point(1110, 865) }
      ], "debate")
    };
  }

  function cardTitle(index, fallback) {
    return alpacards[index]?.title || fallback;
  }

  function videoTitle(index, fallback) {
    return channelVideos[index]?.title || fallback;
  }

  function modeObject(id, kind, label, x, y, width, height, panel, modeId, pathId, options = {}) {
    return object(id, kind, label, x, y, width, height, panel, {
      ...options,
      modeId,
      pathId
    });
  }

  const roomBlueprints = [
    {
      id: "campus-courtyard",
      title: "Campus Courtyard",
      subtitle: "Arrival plaza",
      backgroundStyle: "courtyard",
      world: { width: 2400, height: 1600 },
      spawnPoints: {
        default: point(1200, 1210),
        school: point(1200, 690),
        return: point(1200, 1210)
      },
      walkBounds: { x: 120, y: 260, width: 2160, height: 1210 },
      walkZones: [
        polygon("courtyard-main-plaza", [
          point(630, 560), point(1770, 560), point(2090, 990), point(1645, 1450),
          point(755, 1450), point(310, 990)
        ]),
        rect("courtyard-school-forecourt", 420, 390, 1560, 300),
        rect("courtyard-basketball-court", 200, 815, 685, 560),
        rect("courtyard-swing-court", 1500, 785, 650, 555),
        rect("courtyard-gate-approach", 760, 1160, 880, 310)
      ],
      blockedZones: [
        rect("school-building", 650, 110, 1100, 360),
        rect("left-garden", 100, 330, 260, 300),
        rect("right-garden", 2040, 330, 260, 300),
        rect("swing-frame", 1550, 980, 520, 88),
        rect("court-hoop", 340, 1010, 96, 96)
      ],
      portals: [
        portal("school-entrance", "School Entrance", 1106, 410, 188, 110, "school-lobby", "courtyard", {
          interactionPoint: point(1200, 560),
          proximity: 125
        })
      ],
      objects: [
        object("courtyard-ball", "ball", "Campus Ball", 535, 1195, 46, 46, null, {
          interactionPoint: point(535, 1250),
          proximity: 118,
          eventKey: "ball"
        }),
        object("courtyard-board", "board", "Welcome Board", 890, 610, 190, 92, "info", {
          interactionPoint: point(890, 742)
        }),
        object("gathering-ring", "meeting", "Gathering Area", 1210, 1010, 360, 118, "courtyard", {
          interactionPoint: point(1210, 1110),
          proximity: 190
        })
      ],
      seats: rowSeats("courtyard-swing", "Swing", 6, 1610, 1130, 82, "swing", {
        group: "swings",
        interactionPoint: point(1610, 1230)
      }).map((entry, index) => ({
        ...entry,
        interactionPoint: point(1610 + index * 82, 1235),
        sitPoint: point(1610 + index * 82, 1130)
      }))
    },
    {
      id: "school-lobby",
      title: "School Lobby",
      subtitle: "Main hub",
      backgroundStyle: "lobby",
      world: { width: 1900, height: 1250 },
      spawnPoints: {
        default: point(950, 1040),
        courtyard: point(950, 1040),
        learning: point(250, 610),
        games: point(1640, 610),
        training: point(1640, 780),
        cinema: point(655, 440),
        library: point(1265, 440),
        amphitheater: point(1560, 440)
      },
      walkBounds: { x: 120, y: 210, width: 1660, height: 910 },
      walkZones: [
        rect("lobby-main-floor", 145, 330, 1610, 670),
        rect("lobby-north-door-run", 220, 175, 1460, 210),
        rect("lobby-left-wing-approach", 80, 430, 300, 360),
        rect("lobby-right-wing-approach", 1520, 430, 300, 420),
        rect("lobby-south-entrance", 750, 860, 400, 260)
      ],
      blockedZones: [
        rect("reception-desk", 740, 250, 420, 130),
        rect("north-wall", 80, 80, 1740, 100),
        rect("lobby-left-sofa-block", 350, 760, 280, 110),
        rect("lobby-right-sofa-block", 1270, 760, 280, 110),
        rect("lobby-left-display-block", 255, 540, 160, 150),
        rect("lobby-right-display-block", 1485, 540, 160, 150)
      ],
      portals: [
        portal("lobby-exit", "Courtyard", 890, 1110, 120, 74, "campus-courtyard", "school", { interactionPoint: point(950, 1030) }),
        portal("cinema-door", "Alpaca Channel Cinema", 570, 170, 170, 110, "alpaca-channel-cinema", "lobby", { interactionPoint: point(655, 340) }),
        portal("library-door", "Guiding Library Lounge", 1180, 170, 170, 110, "guiding-library-lounge", "lobby", { interactionPoint: point(1265, 340) }),
        portal("amphitheater-door", "Grand Amphitheater", 1485, 170, 170, 110, "grand-amphitheater", "lobby", { interactionPoint: point(1570, 340), statusLabel: "Coming soon" }),
        portal("learning-wing-door", "Learning Commons", 96, 520, 150, 92, "learning-commons", "lobby", { interactionPoint: point(290, 566) }),
        portal("games-hall-door", "Games Hall", 1654, 520, 150, 92, "games-hall", "lobby", { interactionPoint: point(1610, 566) }),
        portal("training-center-door", "Training Center", 1654, 720, 150, 92, "training-center", "lobby", { interactionPoint: point(1610, 766) })
      ],
      objects: [
        object("information-alpaca", "npc", "Information Alpaca", 950, 238, 128, 110, "info", {
          interactionPoint: point(950, 440),
          proximity: 150
        }),
        object("coach-alpaca", "npc", "Coach Alpaca", 1235, 628, 118, 102, "coach", {
          interactionPoint: point(1235, 760),
          proximity: 145,
          questId: "meet-the-coach"
        }),
        object("syllabus-board", "board", "Syllabus Board", 545, 624, 190, 92, "syllabus", {
          interactionPoint: point(545, 760),
          proximity: 145,
          questId: "explore-the-syllabus-board"
        }),
        object("big-ideas-board", "board", "Big Ideas Board", 1545, 624, 190, 92, "big-ideas", {
          interactionPoint: point(1545, 760),
          proximity: 145,
          questId: "find-the-first-big-idea"
        }),
        object("updates-board", "board", "Updates Board", 330, 630, 190, 92, "info", {
          interactionPoint: point(330, 770)
        })
      ],
      seats: seatsFromPoints("lobby-lounge", "Lobby Seat", [
        { x: 410, y: 825, interactionPoint: point(410, 910), group: "left-sofa" },
        { x: 485, y: 825, interactionPoint: point(485, 910), group: "left-sofa" },
        { x: 560, y: 825, interactionPoint: point(560, 910), group: "left-sofa" },
        { x: 1335, y: 825, interactionPoint: point(1335, 910), group: "right-sofa" },
        { x: 1410, y: 825, interactionPoint: point(1410, 910), group: "right-sofa" },
        { x: 1485, y: 825, interactionPoint: point(1485, 910), group: "right-sofa" }
      ], "lounge")
    },
    {
      id: "learning-commons",
      title: "Learning Commons",
      subtitle: "Learn path hub",
      backgroundStyle: "library",
      world: { width: 1900, height: 1200 },
      spawnPoints: {
        default: point(950, 1035),
        lobby: point(950, 1035),
        training: point(1610, 720),
        games: point(1610, 905),
        slideshow: point(305, 390),
        mindmap: point(605, 390),
        museum: point(905, 390),
        classroom: point(905, 820)
      },
      walkBounds: { x: 110, y: 150, width: 1680, height: 910 },
      walkZones: [
        rect("commons-door-gallery", 125, 175, 1650, 260),
        rect("commons-main-floor", 110, 330, 1680, 590),
        rect("commons-bottom-entry", 620, 810, 560, 250),
        rect("commons-left-study-aisle", 90, 500, 520, 460),
        rect("commons-right-lounge-aisle", 1280, 500, 520, 460)
      ],
      blockedZones: [
        rect("commons-service-desk", 760, 205, 380, 120),
        rect("commons-left-study-table", 520, 665, 310, 130),
        rect("commons-right-study-table", 1070, 665, 310, 130),
        rect("commons-left-study-table-back", 520, 810, 310, 130),
        rect("commons-right-study-table-back", 1070, 810, 310, 130),
        rect("commons-lounge-sofas", 1250, 455, 430, 180)
      ],
      portals: [
        portal("commons-exit", "School Lobby", 890, 1080, 120, 72, "school-lobby", "learning", { interactionPoint: point(950, 1015) }),
        portal("commons-training", "Training Center", 1500, 720, 150, 92, "training-center", "learning", { interactionPoint: point(1450, 700) }),
        portal("commons-games", "Games Hall", 1500, 890, 150, 92, "games-hall", "learning", { interactionPoint: point(1450, 850) }),
        portal("commons-slideshow", "Slideshow Studio", 220, 180, 170, 100, "slideshow-studio", "commons", { interactionPoint: point(305, 335) }),
        portal("commons-mindmap", "Mind Map Lab", 520, 180, 170, 100, "mind-map-lab", "commons", { interactionPoint: point(605, 335) }),
        portal("commons-museum", "Flashcard Museum", 820, 180, 170, 100, "flashcard-museum", "commons", { interactionPoint: point(905, 335) }),
        portal("commons-classroom", "Raw Classroom", 820, 890, 170, 92, "raw-content-classroom", "commons", { interactionPoint: point(905, 815) })
      ],
      objects: [
        object("learn-path-directory", "board", "Learn Path Directory", 950, 250, 300, 120, "path-learn", {
          interactionPoint: point(950, 430),
          pathId: "learn"
        }),
        object("learn-help-desk", "npc", "Learning Alpaca", 950, 520, 120, 104, "path-learn", {
          interactionPoint: point(950, 665),
          pathId: "learn"
        })
      ],
      seats: [
        ...rowSeats("commons-table-a", "Study Seat", 5, 610, 720, 110, "study"),
        ...rowSeats("commons-table-b", "Study Seat", 5, 610, 845, 110, "study")
      ]
    },
    {
      id: "flashcard-museum",
      title: "Flashcard Museum",
      subtitle: "Alpacard exhibits",
      backgroundStyle: "museum",
      world: { width: 1800, height: 1120 },
      spawnPoints: {
        default: point(900, 960),
        commons: point(900, 960),
        mindmap: point(260, 600),
        raw: point(1500, 600)
      },
      walkBounds: { x: 120, y: 160, width: 1560, height: 850 },
      walkZones: [
        rect("museum-main-gallery-floor", 125, 210, 1550, 660),
        rect("museum-center-gallery-aisle", 680, 320, 440, 560),
        rect("museum-entrance-floor", 560, 780, 680, 240)
      ],
      blockedZones: [
        rect("north-gallery-wall", 80, 92, 1640, 72),
        rect("museum-left-display-row", 405, 355, 250, 430),
        rect("museum-right-display-row", 1145, 355, 250, 430),
        rect("museum-front-rope-left", 390, 830, 390, 70),
        rect("museum-front-rope-right", 1020, 830, 390, 70)
      ],
      portals: [
        portal("museum-exit", "Learning Commons", 840, 1018, 120, 70, "learning-commons", "museum", { interactionPoint: point(900, 950) }),
        portal("museum-to-mindmap", "Mind Map Lab", 96, 520, 145, 84, "mind-map-lab", "museum", { interactionPoint: point(265, 560) }),
        portal("museum-to-raw", "Raw Classroom", 1558, 520, 145, 84, "raw-content-classroom", "museum", { interactionPoint: point(1500, 560) })
      ],
      objects: Array.from({ length: 10 }, (_item, index) => {
        const top = index < 5;
        const x = 260 + (index % 5) * 320;
        const y = top ? 205 : 520;
        return object(`flashcard-exhibit-${index + 1}`, "exhibit", cardTitle(index, `Exhibit ${index + 1}`), x, y, 190, 118, "flashcards", {
          contentId: index,
          interactionPoint: point(x, y + 170),
          proximity: 145
        });
      }),
      seats: []
    },
    {
      id: "slideshow-studio",
      title: "Slideshow Studio",
      subtitle: "Lesson projector room",
      backgroundStyle: "classroom",
      world: { width: 1700, height: 1080 },
      spawnPoints: { default: point(850, 940), commons: point(850, 940), mindmap: point(1365, 720) },
      walkBounds: { x: 110, y: 150, width: 1480, height: 830 },
      walkZones: [
        rect("slideshow-front-approach", 310, 225, 1080, 240),
        rect("slideshow-center-aisle", 735, 270, 230, 700),
        rect("slideshow-left-aisle", 110, 330, 610, 570),
        rect("slideshow-right-aisle", 980, 330, 610, 570),
        rect("slideshow-entrance-aisle", 585, 800, 530, 220)
      ],
      blockedZones: [
        rect("studio-screen-wall", 390, 90, 920, 130),
        rect("teacher-console-block", 710, 285, 280, 92),
        rect("studio-left-seat-bank-a", 465, 525, 240, 90),
        rect("studio-right-seat-bank-a", 995, 525, 240, 90),
        rect("studio-left-seat-bank-b", 465, 675, 240, 90),
        rect("studio-right-seat-bank-b", 995, 675, 240, 90)
      ],
      portals: [
        portal("slideshow-exit", "Learning Commons", 790, 980, 120, 70, "learning-commons", "slideshow", { interactionPoint: point(850, 910) }),
        portal("slideshow-to-mindmap", "Mind Map Lab", 1435, 660, 130, 80, "mind-map-lab", "slideshow", { interactionPoint: point(1365, 690) })
      ],
      objects: [
        modeObject("slideshow-projector", "screen", "Slideshow Lesson", 850, 155, 650, 110, "mode-slideshow", "slideshow", "learn", {
          interactionPoint: point(850, 405),
          proximity: 185
        }),
        modeObject("lesson-route-board", "board", "Route Board", 260, 390, 210, 100, "mode-slideshow", "slideshow", "learn", {
          interactionPoint: point(380, 520)
        })
      ],
      seats: [
        ...rowSeats("slideshow-row-a", "Lesson Seat", 6, 510, 565, 135, "lesson", {
          interactionPoint: point(850, 630)
        }),
        ...rowSeats("slideshow-row-b", "Lesson Seat", 6, 510, 720, 135, "lesson", {
          interactionPoint: point(850, 780)
        })
      ]
    },
    {
      id: "mind-map-lab",
      title: "Mind Map Lab",
      subtitle: "Concept mapping room",
      backgroundStyle: "library",
      world: { width: 1800, height: 1120 },
      spawnPoints: {
        default: point(900, 980),
        commons: point(900, 980),
        slideshow: point(360, 755),
        museum: point(1440, 755)
      },
      walkBounds: { x: 110, y: 150, width: 1580, height: 850 },
      walkZones: [
        rect("mindmap-front-lens-approach", 145, 255, 1510, 350),
        rect("mindmap-main-floor", 125, 475, 1550, 355),
        rect("mindmap-bottom-entry", 650, 755, 500, 245),
        rect("mindmap-left-door-approach", 120, 650, 420, 220),
        rect("mindmap-right-door-approach", 1260, 650, 420, 220)
      ],
      blockedZones: [
        rect("mindmap-round-table-block", 590, 430, 620, 295),
        rect("mindmap-left-glass-board", 395, 295, 265, 230),
        rect("mindmap-right-glass-board", 1140, 295, 265, 230)
      ],
      portals: [
        portal("mindmap-exit", "Learning Commons", 840, 1020, 120, 70, "learning-commons", "mindmap", { interactionPoint: point(900, 950) }),
        portal("mindmap-to-slideshow", "Slideshow Studio", 240, 720, 140, 84, "slideshow-studio", "mindmap", { interactionPoint: point(360, 735) }),
        portal("mindmap-to-museum", "Flashcard Museum", 1420, 720, 140, 84, "flashcard-museum", "mindmap", { interactionPoint: point(1440, 735) })
      ],
      objects: [
        modeObject("mindmap-table", "meeting", "Interactive Mind Map", 900, 500, 520, 210, "mode-mindmap", "mindmap", "learn", {
          interactionPoint: point(900, 760),
          proximity: 220
        }),
        modeObject("mindmap-key", "board", "Subject / Section / Big Idea Lenses", 320, 310, 230, 110, "mode-mindmap", "mindmap", "learn", {
          interactionPoint: point(420, 455)
        })
      ],
      seats: [
        ...rowSeats("mindmap-left", "Lab Stool", 4, 545, 800, 110, "lab"),
        ...rowSeats("mindmap-right", "Lab Stool", 4, 925, 800, 110, "lab")
      ]
    },
    {
      id: "alpaca-channel-cinema",
      title: "Alpaca Channel Cinema",
      subtitle: "Media room",
      backgroundStyle: "cinema",
      world: { width: 1800, height: 1120 },
      spawnPoints: { default: point(900, 980), lobby: point(900, 980), library: point(335, 720) },
      walkBounds: { x: 110, y: 160, width: 1580, height: 860 },
      walkZones: [
        rect("cinema-front-approach", 285, 255, 1230, 170),
        rect("cinema-center-aisle", 770, 300, 260, 700),
        rect("cinema-left-aisle", 120, 315, 280, 600),
        rect("cinema-right-aisle", 1400, 315, 280, 600),
        rect("cinema-back-entrance", 480, 780, 840, 240),
        rect("cinema-side-door-approach", 195, 650, 320, 180)
      ],
      blockedZones: [
        rect("screen-wall", 360, 105, 1080, 130),
        rect("cinema-left-seat-bank", 470, 455, 275, 350),
        rect("cinema-right-seat-bank", 1055, 455, 275, 350),
        rect("cinema-front-stage-lip", 420, 245, 960, 72)
      ],
      portals: [
        portal("cinema-exit", "School Lobby", 840, 1020, 120, 70, "school-lobby", "cinema", { interactionPoint: point(900, 960) }),
        portal("cinema-to-library", "Guiding Library", 210, 700, 145, 84, "guiding-library-lounge", "cinema", { interactionPoint: point(335, 700) })
      ],
      objects: [
        object("cinema-screen", "screen", videoTitle(0, "Alpaca Channel"), 900, 180, 620, 160, "alpaca-channel", { contentId: 0, interactionPoint: point(900, 395), proximity: 180 }),
        object("cinema-poster-1", "poster", videoTitle(1, "Feature 2"), 260, 340, 190, 118, "alpaca-channel", { contentId: 1, interactionPoint: point(335, 510), proximity: 150 }),
        object("cinema-poster-2", "poster", videoTitle(2, "Feature 3"), 260, 530, 190, 118, "alpaca-channel", { contentId: 2, interactionPoint: point(335, 670), proximity: 150 }),
        object("cinema-poster-3", "poster", videoTitle(3, "Feature 4"), 1540, 340, 190, 118, "alpaca-channel", { contentId: 3, interactionPoint: point(1465, 510), proximity: 150 }),
        object("cinema-poster-4", "poster", videoTitle(4, "Feature 5"), 1540, 530, 190, 118, "alpaca-channel", { contentId: 4, interactionPoint: point(1465, 670), proximity: 150 }),
        object("cinema-control", "control", "Video Selector", 1460, 790, 150, 74, "alpaca-channel", { contentId: 0, interactionPoint: point(1380, 850) })
      ],
      seats: [
        ...rowSeats("cinema-front", "Front Seat", 6, 575, 555, 130, "cinema").map((entry, index) => ({
          ...entry,
          interactionPoint: point(index < 2 ? 360 : index > 3 ? 1440 : 900, entry.y + 54)
        })),
        ...rowSeats("cinema-middle", "Middle Seat", 6, 575, 690, 130, "cinema").map((entry, index) => ({
          ...entry,
          interactionPoint: point(index < 2 ? 360 : index > 3 ? 1440 : 900, entry.y + 54)
        })),
        ...rowSeats("cinema-back", "Back Seat", 6, 575, 825, 130, "cinema").map((entry, index) => ({
          ...entry,
          interactionPoint: point(index < 2 ? 360 : index > 3 ? 1440 : 900, entry.y + 54)
        }))
      ]
    },
    {
      id: "raw-content-classroom",
      title: "Raw Content Classroom",
      subtitle: "Study room",
      backgroundStyle: "classroom",
      world: { width: 1650, height: 1100 },
      spawnPoints: {
        default: point(825, 960),
        commons: point(825, 960),
        museum: point(340, 535),
        library: point(1310, 535)
      },
      walkBounds: { x: 110, y: 155, width: 1430, height: 850 },
      walkZones: [
        rect("classroom-front-approach", 150, 235, 1350, 245),
        rect("classroom-main-floor", 110, 390, 1430, 560),
        rect("classroom-center-aisle", 710, 360, 230, 620),
        rect("classroom-left-aisle", 110, 300, 240, 680),
        rect("classroom-right-aisle", 1300, 300, 240, 680),
        rect("classroom-bottom-entry", 565, 820, 520, 185)
      ],
      blockedZones: [
        rect("front-board-wall", 420, 100, 810, 100),
        rect("teacher-desk", 650, 245, 350, 120),
        rect("classroom-left-desk-row-a", 330, 455, 330, 95),
        rect("classroom-right-desk-row-a", 990, 455, 330, 95),
        rect("classroom-left-desk-row-b", 330, 605, 330, 95),
        rect("classroom-right-desk-row-b", 990, 605, 330, 95),
        rect("classroom-left-desk-row-c", 330, 755, 330, 95),
        rect("classroom-right-desk-row-c", 990, 755, 330, 95)
      ],
      portals: [
        portal("classroom-exit", "Learning Commons", 765, 1000, 120, 70, "learning-commons", "classroom", { interactionPoint: point(825, 930) }),
        portal("classroom-to-museum", "Flashcard Museum", 190, 500, 145, 84, "flashcard-museum", "raw", { interactionPoint: point(340, 515) }),
        portal("classroom-to-library", "Guiding Library", 1315, 500, 145, 84, "guiding-library-lounge", "raw", { interactionPoint: point(1310, 515) })
      ],
      objects: [
        object("raw-board", "board", "Raw Content Board", 825, 146, 430, 80, "raw-content", { contentId: 0, interactionPoint: point(825, 390), proximity: 175 }),
        object("raw-visual-1", "exhibit", "Raw Visual 1", 220, 320, 180, 110, "raw-content", { contentId: 0, interactionPoint: point(340, 430), proximity: 140 }),
        object("raw-visual-2", "exhibit", "Raw Visual 2", 1430, 320, 180, 110, "raw-content", { contentId: 1, interactionPoint: point(1310, 430), proximity: 140 }),
        object("raw-visual-3", "exhibit", "Raw Visual 3", 220, 700, 180, 110, "raw-content", { contentId: 2, interactionPoint: point(340, 810), proximity: 140 }),
        object("raw-visual-4", "exhibit", "Raw Visual 4", 1430, 700, 180, 110, "raw-content", { contentId: 3, interactionPoint: point(1310, 810), proximity: 140 })
      ],
      seats: [
        ...rowSeats("desk-a", "Desk A", 5, 390, 500, 170, "desk", { panel: "raw-content" }),
        ...rowSeats("desk-b", "Desk B", 5, 390, 650, 170, "desk", { panel: "raw-content" }),
        ...rowSeats("desk-c", "Desk C", 5, 390, 800, 170, "desk", { panel: "raw-content" })
      ]
    },
    {
      id: "guiding-library-lounge",
      title: "Guiding Library Lounge",
      subtitle: "Main Learn room",
      backgroundStyle: "library",
      world: { width: 2100, height: 1360 },
      spawnPoints: {
        default: point(1050, 1190),
        lobby: point(1050, 1190),
        raw: point(390, 860),
        cinema: point(1610, 860)
      },
      walkBounds: { x: 110, y: 130, width: 1880, height: 1110 },
      walkZones: [
        rect("library-front-guide-aisle", 130, 295, 1840, 170),
        rect("library-main-reading-floor", 215, 445, 1670, 570),
        rect("library-entrance-run", 420, 980, 1260, 260),
        rect("library-left-lounge-aisle", 110, 625, 360, 360),
        rect("library-right-lounge-aisle", 1630, 625, 360, 360),
        rect("library-center-help-desk-approach", 750, 360, 600, 260)
      ],
      blockedZones: [
        rect("library-help-desk-block", 805, 205, 490, 130),
        rect("library-left-sofa-block", 120, 690, 310, 170),
        rect("library-right-sofa-block", 1670, 690, 310, 170),
        rect("library-bookcase-row-1", 335, 385, 1370, 70),
        rect("library-bookcase-row-2", 335, 605, 1370, 70),
        rect("library-bookcase-row-3", 335, 825, 1370, 70),
        rect("library-left-reading-table", 205, 1015, 160, 155),
        rect("library-center-reading-table", 900, 1025, 300, 150),
        rect("library-right-reading-table", 1735, 1015, 160, 155)
      ],
      portals: [
        portal("library-exit", "School Lobby", 990, 1240, 120, 70, "school-lobby", "library", { interactionPoint: point(1050, 1168) }),
        portal("library-to-raw", "Raw Classroom", 250, 830, 145, 84, "raw-content-classroom", "library", { interactionPoint: point(390, 850) }),
        portal("library-to-cinema", "Alpaca Channel Cinema", 1705, 830, 145, 84, "alpaca-channel-cinema", "library", { interactionPoint: point(1610, 850) })
      ],
      objects: [
        ...makeLibraryShelves(),
        object("library-help-desk", "npc", "Reference / Help Desk", 1050, 270, 420, 116, "library", {
          interactionPoint: point(1050, 430),
          proximity: 180
        }),
        object("library-center-table", "library", "Guide Reading Table", 1050, 1100, 300, 125, "library", {
          interactionPoint: point(1050, 1210),
          proximity: 170
        }),
        object("library-resource-cart", "library", "Book Cart", 1510, 1110, 130, 90, "library", {
          interactionPoint: point(1510, 1210),
          proximity: 130
        })
      ],
      seats: seatsFromPoints("library-seat", "Library Seat", [
        { x: 930, y: 405, interactionPoint: point(1050, 430), group: "help-desk" },
        { x: 1170, y: 405, interactionPoint: point(1050, 430), group: "help-desk" },
        { x: 220, y: 1035, interactionPoint: point(285, 1090), group: "left-reading" },
        { x: 350, y: 1035, interactionPoint: point(285, 1090), group: "left-reading" },
        { x: 220, y: 1145, interactionPoint: point(285, 1090), group: "left-reading" },
        { x: 350, y: 1145, interactionPoint: point(285, 1090), group: "left-reading" },
        { x: 970, y: 1040, interactionPoint: point(1050, 1100), group: "center-reading" },
        { x: 1130, y: 1040, interactionPoint: point(1050, 1100), group: "center-reading" },
        { x: 970, y: 1160, interactionPoint: point(1050, 1100), group: "center-reading" },
        { x: 1130, y: 1160, interactionPoint: point(1050, 1100), group: "center-reading" },
        { x: 1750, y: 1035, interactionPoint: point(1815, 1090), group: "right-reading" },
        { x: 1880, y: 1035, interactionPoint: point(1815, 1090), group: "right-reading" },
        { x: 1750, y: 1145, interactionPoint: point(1815, 1090), group: "right-reading" },
        { x: 1880, y: 1145, interactionPoint: point(1815, 1090), group: "right-reading" },
        { x: 600, y: 1030, interactionPoint: point(580, 970), group: "left-aisle-reading" },
        { x: 1465, y: 1030, interactionPoint: point(1510, 1015), group: "right-aisle-reading" },
        { x: 170, y: 790, interactionPoint: point(390, 830), group: "left-sofa" },
        { x: 245, y: 790, interactionPoint: point(390, 830), group: "left-sofa" },
        { x: 320, y: 790, interactionPoint: point(390, 830), group: "left-sofa" },
        { x: 1780, y: 790, interactionPoint: point(1610, 830), group: "right-sofa" },
        { x: 1855, y: 790, interactionPoint: point(1610, 830), group: "right-sofa" },
        { x: 1930, y: 790, interactionPoint: point(1610, 830), group: "right-sofa" }
      ], "lounge")
    },
    {
      id: "games-hall",
      title: "Games Hall",
      subtitle: "Play path hub",
      backgroundStyle: "game-hall",
      world: { width: 2000, height: 1300 },
      spawnPoints: {
        default: point(1000, 1130),
        lobby: point(1000, 1130),
        learning: point(300, 600),
        training: point(1600, 900),
        alpacapardy: point(315, 365),
        run: point(180, 730),
        jump: point(520, 1040),
        relay: point(1480, 1040),
        survival: point(1820, 730)
      },
      walkBounds: { x: 110, y: 170, width: 1780, height: 980 },
      walkZones: [
        rect("games-central-floor", 190, 325, 1620, 730),
        rect("games-top-door-aisle", 180, 200, 1640, 180),
        rect("games-bottom-door-aisle", 395, 920, 1210, 240),
        rect("games-left-door-aisle", 105, 520, 380, 330),
        rect("games-right-door-aisle", 1515, 520, 380, 330)
      ],
      blockedZones: [
        rect("games-scoreboard-wall", 735, 185, 530, 150),
        rect("games-left-bleachers", 115, 340, 170, 430),
        rect("games-right-bleachers", 1715, 340, 170, 430),
        rect("games-left-front-planter", 330, 780, 110, 170),
        rect("games-right-front-planter", 1560, 780, 110, 170),
        rect("games-team-table-a", 620, 460, 210, 150),
        rect("games-team-table-b", 1165, 460, 210, 150),
        rect("games-team-table-c", 620, 700, 210, 150),
        rect("games-team-table-d", 1165, 700, 210, 150)
      ],
      portals: [
        portal("games-exit", "School Lobby", 940, 1190, 120, 72, "school-lobby", "games", { interactionPoint: point(1000, 1118) }),
        portal("games-learning", "Learning Commons", 96, 570, 150, 92, "learning-commons", "games", { interactionPoint: point(300, 600) }),
        portal("games-training", "Training Center", 1654, 900, 150, 92, "training-center", "games", { interactionPoint: point(1600, 900) }),
        portal("games-alpacapardy", "Alpacapardy Hall", 315, 210, 175, 104, "alpacapardy-hall", "games", { interactionPoint: point(315, 365) }),
        portal("games-run", "Alpaca Run Track", 160, 700, 155, 108, "alpaca-run-track", "games", { interactionPoint: point(300, 710) }),
        portal("games-jump", "Alpaca Jump Gym", 520, 1020, 175, 104, "alpaca-jump-gym", "games", { interactionPoint: point(520, 925) }),
        portal("games-relay", "Alpaquiz Relay Room", 1480, 1020, 175, 104, "alpaquiz-relay-room", "games", { interactionPoint: point(1480, 925) }),
        portal("games-survival", "Survivalpaca Arena", 1840, 700, 155, 108, "survivalpaca-arena", "games", { interactionPoint: point(1700, 710) })
      ],
      objects: [
        object("games-scoreboard", "display", "Play Path Scoreboard", 1000, 250, 420, 150, "path-play", {
          pathId: "play",
          interactionPoint: point(1000, 405),
          proximity: 190
        }),
        object("games-trophy-display", "display", "Trophy Display", 1000, 330, 380, 88, "path-play", {
          pathId: "play",
          interactionPoint: point(1000, 455),
          proximity: 150
        }),
        object("games-host-alpaca", "npc", "Games Hall Host", 1000, 700, 120, 104, "path-play", {
          pathId: "play",
          interactionPoint: point(1000, 850)
        })
      ],
      seats: [
        ...seatsFromPoints("games-table-a", "Team Table Seat", [
          { x: 620, y: 520, interactionPoint: point(725, 610) },
          { x: 725, y: 520, interactionPoint: point(725, 610) },
          { x: 620, y: 635, interactionPoint: point(725, 610) },
          { x: 725, y: 635, interactionPoint: point(725, 610) },
          { x: 1180, y: 520, interactionPoint: point(1275, 610) },
          { x: 1285, y: 520, interactionPoint: point(1275, 610) },
          { x: 1180, y: 635, interactionPoint: point(1275, 610) },
          { x: 1285, y: 635, interactionPoint: point(1275, 610) },
          { x: 620, y: 760, interactionPoint: point(725, 735) },
          { x: 725, y: 760, interactionPoint: point(725, 735) },
          { x: 620, y: 875, interactionPoint: point(725, 735) },
          { x: 725, y: 875, interactionPoint: point(725, 735) },
          { x: 1180, y: 760, interactionPoint: point(1275, 735) },
          { x: 1285, y: 760, interactionPoint: point(1275, 735) },
          { x: 1180, y: 875, interactionPoint: point(1275, 735) },
          { x: 1285, y: 875, interactionPoint: point(1275, 735) }
        ], "team"),
        ...seatsFromPoints("games-bleacher-left", "Bleacher", [
          { x: 150, y: 430, interactionPoint: point(305, 520) },
          { x: 150, y: 510, interactionPoint: point(305, 560) },
          { x: 150, y: 590, interactionPoint: point(305, 600) },
          { x: 150, y: 670, interactionPoint: point(305, 640) },
          { x: 1850, y: 430, interactionPoint: point(1695, 520) },
          { x: 1850, y: 510, interactionPoint: point(1695, 560) },
          { x: 1850, y: 590, interactionPoint: point(1695, 600) },
          { x: 1850, y: 670, interactionPoint: point(1695, 640) }
        ], "bleacher")
      ]
    },
    {
      id: "alpacapardy-hall",
      title: "Alpacapardy Hall",
      subtitle: "Jeopardy-style game room",
      backgroundStyle: "game-hall",
      world: { width: 1900, height: 1200 },
      spawnPoints: { default: point(950, 1040), games: point(950, 1040), relay: point(1500, 620) },
      walkBounds: { x: 110, y: 170, width: 1680, height: 900 },
      walkZones: [
        rect("alpacapardy-front-approach", 220, 310, 1460, 280),
        rect("alpacapardy-center-floor", 230, 520, 1440, 360),
        rect("alpacapardy-bottom-entry", 620, 855, 660, 220),
        rect("alpacapardy-left-aisle", 110, 480, 320, 450),
        rect("alpacapardy-right-aisle", 1470, 480, 320, 450)
      ],
      blockedZones: [
        rect("alpacapardy-board-block", 430, 120, 1040, 230),
        rect("host-desk-block", 790, 395, 320, 135),
        rect("alpacapardy-team-a-table", 360, 670, 300, 140),
        rect("alpacapardy-team-b-table", 800, 670, 300, 140),
        rect("alpacapardy-team-c-table", 1240, 670, 300, 140),
        rect("alpacapardy-audience-left", 110, 795, 210, 180),
        rect("alpacapardy-audience-right", 1580, 795, 210, 180)
      ],
      portals: [
        portal("alpacapardy-exit", "Games Hall", 890, 1080, 120, 72, "games-hall", "alpacapardy", { interactionPoint: point(950, 1010) }),
        portal("alpacapardy-to-relay", "Alpaquiz Relay", 1600, 580, 145, 84, "alpaquiz-relay-room", "alpacapardy", { interactionPoint: point(1490, 620) })
      ],
      objects: [
        modeObject("alpacapardy-board", "screen", "Alpacapardy Board", 950, 230, 820, 180, "mode-jeopardy", "jeopardy", "play", {
          interactionPoint: point(950, 455),
          proximity: 220
        }),
        modeObject("alpacapardy-host", "control", "Host Desk / Stage", 950, 450, 320, 105, "mode-jeopardy", "jeopardy", "play", {
          interactionPoint: point(950, 600),
          proximity: 165
        })
      ],
      seats: seatsFromPoints("alpacapardy-team", "Team Seat", [
        { x: 410, y: 735, interactionPoint: point(515, 830), group: "team-a" },
        { x: 515, y: 735, interactionPoint: point(515, 830), group: "team-a" },
        { x: 410, y: 860, interactionPoint: point(515, 830), group: "team-a" },
        { x: 515, y: 860, interactionPoint: point(515, 830), group: "team-a" },
        { x: 850, y: 735, interactionPoint: point(950, 830), group: "team-b" },
        { x: 955, y: 735, interactionPoint: point(950, 830), group: "team-b" },
        { x: 850, y: 860, interactionPoint: point(950, 830), group: "team-b" },
        { x: 955, y: 860, interactionPoint: point(950, 830), group: "team-b" },
        { x: 1290, y: 735, interactionPoint: point(1385, 830), group: "team-c" },
        { x: 1395, y: 735, interactionPoint: point(1385, 830), group: "team-c" },
        { x: 1290, y: 860, interactionPoint: point(1385, 830), group: "team-c" },
        { x: 1395, y: 860, interactionPoint: point(1385, 830), group: "team-c" }
      ], "team")
    },
    {
      id: "alpaca-run-track",
      title: "Alpaca Run Track",
      subtitle: "Road to the Cup route",
      backgroundStyle: "courtyard",
      world: { width: 2300, height: 1350 },
      spawnPoints: { default: point(1150, 1120), games: point(1150, 1120), survival: point(460, 700), jump: point(1840, 700) },
      walkBounds: { x: 130, y: 210, width: 2040, height: 1000 },
      walkZones: [
        rect("track-top-lanes", 360, 285, 1580, 260),
        rect("track-bottom-lanes", 360, 760, 1580, 320),
        rect("track-left-curve", 160, 380, 460, 570),
        rect("track-right-curve", 1680, 380, 460, 570),
        rect("track-start-approach", 915, 930, 470, 250),
        rect("track-sign-approach", 330, 520, 360, 260),
        rect("track-jump-link-approach", 1610, 520, 360, 260)
      ],
      blockedZones: [
        rect("track-inner-field", 675, 410, 950, 410),
        rect("track-stands-left", 245, 250, 315, 165),
        rect("track-stands-right", 1740, 250, 315, 165),
        rect("track-scoreboard", 900, 210, 500, 110)
      ],
      portals: [
        portal("run-exit", "Games Hall", 1090, 1220, 120, 72, "games-hall", "run", { interactionPoint: point(1150, 1148) }),
        portal("run-to-survival", "Survivalpaca Arena", 330, 650, 145, 84, "survivalpaca-arena", "run", { interactionPoint: point(460, 690) }),
        portal("run-to-jump", "Alpaca Jump Gym", 1825, 650, 145, 84, "alpaca-jump-gym", "run", { interactionPoint: point(1840, 690) })
      ],
      objects: [
        modeObject("run-start-line", "track", "Start Line", 1150, 965, 320, 72, "mode-run", "run", "play", {
          interactionPoint: point(1150, 1065),
          proximity: 165
        }),
        modeObject("run-map-board", "board", "Regional / Global / ToC Route", 1150, 250, 650, 120, "mode-run", "run", "play", {
          interactionPoint: point(1150, 390),
          proximity: 180
        }),
        modeObject("run-victory-podium", "stage", "Victory Podium", 1760, 880, 260, 110, "mode-run", "run", "play", {
          interactionPoint: point(1720, 1010),
          proximity: 145
        })
      ],
      seats: [
        ...rowSeats("run-stand-left", "Track Stand", 5, 385, 310, 70, "bleacher", {
          interactionPoint: point(520, 470)
        }),
        ...rowSeats("run-stand-right", "Track Stand", 5, 1765, 310, 70, "bleacher", {
          interactionPoint: point(1780, 470)
        })
      ]
    },
    {
      id: "alpaca-jump-gym",
      title: "Alpaca Jump Gym",
      subtitle: "Obstacle practice gym",
      backgroundStyle: "gym",
      world: { width: 1800, height: 1120 },
      spawnPoints: { default: point(900, 980), games: point(900, 980), run: point(300, 720) },
      walkBounds: { x: 110, y: 160, width: 1580, height: 850 },
      walkZones: [
        rect("jump-front-wall-approach", 210, 230, 1380, 220),
        rect("jump-main-floor", 145, 405, 1510, 440),
        rect("jump-bottom-entry", 600, 820, 600, 185),
        rect("jump-left-run-approach", 115, 610, 420, 230),
        rect("jump-right-focus-approach", 1240, 610, 420, 230)
      ],
      blockedZones: [
        rect("jump-climbing-wall-block", 200, 285, 260, 210),
        rect("jump-hurdles-block", 625, 380, 390, 120),
        rect("jump-balance-beam-block", 330, 555, 430, 100),
        rect("jump-runway-block", 855, 555, 230, 260),
        rect("jump-mat-block", 1260, 360, 300, 250),
        rect("jump-bench-block", 120, 825, 350, 100),
        rect("jump-coach-desk-block", 1290, 780, 260, 125)
      ],
      portals: [
        portal("jump-exit", "Games Hall", 840, 1020, 120, 70, "games-hall", "jump", { interactionPoint: point(900, 950) }),
        portal("jump-to-run", "Alpaca Run Track", 210, 700, 145, 84, "alpaca-run-track", "jump", { interactionPoint: point(300, 720) })
      ],
      objects: [
        modeObject("jump-course", "track", "Jump Runway", 920, 655, 220, 260, "mode-jump", "jump", "play", {
          interactionPoint: point(900, 825),
          proximity: 220
        }),
        modeObject("jump-climbing-wall", "track", "Climbing Wall", 315, 360, 230, 170, "mode-jump", "jump", "play", {
          interactionPoint: point(470, 470),
          proximity: 150
        }),
        modeObject("jump-hurdles", "track", "Hurdle Section", 815, 420, 360, 92, "mode-jump", "jump", "play", {
          interactionPoint: point(815, 540),
          proximity: 150
        }),
        modeObject("jump-coach", "control", "Coach Desk Area", 1410, 820, 250, 105, "mode-jump", "jump", "play", {
          interactionPoint: point(1320, 930),
          proximity: 150
        })
      ],
      seats: [
        ...rowSeats("jump-bench", "Gym Bench", 4, 205, 880, 80, "bench", {
          interactionPoint: point(390, 845)
        }),
        ...seatsFromPoints("jump-coach-seat", "Coach Chair", [
          { x: 1400, y: 885, interactionPoint: point(1240, 930) }
        ], "chair")
      ]
    },
    {
      id: "alpaquiz-relay-room",
      title: "Alpaquiz Relay Room",
      subtitle: "Buzz-first team quiz room",
      backgroundStyle: "quiz-lab",
      world: { width: 1700, height: 1080 },
      spawnPoints: { default: point(850, 940), games: point(850, 940), alpacapardy: point(300, 700), survival: point(1400, 700) },
      walkBounds: { x: 110, y: 150, width: 1480, height: 820 },
      walkZones: [
        rect("relay-front-board-approach", 250, 220, 1200, 220),
        rect("relay-center-cross", 410, 390, 880, 420),
        rect("relay-bottom-entry", 560, 780, 580, 190),
        rect("relay-left-team-aisle", 120, 445, 450, 350),
        rect("relay-right-team-aisle", 1130, 445, 450, 350)
      ],
      blockedZones: [
        rect("relay-center-console", 720, 455, 260, 160),
        rect("relay-blue-table", 210, 610, 360, 155),
        rect("relay-green-table", 210, 300, 360, 155),
        rect("relay-orange-table", 1130, 300, 360, 155),
        rect("relay-yellow-table", 1130, 610, 360, 155),
        rect("relay-scoreboard-wall", 530, 150, 640, 100)
      ],
      portals: [
        portal("relay-exit", "Games Hall", 790, 980, 120, 70, "games-hall", "relay", { interactionPoint: point(850, 910) }),
        portal("relay-to-alpacapardy", "Alpacapardy Hall", 210, 680, 145, 84, "alpacapardy-hall", "relay", { interactionPoint: point(300, 700) }),
        portal("relay-to-survival", "Survivalpaca Arena", 1350, 680, 145, 84, "survivalpaca-arena", "relay", { interactionPoint: point(1400, 700) })
      ],
      objects: [
        modeObject("relay-console", "control", "Buzz Console", 850, 535, 260, 140, "mode-relay", "relay", "play", {
          interactionPoint: point(850, 745),
          proximity: 180
        }),
        modeObject("relay-scoreboard", "display", "Alpaquiz Scoreboard", 850, 215, 520, 100, "mode-relay", "relay", "play", {
          interactionPoint: point(850, 350),
          proximity: 175
        })
      ],
      seats: seatsFromPoints("relay-seat", "Relay Seat", [
        { x: 255, y: 380, interactionPoint: point(390, 455), group: "green" },
        { x: 365, y: 380, interactionPoint: point(390, 455), group: "green" },
        { x: 255, y: 500, interactionPoint: point(390, 455), group: "green" },
        { x: 365, y: 500, interactionPoint: point(390, 455), group: "green" },
        { x: 1185, y: 380, interactionPoint: point(1310, 455), group: "orange" },
        { x: 1295, y: 380, interactionPoint: point(1310, 455), group: "orange" },
        { x: 1185, y: 500, interactionPoint: point(1310, 455), group: "orange" },
        { x: 1295, y: 500, interactionPoint: point(1310, 455), group: "orange" },
        { x: 255, y: 690, interactionPoint: point(390, 765), group: "blue" },
        { x: 365, y: 690, interactionPoint: point(390, 765), group: "blue" },
        { x: 255, y: 810, interactionPoint: point(390, 765), group: "blue" },
        { x: 365, y: 810, interactionPoint: point(390, 765), group: "blue" },
        { x: 1185, y: 690, interactionPoint: point(1310, 765), group: "yellow" },
        { x: 1295, y: 690, interactionPoint: point(1310, 765), group: "yellow" },
        { x: 1185, y: 810, interactionPoint: point(1310, 765), group: "yellow" },
        { x: 1295, y: 810, interactionPoint: point(1310, 765), group: "yellow" }
      ], "team")
    },
    {
      id: "survivalpaca-arena",
      title: "Survivalpaca Arena",
      subtitle: "Sudden-death race room",
      backgroundStyle: "arena",
      world: { width: 1900, height: 1220 },
      spawnPoints: { default: point(950, 1060), games: point(950, 1060), relay: point(360, 720), run: point(1540, 720) },
      walkBounds: { x: 120, y: 170, width: 1660, height: 910 },
      walkZones: [
        rect("survival-outer-ring", 185, 240, 1530, 780),
        rect("survival-bottom-entry", 650, 910, 600, 170),
        rect("survival-left-link", 130, 620, 410, 220),
        rect("survival-right-link", 1360, 620, 410, 220),
        polygon("survival-center-ring", [
          point(950, 360), point(1300, 475), point(1420, 705), point(1260, 895),
          point(950, 965), point(640, 895), point(480, 705), point(600, 475)
        ])
      ],
      blockedZones: [
        rect("survival-clock-block", 720, 245, 460, 180),
        rect("arena-core-block", 565, 510, 770, 210),
        rect("survival-left-stands", 160, 840, 350, 145),
        rect("survival-right-stands", 1390, 840, 350, 145)
      ],
      portals: [
        portal("survival-exit", "Games Hall", 890, 1110, 120, 70, "games-hall", "survival", { interactionPoint: point(950, 1040) }),
        portal("survival-to-relay", "Alpaquiz Relay", 250, 700, 145, 84, "alpaquiz-relay-room", "survival", { interactionPoint: point(360, 720) }),
        portal("survival-to-run", "Alpaca Run Track", 1505, 700, 145, 84, "alpaca-run-track", "survival", { interactionPoint: point(1540, 720) })
      ],
      objects: [
        modeObject("survival-clock", "display", "Survival Clock", 950, 315, 360, 120, "mode-race", "race", "play", {
          interactionPoint: point(950, 500),
          proximity: 190
        }),
        modeObject("survival-threshold", "track", "Threshold Gate", 950, 635, 600, 130, "mode-race", "race", "play", {
          interactionPoint: point(950, 835),
          proximity: 210
        })
      ],
      seats: rowSeats("survival-stand", "Arena Seat", 10, 520, 900, 95, "bleacher")
    },
    {
      id: "training-center",
      title: "Training Center",
      subtitle: "Train path hub",
      backgroundStyle: "lobby",
      world: { width: 1900, height: 1250 },
      spawnPoints: {
        default: point(950, 1080),
        lobby: point(950, 1080),
        learning: point(315, 615),
        games: point(1585, 615),
        writing: point(315, 400),
        "debate-lab": point(655, 400),
        bowl: point(995, 400),
        challenge: point(1335, 400)
      },
      walkBounds: { x: 110, y: 190, width: 1680, height: 920 },
      walkZones: [
        rect("training-center-wsc-floor", 650, 380, 600, 420),
        rect("training-strength-aisle", 115, 350, 560, 310),
        rect("training-agility-aisle", 1225, 350, 560, 310),
        rect("training-strategy-aisle", 115, 705, 560, 330),
        rect("training-focus-aisle", 1225, 705, 560, 330),
        rect("training-bottom-welcome", 560, 930, 780, 180),
        rect("training-back-wall-approach", 225, 205, 1450, 230)
      ],
      blockedZones: [
        rect("training-welcome-desk", 690, 890, 520, 120),
        rect("training-strength-equipment", 160, 340, 500, 245),
        rect("training-agility-course", 1250, 340, 470, 245),
        rect("training-strategy-table", 160, 705, 420, 170),
        rect("training-focus-lounge", 1280, 710, 430, 200),
        rect("training-supply-shelves", 630, 230, 640, 110)
      ],
      portals: [
        portal("training-exit", "School Lobby", 890, 1140, 120, 72, "school-lobby", "training", { interactionPoint: point(950, 1068) }),
        portal("training-learning", "Learning Commons", 96, 580, 150, 92, "learning-commons", "training", { interactionPoint: point(315, 615) }),
        portal("training-games", "Games Hall", 1654, 580, 150, 92, "games-hall", "training", { interactionPoint: point(1585, 615) }),
        portal("training-writing", "Writing Studio", 285, 805, 170, 105, "writing-studio", "training", { interactionPoint: point(390, 905) }),
        portal("training-debate", "Debate Lab", 315, 450, 170, 105, "debate-lab", "training", { interactionPoint: point(520, 610) }),
        portal("training-bowl", "Scholar's Bowl Studio", 1370, 450, 170, 105, "scholars-bowl-studio", "training", { interactionPoint: point(1260, 610) }),
        portal("training-challenge", "Challenge Room", 1510, 805, 170, 105, "scholars-challenge-room", "training", { interactionPoint: point(1390, 905) })
      ],
      objects: [
        object("training-director", "npc", "Training Director", 950, 860, 120, 104, "path-train", {
          pathId: "train",
          interactionPoint: point(950, 1030)
        }),
        object("training-rubric-board", "board", "Tournament Events Board", 950, 235, 540, 120, "path-train", {
          pathId: "train",
          interactionPoint: point(950, 405),
          proximity: 180
        }),
        object("training-strategy-table", "meeting", "Strategy Table", 370, 760, 330, 130, "path-train", {
          pathId: "train",
          interactionPoint: point(390, 915),
          proximity: 165
        }),
        object("training-focus-area", "meeting", "Focus Area", 1450, 780, 340, 140, "path-train", {
          pathId: "train",
          interactionPoint: point(1390, 930),
          proximity: 170
        })
      ],
      seats: [
        ...seatsFromPoints("training-strategy-seat", "Strategy Seat", [
          { x: 250, y: 805, interactionPoint: point(390, 915) },
          { x: 350, y: 805, interactionPoint: point(390, 915) },
          { x: 450, y: 805, interactionPoint: point(390, 915) },
          { x: 350, y: 905, interactionPoint: point(390, 915) }
        ], "study"),
        ...seatsFromPoints("training-focus-seat", "Focus Seat", [
          { x: 1320, y: 805, interactionPoint: point(1390, 930) },
          { x: 1410, y: 805, interactionPoint: point(1390, 930) },
          { x: 1500, y: 805, interactionPoint: point(1390, 930) },
          { x: 1590, y: 805, interactionPoint: point(1390, 930) },
          { x: 1370, y: 900, interactionPoint: point(1390, 930) },
          { x: 1510, y: 900, interactionPoint: point(1390, 930) }
        ], "lounge")
      ]
    },
    {
      id: "writing-studio",
      title: "Writing Studio",
      subtitle: "Collaborative Writing room",
      backgroundStyle: "studio",
      world: { width: 1700, height: 1080 },
      spawnPoints: { default: point(850, 940), training: point(850, 940) },
      walkBounds: { x: 110, y: 150, width: 1480, height: 820 },
      walkZones: [
        rect("writing-center-rug", 540, 360, 620, 360),
        rect("writing-bottom-entry", 510, 725, 680, 245),
        rect("writing-left-brainstorm-aisle", 110, 380, 460, 300),
        rect("writing-left-collab-aisle", 110, 650, 500, 300),
        rect("writing-right-focus-aisle", 1080, 345, 500, 300),
        rect("writing-right-quiet-aisle", 1160, 680, 430, 270),
        rect("writing-back-board-approach", 230, 180, 1240, 210)
      ],
      blockedZones: [
        rect("writing-back-shelves", 230, 175, 1240, 170),
        rect("writing-brainstorm-sofa", 115, 420, 360, 160),
        rect("writing-collab-table", 115, 705, 440, 175),
        rect("writing-focus-desks", 1135, 375, 420, 220),
        rect("writing-quiet-chairs", 1215, 715, 360, 160),
        rect("writing-front-desk", 630, 650, 440, 145)
      ],
      portals: [portal("writing-exit", "Training Center", 790, 980, 120, 70, "training-center", "writing", { interactionPoint: point(850, 910) })],
      objects: [
        modeObject("writing-prompt-board", "board", "Prompt Board", 850, 200, 430, 105, "mode-writing", "writing", "train", {
          interactionPoint: point(850, 360),
          proximity: 170
        }),
        modeObject("writing-tools-board", "board", "Writer's Tools", 1370, 295, 215, 105, "mode-writing", "writing", "train", {
          interactionPoint: point(1260, 420),
          proximity: 150
        }),
        modeObject("writing-draft-table", "meeting", "Drafting Table", 850, 725, 420, 130, "mode-writing", "writing", "train", {
          interactionPoint: point(850, 875),
          proximity: 210
        }),
        modeObject("writing-collab-table", "meeting", "Collaboration Table", 335, 785, 380, 135, "mode-writing", "writing", "train", {
          interactionPoint: point(440, 930),
          proximity: 180
        })
      ],
      seats: [
        ...seatsFromPoints("writing-collab-seat", "Collaboration Seat", [
          { x: 195, y: 815, interactionPoint: point(440, 930) },
          { x: 305, y: 815, interactionPoint: point(440, 930) },
          { x: 415, y: 815, interactionPoint: point(440, 930) },
          { x: 195, y: 935, interactionPoint: point(440, 930) },
          { x: 305, y: 935, interactionPoint: point(440, 930) },
          { x: 415, y: 935, interactionPoint: point(440, 930) }
        ], "writing"),
        ...seatsFromPoints("writing-focus-seat", "Focus Desk Seat", [
          { x: 1190, y: 450, interactionPoint: point(1260, 570) },
          { x: 1320, y: 450, interactionPoint: point(1260, 570) },
          { x: 1450, y: 450, interactionPoint: point(1260, 570) },
          { x: 1190, y: 585, interactionPoint: point(1260, 570) },
          { x: 1320, y: 585, interactionPoint: point(1260, 570) },
          { x: 1450, y: 585, interactionPoint: point(1260, 570) }
        ], "writing"),
        ...seatsFromPoints("writing-lounge-seat", "Lounge Seat", [
          { x: 180, y: 525, interactionPoint: point(430, 620), group: "brainstorm" },
          { x: 260, y: 525, interactionPoint: point(430, 620), group: "brainstorm" },
          { x: 340, y: 525, interactionPoint: point(430, 620), group: "brainstorm" },
          { x: 1305, y: 805, interactionPoint: point(1200, 900), group: "quiet" },
          { x: 1510, y: 805, interactionPoint: point(1200, 900), group: "quiet" }
        ], "lounge")
      ]
    },
    {
      id: "debate-lab",
      title: "Debate Lab",
      subtitle: "Case prep and room selector",
      backgroundStyle: "debate",
      world: { width: 1800, height: 1120 },
      spawnPoints: {
        default: point(900, 980),
        training: point(900, 980),
        debate: point(900, 980),
        "room-1": point(370, 785),
        "room-2": point(900, 785),
        "room-3": point(1430, 785)
      },
      walkBounds: { x: 110, y: 150, width: 1580, height: 850 },
      walkZones: [
        rect("debate-center-rug", 465, 430, 870, 370),
        rect("debate-front-board-approach", 260, 250, 1280, 240),
        rect("debate-bottom-judge-approach", 600, 760, 600, 240),
        rect("debate-left-research-aisle", 110, 560, 520, 400),
        rect("debate-right-practice-aisle", 1170, 560, 520, 400),
        rect("debate-left-podium-aisle", 250, 420, 430, 260),
        rect("debate-right-podium-aisle", 1120, 420, 430, 260)
      ],
      blockedZones: [
        rect("debate-back-shelf-run", 430, 275, 940, 125),
        rect("debate-left-podiums", 285, 500, 350, 150),
        rect("debate-right-podiums", 1165, 500, 350, 150),
        rect("debate-research-table", 90, 750, 420, 170),
        rect("debate-practice-table", 1290, 740, 400, 170),
        rect("debate-judge-desk", 640, 830, 520, 150)
      ],
      portals: [
        portal("debate-lab-exit", "Training Center", 840, 1020, 120, 70, "training-center", "debate-lab", { interactionPoint: point(900, 950) }),
        portal("debate-lab-room-1", "Debate Room 1", 375, 550, 130, 76, "debate-room-1", "debate-lab", { interactionPoint: point(470, 680) }),
        portal("debate-lab-room-2", "Debate Room 2", 525, 550, 130, 76, "debate-room-2", "debate-lab", { interactionPoint: point(560, 680) }),
        portal("debate-lab-room-3", "Debate Room 3", 675, 550, 130, 76, "debate-room-3", "debate-lab", { interactionPoint: point(650, 680) })
      ],
      objects: [
        modeObject("debate-motion-wheel", "board", "Ideas / Evidence / Impact", 900, 260, 420, 150, "mode-buildcase", "buildcase", "train", {
          interactionPoint: point(900, 460),
          proximity: 190
        }),
        modeObject("debate-case-board", "board", "Argument Map Board", 1590, 550, 240, 150, "mode-buildcase", "buildcase", "train", {
          interactionPoint: point(1460, 690),
          proximity: 150
        }),
        modeObject("debate-judge-desk", "control", "Moderator Desk", 900, 875, 470, 130, "mode-buildcase", "buildcase", "train", {
          interactionPoint: point(900, 760),
          proximity: 180
        })
      ],
      seats: [
        ...seatsFromPoints("debate-research-seat", "Research Seat", [
          { x: 120, y: 795, interactionPoint: point(450, 900) },
          { x: 220, y: 795, interactionPoint: point(450, 900) },
          { x: 320, y: 795, interactionPoint: point(450, 900) },
          { x: 420, y: 795, interactionPoint: point(450, 900) },
          { x: 120, y: 930, interactionPoint: point(450, 900) },
          { x: 220, y: 930, interactionPoint: point(450, 900) },
          { x: 320, y: 930, interactionPoint: point(450, 900) },
          { x: 420, y: 930, interactionPoint: point(450, 900) }
        ], "prep"),
        ...seatsFromPoints("debate-practice-seat", "Practice Seat", [
          { x: 1340, y: 795, interactionPoint: point(1460, 900) },
          { x: 1440, y: 795, interactionPoint: point(1460, 900) },
          { x: 1540, y: 795, interactionPoint: point(1460, 900) },
          { x: 1640, y: 795, interactionPoint: point(1460, 900) },
          { x: 1340, y: 930, interactionPoint: point(1460, 900) },
          { x: 1440, y: 930, interactionPoint: point(1460, 900) },
          { x: 1540, y: 930, interactionPoint: point(1460, 900) },
          { x: 1640, y: 930, interactionPoint: point(1460, 900) }
        ], "prep"),
        ...seatsFromPoints("debate-lounge-seat", "Lounge Chair", [
          { x: 1510, y: 555, interactionPoint: point(1435, 665), group: "lounge" },
          { x: 1610, y: 555, interactionPoint: point(1435, 665), group: "lounge" }
        ], "lounge")
      ]
    },
    {
      id: "scholars-bowl-studio",
      title: "Scholar's Bowl Studio",
      subtitle: "Stimulus-first media lab",
      backgroundStyle: "cinema",
      world: { width: 1800, height: 1120 },
      spawnPoints: { default: point(900, 980), training: point(900, 980) },
      walkBounds: { x: 110, y: 160, width: 1580, height: 850 },
      walkZones: [
        rect("bowl-center-aisle", 805, 470, 190, 520),
        rect("bowl-front-stage-approach", 560, 275, 680, 260),
        rect("bowl-left-row-aisle", 155, 520, 650, 420),
        rect("bowl-right-row-aisle", 995, 520, 650, 420),
        rect("bowl-bottom-entry", 650, 900, 500, 120)
      ],
      blockedZones: [
        rect("bowl-screen-block", 510, 95, 780, 160),
        rect("bowl-judge-panel-block", 620, 330, 560, 130),
        rect("bowl-left-desk-bank", 130, 560, 620, 360),
        rect("bowl-right-desk-bank", 1050, 560, 620, 360),
        rect("bowl-front-rail", 510, 455, 780, 55)
      ],
      portals: [portal("bowl-exit", "Training Center", 840, 1020, 120, 70, "training-center", "bowl", { interactionPoint: point(900, 950) })],
      objects: [
        modeObject("bowl-media-screen", "screen", "Scholar's Bowl Screen", 900, 170, 640, 140, "mode-bowl", "bowl", "train", {
          contentId: 0,
          interactionPoint: point(900, 545),
          proximity: 190
        }),
        modeObject("bowl-question-console", "control", "Moderator Panel", 900, 390, 520, 105, "mode-bowl", "bowl", "train", {
          interactionPoint: point(900, 545),
          proximity: 170
        }),
        modeObject("bowl-floor-logo", "stage", "Competition Floor", 900, 585, 330, 120, "mode-bowl", "bowl", "train", {
          interactionPoint: point(900, 735),
          proximity: 170
        })
      ],
      seats: [
        ...rowSeats("bowl-left-row-a", "Left Bowl Seat", 6, 270, 610, 80, "team", {
          interactionPoint: point(805, 650)
        }),
        ...rowSeats("bowl-left-row-b", "Left Bowl Seat", 7, 220, 730, 80, "team", {
          interactionPoint: point(805, 760)
        }),
        ...rowSeats("bowl-left-row-c", "Left Bowl Seat", 8, 170, 850, 80, "team", {
          interactionPoint: point(805, 875)
        }),
        ...rowSeats("bowl-right-row-a", "Right Bowl Seat", 6, 1090, 610, 80, "team", {
          interactionPoint: point(995, 650)
        }),
        ...rowSeats("bowl-right-row-b", "Right Bowl Seat", 7, 1040, 730, 80, "team", {
          interactionPoint: point(995, 760)
        }),
        ...rowSeats("bowl-right-row-c", "Right Bowl Seat", 8, 990, 850, 80, "team", {
          interactionPoint: point(995, 875)
        })
      ]
    },
    {
      id: "scholars-challenge-room",
      title: "Scholar's Challenge Room",
      subtitle: "Solo challenge practice",
      backgroundStyle: "quiz-lab",
      world: { width: 1750, height: 1100 },
      spawnPoints: { default: point(875, 960), training: point(875, 960) },
      walkBounds: { x: 110, y: 150, width: 1530, height: 840 },
      walkZones: [
        rect("challenge-main-green-floor", 180, 250, 1390, 700),
        rect("challenge-center-aisle", 770, 250, 210, 700),
        rect("challenge-bottom-entry", 610, 870, 530, 120),
        rect("challenge-left-wall-aisle", 120, 240, 220, 710),
        rect("challenge-right-wall-aisle", 1410, 240, 220, 710),
        rect("challenge-front-board-approach", 360, 165, 1030, 210)
      ],
      blockedZones: [
        rect("challenge-front-cabinet", 610, 170, 530, 120),
        rect("challenge-table-left-1", 330, 330, 320, 115),
        rect("challenge-table-right-1", 1090, 330, 320, 115),
        rect("challenge-table-left-2", 330, 500, 320, 115),
        rect("challenge-table-right-2", 1090, 500, 320, 115),
        rect("challenge-table-left-3", 330, 670, 320, 115),
        rect("challenge-table-right-3", 1090, 670, 320, 115),
        rect("challenge-table-left-4", 330, 840, 320, 115),
        rect("challenge-table-right-4", 1090, 840, 320, 115)
      ],
      portals: [portal("challenge-exit", "Training Center", 815, 1000, 120, 70, "training-center", "challenge", { interactionPoint: point(875, 930) })],
      objects: [
        modeObject("challenge-clock", "display", "Challenge Timer Board", 875, 165, 420, 95, "mode-quiz", "quiz", "train", {
          interactionPoint: point(875, 315),
          proximity: 175
        }),
        modeObject("challenge-strategy-board", "board", "Answer Strategy Board", 285, 240, 200, 120, "mode-quiz", "quiz", "train", {
          interactionPoint: point(410, 385),
          proximity: 145
        })
      ],
      seats: seatsFromPoints("challenge-seat", "Challenge Desk", [
        { x: 380, y: 390, interactionPoint: point(705, 430), group: "left-1" },
        { x: 500, y: 390, interactionPoint: point(705, 430), group: "left-1" },
        { x: 380, y: 495, interactionPoint: point(705, 430), group: "left-1" },
        { x: 500, y: 495, interactionPoint: point(705, 430), group: "left-1" },
        { x: 1140, y: 390, interactionPoint: point(1045, 430), group: "right-1" },
        { x: 1260, y: 390, interactionPoint: point(1045, 430), group: "right-1" },
        { x: 1140, y: 495, interactionPoint: point(1045, 430), group: "right-1" },
        { x: 1260, y: 495, interactionPoint: point(1045, 430), group: "right-1" },
        { x: 380, y: 560, interactionPoint: point(705, 600), group: "left-2" },
        { x: 500, y: 560, interactionPoint: point(705, 600), group: "left-2" },
        { x: 380, y: 665, interactionPoint: point(705, 600), group: "left-2" },
        { x: 500, y: 665, interactionPoint: point(705, 600), group: "left-2" },
        { x: 1140, y: 560, interactionPoint: point(1045, 600), group: "right-2" },
        { x: 1260, y: 560, interactionPoint: point(1045, 600), group: "right-2" },
        { x: 1140, y: 665, interactionPoint: point(1045, 600), group: "right-2" },
        { x: 1260, y: 665, interactionPoint: point(1045, 600), group: "right-2" },
        { x: 380, y: 730, interactionPoint: point(705, 770), group: "left-3" },
        { x: 500, y: 730, interactionPoint: point(705, 770), group: "left-3" },
        { x: 380, y: 835, interactionPoint: point(705, 770), group: "left-3" },
        { x: 500, y: 835, interactionPoint: point(705, 770), group: "left-3" },
        { x: 1140, y: 730, interactionPoint: point(1045, 770), group: "right-3" },
        { x: 1260, y: 730, interactionPoint: point(1045, 770), group: "right-3" },
        { x: 1140, y: 835, interactionPoint: point(1045, 770), group: "right-3" },
        { x: 1260, y: 835, interactionPoint: point(1045, 770), group: "right-3" }
      ], "desk")
    },
    {
      id: "grand-amphitheater",
      title: "Grand Amphitheater",
      subtitle: "Event shell",
      backgroundStyle: "amphitheater",
      world: { width: 2200, height: 1400 },
      spawnPoints: { default: point(1100, 1260), lobby: point(1100, 1260) },
      walkBounds: { x: 120, y: 160, width: 1960, height: 1120 },
      walkZones: [
        rect("amphi-stage-approach", 520, 330, 1160, 240),
        rect("amphi-center-aisle", 980, 520, 240, 760),
        rect("amphi-left-aisle", 245, 560, 760, 620),
        rect("amphi-right-aisle", 1195, 560, 760, 620),
        rect("amphi-bottom-entry", 760, 1160, 680, 120)
      ],
      blockedZones: [
        rect("stage-block", 570, 150, 1060, 230),
        rect("amphi-left-seating-bank", 260, 615, 680, 420),
        rect("amphi-right-seating-bank", 1260, 615, 680, 420)
      ],
      portals: [portal("amphi-exit", "School Lobby", 1040, 1290, 120, 70, "school-lobby", "amphitheater", { interactionPoint: point(1100, 1218) })],
      objects: [
        object("amphi-stage", "stage", "Scholar's Ball Stage", 1100, 230, 760, 170, "amphitheater", { interactionPoint: point(1100, 470), proximity: 230 }),
        object("amphi-screen", "screen", "Grand Event Screen", 1100, 145, 520, 90, "amphitheater", { interactionPoint: point(1100, 430) })
      ],
      seats: [
        ...rowSeats("amphi-row-a", "Seat", 8, 615, 610, 140, "event", {
          interactionPoint: point(1100, 585)
        }),
        ...rowSeats("amphi-row-b", "Seat", 9, 545, 760, 140, "event", {
          interactionPoint: point(1100, 760)
        }),
        ...rowSeats("amphi-row-c", "Seat", 10, 475, 920, 140, "event", {
          interactionPoint: point(1100, 925)
        })
      ]
    },
    makeDebateRoom(1),
    makeDebateRoom(2),
    makeDebateRoom(3)
  ];

  const ACTIVE_ROOM_IDS = new Set([
    "campus-courtyard",
    "school-lobby",
    "guiding-library-lounge",
    "debate-room-1"
  ]);
  const LOBBY_SIZE_MULTIPLIER = 0.3;
  const LOBBY_LAYOUT_SCALE = CAMPUS_WORLD_SCALE * LOBBY_SIZE_MULTIPLIER;

  function lobbyNumber(value) {
    return value / LOBBY_LAYOUT_SCALE;
  }

  function lobbyRect(id, x, y, width, height) {
    return rect(id, lobbyNumber(x), lobbyNumber(y), lobbyNumber(width), lobbyNumber(height));
  }

  function withoutNpcObjects(objects) {
    return (objects || []).filter((item) => item.kind !== "npc");
  }

  const LIBRARY_ALPACARD_FRAME_FALLBACK_COUNT = 85;

  function splitFrameRow(count) {
    return {
      lower: Math.ceil(count / 2),
      upper: Math.floor(count / 2)
    };
  }

  function spacedValues(start, end, count, stagger = 0) {
    if (count <= 0) {
      return [];
    }
    if (count === 1) {
      return [(start + end) / 2];
    }

    const gap = (end - start) / (count - 1);
    return Array.from({ length: count }, (_item, index) => {
      const value = start + gap * index + stagger;
      return Math.min(end, Math.max(start, value));
    });
  }

  function splitByRangeLength(count, ranges) {
    const totalLength = ranges.reduce((sum, range) => sum + Math.max(0, range.end - range.start), 0);
    const roughCounts = ranges.map((range) => {
      const exact = count * Math.max(0, range.end - range.start) / totalLength;
      return { count: Math.floor(exact), remainder: exact % 1 };
    });
    let assigned = roughCounts.reduce((sum, entry) => sum + entry.count, 0);

    while (assigned < count) {
      const next = roughCounts
        .map((entry, index) => ({ ...entry, index }))
        .sort((left, right) => right.remainder - left.remainder)[0];
      roughCounts[next?.index || 0].count += 1;
      roughCounts[next?.index || 0].remainder = 0;
      assigned += 1;
    }

    return roughCounts.map((entry) => entry.count);
  }

  function distributeAcrossRanges(count, ranges, stagger = 0) {
    const counts = splitByRangeLength(count, ranges);
    return ranges.flatMap((range, index) => spacedValues(range.start, range.end, counts[index], stagger));
  }

  const DEBATE_ROOM_CARACOLE_CHAIR_RECTS = [
    ["001", 270, -496, 95, 96, 2.389],
    ["003", 217, -401, 86, 85, 2.389],
    ["005", 386, -525, 70, 71, 2.389],
    ["010", 781, -523, 71, 72, 2.368],
    ["011", 861, -478, 97, 96, 2.389],
    ["014", 913, -386, 85, 84, 2.389]
  ];

  const DEBATE_ROOM_GROUP_RECTS = [
    ["001", 1026, 261, 42, 82],
    ["002", 870, 302, 42, 82],
    ["003", 1024, 20, 42, 82],
    ["004", 869, 62, 42, 82],
    ["005", 1025, 391, 42, 82],
    ["006", 870, 433, 42, 82],
    ["007", 1024, 643, 42, 82],
    ["008", 869, 684, 42, 82],
    ["009", 1025, 516, 42, 82],
    ["010", 870, 557, 42, 82],
    ["011", 1023, 139, 42, 82],
    ["012", 868, 180, 42, 82],
    ["013", 774, 694, 22, 79],
    ["014", 613, 694, 22, 79],
    ["015", 590, 694, 22, 79],
    ["016", 430, 694, 22, 79],
    ["017", 774, 558, 22, 79],
    ["018", 613, 558, 22, 79],
    ["019", 590, 558, 22, 79],
    ["020", 430, 558, 22, 79],
    ["021", 774, 436, 22, 79],
    ["022", 613, 436, 22, 79],
    ["023", 590, 436, 22, 79],
    ["024", 430, 436, 22, 79],
    ["025", 774, 308, 22, 79],
    ["026", 613, 308, 22, 79],
    ["027", 590, 308, 22, 79],
    ["028", 429, 308, 22, 79],
    ["029", 774, 184, 22, 79],
    ["030", 613, 184, 22, 79],
    ["031", 591, 184, 22, 79],
    ["032", 430, 184, 22, 79],
    ["033", 774, 64, 22, 79],
    ["034", 613, 64, 22, 79],
    ["035", 591, 64, 22, 79],
    ["036", 430, 64, 22, 79],
    ["037", 315, 58, 39, 82],
    ["038", 158, 24, 39, 82],
    ["039", 315, 180, 39, 82],
    ["040", 158, 145, 39, 82],
    ["041", 315, 307, 39, 82],
    ["042", 158, 272, 39, 82],
    ["043", 315, 435, 39, 82],
    ["044", 158, 400, 39, 82],
    ["045", 315, 567, 39, 82],
    ["046", 158, 533, 39, 82],
    ["047", 315, 696, 39, 82],
    ["048", 158, 661, 39, 82]
  ];

  const DEBATE_ROOM_GROUP_12_RECTS = [
    ["001", 959, 267, 81, 73, 1.224],
    ["002", 974, 323, 72, 37, 1.544],
    ["003", 892, 284, 81, 73, 1.224],
    ["004", 907, 341, 72, 37, 1.544],
    ["005", 958, 26, 81, 73, 1.224],
    ["006", 973, 83, 72, 37, 1.544],
    ["007", 891, 44, 81, 73, 1.224],
    ["008", 906, 101, 72, 37, 1.544],
    ["009", 958, 397, 81, 73, 1.224],
    ["010", 973, 454, 72, 37, 1.544],
    ["011", 891, 415, 81, 73, 1.224],
    ["012", 907, 472, 72, 37, 1.544],
    ["013", 958, 648, 81, 73, 1.224],
    ["014", 973, 705, 72, 37, 1.544],
    ["015", 891, 666, 81, 73, 1.224],
    ["016", 906, 723, 72, 37, 1.544],
    ["017", 958, 522, 81, 73, 1.224],
    ["018", 973, 578, 72, 37, 1.544],
    ["019", 891, 539, 81, 73, 1.224],
    ["020", 907, 596, 72, 37, 1.544],
    ["021", 957, 144, 81, 73, 1.224],
    ["022", 972, 201, 72, 37, 1.544],
    ["023", 890, 162, 81, 73, 1.224],
    ["024", 905, 219, 72, 37, 1.544],
    ["025", 704, 694, 69, 57, 1.224],
    ["026", 704, 753, 69, 20, 1.544],
    ["027", 635, 694, 69, 57, 1.224],
    ["028", 635, 753, 69, 20, 1.544],
    ["029", 521, 694, 69, 57, 1.224],
    ["030", 521, 753, 69, 20, 1.544],
    ["031", 452, 694, 69, 57, 1.224],
    ["032", 452, 753, 69, 20, 1.544],
    ["033", 704, 558, 69, 57, 1.224],
    ["034", 704, 617, 69, 20, 1.544],
    ["035", 635, 558, 69, 57, 1.224],
    ["036", 635, 617, 69, 20, 1.544],
    ["037", 521, 558, 69, 57, 1.224],
    ["038", 521, 617, 69, 20, 1.544],
    ["039", 452, 558, 69, 57, 1.224],
    ["040", 452, 617, 69, 20, 1.544],
    ["041", 704, 436, 69, 57, 1.224],
    ["042", 704, 495, 69, 20, 1.544],
    ["043", 635, 436, 69, 57, 1.224],
    ["044", 635, 495, 69, 20, 1.544],
    ["045", 521, 436, 69, 57, 1.224],
    ["046", 521, 495, 69, 20, 1.544],
    ["047", 452, 436, 69, 57, 1.224],
    ["048", 452, 495, 69, 20, 1.544],
    ["049", 704, 308, 69, 57, 1.224],
    ["050", 704, 367, 69, 20, 1.544],
    ["051", 635, 308, 69, 57, 1.224],
    ["052", 635, 367, 69, 20, 1.544],
    ["053", 520, 308, 69, 57, 1.224],
    ["054", 520, 367, 69, 20, 1.544],
    ["055", 451, 308, 69, 57, 1.224],
    ["056", 451, 367, 69, 20, 1.544],
    ["057", 704, 184, 69, 57, 1.224],
    ["058", 704, 243, 69, 20, 1.544],
    ["059", 635, 184, 69, 57, 1.224],
    ["060", 635, 243, 69, 20, 1.544],
    ["061", 522, 184, 69, 57, 1.224],
    ["062", 522, 242, 69, 20, 1.544],
    ["063", 452, 184, 69, 57, 1.224],
    ["064", 452, 242, 69, 20, 1.544],
    ["065", 704, 64, 69, 57, 1.224],
    ["066", 704, 122, 69, 20, 1.544],
    ["067", 635, 64, 69, 57, 1.224],
    ["068", 635, 122, 69, 20, 1.544],
    ["069", 522, 64, 69, 57, 1.224],
    ["070", 522, 122, 69, 20, 1.544],
    ["071", 452, 64, 69, 57, 1.224],
    ["072", 452, 122, 69, 20, 1.544],
    ["073", 252, 43, 80, 70, 1.224],
    ["074", 247, 101, 72, 35, 1.544],
    ["075", 184, 28, 80, 70, 1.224],
    ["076", 179, 86, 72, 35, 1.544],
    ["077", 252, 165, 80, 70, 1.224],
    ["078", 247, 223, 72, 35, 1.544],
    ["079", 184, 150, 80, 70, 1.224],
    ["080", 179, 208, 72, 35, 1.544],
    ["081", 252, 292, 80, 70, 1.224],
    ["082", 247, 349, 72, 35, 1.544],
    ["083", 184, 277, 80, 70, 1.224],
    ["084", 179, 334, 72, 35, 1.544],
    ["085", 252, 420, 80, 70, 1.224],
    ["086", 247, 477, 72, 35, 1.544],
    ["087", 184, 405, 80, 70, 1.224],
    ["088", 179, 462, 72, 35, 1.544],
    ["089", 252, 552, 80, 70, 1.224],
    ["090", 247, 610, 72, 35, 1.544],
    ["091", 184, 537, 80, 70, 1.224],
    ["092", 179, 595, 72, 35, 1.544],
    ["093", 252, 681, 80, 70, 1.224],
    ["094", 247, 738, 72, 35, 1.544],
    ["095", 184, 666, 80, 70, 1.224],
    ["096", 179, 723, 72, 35, 1.544]
  ];

  const DEBATE_ROOM_GROUP_12_ODD_RECTS = DEBATE_ROOM_GROUP_12_RECTS.filter(([id]) => Number(id) % 2 === 1);
  const DEBATE_ROOM_GROUP_12_EVEN_RECTS = DEBATE_ROOM_GROUP_12_RECTS.filter(([id]) => Number(id) % 2 === 0);

  const DEBATE_ROOM_TUBED_LECTERN_PODIUM_RECTS = [
    ["podium", 611, 244, 58, 48]
  ];

  const DEBATE_ROOM_FURNITURE_COLLISION_PADDING = {
    left: 18,
    right: 18,
    backY: 18,
    frontY: 12
  };

  const DEBATE_ROOM_PLATFORM_WALL_ZONES = [
    runtimeLineRect("debate-platform-wall-back", 193, -626, 1048, -626, 56),
    runtimeLineRect("debate-platform-wall-left", 193, -626, 193, -92, 56),
    runtimeLineRect("debate-platform-wall-right", 1048, -626, 1048, -92, 56),
    runtimeLineRect("debate-platform-wall-front-left", 193, -92, 420, -92, 56),
    runtimeLineRect("debate-platform-wall-front-right", 852, -92, 1048, -92, 56),
    runtimeLineRect("debate-platform-wall-between-steps", 635, -92, 635, -14, 44)
  ];

  const DEBATE_ROOM_BOUNDARY_WALL_ZONES = [
    runtimeLineRect("debate-room-boundary-wall-back", 146, -638, 1079, -638, 56),
    runtimeLineRect("debate-room-boundary-wall-right", 1079, -638, 1079, 1012, 56),
    runtimeLineRect("debate-room-boundary-wall-front", 1079, 1012, 146, 1012, 56),
    runtimeLineRect("debate-room-boundary-wall-left", 146, 1012, 146, -638, 56)
  ];

  function debateRoomBlockedRectZones(prefix, rects, options = {}) {
    return rects.map(([id, x, y, width, height]) => ({
      ...runtimeRect(`${prefix}-${id}`, x, y, width, height),
      ...(options.collisionPadding ? { collisionPadding: options.collisionPadding } : {})
    }));
  }

  function debateRoomSittingRectZones(prefix, rects) {
    return rects.map(([id, x, y, width, height, surfaceZ]) => ({
      ...runtimeRect(`${prefix}-${id}`, x, y, width, height),
      surfaceZ
    }));
  }

  function makeLibraryAlpacardFrameObject(contentId, wall, x, y) {
    const card = alpacards[contentId] || {};
    const id = `library-alpacard-frame-${contentId + 1}`;
    const isNorth = wall === "north";
    const isEast = wall === "east";
    const hitWidth = isNorth ? 104 : 86;
    const hitHeight = isNorth ? 86 : 104;
    const objectX = isNorth ? x - hitWidth / 2 : (isEast ? 3447 - hitWidth : 10);
    const objectY = isNorth ? 10 : y - hitHeight / 2;
    const interactionPoint = isNorth
      ? runtimePoint(x, 270)
      : runtimePoint(isEast ? 3215 : 250, y);

    return object(
      id,
      "alpacard",
      card.title || `Alpacard Frame ${contentId + 1}`,
      runtimeNumber(objectX),
      runtimeNumber(objectY),
      runtimeNumber(hitWidth),
      runtimeNumber(hitHeight),
      "flashcards",
      { contentId, interactionPoint, proximity: runtimeNumber(245) }
    );
  }

  // Library wall Alpacard objects mirror the 3D frame placement in environment-assets.ts.
  // Edit future frame coordinates in both places until this shared room data migrates to TS.
  function makeLibraryAlpacardFrameObjects() {
    const totalCount = alpacards.length || LIBRARY_ALPACARD_FRAME_FALLBACK_COUNT;
    const baseWallCount = Math.floor(totalCount / 3);
    const remainder = totalCount % 3;
    const northCount = baseWallCount + (remainder > 0 ? 1 : 0);
    const westCount = baseWallCount + (remainder > 1 ? 1 : 0);
    const eastCount = Math.max(0, totalCount - northCount - westCount);
    const northRows = splitFrameRow(northCount);
    const westRows = splitFrameRow(westCount);
    const eastRows = splitFrameRow(eastCount);
    const northRanges = [{ start: 165, end: 1760 }, { start: 2310, end: 3300 }];
    const sideRange = { start: 270, end: 1970 };
    let contentId = 0;
    const make = (wall, x, y) => makeLibraryAlpacardFrameObject(contentId++, wall, x, y);

    return [
      ...distributeAcrossRanges(northRows.lower, northRanges).map((x) => make("north", x, 18)),
      ...distributeAcrossRanges(northRows.upper, northRanges, 42).map((x) => make("north", x, 18)),
      ...spacedValues(sideRange.start, sideRange.end, westRows.lower).map((y) => make("west", 18, y)),
      ...spacedValues(sideRange.start, sideRange.end, westRows.upper, 64).map((y) => make("west", 18, y)),
      ...spacedValues(sideRange.start, sideRange.end, eastRows.lower).map((y) => make("east", 3447, y)),
      ...spacedValues(sideRange.start, sideRange.end, eastRows.upper, 64).map((y) => make("east", 3447, y))
    ].slice(0, totalCount);
  }

  function limitRoom(room) {
    if (room.id === "campus-courtyard") {
      return {
        ...room,
        title: "Campus Courtyard",
        subtitle: "Arrival gate",
        world: { ...room.world, height: runtimeNumber(2060) },
        spawnPoints: {
          default: runtimePoint(1980, 1980),
          gate: runtimePoint(1980, 1980),
          return: runtimePoint(1980, 1980),
          school: runtimePoint(1980, 885),
          parking: runtimePoint(1020, 1980),
          track: runtimePoint(2920, 1680),
          playground: runtimePoint(940, 1535),
          amphitheatre: runtimePoint(900, 1070),
          "school-2": runtimePoint(1533, 1105),
          "school-3": runtimePoint(2520, 1105)
        },
        walkBounds: runtimeRect("courtyard-playable-bounds", 830, 614, 2250, 1446),
        walkZones: [
          runtimeRect("courtyard-playable-rectangle", 830, 614, 2250, 1446)
        ],
        blockedZones: [
          runtimeRect("courtyard-wall-west", 806, 614, 24, 1446),
          runtimeRect("courtyard-wall-east", 3080, 614, 24, 1446),
          runtimeRect("courtyard-wall-north", 830, 590, 2250, 24),
          runtimeRect("courtyard-wall-south", 830, 2060, 2250, 24),
          runtimeLineRect("courtyard-inner-wall-horizontal", 1740, 1417, 2280, 1417),
          runtimeLineRect("courtyard-inner-wall-right", 2450, 1260, 2450, 730),
          runtimeLineRect("courtyard-inner-wall-left", 1580, 720, 1565, 1236),
          runtimeRing("courtyard-round-tower-wall", 1542, 1458, 205, 48),
          runtimeRing("courtyard-east-round-tower-wall", 2478, 1456, 208, 48),
          runtimeSmoothPath("courtyard-north-east-curved-wall", [[2930, 623], [2976, 710], [3080, 752]]),
          runtimeSmoothPath("courtyard-north-oval-wall", [[2162, 626], [2461, 695], [2564, 672]]),
          runtimeSmoothPath("courtyard-west-egg-wall", [[848, 748], [945, 740], [1036, 695], [1046, 633]]),
          runtimeSmoothPath("courtyard-center-egg-wall", [[1381, 635], [1458, 673], [1523, 700], [1576, 709]])
        ],
        portals: [
          portal(
            "school-entrance",
            "School Entrance",
            runtimeNumber(1912),
            runtimeNumber(1350),
            runtimeNumber(53),
            runtimeNumber(80),
            "school-lobby",
            "courtyard",
            {
              interactionPoint: runtimePoint(1939, 1470),
              proximity: runtimeNumber(145)
            }
          ),
          portal(
            "school-entrance-2",
            "School Entrance 2",
            runtimeNumber(1497),
            runtimeNumber(953),
            runtimeNumber(72),
            runtimeNumber(49),
            "school-lobby",
            "courtyard-2",
            {
              interactionPoint: runtimePoint(1533, 978),
              proximity: runtimeNumber(135)
            }
          ),
          portal(
            "school-entrance-3",
            "School Entrance 3",
            runtimeNumber(2494),
            runtimeNumber(956),
            runtimeNumber(53),
            runtimeNumber(51),
            "school-lobby",
            "courtyard-3",
            {
              interactionPoint: runtimePoint(2520, 982),
              proximity: runtimeNumber(135)
            }
          )
        ],
        objects: [],
        seats: []
      };
    }
    if (room.id === "school-lobby") {
      return {
        ...room,
        layoutScale: CAMPUS_WORLD_SCALE * LOBBY_SIZE_MULTIPLIER,
        spawnPoints: {
          default: point(950, 1040),
          lobby: point(950, 1040),
          courtyard: point(950, 1040),
          "courtyard-2": point(210, 625),
          "courtyard-3": point(1690, 625),
          library: point(635, 340),
          debate: point(1265, 340)
        },
        blockedZones: [
          lobbyRect("lobby-fountain-block", 86, 74, 98, 132),
          lobbyRect("lobby-al-aqsa-stand-block", 416, 88, 92, 136),
          lobbyRect("lobby-ottoman-table-block", 642, 418, 104, 96)
        ],
        sittingZones: [
          lobbyRect("lobby-majlis-sitting-area", 156, 430, 248, 145),
          lobbyRect("lobby-pillow-sitting-area", 704, 74, 178, 152),
          lobbyRect("lobby-table-sitting-area", 586, 330, 260, 232)
        ],
        portals: [
          portal("lobby-exit", "Courtyard", 890, 1213, 120, 74, "campus-courtyard", "school", { interactionPoint: point(950, 1250) }),
          portal("lobby-courtyard-2", "Courtyard Door 2", 76, 560, 150, 92, "campus-courtyard", "school-2", { interactionPoint: point(151, 625) }),
          portal("lobby-courtyard-3", "Courtyard Door 3", 1674, 560, 150, 92, "campus-courtyard", "school-3", { interactionPoint: point(1749, 625) }),
          portal("lobby-library", "Library", 550, 170, 170, 110, "guiding-library-lounge", "lobby", { interactionPoint: point(635, 340) }),
          portal("lobby-debate", "Debate Room", 1180, 170, 170, 110, "debate-room-1", "lobby", { interactionPoint: point(1265, 340) })
        ],
        objects: [],
        seats: []
      };
    }
    if (room.id === "raw-content-classroom") {
      return {
        ...room,
        spawnPoints: {
          default: point(825, 745),
          lobby: point(825, 745)
        },
        walkBounds: { x: 120, y: 205, width: 1410, height: 790 },
        blockedZones: [],
        portals: [
          portal("classroom-exit", "School Lobby", 765, 1000, 120, 70, "school-lobby", "classroom", {
            interactionPoint: point(825, 930)
          })
        ]
      };
    }
    if (room.id === "guiding-library-lounge") {
      return {
        ...room,
        title: "Library",
        subtitle: "Reading lounge",
        spawnPoints: {
          default: point(1050, 1190),
          lobby: point(1050, 1190),
          debate: runtimePoint(3180, 1760)
        },
        walkBounds: runtimeRect("library-room-walk-bounds", 15, 15, 3430, 2210),
        blockedZones: [
          ...(room.blockedZones || []).filter((zone) => ![
            "library-help-desk-block",
            "library-left-sofa-block",
            "library-right-sofa-block",
            "library-bookcase-row-1",
            "library-bookcase-row-2",
            "library-bookcase-row-3",
            "library-left-reading-table",
            "library-center-reading-table",
            "library-right-reading-table"
          ].includes(zone.id)),
          runtimeRect("library-reception-desk-block", 1965, 18, 180, 135),
          runtimeRect("library-bookcase-row-1", 580, 674, 2208, 40),
          runtimeRect("library-bookcase-row-2", 580, 1037, 2208, 40),
          runtimeRect("library-bookcase-row-3", 580, 1400, 2208, 40),
          runtimeRect("library-left-long-table-block", 745, 1568, 390, 297),
          runtimeRect("library-center-long-table-block", 1389, 1568, 390, 297),
          runtimeRect("library-right-long-table-block", 2033, 1568, 390, 297)
        ],
        portals: [
          portal(
            "library-exit",
            "School Lobby",
            runtimeNumber(1634),
            runtimeNumber(2167),
            runtimeNumber(198),
            runtimeNumber(116),
            "school-lobby",
            "library",
            { interactionPoint: runtimePoint(1733, 2048) }
          ),
          portal(
            "library-to-debate",
            "Debate Room",
            runtimeNumber(3370),
            runtimeNumber(1650),
            runtimeNumber(150),
            runtimeNumber(220),
            "debate-room-1",
            "library",
            { interactionPoint: runtimePoint(3180, 1760), proximity: runtimeNumber(220) }
          )
        ],
        objects: [
          ...withoutNpcObjects(room.objects).filter((item) => ![
            "library-center-table",
            "library-resource-cart"
          ].includes(item.id)),
          ...makeLibraryAlpacardFrameObjects(),
          object("library-information-alpaca", "npc", "Library Information Alpaca", runtimeNumber(1992), runtimeNumber(1), runtimeNumber(118), runtimeNumber(102), "library", {
            interactionPoint: runtimePoint(2051, 190),
            proximity: runtimeNumber(180),
            avatar: { woolColor: "alpaca-11", outfitId: "suit" }
          })
        ],
        seats: seatsFromPoints("library-long-bench", "Library Bench", [
          { x: 500, y: 986, interactionPoint: point(570, 1040), group: "left-long-table" },
          { x: 500, y: 1094, interactionPoint: point(570, 1040), group: "left-long-table" },
          { x: 640, y: 986, interactionPoint: point(570, 1040), group: "left-long-table" },
          { x: 640, y: 1094, interactionPoint: point(570, 1040), group: "left-long-table" },
          { x: 890, y: 986, interactionPoint: point(960, 1040), group: "center-long-table" },
          { x: 890, y: 1094, interactionPoint: point(960, 1040), group: "center-long-table" },
          { x: 1030, y: 986, interactionPoint: point(960, 1040), group: "center-long-table" },
          { x: 1030, y: 1094, interactionPoint: point(960, 1040), group: "center-long-table" },
          { x: 1280, y: 986, interactionPoint: point(1350, 1040), group: "right-long-table" },
          { x: 1280, y: 1094, interactionPoint: point(1350, 1040), group: "right-long-table" },
          { x: 1420, y: 986, interactionPoint: point(1350, 1040), group: "right-long-table" },
          { x: 1420, y: 1094, interactionPoint: point(1350, 1040), group: "right-long-table" }
        ], "bench")
      };
    }
    if (room.id === "flashcard-museum") {
      return {
        ...room,
        title: "Museum",
        subtitle: "Alpacard exhibits",
        spawnPoints: {
          default: point(900, 960),
          lobby: point(900, 960)
        },
        portals: [
          portal("museum-exit", "School Lobby", 840, 1018, 120, 70, "school-lobby", "museum", { interactionPoint: point(900, 950) })
        ],
        objects: withoutNpcObjects(room.objects)
      };
    }
    if (room.id === "debate-room-1") {
      return {
        ...room,
        title: "Debate Room",
        subtitle: "Congress chamber",
        spawnPoints: {
          default: runtimePoint(820, 930),
          lobby: runtimePoint(820, 930),
          library: runtimePoint(820, 320)
        },
        walkBounds: runtimeRect("congreso-walk-extended", 120, -1000, 1260, 2000),
        walkZones: [
          runtimeRect("congreso-walk-extended", 120, -1000, 1260, 2000)
        ],
        blockedZones: [
          ...DEBATE_ROOM_BOUNDARY_WALL_ZONES,
          ...DEBATE_ROOM_PLATFORM_WALL_ZONES,
          ...debateRoomBlockedRectZones("debate-group-block", DEBATE_ROOM_GROUP_RECTS, { collisionPadding: DEBATE_ROOM_FURNITURE_COLLISION_PADDING }),
          ...debateRoomBlockedRectZones("debate-group-12-even-block", DEBATE_ROOM_GROUP_12_EVEN_RECTS, { collisionPadding: DEBATE_ROOM_FURNITURE_COLLISION_PADDING }),
          ...debateRoomBlockedRectZones("debate-group-12-odd-seat-block", DEBATE_ROOM_GROUP_12_ODD_RECTS, { collisionPadding: DEBATE_ROOM_FURNITURE_COLLISION_PADDING }),
          ...debateRoomBlockedRectZones("debate-caracole-chair-block", DEBATE_ROOM_CARACOLE_CHAIR_RECTS, { collisionPadding: DEBATE_ROOM_FURNITURE_COLLISION_PADDING }),
          ...debateRoomBlockedRectZones("debate-tubed-lectern", DEBATE_ROOM_TUBED_LECTERN_PODIUM_RECTS)
        ],
        sittingZones: [
          ...debateRoomSittingRectZones("debate-group-12-odd-seat", DEBATE_ROOM_GROUP_12_ODD_RECTS),
          ...debateRoomSittingRectZones("debate-caracole-chair-seat", DEBATE_ROOM_CARACOLE_CHAIR_RECTS)
        ],
        portals: [
          portal(
            "debate-room-exit",
            "School Lobby",
            runtimeNumber(721),
            runtimeNumber(1000),
            runtimeNumber(198),
            runtimeNumber(116),
            "school-lobby",
            "debate",
            { interactionPoint: runtimePoint(820, 930), proximity: runtimeNumber(170) }
          ),
          portal(
            "debate-room-library",
            "Library",
            runtimeNumber(721),
            runtimeNumber(262),
            runtimeNumber(198),
            runtimeNumber(116),
            "guiding-library-lounge",
            "debate",
            { interactionPoint: runtimePoint(820, 390), proximity: runtimeNumber(170) }
          )
        ],
        objects: [],
        seats: []
      };
    }
    if (room.id === "games-hall") {
      return {
        ...room,
        spawnPoints: {
          default: point(1000, 1130),
          lobby: point(1000, 1130)
        },
        portals: [
          portal("games-exit", "School Lobby", 940, 1190, 120, 72, "school-lobby", "games", { interactionPoint: point(1000, 1118) })
        ],
        objects: withoutNpcObjects(room.objects)
      };
    }
    return room;
  }

  const rooms = roomBlueprints
    .filter((room) => ACTIVE_ROOM_IDS.has(room.id))
    .map((room) => {
      const limitedRoom = limitRoom(room);
      return scaleRoom(limitedRoom, limitedRoom.layoutScale || room.layoutScale || CAMPUS_WORLD_SCALE);
    });
  const roomById = Object.fromEntries(rooms.map((room) => [room.id, room]));

  function getRoom(roomId) {
    return roomById[roomId] || roomById["school-lobby"];
  }

  function getSpawnPoint(roomId, spawnId = "default") {
    const room = getRoom(roomId);
    return room.spawnPoints?.[spawnId] || room.spawnPoints?.default || point(room.world.width / 2, room.world.height / 2);
  }

  function getRoomObject(roomId, objectId) {
    const room = getRoom(roomId);
    return [...(room.objects || []), ...(room.portals || []), ...(room.seats || [])].find((entry) => entry.id === objectId) || null;
  }

  window.WSC_ALPACA_CAMPUS_ROOMS = Object.freeze({
    rooms,
    roomById,
    getRoom,
    getSpawnPoint,
    getRoomObject
  });
}());
