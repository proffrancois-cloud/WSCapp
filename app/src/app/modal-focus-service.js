(function () {
  const MODAL_SELECTOR = '[role="dialog"][aria-modal="true"]';
  const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  let activeDialog = null;
  let previousFocus = null;
  let backgroundRecords = [];
  let boundDocument = null;

  function isElementVisible(element) {
    if (!element || element.hidden || element.getAttribute("aria-hidden") === "true") {
      return false;
    }

    if (element.getClientRects && element.getClientRects().length > 0) {
      return true;
    }

    return Boolean(element.offsetWidth || element.offsetHeight);
  }

  function isFocusable(element) {
    if (!element || element.disabled || element.inert || !isElementVisible(element)) {
      return false;
    }

    const tabIndex = Number(element.getAttribute("tabindex"));
    return !Number.isFinite(tabIndex) || tabIndex >= 0;
  }

  function getFocusableElements(dialog) {
    return Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isFocusable);
  }

  function getVisibleDialogs(documentRef = document) {
    return Array.from(documentRef.querySelectorAll(MODAL_SELECTOR)).filter(isElementVisible);
  }

  function getActiveDialog(documentRef = document) {
    const dialogs = getVisibleDialogs(documentRef);
    return dialogs.length ? dialogs[dialogs.length - 1] : null;
  }

  function rememberBackgroundSiblings(dialog, documentRef) {
    const body = documentRef.body;
    if (!body || !dialog) {
      return [];
    }

    const path = new Set();
    let node = dialog;
    while (node && node !== body) {
      path.add(node);
      node = node.parentElement;
    }
    path.add(body);

    const records = [];
    path.forEach((parent) => {
      if (parent === dialog) {
        return;
      }

      Array.from(parent.children || []).forEach((child) => {
        if (path.has(child) || child.contains(dialog)) {
          return;
        }

        records.push({
          element: child,
          inert: Boolean(child.inert),
          ariaHidden: child.getAttribute("aria-hidden")
        });
        child.inert = true;
        child.setAttribute("aria-hidden", "true");
      });
    });

    return records;
  }

  function restoreBackgroundSiblings() {
    backgroundRecords.forEach((record) => {
      record.element.inert = record.inert;
      if (record.ariaHidden === null) {
        record.element.removeAttribute("aria-hidden");
      } else {
        record.element.setAttribute("aria-hidden", record.ariaHidden);
      }
    });
    backgroundRecords = [];
  }

  function focusDialog(dialog) {
    const focusable = getFocusableElements(dialog);
    const target =
      dialog.querySelector("[data-modal-initial-focus], [autofocus]") ||
      focusable.find((element) => ["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)) ||
      focusable[0] ||
      dialog;

    if (!dialog.hasAttribute("tabindex")) {
      dialog.setAttribute("tabindex", "-1");
    }

    if (target && target.focus) {
      target.focus({ preventScroll: true });
    }
  }

  function restorePreviousFocus(documentRef) {
    if (
      previousFocus &&
      documentRef.contains(previousFocus) &&
      !previousFocus.closest(MODAL_SELECTOR) &&
      previousFocus.focus
    ) {
      previousFocus.focus({ preventScroll: true });
    }
    previousFocus = null;
  }

  function trapTab(event) {
    if (!activeDialog || event.key !== "Tab") {
      return;
    }

    const focusable = getFocusableElements(activeDialog);
    if (!focusable.length) {
      event.preventDefault();
      activeDialog.focus({ preventScroll: true });
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const current = activeDialog.ownerDocument.activeElement;
    if (event.shiftKey && (!activeDialog.contains(current) || current === first)) {
      event.preventDefault();
      last.focus({ preventScroll: true });
      return;
    }

    if (!event.shiftKey && current === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
  }

  function keepFocusInside(event) {
    if (!activeDialog || activeDialog.contains(event.target)) {
      return;
    }

    focusDialog(activeDialog);
  }

  function bindDocument(documentRef) {
    if (boundDocument === documentRef) {
      return;
    }

    if (boundDocument) {
      boundDocument.removeEventListener("keydown", trapTab, true);
      boundDocument.removeEventListener("focusin", keepFocusInside, true);
    }

    boundDocument = documentRef;
    boundDocument.addEventListener("keydown", trapTab, true);
    boundDocument.addEventListener("focusin", keepFocusInside, true);
  }

  function syncActiveDialog({ documentRef = document } = {}) {
    bindDocument(documentRef);
    const nextDialog = getActiveDialog(documentRef);

    if (nextDialog === activeDialog) {
      if (nextDialog && !nextDialog.contains(documentRef.activeElement)) {
        focusDialog(nextDialog);
      }
      return nextDialog;
    }

    restoreBackgroundSiblings();

    if (!nextDialog) {
      activeDialog = null;
      restorePreviousFocus(documentRef);
      return null;
    }

    if (!activeDialog || !activeDialog.contains(documentRef.activeElement)) {
      previousFocus = documentRef.activeElement;
    }

    activeDialog = nextDialog;
    backgroundRecords = rememberBackgroundSiblings(nextDialog, documentRef);
    focusDialog(nextDialog);
    return nextDialog;
  }

  function reset({ documentRef = document } = {}) {
    restoreBackgroundSiblings();
    activeDialog = null;
    restorePreviousFocus(documentRef);
  }

  window.WSC_MODAL_FOCUS_SERVICE = Object.freeze({
    MODAL_SELECTOR,
    FOCUSABLE_SELECTOR,
    getActiveDialog,
    getFocusableElements,
    syncActiveDialog,
    reset
  });
}());
