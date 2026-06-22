type ProductWithCategory = {
  category?: string | null;
  images?: string[];
};

export function aggregateCategoryCounts(
  products: ProductWithCategory[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const product of products) {
    const name = product.category?.trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

export function categoryPreviewImages(
  products: ProductWithCategory[],
): Map<string, string> {
  const images = new Map<string, string>();
  for (const product of products) {
    const name = product.category?.trim();
    const url = product.images?.[0];
    if (!name || !url || images.has(name)) continue;
    images.set(name, url);
  }
  return images;
}

export function categoriesFromProducts(
  products: ProductWithCategory[],
): Array<{ name: string; product_count: number }> {
  const counts = aggregateCategoryCounts(products);
  return Array.from(counts.entries()).map(([name, product_count]) => ({
    name,
    product_count,
  }));
}
