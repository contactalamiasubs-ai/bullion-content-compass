/** Stable public URLs cache bytes, never privileged clients or authorization decisions. */
export function cachedMediaBytes(response: Response) {
  if (!response.ok) return new Response("Unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  const type = response.headers.get("Content-Type") || "application/octet-stream";
  const headers = new Headers({
    "Content-Type": type,
    "Cache-Control": "public, max-age=300, s-maxage=300",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox",
  });
  // A media upload must never become an active same-origin HTML document.
  if (!/^(image\/(?!svg\+xml)|audio\/|video\/|application\/pdf(?:;|$))/i.test(type)) {
    headers.set("Content-Type", "application/octet-stream");
    headers.set("Content-Disposition", "attachment");
  }
  for (const name of ["Content-Length", "Content-Range", "Accept-Ranges", "ETag", "Last-Modified"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers });
}