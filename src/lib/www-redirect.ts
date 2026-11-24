/**
 * Returns the bare-domain URL a www request should be permanently redirected to,
 * or null when the request is already on the main address (or on localhost / Lovable hosts).
 */
export function wwwRedirectTarget(requestUrl: string, hostHeader?: string | null): string | null {
  const url = new URL(requestUrl);
  const rawHost = (hostHeader ?? url.host).split(",")[0]?.trim().toLowerCase() ?? "";
  if (!rawHost.startsWith("www.")) return null;
  const bareHost = rawHost.slice(4);
  if (!bareHost.includes(".")) return null;
  return `https://${bareHost}${url.pathname}${url.search}`;
}
