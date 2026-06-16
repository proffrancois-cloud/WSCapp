(function () {
  function createGameAudioService({
    windowRef = window,
    helpers
  }) {
    const { getAssetValue } = helpers;
    let relayBuzzAudio = null;
    let relayBuzzAudioSrc = null;

    function createAudio(src) {
      const AudioCtor = windowRef.Audio || Audio;
      const audio = new AudioCtor(src);
      audio.preload = "auto";
      audio.volume = 0.8;
      return audio;
    }

    function preloadExperienceAudio() {
      const relayBuzzSrc = getAssetValue(["multiplayer", "buzzSound"]);
      if (!relayBuzzSrc) {
        return;
      }

      relayBuzzAudio = createAudio(relayBuzzSrc);
      relayBuzzAudioSrc = relayBuzzSrc;
    }

    function playRelayBuzzSound() {
      const relayBuzzSrc = getAssetValue(["multiplayer", "buzzSound"]);
      if (!relayBuzzSrc) {
        return;
      }

      if (!relayBuzzAudio || relayBuzzAudioSrc !== relayBuzzSrc) {
        relayBuzzAudio = createAudio(relayBuzzSrc);
        relayBuzzAudioSrc = relayBuzzSrc;
      }

      relayBuzzAudio.currentTime = 0;
      const playback = relayBuzzAudio.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch(() => {});
      }
    }

    return Object.freeze({
      preloadExperienceAudio,
      playRelayBuzzSound
    });
  }

  window.WSC_CREATE_GAME_AUDIO_SERVICE = createGameAudioService;
}());
