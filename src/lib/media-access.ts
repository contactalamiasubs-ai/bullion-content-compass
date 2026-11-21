export const publishedMediaOrigin = "https://bullion-content-compass.lovable.app";
export function publicMediaPath(path: string) {
  return /^[\w.-]{1,200}$/.test(path) && !path.startsWith(".") ? `/api/public/media/${encodeURIComponent(path)}` : null;
}
export async function mediaResponse(path: string, dependencies: {
  isPublished: (url: string) => Promise<boolean>;
  sign: (path: string) => Promise<string | null>;
}) {
  const url = publicMediaPath(path);
  const missing = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!url || !await dependencies.isPublished(url)) return missing();
  const signed = await dependencies.sign(path);
  if (!signed) return missing();
  return new Response(null, { status: 302, headers: { Location: signed, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}