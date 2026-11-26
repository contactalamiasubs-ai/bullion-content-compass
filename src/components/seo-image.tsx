import type { ImgHTMLAttributes } from "react";
import { useQuery } from "@tanstack/react-query";
import { seoBundleQuery } from "@/lib/seo-public.functions";
import { useLang } from "@/lib/i18n";
import { imageAlt } from "@/lib/seo";
export function SeoImage({ src, alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const { data } = useQuery(seoBundleQuery); const { lang } = useLang();
  const record = data?.images.find(i => i.url === src);
  return <img {...props} src={record?.optimized_url || src} alt={data ? imageAlt(data,src,alt,lang) : alt} />;
}