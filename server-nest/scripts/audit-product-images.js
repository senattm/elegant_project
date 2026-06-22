/**
 * Lists products missing images on site (no DB row or file not on disk).
 * Usage: node scripts/audit-product-images.js
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const productsDir = path.join(__dirname, '..', 'public', 'images', 'products');
const publicRoot = path.join(__dirname, '..', 'public');

function resolveFile(productId, imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http')) return imageUrl;
  const rel = imageUrl.replace(/^\//, '');
  const candidates = [
    path.join(publicRoot, rel),
    path.join(productsDir, path.basename(rel)),
    path.join(productsDir, `${productId}-0.jpg`),
    path.join(productsDir, `${productId}-1.jpg`),
    path.join(productsDir, `${productId}.jpg`),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

async function main() {
  const products = await prisma.products.findMany({
    include: {
      product_images: { orderBy: [{ is_main: 'desc' }, { image_url: 'asc' }] },
    },
    orderBy: { id: 'asc' },
  });

  const noDb = [];
  const noFile = [];
  let ok = 0;

  for (const p of products) {
    if (!p.product_images.length) {
      noDb.push({ id: p.id, name: p.name });
      continue;
    }
    const url = p.product_images[0].image_url;
    if (resolveFile(p.id, url)) {
      ok++;
    } else {
      noFile.push({ id: p.id, name: p.name, url });
    }
  }

  console.log('Total products:', products.length);
  console.log('OK (DB + file or external URL):', ok);
  console.log('No product_images row:', noDb.length);
  console.log('DB row but file missing:', noFile.length);

  if (noDb.length) {
    console.log('\n--- No DB row (run sync-missing-product-images.js) ---');
    noDb.forEach((x) => console.log(`  ${x.id} ${x.name}`));
  }
  if (noFile.length) {
    console.log('\n--- File missing on disk ---');
    noFile.slice(0, 30).forEach((x) => console.log(`  ${x.id} ${x.url}`));
    if (noFile.length > 30) console.log(`  ... +${noFile.length - 30} more`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
