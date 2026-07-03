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

  function seat(id, x, y, width, height) {
    return { id, zone: rect(id, x, y, width, height), x: x + (width / 2), y: y + (height / 2) };
  }

  function rects(prefix, boxes) {
    return boxes.map((box, index) => rect(`${prefix}-${index + 1}`, box[0], box[1], box[2], box[3]));
  }

  function seatRects(prefix, boxes) {
    return boxes.map((box, index) => seat(`${prefix}-${index + 1}`, box[0], box[1], box[2], box[3]));
  }

  const colors = [
    { id: "cream", label: "Cream", hex: "#f7ead0", filter: "sepia(0.08) saturate(0.95) brightness(1.08)" },
    { id: "gold", label: "Gold", hex: "#f2bf4d", filter: "sepia(0.45) saturate(1.55) hue-rotate(348deg) brightness(1.04)" },
    { id: "rose", label: "Rose", hex: "#f18d9b", filter: "sepia(0.22) saturate(1.9) hue-rotate(300deg) brightness(1.03)" },
    { id: "mint", label: "Mint", hex: "#7ccfb1", filter: "sepia(0.18) saturate(1.65) hue-rotate(96deg) brightness(1.05)" },
    { id: "sky", label: "Sky", hex: "#73addf", filter: "sepia(0.12) saturate(1.85) hue-rotate(168deg) brightness(1.03)" },
    { id: "cocoa", label: "Cocoa", hex: "#9a6a42", filter: "sepia(0.65) saturate(1.35) hue-rotate(352deg) brightness(0.86)" }
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
        ...rects("courtyard-maze-wall", [
          [59, 367, 256, 28],
          [335, 367, 108, 166],
          [334, 375, 121, 190],
          [199, 396, 84, 15],
          [272, 405, 169, 315],
          [88, 407, 62, 154],
          [138, 407, 157, 101],
          [269, 435, 68, 37],
          [127, 452, 111, 72],
          [252, 452, 126, 166],
          [395, 490, 12, 110],
          [88, 509, 212, 94],
          [210, 524, 71, 41],
          [317, 526, 42, 22],
          [360, 529, 31, 130],
          [442, 533, 29, 233],
          [265, 547, 78, 93],
          [201, 549, 30, 39],
          [125, 556, 34, 69],
          [100, 558, 40, 43],
          [178, 562, 30, 77],
          [424, 567, 33, 175],
          [159, 587, 40, 81],
          [83, 600, 17, 159],
          [365, 602, 60, 141],
          [177, 604, 71, 82],
          [265, 604, 46, 40],
          [78, 618, 116, 265],
          [376, 618, 31, 59],
          [228, 624, 65, 99],
          [305, 658, 82, 41],
          [340, 679, 67, 42],
          [171, 682, 77, 85],
          [220, 693, 105, 99],
          [300, 728, 44, 79],
          [159, 730, 114, 127],
          [334, 768, 47, 90],
          [292, 787, 26, 46],
          [248, 811, 51, 12],
          [412, 820, 12, 78],
          [356, 832, 12, 41],
          [292, 833, 12, 45],
          [304, 851, 27, 23],
          [249, 873, 42, 34],
          [268, 899, 26, 46]
        ]),
        rect("courtyard-field", 90, 1010, 300, 260),
        rect("courtyard-pond-upper", 650, 690, 245, 170),
        rect("courtyard-pond-lower", 625, 875, 275, 185),
        rect("courtyard-left-bamboo-lower", 58, 913, 60, 53),
        rect("courtyard-center-bamboo-lower", 426, 819, 67, 70),
        rect("courtyard-right-bamboo-lower", 898, 585, 68, 69),
        rect("courtyard-left-swing-base", 624, 1308, 111, 56),
        rect("courtyard-right-swing-base", 813, 1307, 111, 57),
        rect("courtyard-bottom-left-bamboo", 53, 1306, 68, 54),
        rect("courtyard-bottom-right-bamboo", 903, 1348, 59, 52)
      ],
      portals: [
        portal("courtyard-to-lobby", "lobby", "courtyard", 405, 0, 235, 185)
      ],
      hotspots: [
        hotspot("courtyard-board", "lesson", "Courtyard board", 690, 170, 290, 230)
      ],
      behindZones: [
        rect("courtyard-top-left-tree", 63, 148, 107, 53),
        rect("courtyard-board-roof", 658, 155, 303, 118),
        rect("courtyard-top-bamboo", 255, 148, 76, 78),
        rect("courtyard-top-right-bamboo", 574, 254, 68, 70),
        rect("courtyard-left-stone-lantern", 176, 258, 43, 40),
        rect("courtyard-center-bamboo", 460, 467, 53, 23),
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
        rect("courtyard-bottom-right-bamboo", 903, 1348, 59, 52)
      ],
      seats: [
        ...seatRects("courtyard-class-benches", [
          [678, 398, 73, 37],
          [768, 394, 72, 38],
          [856, 396, 72, 36]
        ]),
        ...seatRects("courtyard-class-stools", [
          [687, 470, 36, 36],
          [738, 470, 37, 37],
          [789, 466, 38, 38],
          [841, 467, 39, 37],
          [894, 468, 38, 36],
          [685, 517, 38, 37],
          [737, 518, 38, 36],
          [789, 517, 38, 37],
          [842, 518, 39, 37],
          [893, 518, 38, 37]
        ]),
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
