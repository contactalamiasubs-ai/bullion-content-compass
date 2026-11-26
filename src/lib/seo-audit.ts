export type AuditIssue = { code: string; priority: "high" | "medium" | "low"; detail: string };
export type AuditObservation = { status: number; title: string; description: string; canonical: string; expectedCanonical: string; schemaCount: number; invalidSchemas: number; h1Count: number; missingAlts: number; wordCount: number; brokenLinks: string[]; failedLinks: string[]; pageType: string; imageCount: number };
export function auditObservation(o: AuditObservation) {
  const issues: AuditIssue[] = [];
  const add = (code: string, priority: AuditIssue["priority"], detail = "") => issues.push({ code, priority, detail });
  if (o.status >= 400) add("http_error", "high", String(o.status));
  if (!o.title.trim()) add("missing_title", "high");
  if (!o.description.trim()) add("missing_description", "high");
  if (o.canonical !== o.expectedCanonical) add("canonical_mismatch", "high", o.canonical);
  if (!o.schemaCount) add("missing_schema", "medium");
  if (o.invalidSchemas) add("invalid_schema", "high", String(o.invalidSchemas));
  if (o.h1Count !== 1) add("h1_count", "medium", String(o.h1Count));
  if (o.missingAlts) add("missing_alt", "medium", String(o.missingAlts));
  if (o.wordCount < 40 && !["/check-bar", "/contact"].includes(o.pageType)) add("thin_content", "low", String(o.wordCount));
  if (o.brokenLinks.length) add("broken_links", "high", o.brokenLinks.join(", "));
  if (o.failedLinks.length) add("unverified_links", "low", o.failedLinks.join(", "));
  const deductions = { high: 15, medium: 8, low: 4 };
  return { issues, score: Math.max(0, 100 - issues.reduce((sum,i) => sum + deductions[i.priority], 0)), observation: o };
}
export function duplicateValues(rows: { path: string; title: string; description: string }[], field: "title" | "description") {
  const groups = new Map<string, string[]>();
  for (const row of rows) { const value = row[field].trim().toLowerCase(); if (!value) continue; groups.set(value, [...(groups.get(value) ?? []), row.path]); }
  return [...groups.values()].filter(paths => paths.length > 1);
}