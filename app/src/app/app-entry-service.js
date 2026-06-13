(function () {
  const DEFAULT_ONLINE_ALPACA_NAME = "Devalpacca";
  const CAMPUS_3D_MULTIPLAYER_URL = "./alpaca-campus-3d/?mode=multiplayer";
  const ALPACA_ONLINE_CAMPUS_URL = CAMPUS_3D_MULTIPLAYER_URL;
  const CAMPUS_PREVIEW_LABEL = "3D Campus Preview";
  const CAMPUS_PREVIEW_ACTION_LABEL = "Explore preview";
  const CAMPUS_PREVIEW_STATUS =
    "Preview: not a persisted MMO yet; chat and presence may be experimental.";
  const LOCAL_STUDY_ACTION_LABEL = "Study solo";
  const APP_ENTRY_PRODUCT_SUMMARY =
    "Study the WSC 2026 theme through guides, flashcards, videos, games, and an experimental 3D campus preview.";
  const ACTIONS = Object.freeze({
    openAppEntryGate: "data-open-app-entry-gate",
    openAlpacaOnlineCampus: "data-open-alpaca-online-campus"
  });

  function getOnlineAlpacaName() {
    return DEFAULT_ONLINE_ALPACA_NAME;
  }

  function getCampusMultiplayerUrl() {
    return CAMPUS_3D_MULTIPLAYER_URL;
  }

  function getOnlineCampusUrl() {
    return getCampusMultiplayerUrl();
  }

  function getCampusPreviewLabel() {
    return CAMPUS_PREVIEW_LABEL;
  }

  function getCampusPreviewActionLabel() {
    return CAMPUS_PREVIEW_ACTION_LABEL;
  }

  function getCampusPreviewStatus() {
    return CAMPUS_PREVIEW_STATUS;
  }

  function getLocalStudyActionLabel() {
    return LOCAL_STUDY_ACTION_LABEL;
  }

  function getAppEntryProductSummary() {
    return APP_ENTRY_PRODUCT_SUMMARY;
  }

  function getModeSwitchAction(isOnline) {
    return isOnline ? ACTIONS.openAppEntryGate : ACTIONS.openAlpacaOnlineCampus;
  }

  function getModeSwitchTitle(isOnline) {
    return isOnline ? "Switch mode" : `Open ${CAMPUS_PREVIEW_LABEL}`;
  }

  function openCampusMultiplayer(locationObject = window.location) {
    locationObject.href = getCampusMultiplayerUrl();
  }

  function openOnlineCampus(locationObject = window.location) {
    openCampusMultiplayer(locationObject);
  }

  window.WSC_APP_ENTRY_SERVICE = Object.freeze({
    DEFAULT_ONLINE_ALPACA_NAME,
    CAMPUS_3D_MULTIPLAYER_URL,
    ALPACA_ONLINE_CAMPUS_URL,
    CAMPUS_PREVIEW_LABEL,
    CAMPUS_PREVIEW_ACTION_LABEL,
    CAMPUS_PREVIEW_STATUS,
    LOCAL_STUDY_ACTION_LABEL,
    APP_ENTRY_PRODUCT_SUMMARY,
    ACTIONS,
    getOnlineAlpacaName,
    getCampusMultiplayerUrl,
    getOnlineCampusUrl,
    getCampusPreviewLabel,
    getCampusPreviewActionLabel,
    getCampusPreviewStatus,
    getLocalStudyActionLabel,
    getAppEntryProductSummary,
    getModeSwitchAction,
    getModeSwitchTitle,
    openCampusMultiplayer,
    openOnlineCampus
  });
}());
