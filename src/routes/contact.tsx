import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { PageHero } from "@/components/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا | جولد سنتر" },
      { name: "description", content: "راسلنا لأي استفسار عن الذهب والسبائك والخدمات." },
      { property: "og:title", content: "تواصل معنا | جولد سنتر" },
      { property: "og:description", content: "راسلنا لأي استفسار." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { t } = useLang();
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase
      .from("contact_messages")
      .insert({ ...f, phone: f.phone || null });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("sent"));
    setF({ name: "", email: "", phone: "", message: "" });
  };
  const inp = "w-full rounded-md border border-input bg-background px-3 py-2.5";
  return (
    <main>
      <PageHero title={t("contact")} centered />
      <form onSubmit={submit} className="mx-auto max-w-xl space-y-4 px-4 py-12">
        <input
          required
          maxLength={120}
          placeholder={t("name")}
          className={inp}
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
        <input
          required
          type="email"
          maxLength={200}
          placeholder={t("email")}
          className={inp}
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
        />
        <input
          maxLength={40}
          placeholder={t("phone")}
          className={inp}
          value={f.phone}
          onChange={(e) => setF({ ...f, phone: e.target.value })}
        />
        <textarea
          required
          maxLength={3000}
          rows={5}
          placeholder={t("message")}
          className={inp}
          value={f.message}
          onChange={(e) => setF({ ...f, message: e.target.value })}
        />
        <button
          disabled={busy}
          className="w-full rounded-md bg-gold-gradient py-3 font-semibold text-primary-foreground disabled:opacity-60"
        >
          {t("send")}
        </button>
      </form>
    </main>
  );
}
