(function () {
  function renderToggle(entry, options = {}, helpers) {
    const escapeHtml = helpers.escapeHtml;
    const key = helpers.getEntryMasteryKey(entry);
    const mastered = helpers.isEntryMastered(entry);
    const quickActions = options.includeBackToTop ? renderQuickActions(entry, options.entryIndex, helpers) : "";

    return `
      <div class="raw-mastery-row ${options.includeBackToTop ? "with-back-to-top" : ""}">
        ${quickActions}
        <button
          class="raw-mastery-toggle ${mastered ? "mastered" : ""}"
          type="button"
          data-raw-mastery-toggle="${escapeHtml(key)}"
          aria-pressed="${mastered ? "true" : "false"}"
        >
          <span>Not mastered yet</span>
          <span>Mastered</span>
        </button>
      </div>
    `;
  }

  function renderQuickActions(entry, entryIndex, helpers) {
    return `
      <div class="raw-entry-actions">
        ${renderBackToTopButton(helpers)}
        ${renderEntryChannelLinks(entry, entryIndex, helpers)}
      </div>
    `;
  }

  function renderBackToTopButton(helpers) {
    const escapeHtml = helpers.escapeHtml;
    const asset = helpers.getAssetValue(["icons", "ui", "backToTop"], "./assets/mascot/library/final-pack/Backtotop.png");

    return `
      <button
        class="raw-entry-back-to-top"
        type="button"
        data-back-to-top
        aria-label="Back to top"
        title="Back to top"
      >
        <img src="${escapeHtml(asset)}" alt="" aria-hidden="true" />
      </button>
    `;
  }

  function renderEntryChannelLinks(entry, entryIndex, helpers) {
    const escapeHtml = helpers.escapeHtml;
    const videos = helpers.getAlpacaChannelVideosForEntry(entry);
    if (!videos.length) {
      return "";
    }

    const videoCount = videos.length;
    const titleList = videos.map((video) => video.title || "Video").join(", ");

    return `
      <button
        class="raw-entry-channel-link"
        type="button"
        data-open-raw-media="entry-channel"
        data-raw-media-entry-index="${Number(entryIndex)}"
        data-raw-media-item-index="0"
        aria-label="Open ${videoCount} Alpaca Channel ${videoCount === 1 ? "video" : "videos"}: ${escapeHtml(titleList)}"
        title="${escapeHtml(titleList)}"
      >
        <img src="${escapeHtml(helpers.getModeAssetPath("channel"))}" alt="" aria-hidden="true" />
        <span>Alpaca Channel</span>
        ${videoCount > 1 ? `<span class="raw-entry-channel-count">${videoCount} videos</span>` : ""}
      </button>
    `;
  }

  window.WSC_RAW_CONTENT_MASTERY = Object.freeze({
    renderToggle,
    renderQuickActions,
    renderBackToTopButton,
    renderEntryChannelLinks
  });
}());
