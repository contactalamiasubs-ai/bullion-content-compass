import dns from "node:dns/promises";
import mysql from "mysql2/promise";
import { SITE_TABLES, type SiteTable } from "./site-schema";

let pool: mysql.Pool | null = null;
let poolHost = "";

export async function getPool() {
  const host = process.env["MYSQL_HOST"];
  const user = process.env["MYSQL_USER"];
  const password = process.env["MYSQL_PASSWORD"];
  const database = process.env["MYSQL_DATABASE"];
  if (!host || !user || !password || !database) throw new Error("قاعدة بيانات الموقع غير مهيأة");
  if (pool && poolHost === host) return pool;
  // Remote access is allowed by IPv4 address, so connect over IPv4 when available.
  const ip = host === "localhost" ? host : ((await dns.resolve4(host).catch(() => [host]))[0] ?? host);
  pool = mysql.createPool({
    host: ip, user, password, database, port: Number(process.env["MYSQL_PORT"] ?? 3306),
    connectionLimit: 5, dateStrings: true, timezone: "Z", decimalNumbers: true, charset: "utf8mb4",
  });
  poolHost = host;
  return pool;
}

export async function sql<T = Record<string, unknown>>(query: string, params: unknown[] = []) {
  const p = await getPool();
  const [rows] = await p.query(query, params);
  return rows as T[];
}

export async function exec(query: string, params: unknown[] = []) {
  const p = await getPool();
  const [res] = await p.query(query, params);
  return res as mysql.ResultSetHeader;
}

const id = (name: string) => "`" + name.replace(/`/g, "") + "`";
export const ident = id;

function toIso(v: unknown) {
  if (typeof v !== "string") return v;
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(v) ? v.replace(" ", "T") + (v.endsWith("Z") ? "" : "Z") : v;
}

/** Converts MySQL values back to the shapes the app used before (booleans, ISO timestamps). */
export function normalize(table: SiteTable, row: Record<string, unknown>) {
  const def = SITE_TABLES[table];
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (def.booleans?.includes(k)) out[k] = v === null ? null : Boolean(Number(v));
    else if (k === "created_at" || k === "updated_at" || k === "publish_at") out[k] = toIso(v);
    else out[k] = v;
  }
  return out;
}

/** Converts app values to MySQL values. */
export function toDb(value: unknown) {
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.replace("T", " ").replace(/Z$|[+-]\d{2}:?\d{2}$/, "").slice(0, 23);
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return value;
}

export function nowDb() {
  return new Date().toISOString().replace("T", " ").replace("Z", "").slice(0, 23);
}
