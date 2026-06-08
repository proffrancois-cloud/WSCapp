(function () {
  const BACKGROUND_BASE = "../assets/campus/backgrounds/";

  const backgrounds = {
    "campus-courtyard": {
      key: "campus-bg-courtyard",
      src: `${BACKGROUND_BASE}campus-courtyard.png`,
      sourcePanel: "01. CAMPUS COURTYARD 2.png",
      extraction: "primary full-room view"
    },
    "school-lobby": {
      key: "campus-bg-school-lobby",
      src: `${BACKGROUND_BASE}school-lobby.png`,
      sourcePanel: "02. SCHOOL LOBBY.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "learning-commons": {
      key: "campus-bg-learning-commons",
      src: `${BACKGROUND_BASE}learning-commons.png`,
      sourcePanel: "03. LEARNING COMMONS.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "flashcard-museum": {
      key: "campus-bg-flashcard-museum",
      src: `${BACKGROUND_BASE}flashcard-museum.png`,
      sourcePanel: "04. FLASHCARD MUSEUM.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "slideshow-studio": {
      key: "campus-bg-slideshow-studio",
      src: `${BACKGROUND_BASE}slideshow-studio.png`,
      sourcePanel: "05. SLIDESHOW STUDIO.png",
      extraction: "primary full-room view"
    },
    "mind-map-lab": {
      key: "campus-bg-mind-map-lab",
      src: `${BACKGROUND_BASE}mind-map-lab.png`,
      sourcePanel: "06. MIND MAP LAB.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "alpaca-channel-cinema": {
      key: "campus-bg-alpaca-channel-cinema",
      src: `${BACKGROUND_BASE}alpaca-channel-cinema.png`,
      sourcePanel: "07. CINEMA.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "raw-content-classroom": {
      key: "campus-bg-raw-content-classroom",
      src: `${BACKGROUND_BASE}raw-content-classroom.png`,
      sourcePanel: "08. RAW CONTENT CLASSROOM.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "guiding-library-lounge": {
      key: "campus-bg-guiding-library-lounge",
      src: `${BACKGROUND_BASE}guiding-library-lounge.png`,
      sourcePanel: "09. GUIDING LIBRARY LOUNDGE.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "games-hall": {
      key: "campus-bg-games-hall",
      src: `${BACKGROUND_BASE}games-hall.png`,
      sourcePanel: "10. GAMES HALL.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "alpacapardy-hall": {
      key: "campus-bg-alpacapardy-hall",
      src: `${BACKGROUND_BASE}alpacapardy-hall.png`,
      sourcePanel: "11. ALPACAPARDY HALL.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "alpaca-run-track": {
      key: "campus-bg-alpaca-run-track",
      src: `${BACKGROUND_BASE}alpaca-run-track.png`,
      sourcePanel: "12. ALPACA RUN TRACK.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "alpaca-jump-gym": {
      key: "campus-bg-alpaca-jump-gym",
      src: `${BACKGROUND_BASE}alpaca-jump-gym.png`,
      sourcePanel: "13. ALPACA JUMP GYM.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "alpaquiz-relay-room": {
      key: "campus-bg-alpaquiz-relay-room",
      src: `${BACKGROUND_BASE}alpaquiz-relay-room.png`,
      sourcePanel: "14. ALPAQUIZ RELAY ROOM.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "survivalpaca-arena": {
      key: "campus-bg-survivalpaca-arena",
      src: `${BACKGROUND_BASE}survivalpaca-arena.png`,
      sourcePanel: "00. First draft general panel.png",
      extraction: "room thumbnail fallback; detailed panel still missing"
    },
    "training-center": {
      key: "campus-bg-training-center",
      src: `${BACKGROUND_BASE}training-center.png`,
      sourcePanel: "16. TRAINING CENTER.png",
      extraction: "primary full-room view, panel label cropped out"
    },
    "writing-studio": {
      key: "campus-bg-writing-studio",
      src: `${BACKGROUND_BASE}writing-studio.png`,
      sourcePanel: "17_writing_studio_room_background_only.png",
      extraction: "room background cropped from supplied room-only image"
    },
    "debate-lab": {
      key: "campus-bg-debate-lab",
      src: `${BACKGROUND_BASE}debate-lab.png`,
      sourcePanel: "18. DEBATE LAB.png",
      extraction: "full-room background"
    },
    "scholars-bowl-studio": {
      key: "campus-bg-scholars-bowl-studio",
      src: `${BACKGROUND_BASE}scholars-bowl-studio.png`,
      sourcePanel: "19. SCHOLARS BOWL.png",
      extraction: "full-room background"
    },
    "scholars-challenge-room": {
      key: "campus-bg-scholars-challenge-room",
      src: `${BACKGROUND_BASE}scholars-challenge-room.png`,
      sourcePanel: "20. SCHOLARS CHALLENGE.png",
      extraction: "primary full-room view"
    },
    "grand-amphitheater": {
      key: "campus-bg-grand-amphitheater",
      src: `${BACKGROUND_BASE}grand-amphitheater.png`,
      sourcePanel: "00. First draft general panel.png",
      extraction: "room thumbnail fallback; detailed panel still missing"
    },
    "debate-room-1": {
      key: "campus-bg-debate-room-1",
      src: `${BACKGROUND_BASE}debate-room-1.png`,
      sourcePanel: "21. CLASSROOM 1 - objects.png",
      extraction: "object-sheet room preview fallback"
    },
    "debate-room-2": {
      key: "campus-bg-debate-room-2",
      src: `${BACKGROUND_BASE}debate-room-2.png`,
      sourcePanel: "22. CLASSROOM 2 - objects.png",
      extraction: "object-sheet room preview fallback"
    },
    "debate-room-3": {
      key: "campus-bg-debate-room-3",
      src: `${BACKGROUND_BASE}debate-room-3.png`,
      sourcePanel: "23. CLASSROOM 3 - objects.png",
      extraction: "object-sheet room preview fallback"
    }
  };

  function getBackground(roomId) {
    return backgrounds[roomId] || null;
  }

  window.WSC_ALPACA_CAMPUS_ROOM_ASSETS = Object.freeze({
    backgrounds,
    getBackground
  });
}());
