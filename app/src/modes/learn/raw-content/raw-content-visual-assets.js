(function () {
  function getSelectionKey(entryIndex, assetIndex) {
    return `${entryIndex}:${assetIndex}`;
  }

  function getSelectedIndex(selections, entryIndex, assetIndex, itemCount) {
    const key = getSelectionKey(entryIndex, assetIndex);
    return Math.max(0, Math.min(itemCount - 1, selections?.[key] ?? 0));
  }

  function versionAssetSrc(src) {
    const value = String(src || "");
    if (
      !value ||
      /[?&]v=/.test(value) ||
      /^(?:https?:|data:|blob:)/i.test(value) ||
      !/^(?:\.\/)?assets\//.test(value)
    ) {
      return value;
    }

    return `${value}${value.includes("?") ? "&" : "?"}v=20260518online8`;
  }

  function renderStudentAssets(entry, entryIndex, selections, helpers) {
    const blocks = [];

    if (entry.specialAssets && entry.specialAssets.length) {
      blocks.push(renderSpecialAssets(entry.specialAssets, entryIndex, selections, helpers));
    }

    if (entry.visualSections && entry.visualSections.length) {
      blocks.push(renderVisualSections(entry.visualSections, entryIndex, helpers));
    } else if (entry.visualGallery && entry.visualGallery.length) {
      blocks.push(renderVisualGallery(entry.visualGallery, entryIndex, helpers));
    }

    if (entry.visualFooterQuestion) {
      blocks.push(renderVisualFooterQuestion(entry.visualFooterQuestion, helpers));
    }

    return blocks.join("");
  }

  function renderSpecialAssets(assets, entryIndex, selections, helpers) {
    return `
      <div class="raw-feature-stack">
        ${assets.map((asset, assetIndex) => renderSpecialAsset(asset, entryIndex, assetIndex, selections, helpers)).join("")}
      </div>
    `;
  }

  function renderSpecialAsset(asset, entryIndex, assetIndex, selections, helpers) {
    switch (asset.kind) {
      case "timeline":
        return renderTimelineAsset(asset, entryIndex, assetIndex, selections, helpers);
      case "route-map":
        return renderRouteMapAsset(asset, entryIndex, assetIndex, selections, helpers);
      case "image-card":
        return renderImageCardAsset(asset, helpers);
      default:
        return "";
    }
  }

  function renderTimelineAsset(asset, entryIndex, assetIndex, selections, helpers) {
    const escapeHtml = helpers.escapeHtml;
    const points = Array.isArray(asset.points) ? asset.points : [];
    if (!points.length) {
      return "";
    }

    const selectedIndex = getSelectedIndex(selections, entryIndex, assetIndex, points.length);
    const activePoint = points[selectedIndex];

    return `
      <section class="raw-feature-card raw-feature-card--timeline">
        <div class="raw-feature-head">
          <span class="challenge-label">${escapeHtml(asset.label || "Interactive timeline")}</span>
          <h4>${escapeHtml(asset.title || "Timeline")}</h4>
        </div>
        ${asset.note ? `<p class="raw-feature-note">${escapeHtml(asset.note)}</p>` : ""}
        <div class="raw-timeline-shell">
          <div class="raw-timeline-track" aria-hidden="true"></div>
          <div class="raw-timeline-points" role="tablist" aria-label="${escapeHtml(asset.title || "Timeline stops")}">
            ${points.map((point, pointIndex) => `
              <button
                class="raw-timeline-point ${pointIndex === selectedIndex ? "active" : ""}"
                type="button"
                data-raw-asset-point="${pointIndex}"
                data-raw-asset-entry-index="${entryIndex}"
                data-raw-asset-index="${assetIndex}"
                aria-pressed="${pointIndex === selectedIndex ? "true" : "false"}"
              >
                <span class="raw-timeline-point-index">${pointIndex + 1}</span>
                <span class="raw-timeline-point-label">${escapeHtml(point.title)}</span>
              </button>
            `).join("")}
          </div>
          <div class="raw-timeline-detail">
            ${activePoint.src ? `
              <div class="raw-timeline-image-shell">
                <img class="raw-timeline-image${activePoint.preserveOriginalColor ? " raw-timeline-image--original" : ""}" src="${escapeHtml(versionAssetSrc(activePoint.src))}" alt="${escapeHtml(activePoint.alt || activePoint.title || "Timeline visual")}" loading="lazy" decoding="async" />
              </div>
            ` : ""}
            <div class="raw-timeline-copy">
              <h5>${escapeHtml(activePoint.title)}</h5>
              ${activePoint.note ? `<p>${escapeHtml(activePoint.note)}</p>` : ""}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderRouteMapAsset(asset, entryIndex, assetIndex, selections, helpers) {
    const escapeHtml = helpers.escapeHtml;
    const pins = Array.isArray(asset.pins) ? asset.pins : [];
    if (!pins.length || !asset.src) {
      return "";
    }

    const selectedIndex = getSelectedIndex(selections, entryIndex, assetIndex, pins.length);
    const activePin = pins[selectedIndex];

    return `
      <section class="raw-feature-card raw-feature-card--map">
        <div class="raw-feature-head">
          <span class="challenge-label">${escapeHtml(asset.label || "Interactive route map")}</span>
          <h4>${escapeHtml(asset.title || "Route map")}</h4>
        </div>
        ${asset.note ? `<p class="raw-feature-note">${escapeHtml(asset.note)}</p>` : ""}
        <div class="raw-route-map-layout">
          <div class="raw-route-map-figure">
            <img class="raw-route-map-image${asset.preserveOriginalColor ? " raw-route-map-image--original" : ""}" src="${escapeHtml(versionAssetSrc(asset.src))}" alt="${escapeHtml(asset.alt || asset.title || "Route map")}" loading="lazy" decoding="async" />
            ${pins.map((pin, pinIndex) => `
              <button
                class="raw-route-map-pin ${pinIndex === selectedIndex ? "active" : ""}"
                type="button"
                style="left:${Number(pin.x)}%; top:${Number(pin.y)}%;"
                data-raw-asset-point="${pinIndex}"
                data-raw-asset-entry-index="${entryIndex}"
                data-raw-asset-index="${assetIndex}"
                aria-label="${escapeHtml(pin.title)}"
                aria-pressed="${pinIndex === selectedIndex ? "true" : "false"}"
              >
                ${escapeHtml(String(pin.number || pinIndex + 1))}
              </button>
            `).join("")}
          </div>
          <div class="raw-route-map-detail">
            <span class="challenge-label">Selected stop</span>
            <h5>${escapeHtml(activePin.title)}</h5>
            ${activePin.note ? `<p>${escapeHtml(activePin.note)}</p>` : ""}
          </div>
        </div>
      </section>
    `;
  }

  function renderImageCardAsset(asset, helpers) {
    const escapeHtml = helpers.escapeHtml;
    if (!asset?.src) {
      return "";
    }

    return `
      <section class="raw-feature-card raw-feature-card--image">
        <div class="raw-feature-head">
          <span class="challenge-label">${escapeHtml(asset.label || "Reference image")}</span>
          <h4>${escapeHtml(asset.title || "Visual")}</h4>
        </div>
        <div class="raw-feature-image-shell">
          <img class="raw-feature-image${asset.preserveOriginalColor ? " raw-feature-image--original" : ""}" src="${escapeHtml(versionAssetSrc(asset.src))}" alt="${escapeHtml(asset.alt || asset.title || "Reference visual")}" loading="lazy" decoding="async" />
        </div>
        ${asset.note ? `<p class="raw-feature-note raw-feature-note--center">${escapeHtml(asset.note)}</p>` : ""}
      </section>
    `;
  }

  function renderVisualSections(sections, entryIndex, helpers) {
    const escapeHtml = helpers.escapeHtml;
    return `
      <div class="raw-visual-sections">
        ${sections.map((section, sectionIndex) => `
          <section class="raw-visual-section">
            <div class="raw-feature-head">
              <h4>${escapeHtml(section.title)}</h4>
            </div>
            ${renderVisualGallery(section.items || [], entryIndex, helpers, sectionIndex)}
          </section>
        `).join("")}
      </div>
    `;
  }

  function renderVisualFooterQuestion(footer, helpers) {
    const escapeHtml = helpers.escapeHtml;
    if (!footer?.question && !footer?.answer) {
      return "";
    }

    return `
      <div class="raw-feature-inline-answer">
        ${footer.question ? `<strong>${escapeHtml(footer.question)}</strong>` : ""}
        ${footer.answer ? `<p>${escapeHtml(footer.answer)}</p>` : ""}
      </div>
    `;
  }

  function renderVisualGallery(items, entryIndex, helpers, sectionIndex = null) {
    const escapeHtml = helpers.escapeHtml;
    return `
      <div class="raw-visual-gallery">
        ${items.map((item, itemIndex) => renderVisualGalleryItem(item, itemIndex, entryIndex, sectionIndex, helpers)).join("")}
      </div>
    `;
  }

  function renderVisualGalleryItem(item, itemIndex, entryIndex, sectionIndex, helpers) {
    const escapeHtml = helpers.escapeHtml;
    const embeddedVideo = helpers.getEmbeddableVideo?.(item.url);
    const previewKind = escapeHtml(item.kind || (embeddedVideo ? "video" : "reference"));
    const preview = item.src
      ? `<img class="raw-visual-image${item.preserveOriginalColor ? " raw-visual-image--original" : ""}" src="${escapeHtml(versionAssetSrc(item.src))}" alt="${escapeHtml(item.title || item.alt || "Raw content visual")}" loading="lazy" decoding="async" />`
      : (item.url || (Array.isArray(item.links) && item.links.length))
        ? renderVisualLinkPreview(item, helpers)
        : renderVisualPreview(item.kind, helpers);
    const content = `
      <div class="raw-visual-preview raw-visual-preview--${previewKind}">
        ${preview}
      </div>
      <span class="raw-visual-title">${escapeHtml(item.title)}</span>
    `;

    if (embeddedVideo) {
      return `
        <article class="raw-visual-card raw-visual-card--embedded-video">
          ${content}
        </article>
      `;
    }

    return `
      <button
        class="raw-visual-card"
        type="button"
        data-open-raw-media="gallery"
        data-raw-media-entry-index="${entryIndex}"
        ${Number.isFinite(sectionIndex) ? `data-raw-media-section-index="${sectionIndex}"` : ""}
        data-raw-media-item-index="${itemIndex}"
        aria-label="Open ${escapeHtml(item.title)}"
      >
        ${content}
      </button>
    `;
  }

  function renderVisualLinkPreview(item, helpers) {
    const escapeHtml = helpers.escapeHtml;
    const video = helpers.getEmbeddableVideo?.(item.url);

    if (video) {
      return `
        <div class="raw-visual-video-wrap">
          <iframe
            class="raw-visual-video-iframe"
            src="${escapeHtml(video.embedUrl)}"
            title="${escapeHtml(item.title || "Embedded video")}"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
      `;
    }

    return `
      <div class="raw-visual-link-preview">
        <span class="raw-visual-link-kicker">${video ? "Video slide" : "Reference slide"}</span>
        <span class="raw-visual-link-name">${escapeHtml(item.previewLabel || (video ? "Play video" : "Open source"))}</span>
      </div>
    `;
  }

  function renderVisualPreview(kind, helpers) {
    const escapeHtml = helpers.escapeHtml;
    switch (kind) {
      case "percent-done":
        return `
          <div class="raw-visual-bar-shell">
            <span class="raw-visual-bar-label">Loading</span>
            <span class="raw-visual-bar-track">
              <span class="raw-visual-bar-fill"></span>
            </span>
            <span class="raw-visual-bar-value">72%</span>
          </div>
        `;
      case "indeterminate":
        return `
          <div class="raw-visual-bar-shell">
            <span class="raw-visual-bar-label">Syncing</span>
            <span class="raw-visual-bar-track raw-visual-bar-track-indeterminate">
              <span class="raw-visual-bar-wave"></span>
            </span>
            <span class="raw-visual-bar-value">Please wait</span>
          </div>
        `;
      case "splash-screen":
        return `
          <div class="raw-visual-splash">
            <span class="raw-visual-splash-logo">A</span>
            <span class="raw-visual-splash-line"></span>
            <span class="raw-visual-splash-dots">
              <span></span><span></span><span></span>
            </span>
          </div>
        `;
      case "console-output":
        return `
          <div class="raw-visual-console">
            <span>&gt; boot sequence</span>
            <span>&gt; loading modules</span>
            <span>&gt; compiling assets</span>
            <span>&gt; ready<span class="raw-visual-console-cursor"></span></span>
          </div>
        `;
      case "skeleton-screen":
        return `
          <div class="raw-visual-skeleton">
            <span class="raw-visual-skeleton-avatar"></span>
            <span class="raw-visual-skeleton-line short"></span>
            <span class="raw-visual-skeleton-line"></span>
            <span class="raw-visual-skeleton-line"></span>
            <span class="raw-visual-skeleton-line short"></span>
          </div>
        `;
      case "throbber":
        return `
          <div class="raw-visual-throbber-shell">
            <span class="raw-visual-throbber"></span>
            <span class="raw-visual-throbber-text">working...</span>
          </div>
        `;
      case "text-slide":
        return `
          <div class="raw-visual-link-preview">
            <span class="raw-visual-link-kicker">Text slide</span>
            <span class="raw-visual-link-name">Open note</span>
          </div>
        `;
      default:
        return `
          <div class="raw-visual-fallback">
            <span>${escapeHtml(kind || "visual")}</span>
          </div>
        `;
    }
  }

  window.WSC_RAW_CONTENT_VISUAL_ASSETS = Object.freeze({
    getSelectionKey,
    renderStudentAssets,
    renderSpecialAssets,
    renderSpecialAsset,
    renderTimelineAsset,
    renderRouteMapAsset,
    renderImageCardAsset,
    renderVisualSections,
    renderVisualFooterQuestion,
    renderVisualGallery,
    renderVisualLinkPreview,
    renderVisualPreview
  });
}());
