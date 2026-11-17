import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LoginScene, LoginBrand } from "@/components/login-panel";
import { useShoppingText } from "@/components/shopping-provider";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/auth_/callback")({
  head: () => ({ meta: [{ title: "تأكيد الدخول | جولد سنتر" }, { name: "description", content: "التحقق من تسجيل الدخول إلى جولد سنتر." }, { property: "og:title", content: "تأكيد الدخول | جولد سنتر" }, { property: "og:description", content: "إكمال تسجيل الدخول الآمن إلى جولد سنتر." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Callback,
});
function Callback() {
  const nav = useNavigate(); const text = useShoppingText(); const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const finish = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error || !data.user) { setError(true); return; }
      const saved = sessionStorage.getItem("gold-center-login-destination");
      sessionStorage.removeItem("gold-center-login-destination");
      await nav({ to: saved === "/admin" ? "/admin" : "/account", replace: true });
    };
    void finish();
    return () => { active = false; };
  }, [nav]);
  return <LoginScene><section className="login-panel"><LoginBrand /><p role={error ? "alert" : "status"}>{text(error ? "auth_error" : "loading")}</p>{error && <Button onClick={() => nav({ to: "/auth" })}>{text("back_login")}</Button>}</section></LoginScene>;
}
