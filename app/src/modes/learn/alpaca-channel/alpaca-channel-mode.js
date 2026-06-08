(function () {
  function buildExperience(videos, routeTitle) {
    return {
      type: "channel",
      title: "Alpaca Channel",
      routeTitle,
      videos,
      index: 0
    };
  }

  function renderExperience(experience, helpers) {
    const escapeHtml = helpers.escapeHtml;
    const renderPanelTitle = helpers.renderPanelTitle;
    const renderConfiguredMascotAsset = helpers.renderConfiguredMascotAsset;
    const renderLearnCardFooterNav = helpers.renderLearnCardFooterNav;
    const getModeAssetPath = helpers.getModeAssetPath;
    const getTargetLabel = helpers.getTargetLabel;
    const getEmbeddableVideo = helpers.getEmbeddableVideo;
    const getVideoPreview = helpers.getVideoPreview;
    const isDesktopApp = helpers.isDesktopApp === true;
    const videos = experience.videos || [];
    const current = videos[experience.index] || null;
    const routeLabel = getRouteTitleLabel(helpers, experience.routeTitle || getTargetLabel());
    const titleMarkup = renderChannelTitleMarkup(helpers, routeLabel);

    if (!current) {
      return `
        ${renderPanelTitle("Alpaca Channel", null, null, { titleHtml: titleMarkup, showSectionSpans: false })}
        <div class="channel-empty">
          ${renderConfiguredMascotAsset(getModeAssetPath("channel"), "thinking", "medium", {
            alt: "Alpaca Channel alpaca",
            slotClass: "channel-empty-icon-slot",
            imageClass: "channel-empty-icon"
          })}
          <div>
            <h3>No videos on this route yet</h3>
            <p>Alpaca Channel is ready, but this selected route does not currently include YouTube video links in its app-visible raw entries.</p>
          </div>
        </div>
        ${renderLearnCardFooterNav("channel")}
      `;
    }

    const previous = videos[(experience.index - 1 + videos.length) % videos.length];
    const next = videos[(experience.index + 1) % videos.length];
    const embeddedVideo = getEmbeddableVideo(current.url);
    const videoPreview = getVideoPreview(current.url);
    const canEmbedVideo = Boolean(embeddedVideo) && !isDesktopApp;
    const singleVideo = videos.length <= 1;
    const channelDomain = getDomain(routeLabel);
    const description = current.description || `Video from ${current.sectionTitle || experience.routeTitle || getTargetLabel()}.`;

    return `
      ${renderPanelTitle("Alpaca Channel", null, null, { titleHtml: titleMarkup, showSectionSpans: false })}
      <div class="channel-shell">
        <article class="channel-browser" aria-label="Alpaca Channel video player">
          <div class="channel-browser-bar">
            <div class="channel-window-dots" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
            <div class="channel-address-pill">
              <span>${escapeHtml(channelDomain)}</span>
            </div>
          </div>
          <div class="channel-youtube-copy">
            <h2>${escapeHtml(current.title)}</h2>
          </div>
          <div class="channel-video-frame">
            ${canEmbedVideo ? `
              <iframe
                class="channel-video-iframe"
                src="${escapeHtml(embeddedVideo.embedUrl)}"
                title="${escapeHtml(current.title)}"
                loading="lazy"
                referrerpolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
              <a class="channel-open-link" href="${escapeHtml(current.url)}" target="_blank" rel="noreferrer">Open on YouTube</a>
            ` : videoPreview ? `
              <a class="channel-video-fallback" href="${escapeHtml(current.url)}" target="_blank" rel="noreferrer">
                <img src="${escapeHtml(videoPreview.thumbnailUrl)}" alt="${escapeHtml(current.title)}" loading="lazy" referrerpolicy="no-referrer" />
                <span>Open video</span>
              </a>
            ` : `
              <a class="channel-video-fallback no-thumb" href="${escapeHtml(current.url)}" target="_blank" rel="noreferrer">
                <span>Open video</span>
              </a>
            `}
          </div>
          <div class="channel-description">
            <h3>Description</h3>
            <p>${escapeHtml(description)}</p>
          </div>
          <div class="channel-browser-footer">
            <button class="button secondary channel-nav-button" type="button" data-channel-nav="prev" ${singleVideo ? "disabled" : ""}>
              <span class="channel-nav-label">Last video</span>
              <span class="channel-nav-title">${escapeHtml(previous.title)}</span>
            </button>
            <div class="channel-video-count">${experience.index + 1} / ${videos.length}</div>
            <button class="button primary channel-nav-button" type="button" data-channel-nav="next" ${singleVideo ? "disabled" : ""}>
              <span class="channel-nav-label">Next video</span>
              <span class="channel-nav-title">${escapeHtml(next.title)}</span>
            </button>
          </div>
        </article>
      </div>
      ${renderLearnCardFooterNav("channel")}
    `;
  }

  function renderChannelTitleMarkup(helpers, routeLabel) {
    const escapeHtml = helpers.escapeHtml;
    return `
      <span class="channel-panel-title-brand">
        ${helpers.renderConfiguredMascotAsset(helpers.getModeAssetPath("channel"), "excited", "small", {
          alt: "Alpaca Channel logo",
          slotClass: "channel-panel-title-icon-slot",
          imageClass: "channel-panel-title-icon"
        })}
        <span>Alpaca Channel</span>
        ${routeLabel ? `<span class="channel-panel-section-chip">${escapeHtml(routeLabel)}</span>` : ""}
      </span>
    `;
  }

  function getRouteTitleLabel(helpers, fallbackLabel) {
    const labels = typeof helpers.getSelectedSectionLabels === "function"
      ? helpers.getSelectedSectionLabels()
      : [];
    return labels.length ? labels.join(" · ") : fallbackLabel;
  }

  function navigate(experience, direction) {
    if (!experience || experience.type !== "channel" || !experience.videos?.length) {
      return false;
    }

    const total = experience.videos.length;
    experience.index = direction === "prev"
      ? (experience.index - 1 + total) % total
      : (experience.index + 1) % total;
    return true;
  }

  function getDomain(label) {
    const slug = String(label || "route")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .trim() || "route";

    return `www.alpacachannel.${slug}.com`;
  }

  window.WSC_ALPACA_CHANNEL_MODE = Object.freeze({
    buildExperience,
    renderExperience,
    navigate,
    getDomain
  });
}());
