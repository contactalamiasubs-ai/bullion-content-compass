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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error(error.message); return; }
        await nav({ to: "/admin" });
    } catch { toast.error("تعذر إكمال الطلب الآن، يرجى المحاولة مجددًا."); }
    finally { setBusy(false); }
  };
  const inp = "w-full rounded-md border border-input bg-background px-3 py-2.5";
  return (
    <main dir="rtl" className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-gold/30 bg-card p-8 shadow-gold">
        <h1 className="text-center text-2xl text-gold-gradient">دخول لوحة التحكم</h1>
        <input type="email" required aria-label="البريد الإلكتروني" placeholder="البريد الإلكتروني" autoComplete="email" className={inp} value={email} onChange={event => setEmail(event.target.value)} />
        <input type="password" required minLength={6} aria-label="كلمة المرور" placeholder="كلمة المرور" autoComplete="current-password" className={inp} value={password} onChange={event => setPassword(event.target.value)} />
        <Button type="submit" disabled={busy} className="w-full bg-gold-gradient py-2.5 font-semibold text-primary-foreground">دخول</Button>
      </form>
    </main>
  );
}
