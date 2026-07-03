(function () {
  const ASSET_ROOT = "./assets/campus-2d";

  function point(x, y) {
    return { x, y };
  }

  function rect(id, x, y, width, height) {
    return { id, x, y, width, height };
  }

  function portal(id, targetRoomId, targetSpawnId, x, y, width, height) {
    return { id, targetRoomId, targetSpawnId, zone: rect(id, x, y, width, height) };
  }

  function hotspot(id, kind, label, x, y, width, height) {
    return { id, kind, label, zone: rect(id, x, y, width, height) };
  }

  function gameZone(id, mode, label, x, y, width, height) {
    return { id, mode, label, zone: rect(id, x, y, width, height) };
  }

  function seat(id, x, y, width, height) {
    return { id, zone: rect(id, x, y, width, height), x: x + (width / 2), y: y + (height / 2) };
  }

  function rects(prefix, boxes) {
    return boxes.map((box, index) => rect(`${prefix}-${index + 1}`, box[0], box[1], box[2], box[3]));
  }

  function seatRects(prefix, boxes) {
    return boxes.map((box, index) => seat(`${prefix}-${index + 1}`, box[0], box[1], box[2], box[3]));
  }

  function alpacaColor(id, label, hex, swatch = hex) {
    return { id, label, hex, swatch, asset: `${ASSET_ROOT}/alpaca-sprite-${id}.png` };
  }

  const colors = [
    alpacaColor("cream", "Cream", "#f1d8ad"),
    alpacaColor("white", "White", "#f8f4ea"),
    alpacaColor("pearl", "Pearl", "#efe7d8"),
    alpacaColor("silver", "Silver", "#c8c5bd"),
    alpacaColor("gray", "Gray", "#888784"),
    alpacaColor("charcoal", "Charcoal", "#424140"),
    alpacaColor("black", "Black", "#242220"),
    alpacaColor("cinnamon", "Cinnamon", "#c87535"),
    alpacaColor("caramel", "Caramel", "#d6954f"),
    alpacaColor("cocoa", "Cocoa", "#8a5a38"),
    alpacaColor("gold", "Gold", "#f0bd42"),
    alpacaColor("lemon", "Lemon", "#f7e35e"),
    alpacaColor("orange", "Orange", "#f18530"),
    alpacaColor("coral", "Coral", "#ef6f61"),
    alpacaColor("red", "Red", "#d83b36"),
    alpacaColor("rose", "Rose", "#ec8499"),
    alpacaColor("hot-pink", "Hot pink", "#ff4fb3"),
    alpacaColor("magenta", "Magenta", "#c546d8"),
    alpacaColor("lavender", "Lavender", "#a78be8"),
    alpacaColor("violet", "Violet", "#7b61ff"),
    alpacaColor("plum", "Plum", "#7b4b91"),
    alpacaColor("mint", "Mint", "#6fc8aa"),
    alpacaColor("lime", "Lime", "#a3df48"),
    alpacaColor("emerald", "Emerald", "#3faf6f"),
    alpacaColor("teal", "Teal", "#2ba6a0"),
    alpacaColor("cyan", "Cyan", "#3ac7df"),
    alpacaColor("sky", "Sky", "#68a9e3"),
    alpacaColor("royal", "Royal", "#466bd9"),
    alpacaColor("navy", "Navy", "#243f87"),
    alpacaColor("rainbow", "Rainbow", "#42c96f", "linear-gradient(135deg, #ff4444, #ffb13b, #f5ef48, #42c96f, #34a2ff, #8b5cff, #ff4fb3)"),
    alpacaColor("pastel-rainbow", "Pastel rainbow", "#b7e9ff", "linear-gradient(135deg, #ffd6e8, #fff3a8, #c8ffd6, #b7e9ff, #d9c5ff)"),
    alpacaColor("neon-rainbow", "Neon rainbow", "#28f3a5", "conic-gradient(from 20deg, #00fff0, #44ff00, #fff600, #ff8c00, #ff00f5, #6236ff, #00fff0)"),
    alpacaColor("stars", "Stars", "#5f7be7", "radial-gradient(circle at 30% 28%, #fff7ba 0 9%, transparent 10%), radial-gradient(circle at 67% 64%, #fff7ba 0 7%, transparent 8%), #5f7be7"),
    alpacaColor("midnight-stars", "Midnight stars", "#171c45", "radial-gradient(circle at 32% 30%, #fff8d6 0 9%, transparent 10%), radial-gradient(circle at 68% 62%, #fff8d6 0 7%, transparent 8%), #171c45"),
    alpacaColor("galaxy", "Galaxy", "#20104d", "radial-gradient(circle at 30% 28%, #fff7d8 0 6%, transparent 7%), linear-gradient(135deg, #20104d, #7434c7, #0b8bd6)"),
    alpacaColor("confetti", "Confetti", "#ff4fb3", "linear-gradient(135deg, #ff4fb3 0 18%, #f7e35e 18% 36%, #42c96f 36% 54%, #3ac7df 54% 72%, #7b61ff 72% 100%)"),
    alpacaColor("sparkle-gold", "Sparkle gold", "#e5ac2f", "radial-gradient(circle at 31% 28%, #fff8d6 0 10%, transparent 11%), radial-gradient(circle at 67% 67%, #fff8d6 0 7%, transparent 8%), #e5ac2f"),
    alpacaColor("candy-stripes", "Candy stripes", "#ff78b8", "repeating-linear-gradient(135deg, #ff78b8 0 7px, #fff5ee 7px 14px)"),
    alpacaColor("fire", "Fire", "#ff6b22", "linear-gradient(180deg, #fff064, #ff8a24, #c3222a)"),
    alpacaColor("ice", "Ice", "#7dd8ef", "linear-gradient(135deg, #f3fdff, #7dd8ef, #c7f5ff)")
  ];

  const rooms = [
    {
      id: "lobby",
      title: "Lobby",
      asset: `${ASSET_ROOT}/lobby.png`,
      width: 1183,
      height: 1329,
      spawnPoints: {
        default: point(592, 665),
        courtyard: point(592, 1040),
        library: point(290, 665),
        debate: point(895, 665)
      },
      walkZones: [
        rect("lobby-main", 270, 310, 645, 790),
        rect("lobby-left-door-path", 155, 475, 235, 290),
        rect("lobby-right-door-path", 790, 475, 235, 290),
        rect("lobby-bottom-door-path", 450, 940, 285, 315),
        rect("lobby-top-approach", 355, 260, 470, 185)
      ],
      blockedZones: [
        rect("lobby-top-left-planter", 26, 255, 136, 55),
        rect("lobby-top-left-potted-plant", 317, 262, 68, 48),
        rect("lobby-reception", 383, 260, 389, 150),
        rect("lobby-top-right-potted-plant", 768, 256, 65, 55),
        rect("lobby-top-right-planter", 1099, 258, 46, 51),
        rect("lobby-left-door-block", 27, 590, 216, 118),
        rect("lobby-right-door-block", 923, 594, 220, 114),
        rect("lobby-bottom-left-shop", 27, 920, 371, 287),
        rect("lobby-bottom-gate-roof", 438, 1042, 265, 164),
        rect("lobby-bottom-right-shop", 755, 924, 386, 284)
      ],
      portals: [
        portal("lobby-to-courtyard", "courtyard", "lobby", 465, 985, 250, 70),
        portal("lobby-to-library", "library", "lobby", 244, 520, 80, 170),
        portal("lobby-to-debate", "debate-lab", "lobby", 860, 520, 82, 170)
      ],
      hotspots: [
        hotspot("lobby-games", "games", "Games", 465, 480, 250, 195)
      ],
      gameZones: [
        gameZone("lobby-games", "game", "Games", 465, 480, 250, 195)
      ],
      behindZones: [
        rect("lobby-left-door-awning", 32, 446, 209, 146),
        rect("lobby-right-door-awning", 968, 448, 175, 146),
        rect("lobby-right-door-edge", 927, 513, 40, 81),
        rect("lobby-bottom-left-plant-bed", 38, 864, 117, 53),
        rect("lobby-bottom-left-lamp", 321, 862, 40, 55),
        rect("lobby-bottom-right-lamp", 787, 863, 39, 60),
        rect("lobby-bottom-right-plant-bed", 1004, 864, 133, 58)
      ],
      seats: [
        seat("lobby-board-seat-1", 882, 248, 49, 48),
        seat("lobby-board-seat-2", 946, 248, 48, 48),
        seat("lobby-board-seat-3", 1009, 248, 48, 48),
        seat("lobby-left-bench-1", 214, 891, 48, 48),
        seat("lobby-left-bench-2", 263, 890, 49, 49),
        seat("lobby-right-bench-1", 842, 900, 47, 47),
        seat("lobby-right-bench-2", 891, 899, 49, 48)
      ]
    },
    {
      id: "courtyard",
      title: "Courtyard",
      asset: `${ASSET_ROOT}/courtyard.png`,
      width: 1023,
      height: 1537,
      spawnPoints: {
        default: point(512, 170),
        lobby: point(512, 170)
      },
      walkZones: [
        rect("courtyard-path-main", 430, 130, 185, 1120),
        rect("courtyard-path-lower", 360, 1080, 315, 230),
        rect("courtyard-left-green", 70, 120, 340, 1210),
        rect("courtyard-right-green", 625, 120, 315, 1210),
        rect("courtyard-bottom-entry", 390, 1300, 245, 235)
      ],
      blockedZones: [
        rect("courtyard-top-left-tree-trunk", 75, 201, 76, 45),
        rect("courtyard-top-left-bush", 193, 148, 43, 43),
        rect("courtyard-top-bamboo", 255, 148, 76, 78),
        rect("courtyard-top-left-lantern", 344, 153, 40, 85),
        rect("courtyard-top-gate-left-post", 398, 153, 33, 48),
        rect("courtyard-top-gate-right-post", 552, 153, 34, 84),
        rect("courtyard-top-right-lantern", 614, 154, 38, 85),
        rect("courtyard-board", 666, 274, 283, 102),
        rect("courtyard-right-bamboo-top", 574, 325, 67, 54),
        rect("courtyard-maze-wall-1", 59, 367, 256, 28),
        rect("courtyard-maze-wall-2", 341, 372, 59, 16),
        rect("courtyard-maze-wall-3", 125, 411, 20, 20),
        rect("courtyard-maze-wall-4", 395, 789, 50, 14),
        rect("courtyard-maze-wall-5", 102, 410, 19, 171),
        rect("courtyard-maze-wall-6", 64, 397, 13, 509),
        rect("courtyard-maze-wall-7", 201, 414, 95, 17),
        rect("courtyard-maze-wall-8", 269, 451, 64, 20),
        rect("courtyard-maze-wall-9", 180, 490, 137, 17),
        rect("courtyard-maze-wall-10", 327, 551, 14, 81),
        rect("courtyard-maze-wall-11", 395, 490, 12, 110),
        rect("courtyard-maze-wall-12", 214, 808, 12, 85),
        rect("courtyard-maze-wall-13", 210, 528, 73, 17),
        rect("courtyard-maze-wall-14", 290, 841, 12, 42),
        rect("courtyard-maze-wall-15", 362, 515, 12, 128),
        rect("courtyard-maze-wall-16", 393, 390, 12, 55),
        rect("courtyard-maze-wall-17", 143, 449, 67, 21),
        rect("courtyard-maze-wall-18", 196, 568, 30, 16),
        rect("courtyard-maze-wall-19", 137, 559, 20, 72),
        rect("courtyard-maze-wall-20", 124, 527, 68, 14),
        rect("courtyard-maze-wall-21", 178, 562, 13, 101),
        rect("courtyard-maze-wall-22", 456, 544, 12, 219),
        rect("courtyard-maze-wall-23", 217, 608, 12, 94),
        rect("courtyard-maze-wall-24", 99, 603, 17, 159),
        rect("courtyard-maze-wall-25", 429, 436, 12, 126),
        rect("courtyard-maze-wall-26", 223, 748, 39, 18),
        rect("courtyard-maze-wall-27", 216, 611, 89, 12),
        rect("courtyard-maze-wall-28", 139, 640, 14, 184),
        rect("courtyard-maze-wall-29", 303, 519, 12, 65),
        rect("courtyard-maze-wall-30", 101, 803, 14, 60),
        rect("courtyard-maze-wall-31", 306, 662, 95, 14),
        rect("courtyard-maze-wall-32", 423, 588, 12, 123),
        rect("courtyard-maze-wall-33", 171, 734, 15, 75),
        rect("courtyard-maze-wall-34", 320, 490, 12, 38),
        rect("courtyard-maze-wall-35", 203, 689, 13, 79),
        rect("courtyard-maze-wall-36", 80, 883, 111, 18),
        rect("courtyard-maze-wall-37", 252, 764, 12, 40),
        rect("courtyard-maze-wall-38", 286, 767, 12, 40),
        rect("courtyard-maze-wall-39", 248, 796, 52, 12),
        rect("courtyard-maze-wall-40", 399, 799, 12, 100),
        rect("courtyard-maze-wall-41", 363, 837, 31, 43),
        rect("courtyard-maze-wall-42", 319, 811, 15, 44),
        rect("courtyard-maze-wall-43", 320, 795, 55, 14),
        rect("courtyard-maze-wall-44", 189, 792, 34, 16),
        rect("courtyard-maze-wall-45", 268, 899, 26, 46),
        rect("courtyard-field", 231, 1076, 46, 19),
        rect("courtyard-pond-upper", 635, 754, 109, 78),
        rect("courtyard-pond-lower", 652, 979, 167, 116),
        rect("courtyard-left-bamboo-lower", 59, 971, 60, 53),
        rect("courtyard-center-bamboo-lower", 426, 819, 67, 70),
        rect("courtyard-right-bamboo-lower", 898, 585, 68, 69),
        rect("courtyard-left-swing-base", 624, 1308, 111, 56),
        rect("courtyard-right-swing-base", 813, 1307, 111, 57),
        rect("courtyard-bottom-left-bamboo", 53, 1372, 68, 54),
        rect("courtyard-bottom-right-bamboo", 903, 1348, 59, 52),
        rect("courtyard-blocked-65", 235, 1284, 39, 20),
        rect("courtyard-blocked-66", 818, 1023, 37, 63),
        rect("courtyard-blocked-67", 712, 1102, 12, 12),
        rect("courtyard-blocked-68", 720, 1102, 113, 17),
        rect("courtyard-blocked-69", 700, 943, 93, 30),
        rect("courtyard-blocked-70", 686, 864, 137, 17),
        rect("courtyard-blocked-71", 197, 919, 16, 26),
        rect("courtyard-blocked-72", 746, 825, 92, 37),
        rect("courtyard-blocked-73", 745, 799, 60, 20),
        rect("courtyard-blocked-74", 654, 832, 91, 31),
        rect("courtyard-blocked-75", 180, 310, 31, 22),
        rect("courtyard-blocked-76", 485, 631, 28, 21),
        rect("courtyard-blocked-77", 277, 747, 67, 16),
        rect("courtyard-blocked-78", 216, 834, 54, 17),
        rect("courtyard-blocked-79", 255, 882, 144, 12),
        rect("courtyard-blocked-80", 362, 748, 35, 12),
        rect("courtyard-blocked-81", 391, 705, 42, 12),
        rect("courtyard-blocked-82", 320, 413, 48, 15),
        rect("courtyard-blocked-83", 356, 474, 49, 12),
        rect("courtyard-blocked-84", 353, 675, 12, 36),
        rect("courtyard-blocked-85", 327, 701, 12, 43),
        rect("courtyard-blocked-86", 391, 707, 12, 53),
        rect("courtyard-blocked-87", 428, 746, 19, 40),
        rect("courtyard-blocked-88", 362, 756, 12, 39),
        rect("courtyard-blocked-89", 142, 470, 13, 33),
        rect("courtyard-blocked-90", 238, 452, 12, 43),
        rect("courtyard-blocked-91", 83, 562, 16, 15),
        rect("courtyard-blocked-92", 99, 605, 45, 14),
        rect("courtyard-blocked-93", 78, 762, 30, 12),
        rect("courtyard-blocked-94", 113, 805, 20, 12),
        rect("courtyard-blocked-95", 116, 848, 50, 12),
        rect("courtyard-blocked-96", 158, 834, 12, 43),
        rect("courtyard-blocked-97", 163, 838, 23, 12),
        rect("courtyard-blocked-98", 154, 737, 22, 13),
        rect("courtyard-blocked-99", 177, 690, 35, 12),
        rect("courtyard-blocked-100", 253, 573, 12, 44),
        rect("courtyard-blocked-101", 266, 575, 32, 12),
        rect("courtyard-blocked-102", 334, 517, 29, 12),
        rect("courtyard-blocked-103", 357, 430, 12, 45),
        rect("courtyard-blocked-104", 317, 432, 12, 26),
        rect("courtyard-blocked-105", 286, 397, 12, 12),
        rect("courtyard-blocked-106", 203, 433, 12, 19),
        rect("courtyard-blocked-107", 407, 432, 19, 12),
        rect("courtyard-blocked-108", 434, 542, 31, 12),
        rect("courtyard-blocked-109", 403, 585, 28, 14),
        rect("courtyard-blocked-110", 392, 627, 12, 38),
        rect("courtyard-blocked-111", 369, 627, 31, 12),
        rect("courtyard-blocked-112", 293, 628, 12, 12),
        rect("courtyard-blocked-113", 150, 647, 35, 12),
        rect("courtyard-blocked-114", 213, 533, 12, 36),
        rect("courtyard-blocked-115", 178, 506, 12, 27),
        rect("courtyard-blocked-116", 336, 703, 20, 12),
        rect("courtyard-blocked-117", 295, 835, 31, 12),
        rect("courtyard-blocked-118", 975, 111, 42, 1422),
        rect("courtyard-blocked-119", 0, 0, 977, 108),
        rect("courtyard-blocked-120", 556, 110, 418, 40),
        rect("courtyard-blocked-121", 1, 107, 449, 42),
        rect("courtyard-blocked-122", 0, 152, 43, 1385),
        rect("courtyard-blocked-123", 47, 1459, 923, 69)
      ],
      portals: [
        portal("courtyard-to-lobby", "lobby", "courtyard", 405, 0, 235, 185),
        portal("courtyard-portal-2", "lobby", "courtyard", 642, 142, 12, 12)
      ],
      hotspots: [
        hotspot("courtyard-board", "lesson", "Courtyard board", 690, 170, 290, 230)
      ],
      gameZones: [
        gameZone("courtyard-board", "learn", "Courtyard board", 690, 170, 290, 230)
      ],
      behindZones: [
        rect("courtyard-top-left-tree", 63, 148, 107, 53),
        rect("courtyard-board-roof", 680, 156, 259, 115),
        rect("courtyard-top-bamboo", 255, 148, 76, 78),
        rect("courtyard-top-right-bamboo", 577, 266, 68, 70),
        rect("courtyard-right-bamboo-upper", 898, 585, 68, 69),
        rect("courtyard-right-bamboo-mid", 895, 729, 69, 66),
        rect("courtyard-center-bamboo-lower", 426, 819, 67, 70),
        rect("courtyard-left-bamboo-lower", 58, 913, 60, 53),
        rect("courtyard-bridge", 704, 917, 91, 33),
        rect("courtyard-small-tree-right", 923, 1125, 34, 18),
        rect("courtyard-left-swing-frame", 627, 1209, 103, 103),
        rect("courtyard-right-swing-frame", 817, 1209, 103, 103),
        rect("courtyard-bottom-left-bamboo", 53, 1306, 68, 54),
        rect("courtyard-bottom-center-tree", 394, 1328, 57, 49),
        rect("courtyard-bottom-gate-roof", 396, 1382, 201, 62),
        rect("courtyard-bottom-center-shrub", 645, 1391, 53, 49),
        rect("courtyard-bottom-right-bamboo", 903, 1348, 59, 52),
        rect("courtyard-behind-20", 662, 147, 292, 12),
        rect("courtyard-behind-21", 670, 126, 275, 17),
        rect("courtyard-behind-22", 51, 131, 113, 68),
        rect("courtyard-behind-23", 184, 265, 23, 48),
        rect("courtyard-behind-24", 488, 584, 21, 41)
      ],
      seats: [
        seat("courtyard-class-benches-1", 678, 398, 73, 37),
        seat("courtyard-class-benches-2", 768, 394, 72, 38),
        seat("courtyard-class-benches-3", 856, 396, 72, 36),
        seat("courtyard-class-stools-1", 687, 470, 36, 36),
        seat("courtyard-class-stools-2", 738, 470, 37, 37),
        seat("courtyard-class-stools-3", 789, 466, 38, 38),
        seat("courtyard-class-stools-4", 841, 467, 39, 37),
        seat("courtyard-class-stools-5", 894, 468, 38, 36),
        seat("courtyard-class-stools-6", 685, 517, 38, 37),
        seat("courtyard-class-stools-7", 737, 518, 38, 36),
        seat("courtyard-class-stools-8", 789, 517, 38, 37),
        seat("courtyard-class-stools-9", 842, 518, 39, 37),
        seat("courtyard-class-stools-10", 893, 518, 38, 37),
        seat("courtyard-left-swing", 661, 1312, 36, 22),
        seat("courtyard-right-swing", 850, 1311, 36, 23)
      ]
    },
    {
      id: "library",
      title: "Library",
      asset: `${ASSET_ROOT}/library.png`,
      width: 1173,
      height: 1341,
      spawnPoints: {
        default: point(586, 1215),
        lobby: point(586, 1215)
      },
      walkZones: [
        rect("library-center-aisle", 445, 220, 260, 1015),
        rect("library-left-floor", 60, 240, 405, 890),
        rect("library-right-floor", 680, 240, 430, 890),
        rect("library-bottom-door", 450, 1080, 275, 260)
      ],
      blockedZones: [
        rect("library-top-left-shelves", 147, 198, 242, 48),
        rect("library-top-center-wall", 384, 202, 352, 43),
        rect("library-top-right-shelves", 737, 202, 402, 46),
        rect("library-left-wall", 34, 231, 70, 1104),
        rect("library-right-wall", 1098, 231, 46, 1108),
        rect("library-front-desk", 430, 235, 330, 155),
        rect("library-lounge", 65, 235, 305, 255),
        rect("library-right-shelves", 785, 235, 310, 420),
        rect("library-table", 75, 955, 350, 220),
        rect("library-screen", 720, 845, 380, 265),
        rect("library-medallion", 485, 630, 200, 200),
        rect("library-bottom-left-bookcase", 80, 921, 371, 65),
        rect("library-bottom-right-screen-bank", 695, 854, 398, 154)
      ],
      portals: [
        portal("library-to-lobby", "lobby", "library", 450, 1190, 275, 150)
      ],
      hotspots: [
        hotspot("library-alpacards", "lesson", "Library lessons", 720, 845, 390, 270)
      ],
      gameZones: [
        gameZone("library-alpacards", "learn", "Library lessons", 720, 845, 390, 270)
      ],
      behindZones: [
        rect("library-front-desk-left-lamp", 453, 231, 40, 60),
        rect("library-front-desk-right-lamp", 673, 232, 40, 59),
        rect("library-upper-shelf-1", 785, 268, 312, 57),
        rect("library-upper-shelf-2", 784, 401, 311, 58),
        rect("library-left-plant", 49, 442, 36, 46),
        rect("library-upper-shelf-3", 784, 537, 310, 56),
        rect("library-center-right-lamp", 690, 572, 39, 60),
        rect("library-center-left-lamp", 436, 574, 37, 46),
        rect("library-right-bookcase-lamp", 1089, 619, 47, 76),
        rect("library-lower-left-lamp", 438, 770, 30, 59),
        rect("library-lower-right-lamp", 691, 771, 40, 60),
        rect("library-screen-top", 769, 812, 228, 41),
        rect("library-bottom-left-bookcase-top", 80, 860, 322, 59),
        rect("library-bottom-left-plant", 411, 893, 35, 47),
        rect("library-bottom-door-rail", 477, 1195, 196, 52)
      ],
      seats: [
        seat("library-lounge-top-1", 174, 289, 28, 27),
        seat("library-lounge-top-2", 204, 290, 29, 27),
        seat("library-lounge-top-3", 235, 290, 28, 27),
        seat("library-lounge-top-4", 265, 289, 28, 28),
        seat("library-lounge-left-1", 126, 336, 32, 32),
        seat("library-lounge-left-2", 126, 376, 32, 32),
        seat("library-lounge-right-1", 309, 341, 32, 32),
        seat("library-lounge-right-2", 309, 380, 32, 32),
        seat("library-table-top-1", 170, 1019, 43, 42),
        seat("library-table-top-2", 233, 1018, 44, 43),
        seat("library-table-top-3", 292, 1019, 43, 42),
        seat("library-table-left-1", 106, 1080, 45, 44),
        seat("library-table-left-2", 107, 1135, 43, 42),
        seat("library-table-right-1", 353, 1080, 44, 43),
        seat("library-table-right-2", 353, 1135, 44, 43),
        seat("library-table-bottom-1", 170, 1184, 44, 43),
        seat("library-table-bottom-2", 232, 1184, 44, 43),
        seat("library-table-bottom-3", 292, 1185, 43, 42),
        seat("library-classroom-a1", 745, 1029, 43, 43),
        seat("library-classroom-a2", 802, 1029, 44, 43),
        seat("library-classroom-a3", 861, 1030, 44, 43),
        seat("library-classroom-a4", 922, 1029, 44, 43),
        seat("library-classroom-a5", 980, 1029, 44, 43),
        seat("library-classroom-b1", 744, 1102, 44, 43),
        seat("library-classroom-b2", 803, 1101, 43, 43),
        seat("library-classroom-b3", 861, 1102, 44, 42),
        seat("library-classroom-b4", 921, 1101, 43, 43),
        seat("library-classroom-b5", 980, 1101, 43, 43),
        seat("library-classroom-c1", 744, 1178, 44, 43),
        seat("library-classroom-c2", 802, 1177, 44, 43),
        seat("library-classroom-c3", 862, 1176, 44, 43),
        seat("library-classroom-c4", 921, 1173, 44, 43),
        seat("library-classroom-c5", 979, 1173, 44, 43)
      ]
    },
    {
      id: "debate-lab",
      title: "Debate Lab",
      asset: `${ASSET_ROOT}/debate-lab.png`,
      width: 1182,
      height: 1330,
      spawnPoints: {
        default: point(591, 1210),
        lobby: point(591, 1210)
      },
      walkZones: [
        rect("debate-center-aisle", 455, 250, 270, 960),
        rect("debate-left-floor", 80, 225, 385, 890),
        rect("debate-right-floor", 715, 225, 385, 890),
        rect("debate-entry", 445, 1055, 295, 275)
      ],
      blockedZones: [
        rect("debate-stage", 300, 220, 585, 330),
        rect("debate-left-table", 95, 325, 168, 87),
        rect("debate-right-table", 913, 324, 169, 87),
        rect("debate-left-upper-lamp", 320, 430, 36, 50),
        rect("debate-right-upper-lamp", 817, 428, 36, 50),
        rect("debate-left-mid-plant", 400, 592, 44, 113),
        rect("debate-right-mid-plant", 734, 592, 44, 113),
        rect("debate-left-audience-row-1", 160, 780, 350, 42),
        rect("debate-left-audience-row-2", 160, 865, 350, 42),
        rect("debate-left-audience-row-3", 160, 950, 350, 42),
        rect("debate-left-audience-row-4", 160, 1035, 350, 42),
        rect("debate-right-audience-row-1", 655, 780, 360, 42),
        rect("debate-right-audience-row-2", 655, 865, 360, 42),
        rect("debate-right-audience-row-3", 655, 950, 360, 42),
        rect("debate-right-audience-row-4", 655, 1035, 360, 42),
        rect("debate-far-left-plant", 42, 781, 48, 133),
        rect("debate-far-right-plant", 1093, 781, 48, 133),
        rect("debate-bottom-left-plant", 40, 1126, 80, 38),
        rect("debate-bottom-right-plant", 1062, 1126, 78, 38),
        rect("debate-bottom-left-post", 441, 1143, 26, 20),
        rect("debate-bottom-right-post", 701, 1141, 28, 22)
      ],
      portals: [
        portal("debate-to-lobby", "lobby", "debate", 445, 1145, 295, 185)
      ],
      hotspots: [
        hotspot("debate-board", "lesson", "Debate board", 390, 30, 405, 175)
      ],
      gameZones: [
        gameZone("debate-board", "train", "Debate board", 390, 30, 405, 175)
      ],
      behindZones: [],
      seats: [
        seat("debate-left-table-1", 108, 299, 33, 35),
        seat("debate-left-table-2", 163, 299, 32, 35),
        seat("debate-left-table-3", 216, 299, 32, 34),
        seat("debate-right-table-1", 925, 299, 33, 35),
        seat("debate-right-table-2", 980, 299, 33, 35),
        seat("debate-right-table-3", 1036, 303, 32, 34),
        seat("debate-center-seat", 564, 634, 40, 47),
        seat("debate-left-audience-a1", 169, 757, 38, 23),
        seat("debate-left-audience-a2", 210, 757, 38, 23),
        seat("debate-left-audience-a3", 250, 757, 40, 23),
        seat("debate-left-audience-a4", 291, 757, 40, 23),
        seat("debate-left-audience-a5", 334, 758, 40, 22),
        seat("debate-left-audience-a6", 380, 758, 39, 23),
        seat("debate-left-audience-a7", 423, 757, 40, 23),
        seat("debate-left-audience-a8", 469, 758, 40, 23),
        seat("debate-left-audience-b1", 169, 841, 38, 22),
        seat("debate-left-audience-b2", 210, 841, 38, 22),
        seat("debate-left-audience-b3", 250, 841, 40, 23),
        seat("debate-left-audience-b4", 294, 841, 39, 24),
        seat("debate-left-audience-b5", 335, 841, 39, 24),
        seat("debate-left-audience-b6", 380, 843, 40, 22),
        seat("debate-left-audience-b7", 424, 842, 39, 22),
        seat("debate-left-audience-b8", 469, 841, 39, 22),
        seat("debate-left-audience-c1", 168, 925, 40, 23),
        seat("debate-left-audience-c2", 209, 926, 39, 22),
        seat("debate-left-audience-c3", 251, 926, 39, 22),
        seat("debate-left-audience-c4", 293, 925, 40, 23),
        seat("debate-left-audience-c5", 335, 927, 40, 22),
        seat("debate-left-audience-c6", 380, 926, 40, 22),
        seat("debate-left-audience-c7", 423, 927, 40, 22),
        seat("debate-left-audience-c8", 468, 928, 40, 22),
        seat("debate-left-audience-d1", 166, 1012, 40, 23),
        seat("debate-left-audience-d2", 208, 1012, 40, 22),
        seat("debate-left-audience-d3", 250, 1012, 40, 22),
        seat("debate-left-audience-d4", 294, 1012, 39, 23),
        seat("debate-left-audience-d5", 336, 1011, 40, 23),
        seat("debate-left-audience-d6", 380, 1012, 40, 23),
        seat("debate-left-audience-d7", 423, 1012, 40, 23),
        seat("debate-left-audience-d8", 470, 1013, 40, 22),
        seat("debate-right-audience-a1", 657, 756, 40, 23),
        seat("debate-right-audience-a2", 702, 758, 40, 22),
        seat("debate-right-audience-a3", 748, 758, 39, 23),
        seat("debate-right-audience-a4", 793, 758, 40, 23),
        seat("debate-right-audience-a5", 838, 758, 40, 23),
        seat("debate-right-audience-a6", 881, 758, 40, 23),
        seat("debate-right-audience-a7", 925, 758, 40, 23),
        seat("debate-right-audience-a8", 971, 758, 40, 23),
        seat("debate-right-audience-b1", 658, 845, 39, 22),
        seat("debate-right-audience-b2", 702, 846, 40, 22),
        seat("debate-right-audience-b3", 748, 845, 39, 22),
        seat("debate-right-audience-b4", 793, 846, 39, 22),
        seat("debate-right-audience-b5", 837, 844, 40, 23),
        seat("debate-right-audience-b6", 883, 845, 40, 22),
        seat("debate-right-audience-b7", 927, 845, 40, 22),
        seat("debate-right-audience-b8", 971, 845, 39, 22),
        seat("debate-right-audience-c1", 658, 930, 40, 22),
        seat("debate-right-audience-c2", 702, 931, 40, 22),
        seat("debate-right-audience-c3", 747, 929, 40, 23),
        seat("debate-right-audience-c4", 792, 930, 40, 22),
        seat("debate-right-audience-c5", 838, 930, 40, 22),
        seat("debate-right-audience-c6", 883, 929, 40, 22),
        seat("debate-right-audience-c7", 928, 928, 39, 22),
        seat("debate-right-audience-c8", 970, 928, 39, 22),
        seat("debate-right-audience-d1", 659, 1015, 40, 22),
        seat("debate-right-audience-d2", 702, 1015, 40, 22),
        seat("debate-right-audience-d3", 745, 1015, 40, 23),
        seat("debate-right-audience-d4", 793, 1016, 39, 22),
        seat("debate-right-audience-d5", 838, 1016, 40, 22),
        seat("debate-right-audience-d6", 883, 1016, 40, 22),
        seat("debate-right-audience-d7", 928, 1015, 40, 22),
        seat("debate-right-audience-d8", 970, 1015, 40, 23)
      ]
    }
  ];

  window.WSC_CAMPUS_2D_MANIFEST = Object.freeze({
    schema: "campus2d.manifest.v1",
    assetRoot: ASSET_ROOT,
    sprite: {
      asset: `${ASSET_ROOT}/alpaca-sprite.png`,
      width: 1024,
      height: 1536,
      columns: 3,
      rows: 4
    },
    defaultRoomId: "lobby",
    colors,
    rooms,
    roomsById: Object.freeze(Object.fromEntries(rooms.map((room) => [room.id, room])))
  });
}());
