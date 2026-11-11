import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en";

const dict = {
  home: { ar: "الرئيسية", en: "Home" },
  about: { ar: "من نحن", en: "About" },
  services: { ar: "خدماتنا", en: "Services" },
  products: { ar: "منتجاتنا", en: "Products" },
  blog: { ar: "المدونة", en: "Blog" },
  news: { ar: "الأخبار", en: "News" },
  contact: { ar: "تواصل معنا", en: "Contact" },
  goldPrice: { ar: "سعر الذهب", en: "Gold price" },
  silverPrice: { ar: "سعر الفضة", en: "Silver price" },
  perOz: { ar: "للأوقية اليوم", en: "per oz today" },
  metalPrices: { ar: "أسعار المعادن", en: "Metal prices" },
  weSell: { ar: "نبيع", en: "We sell" },
  weBuy: { ar: "نشتري", en: "We buy" },
  lastUpdate: { ar: "آخر تحديث", en: "Last update" },
  marketRange: { ar: "نطاق سعر الذهب بالدولار والجنيه", en: "Gold market range in USD & EGP" },
  month: { ar: "شهر", en: "Month" },
  year: { ar: "سنة", en: "Year" },
  y3: { ar: "3 سنوات", en: "3 Years" },
  y5: { ar: "5 سنوات", en: "5 Years" },
  years: { ar: "عامًا من الريادة", en: "years of leadership" },
  buyWhatsapp: { ar: "اطلب عبر واتساب", en: "Order on WhatsApp" },
  readMore: { ar: "اقرأ المزيد", en: "Read more" },
  viewAll: { ar: "عرض الكل", en: "View all" },
  infoHub: { ar: "مركز المعلومات", en: "Information hub" },
  dailyReport: { ar: "التقرير اليومي", en: "Daily report" },
  goldGuide: { ar: "دليل الذهب", en: "Gold guide" },
  catalog: { ar: "تحميل الكتالوج", en: "Download catalog" },
  verify: { ar: "تحقق من جودة الذهب", en: "Verify gold quality" },
  zakat: { ar: "حاسبة زكاة الذهب", en: "Gold zakat calculator" },
  grams: { ar: "الوزن بالجرام", en: "Weight in grams" },
  karat: { ar: "العيار", en: "Karat" },
  calculate: { ar: "احسب", en: "Calculate" },
  zakatDue: { ar: "الزكاة المستحقة", en: "Zakat due" },
  belowNisab: {
    ar: "أقل من النصاب (85 جرام عيار 24) — لا زكاة",
    en: "Below nisab (85 g of 24K) — no zakat due",
  },
  download: { ar: "حمّل الآن", en: "Download now" },
  name: { ar: "الاسم", en: "Name" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  phone: { ar: "الهاتف", en: "Phone" },
  message: { ar: "رسالتك", en: "Your message" },
  send: { ar: "إرسال", en: "Send" },
  sent: { ar: "تم إرسال رسالتك، شكرًا لك", en: "Message sent, thank you" },
  rights: { ar: "جميع الحقوق محفوظة", en: "All rights reserved" },
  latest: { ar: "أحدث المقالات", en: "Latest articles" },
  close: { ar: "إغلاق", en: "Close" },
} as const;

type Key = keyof typeof dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string }>({
  lang: "ar",
  setLang: () => {},
  t: (k) => dict[k].ar,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "en" || saved === "ar") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = (l: Lang) => {
    localStorage.setItem("lang", l);
    setLangState(l);
  };
  return <Ctx.Provider value={{ lang, setLang, t: (k) => dict[k][lang] }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);

/** Pick the bilingual field: pick(row, "title") -> row.title_ar | row.title_en */
export function pick(
  row: Record<string, unknown> | null | undefined,
  field: string,
  lang: Lang,
): string {
  if (!row) return "";
  const v = row[`${field}_${lang}`] ?? row[`${field}_ar`];
  return typeof v === "string" ? v : "";
}
