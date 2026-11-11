import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | لوحة التحكم" },
      { name: "description", content: "دخول المسؤول إلى لوحة التحكم." },
      { property: "og:title", content: "تسجيل الدخول" },
      { property: "og:description", content: "دخول المسؤول إلى لوحة التحكم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      nav({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("تم إنشاء الحساب — افتح بريدك لتأكيده ثم سجّل الدخول");
      setMode("in");
    }
  };
  const inp = "w-full rounded-md border border-input bg-background px-3 py-2.5";
  return (
    <main dir="rtl" className="grid min-h-screen place-items-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-xl border border-gold/30 bg-card p-8 shadow-gold"
      >
        <h1 className="text-center text-2xl text-gold-gradient">
          {mode === "in" ? "دخول لوحة التحكم" : "إنشاء حساب مسؤول"}
        </h1>
        <input
          type="email"
          required
          placeholder="البريد الإلكتروني"
          className={inp}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="كلمة المرور"
          className={inp}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          disabled={busy}
          className="w-full rounded-md bg-gold-gradient py-2.5 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {mode === "in" ? "دخول" : "إنشاء الحساب"}
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="w-full text-sm text-muted-foreground hover:text-gold"
        >
          {mode === "in" ? "أول مرة؟ أنشئ حساب المسؤول" : "لديك حساب؟ سجّل الدخول"}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          أول حساب يتم إنشاؤه يصبح هو المسؤول تلقائيًا.
        </p>
      </form>
    </main>
  );
}
