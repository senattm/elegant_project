const { PrismaClient } = require('@prisma/client');

const dryRun = process.argv.includes('--dry-run');
const prisma = new PrismaClient();

function defaultSizesForProduct(product) {
  const cat = (product.categories?.name || '').toLowerCase();
  const tags = JSON.stringify(product.tags || []).toLowerCase();
  const isShoe =
    cat.includes('ayakkab') ||
    tags.includes('shoes') ||
    tags.includes('ayakkabi') ||
    tags.includes('sandal');
  if (isShoe) return ['36', '37', '38', '39', '40', '41'];
  const isNumericBottom =
    cat.includes('pantolon') || cat.includes('jean') || cat.includes('etek');
  if (isNumericBottom) return ['34', '36', '38', '40', '42'];
  if (cat.includes('çanta') || cat.includes('aksesuar') || cat.includes('canta')) {
    return ['Tek Beden'];
  }
  return ['XS', 'S', 'M', 'L', 'XL'];
}

async function main() {
  const missing = await prisma.products.findMany({
    where: { product_variants: { none: {} } },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      tags: true,
      categories: { select: { name: true } },
    },
    orderBy: { id: 'asc' },
  });

  console.log(`Products without variants: ${missing.length}`);

  let created = 0;
  let skipped = 0;

  for (const product of missing) {
    const sizes = defaultSizesForProduct(product);
    const stock =
      product.stock != null && product.stock >= 0 ? product.stock : 10;
    const perSize = Math.max(1, Math.floor(stock / sizes.length));
    const price = product.price != null ? product.price : null;

    console.log(
      `[${dryRun ? 'dry' : 'create'}] ${product.id} ${product.name?.slice(0, 50)} -> ${sizes.join(', ')}`,
    );

    if (!dryRun) {
      for (const size of sizes) {
        const sku = `SKU-${product.id}-${size}`;
        const existingSku = await prisma.product_variants.findUnique({
          where: { sku },
        });
        if (existingSku) continue;
        await prisma.product_variants.create({
          data: {
            product_id: product.id,
            size,
            price,
            stock: perSize,
            sku,
          },
        });
      }
    }
    created++;
  }

  console.log(
    `Done. ${dryRun ? 'Would create' : 'Created'}: ${created}, skipped: ${skipped}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
