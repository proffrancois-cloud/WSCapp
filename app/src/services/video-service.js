(function () {
  function getEmbeddableVideo(url) {
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

  function getPreview(url) {
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

  function isSupportedVideoUrl(url) {
    return Boolean(getEmbeddableVideo(url) || getPreview(url));
  }

  function normalizeUrl(url) {
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
    return String(title || "Video")
      .replace(/\s+-\s+YouTube$/i, "")
      .replace(/\s+video$/i, "")
      .trim() || "Video";
  }

  function cleanDescription(description) {
    return String(description || "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getChannelDescription(node, entry = null) {
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

  function collectVideos(value, fallbackTitle, trail = "", entry = null) {
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

  window.WSC_VIDEO_SERVICE = Object.freeze({
    getEmbeddableVideo,
    getPreview,
    isSupportedVideoUrl,
    normalizeUrl,
    cleanTitle,
    cleanDescription,
    getChannelDescription,
    collectVideos
  });
}());
