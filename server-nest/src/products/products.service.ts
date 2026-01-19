import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const products = await this.prisma.products.findMany({
      include: {
        categories: {
          select: {
            name: true,
          },
        },
        product_images: {
          select: {
            image_url: true,
            is_main: true,
          },
          orderBy: [
            { is_main: 'desc' },
            { image_url: 'asc' },
          ],
        },
      },
      orderBy: {
        id: 'asc',
      },
    });

    return products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_id: product.category_id,
      category: product.categories?.name || null,
      images: product.product_images.map((img) => img.image_url),
    }));
  }

  async findOne(id: number) {
    const product = await this.prisma.products.findUnique({
      where: { id },
      include: {
        categories: {
          select: {
            name: true,
          },
        },
        product_images: {
          select: {
            image_url: true,
            is_main: true,
          },
          orderBy: [
            { is_main: 'desc' },
            { image_url: 'asc' },
          ],
        },
      },
    });

    if (!product) {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_id: product.category_id,
      category: product.categories?.name || null,
      images: product.product_images.map((img) => img.image_url),
    };
  }
}
