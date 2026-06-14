(function () {
  const ONLINE_SURFACES = Object.freeze({
    campus3dPreview: "3d-campus-preview",
    campus3dMultiplayer: "3d-campus-multiplayer",
    legacyLiveGameRooms: "legacy-live-game-rooms"
  });

  function createOnlineModeController({
    entryService = window.WSC_APP_ENTRY_SERVICE
  } = {}) {
    function getCampusMultiplayerLabel() {
      return entryService?.getCampusPreviewLabel
        ? entryService.getCampusPreviewLabel()
        : "3D Campus Preview";
    }

    function getCampusPreviewActionLabel() {
      return entryService?.getCampusPreviewActionLabel
        ? entryService.getCampusPreviewActionLabel()
        : "Explore preview";
    }

    function getCampusPreviewStatus() {
      return entryService?.getCampusPreviewStatus
        ? entryService.getCampusPreviewStatus()
        : "Preview: not a persisted MMO yet; chat and presence may be experimental.";
    }

    function getLegacyLiveGameRoomsLabel() {
      return "legacy/live game room mechanics";
    }

    function getDefaultCampusAlpacaName() {
      return entryService?.getOnlineAlpacaName
        ? entryService.getOnlineAlpacaName()
        : "Devalpacca";
    }

    function getCampusMultiplayerUrl() {
      if (entryService?.getCampusMultiplayerUrl) {
        return entryService.getCampusMultiplayerUrl();
      }
      return entryService?.getOnlineCampusUrl
        ? entryService.getOnlineCampusUrl()
        : "./alpaca-campus-3d/?mode=multiplayer";
    }

    function openCampusMultiplayer(locationObject = window.location) {
      if (entryService?.openCampusMultiplayer) {
        entryService.openCampusMultiplayer(locationObject);
        return;
      }
      locationObject.href = getCampusMultiplayerUrl();
    }

    return Object.freeze({
      ONLINE_SURFACES,
      getCampusMultiplayerLabel,
      getCampusPreviewActionLabel,
      getCampusPreviewStatus,
      getLegacyLiveGameRoomsLabel,
      getDefaultCampusAlpacaName,
      getCampusMultiplayerUrl,
      openCampusMultiplayer
    });
  }

  window.WSC_CREATE_ONLINE_MODE_CONTROLLER = createOnlineModeController;
}());
