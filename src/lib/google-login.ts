// Shared, browser-safe helpers for the site's own Google sign-in.
export const googleLoginBridgeUrl = "https://bullion-content-compass.lovable.app/api/public/google-login";
const fixedOrigins = ["https://goldcenterstr.com", "https://www.goldcenterstr.com", "https://bullion-content-compass.lovable.app"];

export function isAllowedLoginOrigin(origin: string) {
  if (fixedOrigins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.origin !== origin) return false;
    if (url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")) return true;
    return url.protocol === "https:" && (url.hostname.endsWith(".lovable.app") || url.hostname.endsWith(".lovableproject.com"));
  } catch { return false; }
}

export function loginRedirectUri(origin: string) {
  if (!isAllowedLoginOrigin(origin)) throw new Error("origin not allowed");
  return `${origin}/api/public/google-login`;
}
