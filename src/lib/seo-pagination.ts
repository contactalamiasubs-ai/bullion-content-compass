export async function readAllPages<T>(read: (offset: number, limit: number) => Promise<{ data: T[] | null; error: { message: string } | null }>, pageSize = 1000): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const result = await read(offset, pageSize);
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error("Missing collection response");
    rows.push(...result.data);
    if (result.data.length < pageSize) return rows;
  }
}