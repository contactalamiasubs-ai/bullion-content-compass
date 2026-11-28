import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/login-panel";
import { Button } from "@/components/ui/button";
import { useShoppingText } from "@/components/shopping-provider";
import { customerAuth } from "@/lib/customer-client";

export const Route = createFileRoute("/customer-callback")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "إكمال دخول Google | جولد سنتر" },
    { name: "description", content: "إكمال تسجيل دخول العملاء باستخدام Google في جولد سنتر." },
    { property: "og:title", content: "إكمال دخول Google | جولد سنتر" },
    { property: "og:description", content: "إكمال تسجيل دخول العملاء الآمن باستخدام Google." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: CustomerCallback,
});

function CustomerCallback() {
  const text = useShoppingText();
  const nav = useNavigate();
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const finish = async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.slice(1));
        if (url.searchParams.has("error") || hash.has("error")) {
          window.history.replaceState(null, "", url.pathname);
          if (active) setError(true);
          return;
        }
        // The PKCE client's URL detection exchanges the code once during initialization.
        // getUser waits for initialization and verifies the resulting customer session.
        const result = await customerAuth.auth.getUser();
        window.history.replaceState(null, "", url.pathname);
        if (!active) return;
        if (result.error || !result.data.user) { setError(true); return; }
        await nav({ to: "/welcome", replace: true });
      } catch { if (active) setError(true); }
    };
    void finish();
    return () => { active = false; };
  }, [nav]);
  return <AuthShell title={text("login_title")} welcome={text(error ? "auth_error" : "loading")}>
    {error && <Button onClick={() => nav({ to: "/login" })}>{text("back_login")}</Button>}
  </AuthShell>;
}