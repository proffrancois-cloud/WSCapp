(function () {
  const DEFAULT_ONLINE_ALPACA_NAME = "Devalpacca";
  const CAMPUS_3D_MULTIPLAYER_URL = "./alpaca-campus-3d/?mode=multiplayer";
  const ALPACA_ONLINE_CAMPUS_URL = CAMPUS_3D_MULTIPLAYER_URL;
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

  function getModeSwitchAction(isOnline) {
    return isOnline ? ACTIONS.openAppEntryGate : ACTIONS.openAlpacaOnlineCampus;
  }

  function getModeSwitchTitle(isOnline) {
    return isOnline ? "Switch mode" : "Open Alpaca Campus 3D";
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
    ACTIONS,
    getOnlineAlpacaName,
    getCampusMultiplayerUrl,
    getOnlineCampusUrl,
    getModeSwitchAction,
    getModeSwitchTitle,
    openCampusMultiplayer,
    openOnlineCampus
  });
}());
