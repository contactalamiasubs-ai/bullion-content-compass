export const catalogPageSize = 8;
export function catalogSearch(search: Record<string, unknown>): { group?: string; category?: string; page?: number } {
  return {
    group: typeof search["group"] === "string" ? search["group"] : "",
    category: typeof search["category"] === "string" ? search["category"] : "",
    page: Math.max(1, Math.floor(Number(search["page"])) || 1),
  };
}
export function catalogPage<T>(rows: T[], requestedPage: number, pageSize = catalogPageSize) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.max(1, Math.min(totalPages, Math.floor(requestedPage) || 1));
  return { page, totalPages, items: rows.slice((page - 1) * pageSize, page * pageSize) };
}