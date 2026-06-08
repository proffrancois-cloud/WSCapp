(function () {
  const legacyColorIds = {
    cream: "alpaca-01",
    cocoa: "alpaca-02",
    honey: "alpaca-04",
    mint: "alpaca-06",
    sky: "alpaca-07",
    rose: "alpaca-08"
  };

  const woolColors = [
    { id: "alpaca-01", label: "Cream", hex: "#f2d6a2" },
    { id: "alpaca-02", label: "Chestnut", hex: "#8b572e" },
    { id: "alpaca-03", label: "Stone", hex: "#8f8574" },
    { id: "alpaca-04", label: "Honey", hex: "#c77c32" },
    { id: "alpaca-05", label: "Midnight", hex: "#1f1d1a" },
    { id: "alpaca-06", label: "Sage", hex: "#b8cc8a" },
    { id: "alpaca-07", label: "Sky", hex: "#a9d5ef" },
    { id: "alpaca-08", label: "Rose", hex: "#f0a1b4" },
    { id: "alpaca-09", label: "Lavender", hex: "#bea0e4" },
    { id: "alpaca-10", label: "Snow", hex: "#f4f0ea" },
    { id: "alpaca-11", label: "Crimson", hex: "#8d1419" }
  ];

  const outfits = [
    { id: "suit", label: "Black & White Suit" },
    { id: "jeans-polo", label: "Jeans + Polo" },
    { id: "overall", label: "Sweater & Overalls" },
    { id: "casual", label: "Striped Casual" },
    { id: "sporty", label: "Hoodie Joggers" },
    { id: "classy", label: "Classy Lady" },
    { id: "dress", label: "Colorful Dress" },
    { id: "hawaiian", label: "Hawaiian Set" },
    { id: "grungy", label: "Grungy Style" },
    { id: "weird", label: "New Gen Weirdcore" },
    { id: "weird2", label: "Colorful Weirdcore" },
    { id: "candypop", label: "Pastel Candypop" },
    { id: "raver", label: "Retro 90s Raver" }
  ];

  const accessories = {
    head: [
      { id: "none", label: "None" },
      { id: "campus-cap", label: "Campus Cap" },
      { id: "guide-pin", label: "Guide Pin" }
    ],
    face: [
      { id: "none", label: "None" },
      { id: "round-glasses", label: "Round Glasses" },
      { id: "focus-shades", label: "Focus Shades" }
    ],
    neck: [
      { id: "none", label: "None" },
      { id: "club-scarf", label: "Club Scarf" },
      { id: "gold-medal", label: "Gold Medal" }
    ]
  };

  const titles = [
    { id: "new-arrival", label: "New Arrival", unlockQuestId: null },
    { id: "school-club-alpaca", label: "School Club Alpaca", unlockQuestId: "meet-the-coach" },
    { id: "knowledge-explorer", label: "Knowledge Explorer", unlockQuestId: "explore-the-syllabus-board" },
    { id: "big-idea-hunter", label: "Big Idea Hunter", unlockQuestId: "find-the-first-big-idea" }
  ];

  function getColor(colorId) {
    const normalizedId = legacyColorIds[colorId] || colorId;
    return woolColors.find((color) => color.id === normalizedId) || woolColors[0];
  }

  function getOutfit(outfitId) {
    return outfits.find((outfit) => outfit.id === outfitId) || outfits[2];
  }

  function getTitle(titleId) {
    return titles.find((title) => title.id === titleId) || titles[0];
  }

  window.WSC_ALPACA_CAMPUS_COSMETICS = Object.freeze({
    woolColors,
    accessories,
    outfits,
    titles,
    legacyColorIds,
    getColor,
    getOutfit,
    getTitle
  });
}());
