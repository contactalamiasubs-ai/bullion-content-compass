export type ProductGroup = { id: string; name_ar: string; name_en: string; sort: number };
export type ProductCategory = ProductGroup & { group_id: string };

/** Empty selections keep existing, unclassified products in the full catalog. */
export function matchesProductCategory(
  product: { category_id: string | null },
  categories: ProductCategory[],
  groupId: string,
  categoryId: string,
) {
  if (categoryId) return product.category_id === categoryId;
  if (!groupId) return true;
  return categories.some(
    (category) => category.id === product.category_id && category.group_id === groupId,
  );
}
