import { imageVariantPath, type ImageWidth } from "@/lib/responsive-images";
export const publishedMediaOrigin = "https://bullion-content-compass.lovable.app";
export function publicMediaPath(path: string) {
  return /^[\w.-]{1,200}$/.test(path) && !path.startsWith(".") ? `/api/public/media/${encodeURIComponent(path)}` : null;
}
export async function mediaResponse(path: string, dependencies: {
  isPublished: (url: string) => Promise<boolean>;
  sign: (path: string) => Promise<string | null>;
  deliver?: (url: string) => Promise<Response>;
}, width: ImageWidth | null = null) {
  const url = publicMediaPath(path);
  const missing = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  if (!url || !await dependencies.isPublished(url)) return missing();
  // Variants inherit the original's publication check; they never authorize themselves.
  const variant = width && /\.(png|jpe?g|webp)$/i.test(path) ? await dependencies.sign(imageVariantPath(path, width)) : null;
  const signed = variant || await dependencies.sign(path);
  if (!signed) return missing();
  if (dependencies.deliver) return dependencies.deliver(signed);
  return new Response(null, { status: 302, headers: { Location: signed, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
}