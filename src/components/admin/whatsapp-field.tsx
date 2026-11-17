import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { productsQuery, whatsappLink } from "@/lib/data";
import { pick, useLang } from "@/lib/i18n";
import { validateWhatsappField, validateWhatsappNumber } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";

/** Validated WhatsApp number input without the product-order preview. */
export function WhatsappNumberInput({
  label,
  value,
  onChange,
  optional = false,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  optional?: boolean;
}) {
  const hintId = useId();
  const validation = validateWhatsappField(value, optional);
  const empty = typeof value !== "string" || !value.trim();
  const hint =
    validation.error ??
    (empty ? "اختياري — اتركه فارغًا حتى لا يظهر للزوار." : `الصيغة صحيحة: +${validation.number}`);
  return (
    <div className="min-w-0 space-y-2">
      <input
        aria-label={label}
        aria-invalid={!!validation.error}
        aria-describedby={hintId}
        type="tel"
        dir="ltr"
        autoComplete="tel"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      />
      <p
        id={hintId}
        role={validation.error ? "alert" : "status"}
        className={`text-xs ${
          validation.error ? "text-destructive" : empty ? "text-muted-foreground" : "text-success"
        }`}
      >
        {hint}
      </p>
    </div>
  );
}

export function WhatsappField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { lang } = useLang();
  const { data: products = [], isLoading, error } = useQuery(productsQuery);
  const [selected, setSelected] = useState("");
  const available = products.filter((product) => product.active);
  const product = available.find((product) => product.id === selected) ?? available[0];
  const validation = validateWhatsappNumber(value);
  const name = pick(product, "name", lang);
  const message = lang === "ar" ? `مرحبًا، أريد طلب: ${name}` : `Hello, I'd like to order: ${name}`;
  const url = !validation.error && product ? whatsappLink(validation.number, message) : null;
  return (
    <div className="min-w-0 space-y-3">
      <WhatsappNumberInput label={label} value={value} onChange={onChange} />
      <div className="space-y-2 border-s-2 border-border ps-3">
        <p className="text-sm font-medium">معاينة رابط طلب المنتج</p>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">جارٍ تحميل المنتجات…</p>
        ) : error ? (
          <p role="alert" className="text-xs text-destructive">
            تعذر تحميل المنتجات للمعاينة.
          </p>
        ) : !product ? (
          <p className="text-xs text-muted-foreground">لا توجد منتجات ظاهرة للمعاينة.</p>
        ) : (
          <select
            aria-label="منتج المعاينة"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={product.id}
            onChange={(event) => setSelected(event.target.value)}
          >
            {available.map((item) => (
              <option key={item.id} value={item.id}>
                {pick(item, "name", lang)}
              </option>
            ))}
          </select>
        )}
        {url && (
          <>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className="block break-all text-xs text-gold hover:underline"
            >
              {url}
            </a>
            <p className="text-xs text-muted-foreground">{message}</p>
            <Button asChild variant="outline" size="sm">
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                فتح المعاينة
              </a>
            </Button>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          التحقق من الصيغة لا يؤكد وجود حساب واتساب على الرقم.
        </p>
      </div>
    </div>
  );
}
