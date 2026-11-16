import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/set-password")({
  head: () => ({ meta: [
    { title: "تفعيل حساب الفريق | جولد سنتر" },
    { name: "description", content: "اختيار كلمة مرور لحساب فريق جولد سنتر بعد قبول الدعوة." },
    { property: "og:title", content: "تفعيل حساب الفريق | جولد سنتر" },
    { property: "og:description", content: "اختيار كلمة مرور لحساب فريق جولد سنتر بعد قبول الدعوة." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: SetPassword,
});
function SetPassword() {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => { if (active) { setReady(!!data.user); setLoading(false); } });
    return () => { active = false; };
  }, []);
  return <main dir="rtl" className="grid min-h-screen place-items-center px-4">
    <form className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6" onSubmit={async (event) => {
      event.preventDefault();
      if (password !== confirm) { toast.error("كلمتا المرور غير متطابقتين"); return; }
      setBusy(true);
      const { error } = await supabase.auth.updateUser({ password });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("تم تفعيل كلمة المرور"); void nav({ to: "/admin" });
    }}>
      <h1 className="text-center text-2xl text-gold">تفعيل حساب جولد سنتر</h1>
      {loading ? <p>جارٍ التحقق من الدعوة…</p> : !ready ? <p role="alert">رابط الدعوة غير صالح أو انتهت صلاحيته؛ اطلب دعوة جديدة من المسؤول.</p> : <>
        <label className="block space-y-2"><span>كلمة المرور الجديدة</span><input aria-label="كلمة المرور الجديدة" className="w-full rounded-md border border-input bg-background px-3 py-2" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label className="block space-y-2"><span>تأكيد كلمة المرور</span><input aria-label="تأكيد كلمة المرور" className="w-full rounded-md border border-input bg-background px-3 py-2" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(event) => setConfirm(event.target.value)} /></label>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ والدخول للوحة التحكم"}</Button>
      </>}
    </form>
  </main>;
}