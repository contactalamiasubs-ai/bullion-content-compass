import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Upload, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importBullionSerials } from "@/lib/bullion.functions";
import { bullionHeaders, parseBullionRows, type BullionRow } from "@/lib/bullion-serials";

export function BullionImport() {
  const fileInput = useRef<HTMLInputElement>(null);
  const save = useServerFn(importBullionSerials);
  const qc = useQueryClient();
  const [rows, setRows] = useState<BullionRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function template() {
    setError("");
    try {
      const { Workbook } = await import("exceljs");
      const workbook = new Workbook();
      const sheet = workbook.addWorksheet("السيريالات", { views: [{ rightToLeft: true }] });
      sheet.addRow(bullionHeaders);
      sheet.getRow(1).font = { bold: true };
      sheet.columns.forEach(column => { column.width = 28; });
      sheet.getColumn(1).numFmt = "@";
      const bytes = await workbook.xlsx.writeBuffer();
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
      const link = document.createElement("a"); link.href = url; link.download = "bullion-serial-template.xlsx"; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { setError("تعذر تنزيل القالب"); }
  }
  return <section className="mb-8 space-y-4 border-b border-border pb-6">
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={template} disabled={busy}><Download />تنزيل قالب Excel</Button>
      <Button variant="outline" disabled={busy} onClick={() => fileInput.current?.click()}><Upload />رفع شيت السيريالات</Button>
      <input ref={fileInput} type="file" accept=".xlsx" aria-label="شيت السيريالات" hidden disabled={busy} onChange={async event => {
        const file = event.target.files?.[0]; if (!file) return;
        setError(""); setNotice(""); setRows([]); setBusy(true);
        try {
          if (file.size > 5 * 1024 * 1024) throw new Error("حجم الملف يجب ألا يتجاوز 5 ميجابايت");
          const { Workbook } = await import("exceljs");
          const workbook = new Workbook(); await workbook.xlsx.load(await file.arrayBuffer());
          const sheet = workbook.worksheets[0]; if (!sheet) throw new Error("الملف فارغ");
          const values: unknown[][] = [];
          sheet.eachRow(row => {
            const cells: unknown[] = [];
            for (let i = 1; i <= sheet.columnCount; i++) {
              const cell = row.getCell(i);
              if (cell.type === 6) throw new Error("الملف يحتوي على معادلات؛ ارفع القيم كنصوص وأرقام فقط");
              cells.push(cell.value);
            }
            values.push(cells);
          });
          setRows(parseBullionRows(values));
        } catch (error) { setError(error instanceof Error ? error.message : "تعذر قراءة الملف"); }
        finally { setBusy(false); event.target.value = ""; }
      }} />
    </div>
    {rows.length > 0 && <div className="space-y-3">
      <p className="text-sm">{rows.length} سيريال جاهز للاستيراد. السيريال الموجود سيُحدّث بمواصفات الشيت دون حذف باقي السجل.</p>
      <div className="overflow-x-auto"><table className="w-full text-start text-sm"><thead><tr>{["السيريال", "اسم السبيكة", "الوزن", "النقاء"].map(label => <th key={label} className="p-2 text-start">{label}</th>)}</tr></thead><tbody>{rows.slice(0, 5).map(row => <tr key={row.serial} className="border-t border-border"><td className="p-2" dir="ltr">{row.serial}</td><td className="p-2">{row.name_ar}</td><td className="p-2">{row.weight_grams}</td><td className="p-2">{row.purity}</td></tr>)}</tbody></table></div>
      <Button disabled={busy} onClick={async () => {
        setBusy(true); setError("");
        try { const result = await save({ data: rows }); await Promise.all([qc.invalidateQueries({ queryKey: ["bullion-serials"] }), qc.invalidateQueries({ queryKey: ["admin", "bullion_serials"] })]); setRows([]); setNotice(`تم استيراد ${result.count} سيريال بنجاح`); }
        catch (error) { setError(error instanceof Error ? error.message : "تعذر الاستيراد"); }
        finally { setBusy(false); }
      }}>{busy ? <LoaderCircle className="animate-spin" /> : <Upload />}تأكيد الاستيراد</Button>
    </div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {notice && <p role="status" className="text-sm text-success">{notice}</p>}
  </section>;
}