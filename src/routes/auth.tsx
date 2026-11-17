import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "دخول لوحة التحكم | جولد سنتر" },
    { name: "description", content: "تسجيل الدخول الآمن إلى لوحة إدارة جولد سنتر." },
    { property: "og:title", content: "دخول لوحة التحكم | جولد سنتر" },
    { property: "og:description", content: "دخول المسؤول والفريق إلى لوحة إدارة جولد سنتر." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error(error.message); return; }
        await nav({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) { toast.error(error.message); return; }
        toast.success("تم إنشاء الحساب — افتح بريدك لتأكيده ثم سجّل الدخول");
        setMode("in");
      }
    } catch { toast.error("تعذر إكمال الطلب الآن، يرجى المحاولة مجددًا."); }
    finally { setBusy(false); }
  };
  const inp = "w-full rounded-md border border-input bg-background px-3 py-2.5";
  return (
    <main dir="rtl" className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-gold/30 bg-card p-8 shadow-gold">
        <h1 className="text-center text-2xl text-gold-gradient">{mode === "in" ? "دخول لوحة التحكم" : "إنشاء حساب مسؤول"}</h1>
        <input type="email" required aria-label="البريد الإلكتروني" placeholder="البريد الإلكتروني" autoComplete="email" className={inp} value={email} onChange={event => setEmail(event.target.value)} />
        <input type="password" required minLength={6} aria-label="كلمة المرور" placeholder="كلمة المرور" autoComplete={mode === "in" ? "current-password" : "new-password"} className={inp} value={password} onChange={event => setPassword(event.target.value)} />
        <Button type="submit" disabled={busy} className="w-full bg-gold-gradient py-2.5 font-semibold text-primary-foreground">{mode === "in" ? "دخول" : "إنشاء الحساب"}</Button>
        <Button type="button" variant="ghost" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-sm text-muted-foreground hover:text-gold">{mode === "in" ? "أول مرة؟ أنشئ حساب المسؤول" : "لديك حساب؟ سجّل الدخول"}</Button>
        <p className="text-center text-xs text-muted-foreground">أول حساب يتم إنشاؤه يصبح هو المسؤول تلقائيًا.</p>
      </form>
    </main>
  );
}
