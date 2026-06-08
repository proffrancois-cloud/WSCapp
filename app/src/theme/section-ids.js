(function () {
  const canonicalToRuntime = {
    "monkey-see-monkey-prototype": "monkey-see",
    "more-to-do-than-can-ever-be-listed": "more-to-do",
    "there-s-a-draft-in-here": "theres-a-draft",
    "theres-a-draft-in-here": "theres-a-draft",
    "were-all-in-this-to-get-there": "were-all-in-this",
    "where-were-going-well-still-need-them": "roads-and-futures"
  };

  const runtimeToCanonical = Object.fromEntries(
    Object.entries(canonicalToRuntime).map(([canonicalId, runtimeId]) => [runtimeId, canonicalId])
  );

  function normalizeId(value) {
    return String(value || "").trim();
  }

  function toRuntimeId(sectionId) {
    const id = normalizeId(sectionId);
    return canonicalToRuntime[id] || id;
  }

  function toCanonicalId(sectionId) {
    const id = normalizeId(sectionId);
    return runtimeToCanonical[id] || id;
  }

  function matches(left, right) {
    return toRuntimeId(left) === toRuntimeId(right);
  }

  window.WSC_SECTION_IDS = Object.freeze({
    canonicalToRuntime,
    runtimeToCanonical,
    toRuntimeId,
    toCanonicalId,
    matches
  });
}());
