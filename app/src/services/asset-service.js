(function () {
  function createAssetService(assetConfig) {
    function getValue(path, fallback = null) {
      let current = assetConfig || {};

      for (const key of path || []) {
        if (!current || typeof current !== "object" || !(key in current)) {
          return fallback;
        }
        current = current[key];
      }

      return current ?? fallback;
    }

    function getWizardCardAsset(asset) {
      if (!asset || typeof asset !== "string") {
        return asset;
      }

      const prefix = "./assets/mascot/library/final-pack/";
      if (!asset.startsWith(prefix)) {
        return asset;
      }

      const relativePath = asset.slice(prefix.length);
      if (relativePath.includes("/")) {
        return asset;
      }

      const fileName = relativePath.split("/").pop();
      if (!fileName || ["Flashcards.png", "schalorsbowl.png"].includes(fileName)) {
        return asset;
      }

      return `${prefix}card-crops/${fileName}`;
    }

    function getTargetPath(targetId, lensId) {
      if (!targetId) {
        return null;
      }

      if (targetId === "all") {
        return getValue(["contexts", "targets", "all"]);
      }

      const branch = lensId === "subject"
        ? "subject"
        : lensId === "bigidea"
          ? "bigidea"
          : "section";

      return getValue(["contexts", "targets", branch, targetId]);
    }

    function getModePath(modeId) {
      return modeId ? getValue(["contexts", "modes", modeId]) : null;
    }

    function getGameplayPath(stage, modeId) {
      return modeId ? getValue(["contexts", "gameplay", stage, modeId]) : null;
    }

    function getResultPath(modeId, outcome = "success") {
      return modeId ? getValue(["contexts", "results", modeId, outcome]) : null;
    }

    return Object.freeze({
      getValue,
      getWizardCardAsset,
      getTargetPath,
      getModePath,
      getGameplayPath,
      getResultPath
    });
  }

  window.WSC_ASSET_SERVICE = createAssetService(window.WSC_ASSETS || {});
  window.WSC_CREATE_ASSET_SERVICE = createAssetService;
}());
