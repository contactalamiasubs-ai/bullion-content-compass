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