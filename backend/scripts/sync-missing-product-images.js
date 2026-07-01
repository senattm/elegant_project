const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const dryRun = process.argv.includes('--dry-run');
const prisma = new PrismaClient();
const productsDir = path.join(__dirname, '..', 'public', 'images', 'products');

function discoverFiles(productId) {
  if (!fs.existsSync(productsDir)) {
    return [];
  }
  const patterns = [
    `${productId}-0.jpg`,
    `${productId}-0.jpeg`,
    `${productId}-0.png`,
    `${productId}.jpg`,
    `${productId}.jpeg`,
    `${productId}.png`,
    `${productId}-1.jpg`,
    `${productId}-2.jpg`,
  ];
  const found = [];
  for (const file of patterns) {
    if (fs.existsSync(path.join(productsDir, file))) {
      found.push(file);
    }
  }
  const prefix = `${productId}-`;
  for (const file of fs.readdirSync(productsDir)) {
    if (file.startsWith(prefix) && !found.includes(file)) {
      found.push(file);
    }
  }
  return [...new Set(found)].sort();
}

async function main() {
  const missing = await prisma.products.findMany({
    where: { product_images: { none: {} } },
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  });

  console.log(`Products without images in DB: ${missing.length}`);
  if (!fs.existsSync(productsDir)) {
    console.warn('Folder not found:', productsDir);
    console.warn('Copy product photos to backend/public/images/products/');
  }

  let linked = 0;
  let noFile = 0;

  for (const product of missing) {
    const files = discoverFiles(product.id);
    if (!files.length) {
      console.log(`[skip] ${product.id} ${product.name} — no file on disk`);
      noFile++;
      continue;
    }

    console.log(`[fix] ${product.id} ${product.name} -> ${files.join(', ')}`);

    for (let i = 0; i < files.length; i++) {
      const image_url = `images/products/${files[i]}`;
      const is_main = files[i].includes('-0.') || i === 0;
      if (dryRun) {
        console.log(`  would insert: ${image_url} is_main=${is_main}`);
        continue;
      }
      await prisma.product_images.create({
        data: {
          product_id: product.id,
          image_url,
          is_main,
        },
      });
    }
    linked++;
  }

  console.log(`Done. Linked products: ${linked}, still missing files: ${noFile}${dryRun ? ' (dry-run)' : ''}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
