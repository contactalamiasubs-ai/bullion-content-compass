import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/data";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "image" | "bool" | "select" | "date";
  options?: string[];
};

const inp = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function FieldInput({ f, value, onChange }: { f: Field; value: unknown; onChange: (v: unknown) => void }) {
  const [busy, setBusy] = useState(false);
  switch (f.type) {
    case "textarea":
      return <textarea rows={4} className={inp} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return <input type="number" step="any" className={inp} value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} />;
    case "date":
      return <input type="date" className={inp} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "bool":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" /> مفعّل
        </label>
      );
    case "select":
      return (
        <select className={inp} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          {f.options?.map((o) => <option key={o}>{o}</option>)}
        </select>
      );
    case "image":
      return (
        <div className="flex items-center gap-3">
          {value ? <img src={value as string} alt="" className="h-14 w-14 rounded object-cover" /> : <div className="h-14 w-14 rounded bg-secondary" />}
          <label className="flex cursor-pointer items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:border-gold">
            <Upload className="h-3.5 w-3.5" /> {busy ? "جارٍ الرفع..." : "رفع صورة"}
            <input type="file" accept="image/*" hidden onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try { onChange(await uploadImage(file)); } catch (err) { toast.error((err as Error).message); }
              setBusy(false);
            }} />
          </label>
          {!!value && <button type="button" onClick={() => onChange(null)} className="text-xs text-destructive">إزالة</button>}
        </div>
      );
    default:
      return <input className={inp} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
}

function FormGrid({ fields, row, set }: { fields: Field[]; row: Record<string, unknown>; set: (k: string, v: unknown) => void }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {fields.map((f) => (
        <div key={f.name} className={f.type === "textarea" ? "md:col-span-2" : ""}>
          <p className="mb-1 text-xs text-muted-foreground">{f.label}</p>
          <FieldInput f={f} value={row[f.name]} onChange={(v) => set(f.name, v)} />
        </div>
      ))}
    </div>
  );
}

type AnyTable = "site_settings" | "slides" | "metal_prices" | "price_history" | "sections" | "services" | "products" | "posts";

/** Single-row form (site_settings). */
export function SingleEditor({ table, id, fields, queryKey }: { table: AnyTable; id: number; fields: Field[]; queryKey: string[] }) {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", table], queryFn: async () => (await supabase.from(table).select("*").eq("id" as never, id as never).single()).data as Record<string, unknown> });
  const [row, setRow] = useState<Record<string, unknown>>({});
  useEffect(() => { if (data) setRow(data); }, [data]);
  const save = async () => {
    const patch = Object.fromEntries(fields.map((f) => [f.name, row[f.name]]));
    const { error } = await supabase.from(table).update(patch as never).eq("id" as never, id as never);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحفظ");
    qc.invalidateQueries({ queryKey }); qc.invalidateQueries({ queryKey: ["admin", table] });
  };
  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <FormGrid fields={fields} row={row} set={(k, v) => setRow({ ...row, [k]: v })} />
      <button onClick={save} className="flex items-center gap-2 rounded-md bg-gold-gradient px-5 py-2 text-sm font-semibold text-primary-foreground"><Save className="h-4 w-4" /> حفظ</button>
    </div>
  );
}

function RowCard({ table, pk, initial, fields, titleField, onDone, canDelete }: { table: AnyTable; pk: string; initial: Record<string, unknown>; fields: Field[]; titleField: string; onDone: () => void; canDelete: boolean }) {
  const [row, setRow] = useState(initial);
  const [open, setOpen] = useState(false);
  useEffect(() => setRow(initial), [initial]);
  const save = async () => {
    const patch = Object.fromEntries(fields.map((f) => [f.name, row[f.name]]));
    const { error } = await supabase.from(table).update(patch as never).eq(pk, row[pk] as never);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحفظ"); onDone();
  };
  const del = async () => {
    if (!confirm("حذف هذا العنصر؟")) return;
    const { error } = await supabase.from(table).delete().eq(pk, row[pk] as never);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف"); onDone();
  };
  return (
    <div className="rounded-lg border border-border bg-card">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-start">
        <span className="font-medium">{String(row[titleField] ?? "—")}</span>
        <span className="text-xs text-muted-foreground">{open ? "إخفاء" : "تعديل"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-border p-4">
          <FormGrid fields={fields} row={row} set={(k, v) => setRow({ ...row, [k]: v })} />
          <div className="flex gap-2">
            <button onClick={save} className="flex items-center gap-2 rounded-md bg-gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground"><Save className="h-4 w-4" /> حفظ</button>
            {canDelete && <button onClick={del} className="flex items-center gap-2 rounded-md border border-destructive px-4 py-2 text-sm text-destructive"><Trash2 className="h-4 w-4" /> حذف</button>}
          </div>
        </div>
      )}
    </div>
  );
}

/** List editor with add / edit / delete. */
export function ListEditor({ table, fields, titleField, order, ascending = true, queryKey, newRow, pk = "id", canAdd = true }: {
  table: AnyTable; fields: Field[]; titleField: string; order: string; ascending?: boolean; queryKey: string[]; newRow?: Record<string, unknown>; pk?: string; canAdd?: boolean;
}) {
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["admin", table], queryFn: async () => ((await supabase.from(table).select("*").order(order, { ascending })).data ?? []) as Record<string, unknown>[] });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin", table] }); qc.invalidateQueries({ queryKey }); };
  const add = async () => {
    const { error } = await supabase.from(table).insert((newRow ?? {}) as never);
    if (error) { toast.error(error.message); return; }
    toast.success("تمت الإضافة — افتحها لتعديلها"); refresh();
  };
  return (
    <div className="space-y-3">
      {canAdd && <button onClick={add} className="flex items-center gap-2 rounded-md border border-gold px-4 py-2 text-sm text-gold hover:bg-accent"><Plus className="h-4 w-4" /> إضافة جديد</button>}
      {data.map((r) => <RowCard key={String(r[pk])} table={table} pk={pk} initial={r} fields={fields} titleField={titleField} onDone={refresh} canDelete={canAdd} />)}
    </div>
  );
}
