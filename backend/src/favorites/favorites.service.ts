import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) { }

  async getFavorites(userId: number) {
    const favorites = await this.prisma.favorites.findMany({
      where: { user_id: userId },
      include: {
        products: {
          include: {
            categories: {
              select: { name: true },
            },
            product_images: {
              select: { image_url: true },
              orderBy: { image_url: 'asc' },
            },
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return favorites.map((fav) => ({
      id: fav.id,
      product_id: fav.products?.id,
      name: fav.products?.name,
      description: fav.products?.description,
      price: fav.products?.price,
      stock: fav.products?.stock,
      category: fav.products?.categories?.name || null,
      images: fav.products?.product_images.map((img) => img.image_url) || [],
    }));
  }

  async toggleFavorite(userId: number, productId: number) {
    const existingFavorite = await this.prisma.favorites.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
      },
    });

    if (existingFavorite) {
      await this.prisma.favorites.delete({
        where: { id: existingFavorite.id },
      });
      return { message: 'Favorilerden çıkarıldı', isFavorite: false };
    }

    await this.prisma.favorites.create({
      data: {
        user_id: userId,
        product_id: productId,
      },
    });
    return { message: 'Favorilere eklendi', isFavorite: true };
  }
}
