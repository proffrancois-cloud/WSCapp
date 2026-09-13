const ALLOWED_EXTERNAL_PROTOCOLS = new Set(["https:", "http:", "mailto:"]);

function isSafeExternalUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ALLOWED_EXTERNAL_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

module.exports = {
  ALLOWED_EXTERNAL_PROTOCOLS,
  isSafeExternalUrl
};
