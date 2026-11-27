import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { seoBundleQuery } from "@/lib/seo-public.functions";
type AnalyticsWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
export function SeoAnalytics() {
  const { data } = useQuery(seoBundleQuery); const location = useLocation();
  const id = data?.config?.measurement_id || import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY"];
  useEffect(() => {
    if (!id || !/^G-[A-Z0-9]+$/.test(id)) return;
    const w = window as AnalyticsWindow;
    const existing = document.getElementById("goldcenter-ga4");
    if (!existing) {
      w.dataLayer = w.dataLayer ?? [];
      w.gtag = function () { w.dataLayer?.push(arguments); };
      w.gtag("set", "developer_id.dZjgwMW", true); w.gtag("js", new Date());
      const script = document.createElement("script"); script.id = "goldcenter-ga4"; script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`; script.async = true; document.head.appendChild(script);
      w.gtag("config", id, { send_page_view: false });
    }
    if (!/^\/(admin|auth|account|reset-password|set-password)(\/|$)/.test(location.pathname)) w.gtag?.("event", "page_view", { page_path: location.pathname, page_location: `${window.location.origin}${location.pathname}`, page_title: document.title });
  }, [id, location.pathname]);
  return null;
}