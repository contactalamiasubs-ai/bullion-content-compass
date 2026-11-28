import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/** Downloads every bar-check request (name, email, serial, date) as Excel. Strings are written as text, never formulas. */
export function BullionChecksExportButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div><Button variant="outline" disabled={busy} onClick={async () => {
    setBusy(true); setError("");
    try {
      const rows: { name: string; email: string; customer_number: string | null; serial: string; created_at: string }[] = [];
      for (let from = 0; ; from += 1000) {
        const r = await supabase.from("bullion_checks").select("name,email,customer_number,serial,created_at").order("created_at", { ascending: false }).range(from, from + 999);
        if (r.error) throw r.error;
        rows.push(...r.data); if (r.data.length < 1000) break;
      }
      const { Workbook } = await import("exceljs");
      const wb = new Workbook();
      const ws = wb.addWorksheet("طلبات الفحص", { views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }] });
      ws.columns = [{ header: "الاسم", width: 30 }, { header: "البريد الإلكتروني", width: 35 }, { header: "رقم العميل", width: 20 }, { header: "السيريال", width: 25 }, { header: "التاريخ", width: 22 }];
      const safe = (v: string | null) => { const s = v ?? ""; return (/^[=+\-@]/.test(s) ? `'${s}` : s); };
      for (const r of rows) ws.addRow([safe(r.name), safe(r.email), safe(r.customer_number), safe(r.serial), new Date(r.created_at).toLocaleString("ar-EG")]);
      ws.getRow(1).font = { bold: true };
      const bytes = await wb.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const a = document.createElement("a"); a.href = url; a.download = `bar-checks-${new Date().toISOString().slice(0, 10)}.xlsx`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { setError("تعذر تنزيل الطلبات. حاول مرة أخرى."); }
    finally { setBusy(false); }
  }}>{busy ? <LoaderCircle className="animate-spin" /> : <Download />}{busy ? "جارٍ تجهيز الملف…" : "تنزيل الأسماء والإيميلات — Excel"}</Button>{error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}</div>;
}
