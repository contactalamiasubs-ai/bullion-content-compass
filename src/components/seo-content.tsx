import Markdown from "react-markdown";
import { SeoImage } from "@/components/seo-image";
export function SeoContent({ body }: { body: string }) {
  return <article className="space-y-4 whitespace-pre-line text-lg leading-loose text-foreground/90"><Markdown components={{
    h1: ({ children }) => <h2 className="mt-8 text-2xl font-semibold text-gold">{children}</h2>,
    h2: ({ children }) => <h2 className="mt-8 text-2xl font-semibold text-gold">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-6 text-xl font-semibold">{children}</h3>,
    a: ({ href, children }) => <a className="text-gold underline" href={href} {...(href?.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{children}</a>,
    img: ({ src, alt }) => <SeoImage src={src} alt={alt ?? ""} loading="lazy" width={1000} height={600} sizes="(max-width: 767px) calc(100vw - 32px), 1000px" className="h-auto w-full object-contain" />,
  }}>{body}</Markdown></article>;
}