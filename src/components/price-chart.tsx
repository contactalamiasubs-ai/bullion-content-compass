import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLang } from "@/lib/i18n";
import { historyQuery } from "@/lib/data";
const fmt = (n: number, lang: string) => Number(n).toLocaleString(lang === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 2 });
export default function PriceChart() {
  const { t, lang } = useLang();
  const { data: rows = [] } = useQuery(historyQuery);
  const [range, setRange] = useState(12);
  const [cur, setCur] = useState<"usd" | "egp">("usd");
  const data = useMemo(() => {
    const from = new Date();
    from.setMonth(from.getMonth() - range);
    return rows
      .filter((r) => new Date(r.day) >= from)
      .map((r) => ({ day: r.day, v: Number(r[cur]) }));
  }, [rows, range, cur]);
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg">{t("marketRange")}</h3>
        <div className="flex flex-wrap gap-2 text-xs">
          {(["usd", "egp"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCur(c)}
              className={`rounded px-2.5 py-1 border ${cur === c ? "border-gold text-gold" : "border-border text-muted-foreground"}`}
            >
              {c.toUpperCase()}
            </button>
          ))}
          {[
            [1, t("month")],
            [12, t("year")],
            [36, t("y3")],
            [60, t("y5")],
          ].map(([m, l]) => (
            <button
              key={m}
              onClick={() => setRange(m as number)}
              className={`rounded px-2.5 py-1 ${range === m ? "bg-gold-gradient text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis
              dataKey="day"
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickFormatter={(d) => String(d).slice(0, 7)}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={11}
              domain={["auto", "auto"]}
              width={60}
            />
            <Tooltip
              contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
              formatter={(v: number) => fmt(v, lang)}
            />
            <Area type="monotone" dataKey="v" stroke="var(--gold)" fill="url(#g)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

