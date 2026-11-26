import { imageWidths, imageVariantPath } from "@/lib/responsive-images";

/** Preserve the original resolution and derive smaller display copies at high quality. */
export async function createImageVariants(file: File, path: string) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 20_000_000) return [];
  const bitmap = await createImageBitmap(file);
  try {
    const variants: { path: string; file: Blob }[] = [];
    for (const width of imageWidths) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(width, bitmap.width);
      canvas.height = Math.max(1, Math.round(bitmap.height * canvas.width / bitmap.width));
      const context = canvas.getContext("2d");
      if (!context) continue;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/webp", 0.94));
      if (blob?.type === "image/webp" && blob.size < file.size) variants.push({ path: imageVariantPath(path, width), file: blob });
    }
    return variants;
  } finally { bitmap.close(); }
}

export async function optimizeUploadedImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 100_000 || file.size > 20_000_000) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) { bitmap.close(); return file; }
    context.drawImage(bitmap,0,0); bitmap.close();
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve,"image/webp",0.94));
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, {type:"image/webp"});
  } catch { return file; }
}