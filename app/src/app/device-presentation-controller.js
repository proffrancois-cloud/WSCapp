(function () {
  function createDevicePresentationController(deps = {}) {
    const win = deps.window || window;
    const doc = deps.document || win.document || document;
    const refs = deps.refs || {};
    const setHtml = deps.setHtml || ((target, markup) => {
      if (target) {
        target.textContent = String(markup || "");
      }
    });
    const clearHtml = deps.clearHtml || ((target) => target?.replaceChildren?.());

    let focusedControlVisibilityFrameId = 0;
    let landscapeOrientationLockBusy = false;
    let landscapeOrientationLockLastAttempt = 0;
    let landscapeOrientationLockUnavailable = false;
    let landscapeOrientationLockFailed = false;
    let landscapeGateLastFocusedElement = null;
    let setupComplete = false;

    function setup() {
      if (setupComplete) {
        return;
      }
      setupComplete = true;

      const syncSoon = () => {
        win.requestAnimationFrame(() => {
          syncState();
          scheduleFocusedControlVisibilityCheck();
        });
      };

      win.addEventListener("resize", syncSoon);
      win.addEventListener("orientationchange", syncSoon);
      win.addEventListener("pageshow", syncSoon);
      doc.addEventListener("visibilitychange", syncSoon);
      win.visualViewport?.addEventListener("resize", syncSoon);
      win.visualViewport?.addEventListener("scroll", syncSoon);
      doc.addEventListener("focusin", scheduleFocusedControlVisibilityCheck, true);
      doc.addEventListener("keydown", handleOrientationGateKeyDown);
      doc.addEventListener("pointerdown", () => {
        const viewport = getViewport();
        if (shouldPreferLandscapePresentation(viewport)) {
          tryLockLandscapeOrientation({ userGesture: true, landscapePreferred: true });
        }
      }, { passive: true });
      refs.orientationGateMount?.addEventListener("click", (event) => {
        if (!event.target.closest("[data-orientation-recheck]")) {
          return;
        }
        tryLockLandscapeOrientation({ userGesture: true, force: true, landscapePreferred: true });
        syncState();
      });
    }

    function scheduleFocusedControlVisibilityCheck() {
      if (focusedControlVisibilityFrameId) {
        win.cancelAnimationFrame(focusedControlVisibilityFrameId);
      }

      focusedControlVisibilityFrameId = win.requestAnimationFrame(() => {
        focusedControlVisibilityFrameId = 0;
        keepFocusedControlVisibleInCompactTouchViewport();
        win.setTimeout(keepFocusedControlVisibleInCompactTouchViewport, 90);
      });
    }

    function keepFocusedControlVisibleInCompactTouchViewport() {
      const viewport = getViewport();
      if (!doc.body.classList.contains("is-touch-landscape") || viewport.height > 540) {
        return;
      }

      const active = doc.activeElement;
      if (!isEditableControl(active)) {
        return;
      }

      const rect = active.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const topPadding = 10;
      const bottomPadding = 14;
      if (rect.top >= topPadding && rect.bottom <= viewport.height - bottomPadding) {
        return;
      }

      const scrollParent = active.closest?.([
        ".auth-modal-window",
        ".app-entry-gate-window",
        ".question-popup-window",
        ".library-campus-window",
        ".library-embedded-doc-window",
        ".raw-media-lightbox-window",
        ".resources-modal-window",
        ".app-settings-window",
        ".experience-panel",
        ".campus2d-online-shell"
      ].join(", "));

      active.scrollIntoView({ block: "center", inline: "nearest", behavior: "auto" });

      if (scrollParent && typeof scrollParent.scrollBy === "function") {
        const nextRect = active.getBoundingClientRect();
        if (nextRect.top < topPadding) {
          scrollParent.scrollBy({ top: nextRect.top - topPadding, behavior: "auto" });
        } else if (nextRect.bottom > viewport.height - bottomPadding) {
          scrollParent.scrollBy({ top: nextRect.bottom - viewport.height + bottomPadding, behavior: "auto" });
        }
      }
    }

    function isEditableControl(element) {
      return Boolean(
        element &&
        element.matches?.("input:not([type='hidden']), textarea, select, [contenteditable='true']")
      );
    }

    function syncState() {
      const viewport = getViewport();
      syncViewportCssMetrics(viewport);
      const touchCapable = isTouchCapableViewport();
      const landscapePreferred = touchCapable && isMobileOrTabletViewport(viewport);
      const isPortrait = viewport.height > viewport.width;
      const needsLandscape = landscapePreferred && isPortrait;
      const isLandscapeTouch = landscapePreferred && !isPortrait;

      doc.body.classList.toggle("is-touch-device", touchCapable);
      doc.body.classList.toggle("prefers-landscape-device", landscapePreferred);
      doc.body.classList.toggle("needs-landscape", needsLandscape);
      doc.body.classList.toggle("is-touch-landscape", isLandscapeTouch);
      doc.documentElement.classList.toggle("needs-landscape", needsLandscape);

      renderOrientationGate(needsLandscape);
      syncGateBackground(needsLandscape);
      if (landscapePreferred) {
        tryLockLandscapeOrientation({ landscapePreferred: true });
      }
    }

    function syncViewportCssMetrics(viewport = getViewport()) {
      if (!doc.documentElement) {
        return;
      }

      doc.documentElement.style.setProperty("--wsc-viewport-width", `${Math.max(1, viewport.width)}px`);
      doc.documentElement.style.setProperty("--wsc-viewport-height", `${Math.max(1, viewport.height)}px`);
    }

    function getViewport() {
      const visualViewport = win.visualViewport;
      const width = Math.round(visualViewport?.width || win.innerWidth || doc.documentElement.clientWidth || 1280);
      const height = Math.round(visualViewport?.height || win.innerHeight || doc.documentElement.clientHeight || 800);
      return { width, height };
    }

    function isTouchCapableViewport() {
      const coarsePointer = win.matchMedia?.("(pointer: coarse)")?.matches;
      const finePointer = win.matchMedia?.("(pointer: fine)")?.matches;
      const anyCoarsePointer = win.matchMedia?.("(any-pointer: coarse)")?.matches;
      const anyFinePointer = win.matchMedia?.("(any-pointer: fine)")?.matches;
      const hoverHover = win.matchMedia?.("(hover: hover)")?.matches;
      const maxTouchPoints = win.navigator.maxTouchPoints || 0;
      const hoverlessTouch = win.matchMedia?.("(hover: none)")?.matches && maxTouchPoints > 0;
      const desktopHybridTouch = (finePointer || anyFinePointer || hoverHover) && !isLikelyTouchFirstPlatform();
      return Boolean(coarsePointer || hoverlessTouch || (anyCoarsePointer && !desktopHybridTouch));
    }

    function isLikelyTouchFirstPlatform() {
      const userAgent = win.navigator.userAgent || "";
      const platform = win.navigator.platform || "";
      const maxTouchPoints = win.navigator.maxTouchPoints || 0;
      return /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(userAgent)
        || (/Mac/i.test(platform) && maxTouchPoints > 1);
    }

    function isMobileOrTabletViewport(viewport) {
      const longEdge = Math.max(viewport.width, viewport.height);
      const shortEdge = Math.min(viewport.width, viewport.height);
      return longEdge <= 1600 && shortEdge <= 1100;
    }

    function shouldPreferLandscapePresentation(viewport = getViewport()) {
      return isTouchCapableViewport() && isMobileOrTabletViewport(viewport);
    }

    function renderOrientationGate(isVisible) {
      if (!refs.orientationGateMount) {
        return;
      }

      if (!isVisible) {
        refs.orientationGateMount.hidden = true;
        refs.orientationGateMount.setAttribute("aria-hidden", "true");
        clearHtml(refs.orientationGateMount);
        delete refs.orientationGateMount.dataset.ready;
        return;
      }

      const lockHelp = landscapeOrientationLockUnavailable || landscapeOrientationLockFailed
        ? `<p class="orientation-gate-help">Unlock rotation, then turn sideways.</p>`
        : `<p class="orientation-gate-help">If nothing changes, unlock rotation and check again.</p>`;

      if (!refs.orientationGateMount.dataset.ready) {
        setHtml(refs.orientationGateMount, `
          <section class="orientation-gate" role="dialog" aria-modal="true" aria-labelledby="orientationGateTitle">
            <div class="orientation-gate-card">
              <div class="orientation-gate-device" aria-hidden="true">
                <span></span>
              </div>
              <div class="orientation-gate-copy">
                <h2 id="orientationGateTitle">Rotate to landscape</h2>
                <p>WSCapp uses landscape on phones and tablets for games, campus, and study boards.</p>
                ${lockHelp}
              </div>
              <button class="button primary orientation-gate-button" type="button" data-orientation-recheck>
                Check again
              </button>
            </div>
          </section>
        `, "orientation-gate");
        refs.orientationGateMount.dataset.ready = "true";
      } else {
        const help = refs.orientationGateMount.querySelector(".orientation-gate-help");
        if (help) {
          help.textContent = landscapeOrientationLockUnavailable || landscapeOrientationLockFailed
            ? "Unlock rotation, then turn sideways."
            : "If nothing changes, unlock rotation and check again.";
        }
      }

      refs.orientationGateMount.hidden = false;
      refs.orientationGateMount.setAttribute("aria-hidden", "false");
      focusOrientationGate();
    }

    function focusOrientationGate() {
      const gate = refs.orientationGateMount?.querySelector(".orientation-gate");
      if (!gate || gate.contains(doc.activeElement)) {
        return;
      }

      if (doc.activeElement && doc.activeElement !== doc.body) {
        landscapeGateLastFocusedElement = doc.activeElement;
      }

      gate.querySelector("[data-orientation-recheck]")?.focus({ preventScroll: true });
    }

    function restoreOrientationGateFocus() {
      if (!landscapeGateLastFocusedElement?.isConnected) {
        landscapeGateLastFocusedElement = null;
        return;
      }

      const target = landscapeGateLastFocusedElement;
      landscapeGateLastFocusedElement = null;
      target.focus?.({ preventScroll: true });
    }

    function handleOrientationGateKeyDown(event) {
      if (!doc.body.classList.contains("needs-landscape")) {
        return;
      }

      const gate = refs.orientationGateMount?.querySelector(".orientation-gate");
      if (!gate) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        gate.querySelector("[data-orientation-recheck]")?.focus({ preventScroll: true });
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = [...gate.querySelectorAll("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = win.getComputedStyle(element);
          return !element.disabled && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        });
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    }

    function syncGateBackground(isVisible) {
      [...doc.body.children].forEach((child) => {
        if (child === refs.orientationGateMount) {
          return;
        }

        if (isVisible) {
          if (!child.dataset.orientationGateManaged) {
            child.dataset.orientationGateManaged = "true";
            if (child.hasAttribute("aria-hidden")) {
              child.dataset.orientationGatePreviousAriaHidden = child.getAttribute("aria-hidden") || "";
            }
          }
          child.inert = true;
          child.setAttribute("aria-hidden", "true");
          return;
        }

        if (child.dataset.orientationGateManaged) {
          child.inert = false;
          if (child.dataset.orientationGatePreviousAriaHidden !== undefined) {
            child.setAttribute("aria-hidden", child.dataset.orientationGatePreviousAriaHidden);
          } else {
            child.removeAttribute("aria-hidden");
          }
          delete child.dataset.orientationGateManaged;
          delete child.dataset.orientationGatePreviousAriaHidden;
        }
      });

      if (!isVisible) {
        restoreOrientationGateFocus();
      }
    }

    function tryLockLandscapeOrientation({ force = false, landscapePreferred = false, userGesture = false } = {}) {
      if (!landscapePreferred && !shouldPreferLandscapePresentation()) {
        return;
      }

      const orientation = win.screen?.orientation;
      if (!orientation?.lock || doc.visibilityState === "hidden" || landscapeOrientationLockBusy) {
        if (!orientation?.lock) {
          landscapeOrientationLockUnavailable = true;
        }
        return;
      }

      const now = Date.now();
      const cooldownMs = userGesture ? 2500 : 5000;
      if (!force && now - landscapeOrientationLockLastAttempt < cooldownMs) {
        return;
      }

      landscapeOrientationLockBusy = true;
      landscapeOrientationLockLastAttempt = now;
      Promise.resolve(orientation.lock("landscape"))
        .then(() => {
          landscapeOrientationLockFailed = false;
          landscapeOrientationLockUnavailable = false;
        })
        .catch(() => {
          landscapeOrientationLockFailed = true;
          renderOrientationGate(doc.body.classList.contains("needs-landscape"));
        })
        .finally(() => {
          landscapeOrientationLockBusy = false;
        });
    }

    function isTouchLandscapeActive() {
      return doc.body.classList.contains("is-touch-landscape");
    }

    return {
      setup,
      syncState,
      syncGateBackground,
      getViewport,
      isTouchLandscapeActive,
      scheduleFocusedControlVisibilityCheck
    };
  }

  window.WSC_CREATE_DEVICE_PRESENTATION_CONTROLLER = createDevicePresentationController;
}());
