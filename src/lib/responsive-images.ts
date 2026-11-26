import { staticImageVariants } from "@/lib/static-images";

export const imageWidths = [160, 320, 640, 960, 1440, 1920] as const;
export type ImageWidth = (typeof imageWidths)[number];

export function requestedImageWidth(value: string | null): ImageWidth | null {
  const width = Number(value);
  return imageWidths.find(candidate => candidate === width) ?? null;
}

export function imageVariantPath(path: string, width: ImageWidth) {
  return `${path}.w${width}.webp`;
}

export function responsiveImage(src: string | undefined, maxWidth = 1920) {
  const staticVariants = src ? staticImageVariants[src] : undefined;
  if (staticVariants) {
    const variants = staticVariants.filter(variant => variant.width <= maxWidth);
    return { src: variants[variants.length - 1]?.url || src, srcSet: variants.map(variant => `${variant.url} ${variant.width}w`).join(", ") };
  }
  if (!src || !/^\/api\/public\/media\/[\w.%()-]+$/.test(src) || !/\.(png|jpe?g|webp)$/i.test(src)) return {};
  const widths = imageWidths.filter(width => width <= maxWidth);
  return {
    src: `${src}?w=${widths[widths.length - 1] ?? 640}`,
    srcSet: widths.map(width => `${src}?w=${width} ${width}w`).join(", "),
  };
}