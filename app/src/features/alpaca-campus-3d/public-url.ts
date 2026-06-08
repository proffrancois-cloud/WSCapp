const PUBLIC_BASE_URL = import.meta.env.BASE_URL || "/";

export function toCampusPublicUrl(path: string): string {
  const value = String(path || "").trim();

  if (!value || /^(https?:|data:|blob:|file:)/i.test(value)) {
    return value;
  }

  const base = PUBLIC_BASE_URL.endsWith("/") ? PUBLIC_BASE_URL : `${PUBLIC_BASE_URL}/`;
  return `${base}${value.replace(/^\/+/, "")}`;
}
