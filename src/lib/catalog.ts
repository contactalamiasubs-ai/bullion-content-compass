export async function validateCatalogPdf(file: File) {
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (!file.name.toLowerCase().endsWith(".pdf") ||
      String.fromCharCode(...header) !== "%PDF-") {
    throw new Error("اختر ملف PDF صحيحًا");
  }
}

export async function deliverCatalog(blob: Blob) {
  const file = new File([blob], "gold-center-catalog.pdf", { type: "application/pdf" });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: file.name }); return; }
    catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}