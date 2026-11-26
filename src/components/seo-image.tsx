import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { useQuery } from "@tanstack/react-query";
import { seoBundleQuery } from "@/lib/seo-public.functions";
import { useLang } from "@/lib/i18n";
import { imageAlt } from "@/lib/seo";
import { responsiveImage } from "@/lib/responsive-images";

type Props = ImgHTMLAttributes<HTMLImageElement> & { maxWidth?: number };
export function SeoImage({ src, alt = "", maxWidth = 1920, loading = "lazy", sizes = "(max-width: 767px) 100vw, 50vw", onError, ...props }: Props) {
  const { data } = useQuery(seoBundleQuery); const { lang } = useLang();
  const record = data?.images.find(i => i.url === src);
  const image = record?.optimized_url || src;
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const element = useRef<HTMLImageElement>(null);
  const useOriginal = !!image && failedImage === image;
  const responsive = useOriginal ? {} : responsiveImage(image, maxWidth);
  useEffect(() => {
    // Initial requests can fail before React attaches the error handler.
    if (element.current?.complete && element.current.naturalWidth === 0 && !useOriginal && image && (image !== src || responsive.srcSet)) setFailedImage(image);
  }, [image, src, useOriginal, responsive.srcSet]);
  return <img ref={element} decoding="async" loading={loading} sizes={sizes} {...props} {...responsive} srcSet={useOriginal ? undefined : responsive.srcSet || props.srcSet} src={useOriginal ? src : responsive.src || image} alt={data ? imageAlt(data,src,alt,lang) : alt} onError={event => {
    // A missing optimized copy must not hide an otherwise valid original.
    if (!useOriginal && image && (image !== src || responsive.srcSet)) setFailedImage(image);
    onError?.(event);
  }} />;
}