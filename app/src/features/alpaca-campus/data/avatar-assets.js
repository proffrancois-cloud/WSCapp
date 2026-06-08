(function () {
  const ROOT = "../assets/campus/avatar";
  const FRAME_SIZE = 256;
  const FRAME_COUNT = 20;
  const DISPLAY_HEIGHT = 148;

  const frameMap = Object.freeze({
    down: { idle: 0, walk: [1, 2, 3, 4] },
    up: { idle: 5, walk: [6, 7, 8, 9] },
    left: { idle: 10, walk: [11, 12, 13, 14] },
    right: { idle: 15, walk: [16, 17, 18, 19] }
  });

  function byId(list) {
    return Object.fromEntries(list.map((item) => [item.id, item]));
  }

  function withSource(item, folder) {
    return {
      ...item,
      key: `avatar-${folder}-${item.id}`,
      src: `${ROOT}/${folder}/${item.id}.png`,
      previewSrc: `${ROOT}/previews/${folder === "base" ? "base" : "outfits"}/${item.id}.png`
    };
  }

  const cosmetics = window.WSC_ALPACA_CAMPUS_COSMETICS || {};
  const colors = (cosmetics.woolColors || []).map((color) => withSource(color, "base"));
  const outfits = (cosmetics.outfits || []).map((outfit) => ({
    ...withSource(outfit, "outfits"),
    iconSrc: `${ROOT}/outfit-icons/${outfit.id}.png`
  }));
  const colorById = byId(colors);
  const outfitById = byId(outfits);

  function getColor(colorId) {
    return colorById[colorId] || colors[0];
  }

  function getOutfit(outfitId) {
    return outfitById[outfitId] || outfits[0];
  }

  function getFrame(direction, moving, time = 0) {
    const group = frameMap[direction] || frameMap.down;
    if (!moving) {
      return group.idle;
    }
    const frames = group.walk;
    return frames[Math.floor(time / 145) % frames.length];
  }

  window.WSC_ALPACA_CAMPUS_AVATAR_ASSETS = Object.freeze({
    root: ROOT,
    frameSize: FRAME_SIZE,
    frameCount: FRAME_COUNT,
    displayHeight: DISPLAY_HEIGHT,
    displayScale: DISPLAY_HEIGHT / FRAME_SIZE,
    frameMap,
    colors,
    outfits,
    getColor,
    getOutfit,
    getFrame
  });
}());
