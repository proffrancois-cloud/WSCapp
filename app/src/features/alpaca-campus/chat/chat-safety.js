(function () {
  const MAX_CHAT_LENGTH = 180;
  const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const spacedEmailPattern = /\b[A-Z0-9._%+-]+\s*(?:@|\bat\b)\s*[A-Z0-9.-]+\s*(?:\.|\bdot\b)\s*[A-Z]{2,}\b/gi;
  const collapsedWhitespacePattern = /\s+/g;

  function redactSensitiveText(value) {
    return String(value || "")
      .replace(emailPattern, "[hidden contact]")
      .replace(spacedEmailPattern, "[hidden contact]");
  }

  function normalizeChatMessage(value) {
    const trimmed = redactSensitiveText(value)
      .replace(collapsedWhitespacePattern, " ")
      .trim()
      .slice(0, MAX_CHAT_LENGTH);

    return {
      ok: Boolean(trimmed),
      text: trimmed,
      maxLength: MAX_CHAT_LENGTH,
      safety: {
        profanityFilter: "placeholder",
        mute: "placeholder",
        report: "placeholder"
      }
    };
  }

  window.WSC_ALPACA_CAMPUS_CHAT_SAFETY = Object.freeze({
    MAX_CHAT_LENGTH,
    redactSensitiveText,
    normalizeChatMessage
  });
}());
