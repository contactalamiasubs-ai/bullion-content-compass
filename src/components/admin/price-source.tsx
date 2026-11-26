import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Coins } from "lucide-react";
import { toast } from "sonner";
import { SingleEditor } from "@/components/admin/editors";
import { Button } from "@/components/ui/button";
import { refreshVerifiedPrices } from "@/lib/prices.functions";
import { verifiedPricesQuery } from "@/lib/data";

export function PriceSource() {
  const qc = useQueryClient();
  const refresh = useServerFn(refreshVerifiedPrices);
  const [busy, setBusy] = useState(false);
  const { data: updates = [] } = useQuery(verifiedPricesQuery);
  return (
    <div className="space-y-6">
      <SingleEditor
        table="site_settings"
        id={1}
        queryKey={["settings"]}
        fields={[
          { name: "price_source_enabled", label: "تفعيل مصدر Gold API", type: "bool" },
          { name: "gold_source_url", label: "مصدر الذهب (https://api.gold-api.com/price/XAU)" },
          { name: "silver_source_url", label: "مصدر الفضة (https://api.gold-api.com/price/XAG)" },
        ]}
      />
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await refresh();
            await Promise.all([
              qc.invalidateQueries({ queryKey: ["settings"] }),
              qc.invalidateQueries({ queryKey: ["verified-prices"] }),
              qc.invalidateQueries({ queryKey: ["admin", "site_settings"] }),
            ]);
            toast.success("تم توثيق وتحديث أسعار الذهب والفضة");
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "تعذر تحديث الأسعار");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Coins />
        {busy ? "جارٍ التحليل والتوثيق…" : "جلب الأسعار وتحليلها وتحديثها"}
      </Button>
      {updates.map((update) => (
        <div key={update.id} className="space-y-2 border-t border-border py-4">
          <p dir="ltr">
            XAU: {update.gold_usd} USD · XAG: {update.silver_usd} USD
          </p>
          <p>
            {new Date(update.verified_at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}
          </p>
          <p className="text-sm text-muted-foreground">{update.summary_ar}</p>
          <p className="text-xs text-muted-foreground">
            وقت مصدر الذهب: {new Date(update.gold_source_at).toLocaleString("ar-EG")} · الفضة:{" "}
            {new Date(update.silver_source_at).toLocaleString("ar-EG")}
          </p>
        </div>
      ))}
    </div>
  );
}

