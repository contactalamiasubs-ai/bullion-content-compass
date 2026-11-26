import type { ImgHTMLAttributes } from "react";
import { useQuery } from "@tanstack/react-query";
import { seoBundleQuery } from "@/lib/seo-public.functions";
import { useLang } from "@/lib/i18n";
import { imageAlt } from "@/lib/seo";
import { responsiveImage } from "@/lib/responsive-images";

type Props = ImgHTMLAttributes<HTMLImageElement> & { maxWidth?: number };
export function SeoImage({ src, alt = "", maxWidth = 1920, loading = "lazy", sizes = "(max-width: 767px) 100vw, 50vw", ...props }: Props) {
  const { data } = useQuery(seoBundleQuery); const { lang } = useLang();
  const record = data?.images.find(i => i.url === src);
  const image = record?.optimized_url || src;
  const responsive = responsiveImage(image, maxWidth);
  return <img decoding="async" loading={loading} sizes={sizes} {...props} {...responsive} src={responsive.src || image} alt={data ? imageAlt(data,src,alt,lang) : alt} />;
}