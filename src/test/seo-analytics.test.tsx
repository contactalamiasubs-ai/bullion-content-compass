import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { SeoAnalytics } from "@/components/seo-analytics";

const state = vi.hoisted(() => ({ pathname: "/products", measurementId: "" }));
vi.mock("@tanstack/react-query", () => ({ useQuery: () => ({ data: { config: { measurement_id: state.measurementId } } }) }));
vi.mock("@tanstack/react-router", () => ({ useLocation: () => ({ pathname: state.pathname }) }));
vi.mock("@/lib/seo-public.functions", () => ({ seoBundleQuery: {} }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(() => { vi.unstubAllEnvs(); document.getElementById("goldcenter-ga4")?.remove(); });

it("uses the linked browser measurement ID and excludes account pages from page views", async () => {
  vi.stubEnv("VITE_LOVABLE_CONNECTOR_GOOGLE_ANALYTICS_API_KEY", "G-1V3PGBT7DZ");
  const root = createRoot(document.createElement("div"));
  await act(async () => root.render(<SeoAnalytics />));
  expect(document.getElementById("goldcenter-ga4")?.getAttribute("src")).toBe("https://www.googletagmanager.com/gtag/js?id=G-1V3PGBT7DZ");
  const w = window as Window & { dataLayer?: unknown[] };
  const count = w.dataLayer?.length;
  state.pathname = "/account";
  await act(async () => root.render(<SeoAnalytics />));
  expect(w.dataLayer?.length).toBe(count);
  await act(async () => root.unmount());
});