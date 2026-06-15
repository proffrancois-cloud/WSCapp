(function initMindMapOrbitController(global) {
  "use strict";

  function requireObject(value, name) {
    if (!value || typeof value !== "object") {
      throw new Error(`WSC mind map orbit controller requires ${name}.`);
    }
    return value;
  }

  function createMindMapOrbitController(options = {}) {
    const state = requireObject(options.appState, "appState");
    const refs = requireObject(options.refs, "refs");
    const windowRef = options.windowRef || global;
    const documentRef = options.documentRef || global.document;

    let mindMapOrbitAnimationId = null;

    function syncRadialMindMapScroll() {
      if (!refs.experiencePanel || state.experience?.type !== "mindmap") {
        return;
      }

      windowRef.requestAnimationFrame(() => {
        const maps = refs.experiencePanel.querySelectorAll(".mindmap-radial-scroll");
        maps.forEach((map) => {
          const stage = map.querySelector(".mindmap-radial-stage");
          if (!stage) {
            return;
          }

          stage.style.removeProperty("--mindmap-stage-scale");
        });
      });
    }

    function stopMindMapOrbitAnimation() {
      if (mindMapOrbitAnimationId) {
        windowRef.cancelAnimationFrame(mindMapOrbitAnimationId);
        mindMapOrbitAnimationId = null;
      }
    }

    function syncMindMapOrbitAnimation() {
      stopMindMapOrbitAnimation();

      if (!refs.experiencePanel || state.experience?.type !== "mindmap") {
        return;
      }

      if (windowRef.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
        return;
      }

      const stages = [...refs.experiencePanel.querySelectorAll("[data-mindmap-orbit-stage]")];
      if (!stages.length) {
        return;
      }

      let orbitTime = 0;
      let lastFrameTime = null;

      const animate = (frameTime) => {
        if (!refs.experiencePanel || state.experience?.type !== "mindmap") {
          stopMindMapOrbitAnimation();
          return;
        }

        const activeStages = stages.filter((stage) => documentRef.body.contains(stage));
        if (!activeStages.length) {
          stopMindMapOrbitAnimation();
          return;
        }

        if (lastFrameTime === null) {
          lastFrameTime = frameTime;
        }

        const deltaSeconds = Math.min(0.05, Math.max(0, (frameTime - lastFrameTime) / 1000));
        lastFrameTime = frameTime;

        const isPaused = activeStages.some((stage) => stage.matches(":hover") || stage.dataset.orbitPaused === "true");
        if (!isPaused) {
          orbitTime += deltaSeconds;
        }

        activeStages.forEach((stage) => {
          const centerX = Number(stage.dataset.centerX) || stage.offsetWidth / 2;
          const centerY = Number(stage.dataset.centerY) || stage.offsetHeight / 2;
          const nodes = stage.querySelectorAll("[data-mindmap-orbit-entry]");

          nodes.forEach((node) => {
            const radius = Number(node.dataset.orbitRadius) || 0;
            const phase = Number(node.dataset.orbitPhase) || 0;
            const speed = Number(node.dataset.orbitSpeed) || 0;
            const angle = phase + orbitTime * speed;

            node.style.left = `${Math.round(centerX + Math.cos(angle) * radius)}px`;
            node.style.top = `${Math.round(centerY + Math.sin(angle) * radius)}px`;
          });
        });

        mindMapOrbitAnimationId = windowRef.requestAnimationFrame(animate);
      };

      mindMapOrbitAnimationId = windowRef.requestAnimationFrame(animate);
    }

    function navigateMindMapGallery(direction) {
      if (!refs.experiencePanel || state.experience?.type !== "mindmap") {
        return;
      }

      const viewport = refs.experiencePanel.querySelector("[data-mindmap-gallery-viewport]");
      const slides = [...refs.experiencePanel.querySelectorAll("[data-mindmap-gallery-slide]")];
      if (!viewport || slides.length < 2) {
        return;
      }

      const viewportCenter = viewport.scrollLeft + viewport.clientWidth / 2;
      const currentIndex = slides.reduce((nearestIndex, slide, slideIndex) => {
        const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
        const nearestSlide = slides[nearestIndex];
        const nearestCenter = nearestSlide.offsetLeft + nearestSlide.offsetWidth / 2;
        return Math.abs(slideCenter - viewportCenter) < Math.abs(nearestCenter - viewportCenter)
          ? slideIndex
          : nearestIndex;
      }, 0);
      const step = direction === "previous" ? -1 : 1;
      const targetIndex = (currentIndex + step + slides.length) % slides.length;

      slides[targetIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
    }

    return {
      navigateMindMapGallery,
      stopMindMapOrbitAnimation,
      syncMindMapOrbitAnimation,
      syncRadialMindMapScroll
    };
  }

  global.WSC_CREATE_MIND_MAP_ORBIT_CONTROLLER = createMindMapOrbitController;
})(window);
