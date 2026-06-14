(function initAlpacaChannelController(global) {
  "use strict";

  function requiredFunction(collection, name) {
    const value = collection ? collection[name] : null;
    if (typeof value !== "function") {
      throw new Error("WSC Alpaca Channel controller missing function dependency: " + name);
    }
    return value;
  }

  function createAlpacaChannelController(options = {}) {
    const {
      appState: state,
      data = {},
      services = {},
      renderers = {},
      helpers = {},
      callbacks = {}
    } = options;

    if (!state) {
      throw new Error("WSC Alpaca Channel controller missing app state.");
    }

    const videoService = services.videoService || null;
    const alpacaChannelMode = renderers.alpacaChannelMode || null;
    const sectionById = data.sectionById || {};
    const subjectById = data.subjectById || {};
    const bigIdeaRouteById = data.bigIdeaRouteById || {};
    const learnSubjectRouteById = data.learnSubjectRouteById || {};

    const escapeHtml = requiredFunction(helpers, "escapeHtml");
    const getApprovedRawContentSection = requiredFunction(helpers, "getApprovedRawContentSection");
    const getModeAssetPath = requiredFunction(helpers, "getModeAssetPath");
    const getRawEntriesForSelection = requiredFunction(helpers, "getRawEntriesForSelection");
    const getSectionIdFromGuidingTitle = requiredFunction(helpers, "getSectionIdFromGuidingTitle");
    const getSelectedSectionIds = requiredFunction(helpers, "getSelectedSectionIds");
    const getSelectedSectionLabels = requiredFunction(helpers, "getSelectedSectionLabels");
    const getTargetLabel = requiredFunction(helpers, "getTargetLabel");
    const mapRawEntriesWithSection = requiredFunction(helpers, "mapRawEntriesWithSection");
    const normalizeKnowledgeKey = requiredFunction(helpers, "normalizeKnowledgeKey");
    const normalizeSectionId = requiredFunction(helpers, "normalizeSectionId");
    const renderConfiguredMascotAsset = requiredFunction(helpers, "renderConfiguredMascotAsset");
    const renderLearnCardFooterNav = requiredFunction(helpers, "renderLearnCardFooterNav");
    const renderPanelTitle = requiredFunction(helpers, "renderPanelTitle");

    const renderExperienceCallback = requiredFunction(callbacks, "renderExperience");

    function buildExperience() {
      const videos = buildPlaylist();

      return alpacaChannelMode?.buildExperience
        ? alpacaChannelMode.buildExperience(videos, getTargetLabel())
        : {
            type: "channel",
            title: "Alpaca Channel",
            routeTitle: getTargetLabel(),
            videos,
            index: 0
          };
    }

    function renderExperience() {
      if (alpacaChannelMode?.renderExperience) {
        return alpacaChannelMode.renderExperience(state.experience, {
          escapeHtml,
          renderPanelTitle,
          renderConfiguredMascotAsset,
          renderLearnCardFooterNav,
          getModeAssetPath,
          getTargetLabel,
          getSelectedSectionLabels,
          getEmbeddableVideo,
          getVideoPreview,
          isDesktopApp: global.WSC_DESKTOP_APP === true
        });
      }

      const experience = state.experience;
      const videos = experience.videos || [];
      const current = videos[experience.index] || null;
      const routeLabel = getRouteTitleLabel(experience.routeTitle || getTargetLabel());

      if (!current) {
        return `
      ${renderPanelTitle("Alpaca Channel", null, null, { titleHtml: renderTitleMarkup(routeLabel), showSectionSpans: false })}
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
      const canEmbedVideo = Boolean(embeddedVideo) && !global.WSC_DESKTOP_APP;
      const singleVideo = videos.length <= 1;
      const channelDomain = getDomain(routeLabel);
      const description = current.description || `Video from ${current.sectionTitle || experience.routeTitle || getTargetLabel()}.`;

      return `
    ${renderPanelTitle("Alpaca Channel", null, null, { titleHtml: renderTitleMarkup(routeLabel), showSectionSpans: false })}
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

    function renderTitleMarkup(routeLabel = getRouteTitleLabel()) {
      return `
    <span class="channel-panel-title-brand">
      ${renderConfiguredMascotAsset(getModeAssetPath("channel"), "excited", "small", {
        alt: "Alpaca Channel logo",
        slotClass: "channel-panel-title-icon-slot",
        imageClass: "channel-panel-title-icon"
      })}
      <span>Alpaca Channel</span>
      ${routeLabel ? `<span class="channel-panel-section-chip">${escapeHtml(routeLabel)}</span>` : ""}
    </span>
  `;
    }

    function getRouteTitleLabel(fallbackLabel = getTargetLabel()) {
      const labels = getSelectedSectionLabels();
      return labels.length ? labels.join(" \u00b7 ") : fallbackLabel;
    }

    function navigate(direction) {
      const experience = state.experience;
      const didNavigate = alpacaChannelMode?.navigate
        ? alpacaChannelMode.navigate(experience, direction)
        : false;
      if (didNavigate) {
        renderExperienceCallback();
        return;
      }

      if (!experience || experience.type !== "channel" || !experience.videos?.length) {
        return;
      }

      const total = experience.videos.length;
      experience.index = direction === "prev"
        ? (experience.index - 1 + total) % total
        : (experience.index + 1) % total;
      renderExperienceCallback();
    }

    function buildPlaylist() {
      return dedupeVideos([
        ...getRawEntriesForSelection().flatMap((entry) => getEmbeddedVideosForEntry(entry)),
        ...getStandaloneVideosForSelection()
      ]);
    }

    function dedupeVideos(videos) {
      const seen = new Set();
      const output = [];

      (videos || []).forEach((video) => {
        const key = normalizeVideoUrl(video.url);
        if (!key || seen.has(key)) {
          return;
        }
        seen.add(key);
        output.push(video);
      });

      return output;
    }

    function getVideosForEntry(entry) {
      return dedupeVideos([
        ...getEmbeddedVideosForEntry(entry),
        ...getStandaloneVideosForEntry(entry)
      ]);
    }

    function getEmbeddedVideosForEntry(entry) {
      if (!entry) {
        return [];
      }

      return collectVideos(entry, entry.title || "Video", "", entry).map((video) => ({
        ...video,
        entryTitle: entry.title,
        sectionTitle: entry.sectionTitle || entry.guidingSection || ""
      }));
    }

    function getStandaloneVideosForEntry(entry) {
      if (!entry?.title) {
        return [];
      }

      return getCatalogVideos()
        .filter((video) => standaloneVideoMatchesEntry(video, entry))
        .map((video) => createStandaloneVideo(video, entry.sectionId));
    }

    function standaloneVideoMatchesEntry(video, entry) {
      if (!video?.url || !entry?.title) {
        return false;
      }

      const entryTitleKey = normalizeKnowledgeKey(entry.title);
      const videoEntryTitles = normalizeLabelList(video.entryTitles);
      if (!videoEntryTitles.includes(entryTitleKey)) {
        return false;
      }

      const entrySectionId = normalizeSectionId(entry.sectionId || getSectionIdFromGuidingTitle(entry.sectionTitle || entry.guidingSection || ""));
      const videoSectionIds = normalizeIdList(video.sectionIds);

      return !entrySectionId || !videoSectionIds.length || videoSectionIds.includes(entrySectionId);
    }

    function getVideosForSection(sectionId) {
      const canonicalSectionId = normalizeSectionId(sectionId);
      if (!canonicalSectionId) {
        return [];
      }

      const section = getApprovedRawContentSection(canonicalSectionId);
      const embeddedVideos = section
        ? mapRawEntriesWithSection(section, section.entries || []).flatMap((entry) => getEmbeddedVideosForEntry(entry))
        : [];
      const standaloneVideos = getCatalogVideos()
        .filter((video) => normalizeIdList(video.sectionIds).includes(canonicalSectionId))
        .map((video) => createStandaloneVideo(video, canonicalSectionId));

      return dedupeVideos([...embeddedVideos, ...standaloneVideos]);
    }

    function getCatalogVideos() {
      const catalog = typeof data.getCatalog === "function" ? data.getCatalog() : data.alpacaChannelCatalog;
      return Array.isArray(catalog?.videos) ? catalog.videos : [];
    }

    function getStandaloneVideosForSelection() {
      return getCatalogVideos()
        .filter(videoMatchesSelection)
        .map((video) => createStandaloneVideo(video));
    }

    function createStandaloneVideo(video, fallbackSectionId = null) {
      const sectionId = fallbackSectionId || getPrimaryStandaloneVideoSectionId(video);
      const sectionTitle = sectionId && sectionById[sectionId]
        ? sectionById[sectionId].title
        : (video.sectionTitles || [])[0] || getTargetLabel();

      return {
        title: cleanTitle(video.title || "Alpaca Channel video"),
        url: video.url,
        description: cleanDescription(video.description || video.verdict || ""),
        location: "alpaca-channel",
        entryTitle: (video.entryTitles || [])[0] || "",
        sectionTitle,
        source: "alpaca-channel",
        channel: video.channel || "",
        duration: video.duration || "",
        score: video.score || null,
        bigIdeaLabels: Array.isArray(video.bigIdeaLabels) ? video.bigIdeaLabels.slice() : [],
        subjectLabels: Array.isArray(video.subjectLabels) ? video.subjectLabels.slice() : []
      };
    }

    function videoMatchesSelection(video) {
      if (!video || !video.url) {
        return false;
      }

      const selectedSectionIds = getSelectedSectionIds();
      if (state.selection.lens === "section" && selectedSectionIds.length) {
        const selected = new Set(selectedSectionIds);
        return normalizeIdList(video.sectionIds).some((sectionId) => selected.has(sectionId));
      }

      if (state.selection.targetId === "all") {
        return true;
      }

      if (state.selection.lens === "section") {
        return normalizeIdList(video.sectionIds).includes(state.selection.targetId);
      }

      if (state.selection.lens === "bigidea") {
        const route = bigIdeaRouteById[state.selection.targetId];
        const labels = normalizeLabelList(video.bigIdeaLabels);
        const ids = normalizeIdList(video.bigIdeaIds);
        return ids.includes(state.selection.targetId) || (route && labels.includes(normalizeKnowledgeKey(route.label)));
      }

      if (state.selection.lens === "subject") {
        const route = learnSubjectRouteById[state.selection.targetId] || subjectById[state.selection.targetId];
        const labels = normalizeLabelList(video.subjectLabels);
        const ids = normalizeIdList(video.subjectIds);
        return ids.includes(state.selection.targetId) || (route && labels.includes(normalizeKnowledgeKey(route.label)));
      }

      return false;
    }

    function getPrimaryStandaloneVideoSectionId(video) {
      const sectionIds = normalizeIdList(video.sectionIds);
      const selectedSectionIds = getSelectedSectionIds();

      if (state.selection.lens === "section" && selectedSectionIds.length) {
        return selectedSectionIds.find((sectionId) => sectionIds.includes(sectionId)) || sectionIds[0] || null;
      }

      return sectionIds[0] || null;
    }

    function normalizeIdList(values = []) {
      return (Array.isArray(values) ? values : [])
        .map((value) => normalizeSectionId(String(value || "").trim()))
        .filter(Boolean);
    }

    function normalizeLabelList(values = []) {
      return (Array.isArray(values) ? values : [])
        .map((value) => normalizeKnowledgeKey(value))
        .filter(Boolean);
    }

    function collectVideos(value, fallbackTitle, trail = "", entry = null) {
      if (videoService?.collectVideos) {
        return videoService.collectVideos(value, fallbackTitle, trail, entry);
      }

      const videos = [];

      function visit(node, localTitle, localTrail) {
        if (!node) {
          return;
        }

        if (Array.isArray(node)) {
          node.forEach((item, index) => visit(item, localTitle, `${localTrail}[${index}]`));
          return;
        }

        if (typeof node !== "object") {
          return;
        }

        const nodeTitle = cleanTitle(node.sourceTitle || node.title || node.label || node.previewLabel || localTitle || fallbackTitle);
        if (typeof node.url === "string" && isSupportedVideoUrl(node.url)) {
          videos.push({
            title: nodeTitle,
            url: node.url,
            description: getChannelDescription(node, entry),
            location: localTrail || trail || "entry"
          });
        }

        Object.entries(node).forEach(([key, child]) => {
          visit(child, nodeTitle, localTrail ? `${localTrail}.${key}` : key);
        });
      }

      visit(value, fallbackTitle, trail);
      return videos;
    }

    function getChannelDescription(node, entry = null) {
      if (videoService?.getChannelDescription) {
        return videoService.getChannelDescription(node, entry);
      }

      return cleanDescription(
        node.note ||
        node.description ||
        node.caption ||
        entry?.takeaway ||
        entry?.whyItMatters ||
        entry?.studentExplanation ||
        ""
      );
    }

    function cleanDescription(description) {
      if (videoService?.cleanDescription) {
        return videoService.cleanDescription(description);
      }

      return String(description || "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function isSupportedVideoUrl(url) {
      if (videoService?.isSupportedVideoUrl) {
        return videoService.isSupportedVideoUrl(url);
      }

      return Boolean(getEmbeddableVideo(url) || getVideoPreview(url));
    }

    function normalizeVideoUrl(url) {
      if (videoService?.normalizeUrl) {
        return videoService.normalizeUrl(url);
      }

      try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, "");
        if (host === "youtu.be") {
          const videoId = parsed.pathname.split("/").filter(Boolean)[0];
          return videoId ? `youtube:${videoId}` : url;
        }
        if (host === "youtube.com" || host === "m.youtube.com") {
          const videoId = parsed.searchParams.get("v");
          const playlistId = parsed.searchParams.get("list");
          if (videoId) {
            return `youtube:${videoId}`;
          }
          if (playlistId) {
            return `youtube-playlist:${playlistId}`;
          }
        }
      } catch (_error) {
        return url;
      }

      return url;
    }

    function cleanTitle(title) {
      if (videoService?.cleanTitle) {
        return videoService.cleanTitle(title);
      }

      return String(title || "Video")
        .replace(/\s+-\s+YouTube$/i, "")
        .replace(/\s+video$/i, "")
        .trim() || "Video";
    }

    function getDomain(label) {
      if (alpacaChannelMode?.getDomain) {
        return alpacaChannelMode.getDomain(label);
      }

      const slug = String(label || "route")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\u2019']/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .trim() || "route";

      return `www.alpacachannel.${slug}.com`;
    }

    function getEmbeddableVideo(url) {
      if (videoService?.getEmbeddableVideo) {
        return videoService.getEmbeddableVideo(url);
      }

      if (!url) {
        return null;
      }

      try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, "");

        if (host === "youtu.be") {
          const videoId = parsed.pathname.split("/").filter(Boolean)[0];
          if (!videoId) {
            return null;
          }

          return {
            provider: "youtube",
            embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&playsinline=1`
          };
        }

        if (host === "youtube.com" || host === "m.youtube.com") {
          const videoId = parsed.searchParams.get("v");
          const playlistId = parsed.searchParams.get("list");

          if (videoId) {
            const params = new URLSearchParams({ rel: "0" });
            if (playlistId) {
              params.set("list", playlistId);
            }

            return {
              provider: "youtube",
              embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}&playsinline=1`
            };
          }

          if (playlistId) {
            return {
              provider: "youtube",
              embedUrl: `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(playlistId)}&rel=0&playsinline=1`
            };
          }
        }
      } catch (_error) {
        return null;
      }

      return null;
    }

    function getVideoPreview(url) {
      if (videoService?.getPreview) {
        return videoService.getPreview(url);
      }

      if (!url) {
        return null;
      }

      try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace(/^www\./, "");
        let videoId = null;

        if (host === "youtu.be") {
          videoId = parsed.pathname.split("/").filter(Boolean)[0] || null;
        } else if (host === "youtube.com" || host === "m.youtube.com") {
          videoId = parsed.searchParams.get("v");
        }

        if (!videoId) {
          return null;
        }

        return {
          provider: "youtube",
          videoId,
          thumbnailUrl: `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
        };
      } catch (_error) {
        return null;
      }
    }

    return Object.freeze({
      buildExperience,
      renderExperience,
      navigate,
      getVideosForEntry,
      getVideosForSection,
      createStandaloneVideo,
      normalizeVideoUrl,
      getDomain,
      getEmbeddableVideo,
      getVideoPreview
    });
  }

  global.WSC_CREATE_ALPACA_CHANNEL_CONTROLLER = createAlpacaChannelController;
}(window));
