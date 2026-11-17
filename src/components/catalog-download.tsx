import { useQuery } from "@tanstack/react-query";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sectionsQuery } from "@/lib/data";
import { useLang, pick } from "@/lib/i18n";
import { deliverCatalog } from "@/lib/catalog";

export function CatalogDownload({ className, onDownload }: { className?: string; onDownload?: () => void }) {
  const { lang, t } = useLang();
  const { data: sections } = useQuery(sectionsQuery);
  const catalog = sections?.["catalog_download"];
  const url = catalog?.image_url;
  const { data: blob, isFetching, error, refetch } = useQuery({
    queryKey: ["catalog-file", url],
    enabled: !!url,
    retry: 1,
    staleTime: Infinity,
    queryFn: async () => {
      if (!url) throw new Error("Missing catalog");
      const response = await fetch(url);
      if (!response.ok) throw new Error("Catalog download failed");
      const bytes = await response.arrayBuffer();
      if (String.fromCharCode(...new Uint8Array(bytes.slice(0, 5))) !== "%PDF-") throw new Error("Invalid PDF");
      return new Blob([bytes], { type: "application/pdf" });
    },
  });
  const label = pick(catalog, "title", lang) || t("catalog");
  return <Button variant="ghost" className={className} disabled={!url || isFetching}
    title={!url ? pick(catalog, "body", lang) : label}
    onClick={() => {
      if (error) { void refetch(); return; }
      if (!blob) return;
      void deliverCatalog(blob).catch(() => toast.error(lang === "ar" ? "تعذر تنزيل الكتالوج؛ حاول مرة أخرى" : "Unable to download catalog; try again"));
      onDownload?.();
    }}>
    {isFetching ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
    <span className="whitespace-normal">{error ? (lang === "ar" ? "إعادة محاولة تحميل الكتالوج" : "Retry catalog download") : label}</span>
  </Button>;
}