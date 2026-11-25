// Client-safe description of the site tables stored in Hostinger MySQL.
export type SitePermission = "content" | "products" | "prices" | "settings" | "serials";
export type SiteTable =
  | "site_settings" | "slides" | "metal_prices" | "price_history" | "sections" | "services"
  | "products" | "product_groups" | "product_categories" | "bullion_serials" | "posts";

type TableDef = {
  pk: string;
  columns: string[];
  booleans?: string[];
  json?: string[];
  write: SitePermission[];
  /** Column that must be true for anonymous reads; null = public; "none" = staff only. */
  publicFilter: string | null | "none";
  uuidPk?: boolean;
};

export const SITE_TABLES: Record<SiteTable, TableDef> = {
  site_settings: {
    pk: "id", write: ["settings", "prices"], publicFilter: null,
    booleans: ["popup_enabled", "price_source_enabled", "serial_bg_enabled"],
    columns: ["id","site_name_ar","site_name_en","logo_url","whatsapp_number","phone","email","address_ar","address_en","facebook","instagram","youtube","tiktok","gold_usd","silver_usd","years_experience","popup_enabled","popup_title_ar","popup_title_en","popup_link","popup_button_ar","popup_button_en","app_link","updated_at","price_source_enabled","gold_source_url","silver_source_url","gold_gram_21","gold_gram_24","silver_gram","gold_gram_18","contact_channels","serial_bg_enabled","serial_bg_style","serial_bg_speed","serial_bg_image","service_whatsapp","service_phone","x_url"],
  },
  slides: { pk: "id", uuidPk: true, write: ["content"], publicFilter: "active", booleans: ["active"],
    columns: ["id","title_ar","title_en","body_ar","body_en","button_ar","button_en","link","image_url","sort","active","created_at"] },
  metal_prices: { pk: "id", uuidPk: true, write: ["prices"], publicFilter: null,
    columns: ["id","name_ar","name_en","sell","buy","sort","updated_at"] },
  price_history: { pk: "id", uuidPk: true, write: ["prices"], publicFilter: null, columns: ["id","day","usd","egp"] },
  sections: { pk: "key", write: ["content"], publicFilter: null, columns: ["key","title_ar","title_en","body_ar","body_en","image_url"] },
  services: { pk: "id", uuidPk: true, write: ["content"], publicFilter: null, columns: ["id","title_ar","title_en","body_ar","body_en","image_url","sort"] },
  products: { pk: "id", uuidPk: true, write: ["products"], publicFilter: "active", booleans: ["active", "gram_pricing"],
    columns: ["id","name_ar","name_en","description_ar","description_en","price","image_url","active","sort","created_at","category_id","gram_pricing","weight_grams","karat","making_charge","pricing_metal","availability"] },
  product_groups: { pk: "id", uuidPk: true, write: ["products"], publicFilter: null, columns: ["id","name_ar","name_en","sort"] },
  product_categories: { pk: "id", uuidPk: true, write: ["products"], publicFilter: null, columns: ["id","group_id","name_ar","name_en","sort"] },
  bullion_serials: { pk: "id", uuidPk: true, write: ["serials"], publicFilter: "none", booleans: ["active"],
    columns: ["id","serial","name_ar","name_en","weight_grams","purity","specifications_ar","specifications_en","active","created_at"] },
  posts: { pk: "id", uuidPk: true, write: ["content"], publicFilter: "published", booleans: ["published"],
    columns: ["id","kind","slug","title_ar","title_en","excerpt_ar","excerpt_en","body_ar","body_en","image_url","published","created_at"] },
};

export const PRICE_SETTING_FIELDS = ["gold_usd","silver_usd","gold_gram_18","gold_gram_21","gold_gram_24","silver_gram","price_source_enabled","gold_source_url","silver_source_url"];

export function isSiteTable(t: unknown): t is SiteTable {
  return typeof t === "string" && Object.prototype.hasOwnProperty.call(SITE_TABLES, t);
}

/** Keeps only known columns so callers can never reach arbitrary SQL identifiers. */
export function cleanRow(table: SiteTable, row: Record<string, unknown>) {
  const cols = new Set(SITE_TABLES[table].columns);
  return Object.fromEntries(Object.entries(row).filter(([k]) => cols.has(k)));
}

/** Permission needed for a settings patch; price fields need "prices", others "settings". */
export function settingsPermissionsFor(patch: Record<string, unknown>, before: Record<string, unknown>) {
  const needed = new Set<SitePermission>();
  for (const [k, v] of Object.entries(patch)) {
    if (k === "updated_at" || k === "id") continue;
    if (JSON.stringify(v ?? null) === JSON.stringify(before[k] ?? null)) continue;
    needed.add(PRICE_SETTING_FIELDS.includes(k) ? "prices" : "settings");
  }
  return [...needed];
}
