(function () {
  function createAppSettingsController(deps = {}) {
    const win = deps.window || window;
    const doc = deps.document || win.document || document;
    const state = deps.state || { ui: {} };
    const storageKey = deps.storageKey || "wscCampus2dSettings";
    const backgroundMusicSrc = deps.backgroundMusicSrc || "";
    const setHtml = deps.setHtml || ((target, markup) => {
      if (target) {
        target.textContent = String(markup || "");
      }
    });
    const clearHtml = deps.clearHtml || ((target) => target?.replaceChildren?.());
    const escapeHtml = deps.escapeHtml || ((value) => String(value ?? ""));
    const syncPopupScrollLock = deps.syncPopupScrollLock || (() => {});
    const renderResourcesModal = deps.renderResourcesModal || (() => {});
    const defaultSettings = Object.freeze({
      volume: readNumberSetting(deps.defaultSettings?.volume, 16, 0, 100),
      muted: Boolean(deps.defaultSettings?.muted)
    });

    let settings = loadSettings();
    let backgroundMusic = null;
    let backgroundMusicBlocked = false;

    function getModalMount() {
      let mount = doc.getElementById("appSettingsModalMount");
      if (!mount) {
        mount = doc.createElement("div");
        mount.id = "appSettingsModalMount";
        doc.body.appendChild(mount);
      }
      return mount;
    }

    function renderModal() {
      const mount = getModalMount();
      if (!state.ui.appSettingsOpen) {
        clearHtml(mount);
        return;
      }

      const volumeLabel = formatVolumeLabel(settings);
      setHtml(mount, `
        <div class="auth-modal-overlay app-settings-overlay" data-app-settings-overlay role="dialog" aria-modal="true" aria-labelledby="appSettingsTitle">
          <div class="auth-modal-window app-settings-window" data-app-settings-window>
            <button class="popup-close-button" type="button" data-close-app-settings aria-label="Close settings">
              <span aria-hidden="true">×</span>
            </button>
            <div class="auth-modal-stack app-settings-stack">
              <div class="app-settings-heading">
                <p class="challenge-label">Settings</p>
                <h3 id="appSettingsTitle">Music</h3>
              </div>
              <label class="app-settings-control">
                <span class="app-settings-row">
                  <span>Music volume</span>
                  <span aria-live="polite">${escapeHtml(volumeLabel)}</span>
                </span>
                <input
                  class="app-settings-slider"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value="${escapeHtml(String(settings.volume))}"
                  data-app-settings-volume
                />
              </label>
              <div class="panel-actions">
                <button class="button secondary" type="button" data-app-settings-mute aria-pressed="${settings.muted || settings.volume <= 0 ? "true" : "false"}">
                  ${escapeHtml(settings.muted || settings.volume <= 0 ? "Unmute" : "Mute")}
                </button>
                <button class="button primary" type="button" data-close-app-settings>Close</button>
              </div>
            </div>
          </div>
        </div>
      `, "app-settings-modal");
    }

    function readNumberSetting(value, fallback, min, max) {
      const number = Number(value);
      if (!Number.isFinite(number)) {
        return fallback;
      }
      return Math.min(max, Math.max(min, Math.round(number)));
    }

    function normalizeSettings(candidate = {}) {
      return {
        volume: readNumberSetting(candidate.volume, defaultSettings.volume, 0, 100),
        muted: Boolean(candidate.muted)
      };
    }

    function loadSettings() {
      try {
        return normalizeSettings(JSON.parse(win.localStorage.getItem(storageKey) || "{}"));
      } catch (_error) {
        return normalizeSettings();
      }
    }

    function saveSettings() {
      try {
        win.localStorage.setItem(storageKey, JSON.stringify(settings));
      } catch (_error) {
        // Settings remain active for the current tab even if storage is unavailable.
      }
    }

    function formatVolumeLabel(candidate = settings) {
      if (candidate.muted || candidate.volume <= 0) {
        return "Muted";
      }
      return `${candidate.volume}%`;
    }

    function ensureBackgroundMusic() {
      if (backgroundMusic) {
        return backgroundMusic;
      }
      if (!backgroundMusicSrc) {
        return null;
      }
      backgroundMusic = new win.Audio(backgroundMusicSrc);
      backgroundMusic.loop = true;
      backgroundMusic.preload = "auto";
      backgroundMusic.setAttribute("playsinline", "");
      return backgroundMusic;
    }

    function pauseBackgroundMusic() {
      if (backgroundMusic) {
        backgroundMusic.pause();
      }
    }

    function syncPlayback({ play = state.ui.appSettingsOpen } = {}) {
      if (state.ui.appShellMode === "online" || settings.muted || settings.volume <= 0) {
        pauseBackgroundMusic();
        return;
      }

      const music = ensureBackgroundMusic();
      if (!music) {
        return;
      }

      music.volume = Math.min(1, Math.max(0, settings.volume / 100));
      music.muted = false;
      if (!play || !music.paused) {
        return;
      }

      const playback = music.play();
      if (playback?.catch) {
        playback
          .then(() => {
            backgroundMusicBlocked = false;
          })
          .catch(() => {
            backgroundMusicBlocked = true;
          });
      }
    }

    function update(patch = {}) {
      settings = normalizeSettings({ ...settings, ...patch });
      saveSettings();
      renderModal();
      syncPlayback({ play: state.ui.appSettingsOpen || backgroundMusicBlocked });
    }

    function openPanel() {
      state.ui.appSettingsOpen = true;
      state.ui.resourcesOpen = false;
      syncPopupScrollLock();
      renderResourcesModal();
      renderModal();
      syncPlayback({ play: true });
    }

    function closePanel() {
      state.ui.appSettingsOpen = false;
      syncPopupScrollLock();
      renderModal();
    }

    function toggleMute() {
      if (settings.muted || settings.volume <= 0) {
        update({
          muted: false,
          volume: settings.volume > 0 ? settings.volume : defaultSettings.volume
        });
        return;
      }
      update({ muted: true });
    }

    return Object.freeze({
      renderModal,
      readNumberSetting,
      update,
      openPanel,
      closePanel,
      toggleMute,
      syncPlayback,
      pauseBackgroundMusic,
      getSettings: () => ({ ...settings })
    });
  }

  window.WSC_CREATE_APP_SETTINGS_CONTROLLER = createAppSettingsController;
}());
