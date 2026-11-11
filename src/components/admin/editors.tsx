import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Save, Upload, Search, ChevronDown, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { WhatsappField } from "@/components/admin/whatsapp-field";
import { validateWhatsappNumber } from "@/lib/whatsapp";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "image" | "bool" | "select" | "date" | "whatsapp";
  options?: string[];
};

const inp = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function FieldInput({
  f,
  value,
  onChange,
}: {
  f: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const [busy, setBusy] = useState(false);
  switch (f.type) {
    case "whatsapp":
      return <WhatsappField label={f.label} value={value} onChange={onChange} />;
    case "textarea":
      return (
        <textarea
          aria-label={f.label}
          rows={4}
          className={inp}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "number":
      return (
        <input
          aria-label={f.label}
          type="number"
          step="any"
          className={inp}
          value={value == null ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      );
    case "date":
      return (
        <input
          aria-label={f.label}
          type="date"
          className={inp}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "bool":
      return (
        <div className="flex h-9 items-center gap-2 text-sm">
          <Switch aria-label={f.label} checked={!!value} onCheckedChange={onChange} />{" "}
          {value ? "مفعّل" : "غير مفعّل"}
        </div>
      );
    case "select":
      return (
        <select
          aria-label={f.label}
          className={inp}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          {f.options?.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      );
    case "image":
      return (
        <div className="flex flex-wrap items-center gap-3">
          {value ? (
            <img src={value as string} alt="" className="h-14 w-14 rounded object-cover" />
          ) : (
            <div className="h-14 w-14 rounded bg-secondary" />
          )}
          <label className="flex cursor-pointer items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs hover:border-gold">
            <Upload className="h-3.5 w-3.5" /> {busy ? "جارٍ الرفع..." : "رفع صورة"}
            <input
              aria-label={f.label}
              type="file"
              accept="image/*"
              disabled={busy}
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                try {
                  onChange(await uploadImage(file));
                } catch (err) {
                  toast.error((err as Error).message);
                }
                setBusy(false);
              }}
            />
          </label>
          {!!value && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="إزالة الصورة"
              aria-label="إزالة الصورة"
              onClick={() => onChange(null)}
              className="text-destructive"
            >
              <ImageOff />
            </Button>
          )}
          <input
            aria-label={`رابط ${f.label}`}
            className={inp}
            dir="ltr"
            placeholder="https://"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </div>
      );
    default:
      return (
        <input
          aria-label={f.label}
          dir={f.name.endsWith("_en") || f.name.includes("url") ? "ltr" : undefined}
          className={inp}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function FormGrid({
  fields,
  row,
  set,
}: {
  fields: Field[];
  row: Record<string, unknown>;
  set: (k: string, v: unknown) => void;
}) {
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

type AnyTable =
  | "site_settings"
  | "slides"
  | "metal_prices"
  | "price_history"
  | "sections"
  | "services"
  | "products"
  | "posts";

async function readRows(table: AnyTable, order: string, ascending: boolean) {
  const { data, error } = await supabase.from(table).select("*").order(order, { ascending });
  if (error) throw error;
  return (data ?? []) as unknown as Record<string, unknown>[];
}

function ReadState({ loading, error }: { loading: boolean; error: Error | null }) {
  if (loading) return <p className="py-6 text-muted-foreground">جارٍ تحميل المحتوى…</p>;
  if (error)
    return (
      <p role="alert" className="py-6 text-destructive">
        تعذر تحميل المحتوى: {error.message}
      </p>
    );
  return null;
}

function refreshContent(
  qc: ReturnType<typeof useQueryClient>,
  table: AnyTable,
  queryKey: string[],
) {
  void qc.invalidateQueries({ queryKey: ["admin", table] });
  void qc.invalidateQueries({ queryKey });
  void qc.invalidateQueries({ queryKey: ["admin-overview"] });
  if (table === "posts") void qc.invalidateQueries({ queryKey: ["post"] });
}

/** Single-row form (site_settings). */
export function SingleEditor({
  table,
  id,
  fields,
  queryKey,
}: {
  table: AnyTable;
  id: number;
  fields: Field[];
  queryKey: string[];
}) {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", table],
    queryFn: async () => {
      const result = await supabase
        .from(table)
        .select("*")
        .eq("id" as never, id as never)
        .single();
      if (result.error) throw result.error;
      return result.data as unknown as Record<string, unknown>;
    },
  });
  const [row, setRow] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) setRow(data);
  }, [data]);
  const whatsappField = fields.find((field) => field.type === "whatsapp");
  const whatsappValidation = whatsappField ? validateWhatsappNumber(row[whatsappField.name]) : null;
  const save = async () => {
    if (whatsappValidation?.error) {
      toast.error(whatsappValidation.error);
      return;
    }
    setSaving(true);
    try {
      const patch = Object.fromEntries(fields.map((f) => [f.name, row[f.name]]));
      if (whatsappField && whatsappValidation)
        patch[whatsappField.name] = whatsappValidation.number;
      const { data: saved, error } = await supabase
        .from(table)
        .update(patch as never)
        .eq("id" as never, id as never)
        .select();
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!saved?.length) {
        toast.error("لم يتم الحفظ: هذا الحساب لا يملك صلاحية المسؤول");
        return;
      }
      toast.success("تم الحفظ");
      refreshContent(qc, table, queryKey);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحفظ");
    } finally {
      setSaving(false);
    }
  };
  if (isLoading || error) return <ReadState loading={isLoading} error={error} />;
  return (
    <div className="space-y-6">
      <FormGrid fields={fields} row={row} set={(k, v) => setRow({ ...row, [k]: v })} />
      <Button disabled={saving || !data || !!whatsappValidation?.error} onClick={save}>
        <Save />
        {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
      </Button>
    </div>
  );
}

function RowCard({
  table,
  pk,
  initial,
  fields,
  titleField,
  onDone,
  canDelete,
}: {
  table: AnyTable;
  pk: string;
  initial: Record<string, unknown>;
  fields: Field[];
  titleField: string;
  onDone: () => void;
  canDelete: boolean;
}) {
  const [row, setRow] = useState(initial);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => setRow(initial), [initial]);
  const save = async () => {
    setBusy(true);
    try {
      const patch = Object.fromEntries(fields.map((f) => [f.name, row[f.name]]));
      const { data: saved, error } = await supabase
        .from(table)
        .update(patch as never)
        .eq(pk, row[pk] as never)
        .select();
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!saved?.length) {
        toast.error("لم يتم الحفظ: هذا الحساب لا يملك صلاحية المسؤول");
        return;
      }
      toast.success("تم الحفظ");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحفظ");
    } finally {
      setBusy(false);
    }
  };
  const del = async () => {
    if (!confirm("حذف هذا العنصر؟")) return;
    setBusy(true);
    try {
      const { data: gone, error } = await supabase
        .from(table)
        .delete()
        .eq(pk, row[pk] as never)
        .select();
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!gone?.length) {
        toast.error("لم يتم الحذف: هذا الحساب لا يملك صلاحية المسؤول");
        return;
      }
      toast.success("تم الحذف");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر الحذف");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-lg border border-border bg-card">
      <Button
        variant="ghost"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="h-auto min-h-14 w-full justify-between whitespace-normal px-4 py-3 text-start"
      >
        <span className="flex min-w-0 items-center gap-3">
          {typeof row["image_url"] === "string" && row["image_url"] && (
            <img
              src={row["image_url"]}
              alt=""
              className="h-10 w-10 shrink-0 rounded object-cover"
            />
          )}
          <span className="break-words font-medium">{String(row[titleField] ?? "—")}</span>
        </span>
        <ChevronDown className={open ? "rotate-180" : ""} />
      </Button>
      {open && (
        <div className="space-y-4 border-t border-border p-4">
          <FormGrid fields={fields} row={row} set={(k, v) => setRow({ ...row, [k]: v })} />
          <div className="flex gap-2">
            <Button disabled={busy} onClick={save}>
              <Save /> {busy ? "جارٍ التنفيذ…" : "حفظ"}
            </Button>
            {canDelete && (
              <Button disabled={busy} onClick={del} variant="outline" className="text-destructive">
                <Trash2 /> حذف
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** List editor with add / edit / delete. */
export function ListEditor({
  table,
  fields,
  titleField,
  order,
  ascending = true,
  queryKey,
  newRow,
  pk = "id",
  canAdd = true,
}: {
  table: AnyTable;
  fields: Field[];
  titleField: string;
  order: string;
  ascending?: boolean;
  queryKey: string[];
  newRow?: Record<string, unknown>;
  pk?: string;
  canAdd?: boolean;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({ queryKey: ["admin", table], queryFn: () => readRows(table, order, ascending) });
  const refresh = () => refreshContent(qc, table, queryKey);
  const add = async () => {
    setAdding(true);
    try {
      const { error } = await supabase.from(table).insert((newRow ?? {}) as never);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("تمت الإضافة — افتحها لتعديلها");
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذرت الإضافة");
    } finally {
      setAdding(false);
    }
  };
  const visible = data.filter((r) =>
    fields.some((f) =>
      String(r[f.name] ?? "")
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
    ),
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            aria-label="البحث في المحتوى"
            placeholder="بحث…"
            className={`${inp} ps-9`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {canAdd && (
          <Button disabled={adding || isLoading || !!error} onClick={add} variant="outline">
            <Plus /> {adding ? "جارٍ الإضافة…" : "إضافة جديد"}
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{data.length} عنصر</span>
      </div>
      <ReadState loading={isLoading} error={error} />
      {!isLoading && !error && !visible.length && (
        <p className="py-8 text-center text-muted-foreground">
          {search ? "لا توجد نتائج مطابقة." : "لا يوجد محتوى بعد."}
        </p>
      )}
      {visible.map((r) => (
        <RowCard
          key={String(r[pk])}
          table={table}
          pk={pk}
          initial={r}
          fields={fields}
          titleField={titleField}
          onDone={refresh}
          canDelete={canAdd}
        />
      ))}
    </div>
  );
}
