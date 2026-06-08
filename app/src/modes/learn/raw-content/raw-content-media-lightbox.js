(function () {
  function getLinkItems(item) {
    const explicitLinks = Array.isArray(item.links)
      ? item.links.filter((link) => link && link.url)
      : [];

    if (explicitLinks.length) {
      return explicitLinks;
    }

    if (item.url) {
      return [
        {
          label: item.previewLabel || "Open source",
          url: item.url
        }
      ];
    }

    return [];
  }

  function renderLinkButtons(item, escapeHtml) {
    const links = getLinkItems(item);
    if (!links.length) {
      return "";
    }

    return `
      <div class="raw-media-lightbox-link-list">
        ${links.map((link) => `
          <a class="raw-media-lightbox-link-button" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">
            ${escapeHtml(link.label || "Open source")}
          </a>
        `).join("")}
      </div>
    `;
  }

  function renderLightbox(lightbox, helpers) {
    if (!lightbox || !lightbox.items?.length) {
      return "";
    }

    const escapeHtml = helpers.escapeHtml;
    const current = lightbox.items[lightbox.index];
    const multi = lightbox.items.length > 1;
    const hasImage = Boolean(current.src);
    const hasLink = getLinkItems(current).length > 0;
    const embeddedVideo = !hasImage ? helpers.getEmbeddableVideo(current.url) : null;
    const videoPreview = !hasImage ? helpers.getVideoPreview(current.url) : null;
    const canEmbedVideo = Boolean(embeddedVideo) && !helpers.isDesktopApp;
    const hasVideoPreview = Boolean(videoPreview);
    const anchor = lightbox.anchor || null;
    const anchorStyle = anchor
      ? ` style="--raw-media-anchor-left: ${Math.max(0, Math.round(Number(anchor.left) || 0))}px; --raw-media-anchor-top: ${Math.max(0, Math.round(Number(anchor.top) || 0))}px;"`
      : "";
    const anchorClass = anchor ? " raw-media-lightbox-overlay--anchored" : "";

    return `
      <div class="raw-media-lightbox-overlay${anchorClass}" data-close-raw-media role="dialog" aria-modal="true" aria-label="Raw content media viewer"${anchorStyle}>
        <div class="raw-media-lightbox-window" data-raw-media-window>
          <button class="popup-close-button" type="button" data-close-raw-media aria-label="Close media viewer">
            <span aria-hidden="true">×</span>
          </button>
          <div class="raw-media-lightbox-stack">
            <div class="raw-media-lightbox-top">
              <p class="challenge-label">Raw Content visual</p>
              <h3>${escapeHtml(current.title || "Visual")}</h3>
            </div>
            <div class="raw-media-lightbox-frame">
              ${multi ? `<button class="raw-media-lightbox-nav prev" type="button" data-raw-media-nav="prev" aria-label="Previous visual">‹</button>` : ""}
              <div class="raw-media-lightbox-asset ${hasImage ? "" : canEmbedVideo ? "video-slide" : hasVideoPreview ? "video-preview-slide" : "link-slide"}">
                ${hasImage ? `
                  <img class="raw-media-lightbox-image${current.preserveOriginalColor ? " original-color" : ""}" src="${escapeHtml(current.src)}" alt="${escapeHtml(current.title || "Raw content visual")}" />
                ` : canEmbedVideo ? `
                  <div class="raw-media-lightbox-video-wrap">
                    <iframe
                      class="raw-media-lightbox-iframe"
                      src="${escapeHtml(embeddedVideo.embedUrl)}"
                      title="${escapeHtml(current.title || "Embedded video")}"
                      loading="lazy"
                      referrerpolicy="strict-origin-when-cross-origin"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowfullscreen
                    ></iframe>
                  </div>
                ` : hasVideoPreview ? `
                  <div class="raw-media-lightbox-video-preview">
                    <img class="raw-media-lightbox-video-thumb" src="${escapeHtml(videoPreview.thumbnailUrl)}" alt="${escapeHtml(current.title || "Video preview")}" loading="lazy" referrerpolicy="no-referrer" />
                    <div class="raw-media-lightbox-video-copy">
                      <span class="challenge-label">Video preview</span>
                      <p class="raw-media-lightbox-note">YouTube blocks direct playback inside the local Mac app, so this slide opens the original video reliably in your browser.</p>
                      ${renderLinkButtons(current, escapeHtml)}
                    </div>
                  </div>
                ` : `
                  <div class="raw-media-lightbox-link-slide">
                    <span class="challenge-label">Reference slide</span>
                    <h4>${escapeHtml(current.title || "Reference")}</h4>
                    ${current.note ? `<p class="raw-media-lightbox-note">${escapeHtml(current.note)}</p>` : ""}
                    ${renderLinkButtons(current, escapeHtml)}
                  </div>
                `}
              </div>
              ${multi ? `<button class="raw-media-lightbox-nav next" type="button" data-raw-media-nav="next" aria-label="Next visual">›</button>` : ""}
            </div>
            ${((hasImage || canEmbedVideo) && (current.note || hasLink)) ? `
              <div class="raw-media-lightbox-meta">
                ${current.note ? `<p class="raw-media-lightbox-note">${escapeHtml(current.note)}</p>` : ""}
                ${renderLinkButtons(current, escapeHtml)}
              </div>
            ` : ""}
            ${multi ? `
              <div class="raw-media-lightbox-footer">
                <span>${lightbox.index + 1} / ${lightbox.items.length}</span>
                <span>Swipe or use the arrows to move through the set.</span>
              </div>
            ` : ""}
          </div>
        </div>
      </div>
    `;
  }

  window.WSC_RAW_CONTENT_MEDIA_LIGHTBOX = Object.freeze({
    getLinkItems,
    renderLinkButtons,
    renderLightbox
  });
}());
