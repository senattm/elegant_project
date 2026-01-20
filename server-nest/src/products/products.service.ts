import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) { }

  private productInclude = {
    categories: {
      select: {
        name: true,
        id: true,
        parent_id: true,
      },
    },
    product_images: {
      select: {
        image_url: true,
        is_main: true,
      },
      orderBy: [
        { is_main: 'desc' as const },
        { image_url: 'asc' as const },
      ],
    },
  };

  private mapProductResponse(product: any) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category_id: product.category_id,
      parent_category_id: product.categories?.parent_id || null,
      category: product.categories?.name || null,
      images: product.product_images.map((img) => img.image_url),
    };
  }

  async findAll() {
    const products = await this.prisma.products.findMany({
      include: this.productInclude,
      orderBy: {
        id: 'asc',
      },
    });

    return products.map((product) => this.mapProductResponse(product));
  }

  async findOne(id: number) {
    const product = await this.prisma.products.findUnique({
      where: { id },
      include: this.productInclude,
    });

    if (!product) {
      return null;
    }

    return this.mapProductResponse(product);
  }
}
