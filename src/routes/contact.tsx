import { loadPublicPage } from "@/lib/seo-public.functions";
import { seoHead } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { notifyContactMessage } from "@/lib/mail.functions";
import { MessageCircle, Phone } from "lucide-react";
import { useLang, pick } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { PageHero } from "@/components/site";
import { sectionsQuery, settingsQuery, whatsappLink } from "@/lib/data";

export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  loaderDeps: ({ search }) => ({ lang: search.lang }),
  loader: ({ context, deps }) => loadPublicPage(context.queryClient, "/contact", deps.lang),
  head: ({ loaderData }) => seoHead(loaderData?.seo),
  component: Contact,
});

function Contact() {
  const { t, lang } = useLang();
  const { data: s } = useQuery(settingsQuery);
  const { data: sections } = useQuery(sectionsQuery);
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "" });
  const [busy, setBusy] = useState(false);
  const notify = useServerFn(notifyContactMessage);
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
    // Owner notice must never block or fail the visitor's submission.
    void notify({ data: { ...f, phone: f.phone || "" } }).catch(() => {});
    setF({ name: "", email: "", phone: "", message: "" });
  };
  const inp = "w-full rounded-md border border-input bg-background px-3 py-2.5";
  const service = sections?.["customer_service"];
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
      {(s?.service_whatsapp || s?.service_phone) && (
        <section className="mx-auto max-w-xl px-4 pb-12">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="mb-1 text-lg text-gold-gradient">{pick(service, "title", lang)}</h2>
            <p className="mb-4 text-xs text-muted-foreground">{pick(service, "body", lang)}</p>
            <div className="flex flex-wrap gap-3">
              {s?.service_whatsapp && (
                <a
                  href={whatsappLink(s.service_whatsapp, "")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold hover:text-gold"
                >
                  <MessageCircle className="h-4 w-4 text-gold" />
                  <span dir="ltr">{`+${s.service_whatsapp}`}</span>
                </a>
              )}
              {s?.service_phone && (
                <a
                  href={`tel:${(s?.service_phone ?? "").replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold hover:text-gold"
                >
                  <Phone className="h-4 w-4 text-gold" />
                  <span dir="ltr">{s.service_phone}</span>
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
