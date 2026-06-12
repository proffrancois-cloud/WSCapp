(function () {
  const DEFAULT_ONLINE_ALPACA_NAME = "Devalpacca";
  const ALPACA_ONLINE_CAMPUS_URL = "./alpaca-campus-3d/?mode=multiplayer";
  const ACTIONS = Object.freeze({
    openAppEntryGate: "data-open-app-entry-gate",
    openAlpacaOnlineCampus: "data-open-alpaca-online-campus"
  });

  function getOnlineAlpacaName() {
    return DEFAULT_ONLINE_ALPACA_NAME;
  }

  function getOnlineCampusUrl() {
    return ALPACA_ONLINE_CAMPUS_URL;
  }

  function getModeSwitchAction(isOnline) {
    return isOnline ? ACTIONS.openAppEntryGate : ACTIONS.openAlpacaOnlineCampus;
  }

  function getModeSwitchTitle(isOnline) {
    return isOnline ? "Switch mode" : "Open Alpaca Campus 3D";
  }

  function openOnlineCampus(locationObject = window.location) {
    locationObject.href = getOnlineCampusUrl();
  }

  window.WSC_APP_ENTRY_SERVICE = Object.freeze({
    DEFAULT_ONLINE_ALPACA_NAME,
    ALPACA_ONLINE_CAMPUS_URL,
    ACTIONS,
    getOnlineAlpacaName,
    getOnlineCampusUrl,
    getModeSwitchAction,
    getModeSwitchTitle,
    openOnlineCampus
  });
}());
