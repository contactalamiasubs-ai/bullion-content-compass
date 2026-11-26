import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { wwwRedirectTarget } from "./lib/www-redirect";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Permanently send www.<domain> visitors to the bare domain (Hostinger serves both on one app).
const wwwRedirectMiddleware = createMiddleware().server(async ({ request, next }) => {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const target = wwwRedirectTarget(request.url, host);
  if (target) {
    return new Response(null, { status: 301, headers: { location: target } });
  }
  return next();
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});
const seoRedirectMiddleware = createMiddleware().server(async ({ request, next }) => {
  if (request.method !== "GET" && request.method !== "HEAD") return next();
  const url = new URL(request.url);
  if (/^\/(api|_serverFn|@|src|node_modules|admin|auth|account|reset-password|set-password)(\/|$)/.test(url.pathname) || /\.[a-z0-9]{2,6}$/i.test(url.pathname)) return next();
  const { seoRedirect } = await import("@/lib/seo-redirect.server");
  const target = await seoRedirect(url.pathname, url.search);
  if (target) return new Response(null, { status: 301, headers: { location: target } });
  return next();
});

// requestMiddleware runs on every request; functionMiddleware only on server functions, where
// client sendContext is unvalidated input. Append to these arrays, never replace them.
// Enabling Lovable Cloud adds functionMiddleware: [attachSupabaseAuth], the bearer token that
// requireSupabaseAuth server functions need. Add it by hand only if Lovable Cloud or a
// user-managed Supabase project is connected, no middleware here sets Authorization, and the
// project did not intentionally replace it.
export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [wwwRedirectMiddleware, errorMiddleware, csrfMiddleware, seoRedirectMiddleware],
}));
