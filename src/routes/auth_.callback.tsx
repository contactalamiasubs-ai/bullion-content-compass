import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoginScene, LoginBrand } from "@/components/login-panel";
import { useShoppingText } from "@/components/shopping-provider";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/auth_/callback")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "تأكيد الدخول | جولد سنتر" }, { name: "description", content: "التحقق من تسجيل الدخول إلى جولد سنتر." }, { property: "og:title", content: "تأكيد الدخول | جولد سنتر" }, { property: "og:description", content: "إكمال تسجيل الدخول الآمن إلى جولد سنتر." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Callback,
});
function Callback() {
  const nav = useNavigate(); const text = useShoppingText(); const [error, setError] = useState(false); const [test, setTest] = useState<null | { ok: boolean; reason?: string }>(null);
  useEffect(() => {
    let active = true;
    const finish = async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const isTest = sessionStorage.getItem("gold-center-google-test") === "1";
        sessionStorage.removeItem("gold-center-google-test");
        const errText = url.searchParams.get("error_description") || hash.get("error_description") || url.searchParams.get("error") || hash.get("error");
        if (errText) { if (active) { if (isTest) setTest({ ok: false, reason: errText }); else setError(true); } return; }
        const tokenHash = url.searchParams.get("token_hash");
        if (tokenHash) {
          const verified = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
          window.history.replaceState(null, "", url.pathname);
          if (verified.error) { if (active) { if (isTest) setTest({ ok: false, reason: verified.error.message }); else setError(true); } return; }
        }
        const code = url.searchParams.get("code");
        if (code) await supabase.auth.exchangeCodeForSession(code).catch(() => undefined);
        let { data } = await supabase.auth.getSession();
        for (let i = 0; !data.session && i < 20 && active; i++) {
          await new Promise((r) => setTimeout(r, 250));
          ({ data } = await supabase.auth.getSession());
        }
        if (!active) return;
        if (isTest) { setTest(data.session ? { ok: true, reason: data.session.user.email ?? "" } : { ok: false, reason: "لم تُنشأ جلسة دخول بعد العودة من Google." }); return; }
        if (!data.session) { setError(true); return; }
        const saved = sessionStorage.getItem("gold-center-login-destination");
        sessionStorage.removeItem("gold-center-login-destination");
        const to = saved === "/admin" ? "/admin" : "/account";
        try { await nav({ to, replace: true }); } catch { window.location.replace(to); }
      } catch { if (active) setError(true); }
    };
    void finish();
    return () => { active = false; };
  }, [nav]);
  if (test) return <LoginScene><section className="login-panel"><LoginBrand /><h1 className="text-xl">{test.ok ? "نجح اختبار الدخول بـ Google" : "رفض Google الدخول"}</h1><p role={test.ok ? "status" : "alert"} className="break-words text-sm">{test.ok ? `تم الدخول بالحساب: ${test.reason}` : `السبب: ${test.reason}`}</p><a className="underline text-primary" href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">فتح Google Cloud Console</a><Button onClick={() => { window.location.href = "/admin/connections"; }}>العودة إلى الاتصالات الخارجية</Button></section></LoginScene>;
  return <LoginScene><section className="login-panel"><LoginBrand /><p role={error ? "alert" : "status"}>{text(error ? "auth_error" : "loading")}</p>{error && <Button onClick={() => nav({ to: "/login" })}>{text("back_login")}</Button>}</section></LoginScene>;
}
