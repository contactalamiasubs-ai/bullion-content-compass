import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportCustomers } from "@/lib/customers.functions";
import { customerExportSheets } from "@/lib/customer-export";
export function CustomerExportButton() {
  const getData = useServerFn(exportCustomers);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div><Button variant="outline" disabled={busy} onClick={async () => {
    setBusy(true); setError("");
    try {
      const data = await getData();
      const { Workbook } = await import("exceljs");
      const workbook = new Workbook();
      workbook.creator = "Gold Center"; workbook.created = new Date(data.exportedAt);
      for (const sheet of customerExportSheets(data)) {
        const ws = workbook.addWorksheet(sheet.name, { views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }] });
        ws.addRow(sheet.headers); ws.addRows(sheet.rows);
        ws.getRow(1).font = { name: "Arial", bold: true };
        ws.columns.forEach(column => { column.width = 30; });
        ws.eachRow((row, rowNumber) => { row.eachCell(cell => { cell.font = { name: "Arial", bold: rowNumber === 1 }; cell.alignment = { vertical: "top", wrapText: true }; }); });
        ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, ws.rowCount), column: sheet.headers.length } };
      }
      const bytes = await workbook.xlsx.writeBuffer();
      const blob = new Blob([new Uint8Array(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob); const link = document.createElement("a");
      link.href = url; link.download = `customers-${data.exportedAt.slice(0, 10)}.xlsx`; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { setError("تعذر تنزيل بيانات العملاء. حاول مرة أخرى."); }
    finally { setBusy(false); }
  }}>{busy ? <LoaderCircle className="animate-spin" /> : <Download />}{busy ? "جارٍ تجهيز الملف…" : "تنزيل جميع العملاء — Excel"}</Button>{error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}</div>;
}