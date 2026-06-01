const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const arg = process.argv[2] || '803';
const prisma = new PrismaClient();

async function main() {
  if (arg === '--missing') {
    const missing = await prisma.products.findMany({
      where: { product_images: { none: {} } },
      select: { id: true, name: true },
      take: 20,
    });
    const total = await prisma.products.count({
      where: { product_images: { none: {} } },
    });
    console.log('Products without product_images rows:', total);
    console.log(missing);
    return;
  }

  const id = Number(arg);
  const product = await prisma.products.findUnique({
    where: { id },
    include: { product_images: true },
  });
  if (!product) {
    console.log('Product not found:', id);
    return;
  }
  console.log('Product:', product.id, product.name);
  console.log('Images in DB:', product.product_images);
  const publicRoot = path.join(__dirname, '..', 'public');
  for (const img of product.product_images) {
    const url = img.image_url;
    const candidates = [
      path.join(publicRoot, url.replace(/^\//, '')),
      path.join(publicRoot, 'images', 'products', url),
      path.join(publicRoot, 'images', 'products', `${id}.jpg`),
      path.join(publicRoot, 'images', 'products', `${id}-0.jpg`),
      path.join(publicRoot, 'images', 'products', `${id}-1.jpg`),
    ];
    if (!url.startsWith('http')) {
      for (const c of candidates) {
        console.log('  file', c, fs.existsSync(c) ? 'EXISTS' : 'MISSING');
      }
    } else {
      console.log('  external URL:', url);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
