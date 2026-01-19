import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private prisma: PrismaService) { }

  private async validateStock(productId: number, requiredQuantity: number) {
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
      select: { stock: true },
    });

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    if (requiredQuantity > product.stock) {
      throw new BadRequestException(
        `Stok yetersiz. Mevcut stok: ${product.stock}`,
      );
    }
  }

  async getCartItems(userId: number) {
    const cartItems = await this.prisma.cart_items.findMany({
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

    return cartItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      selected_size: item.selected_size,
      product_id: item.products?.id,
      name: item.products?.name,
      description: item.products?.description,
      price: item.products?.price,
      stock: item.products?.stock,
      category: item.products?.categories?.name || null,
      images: item.products?.product_images.map((img) => img.image_url) || [],
    }));
  }

  async addToCart(
    userId: number,
    productId: number,
    quantity: number = 1,
    selectedSize?: string,
  ) {
    const sizeValue = selectedSize || null;

    const existingItem = await this.prisma.cart_items.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
        selected_size: sizeValue,
      },
    });

    const totalQuantity = existingItem
      ? existingItem.quantity! + quantity
      : quantity;

    await this.validateStock(productId, totalQuantity);

    if (existingItem) {
      return await this.prisma.cart_items.update({
        where: { id: existingItem.id },
        data: { quantity: totalQuantity },
      });
    }

    return await this.prisma.cart_items.create({
      data: {
        user_id: userId,
        product_id: productId,
        quantity,
        selected_size: sizeValue,
      },
    });
  }

  async updateQuantity(
    userId: number,
    productId: number,
    quantity: number,
    selectedSize?: string,
  ) {
    this.logger.log(
      `updateQuantity called - userId: ${userId}, productId: ${productId}, quantity: ${quantity}, selectedSize: "${selectedSize}"`,
    );

    if (quantity <= 0) {
      return this.removeFromCart(userId, productId, selectedSize);
    }

    await this.validateStock(productId, quantity);

    const sizeValue = selectedSize || null;

    const cartItem = await this.prisma.cart_items.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
        selected_size: sizeValue,
      },
    });

    if (!cartItem) {
      const allItems = await this.prisma.cart_items.findMany({
        where: {
          user_id: userId,
          product_id: productId,
        },
      });
      this.logger.error(
        `Sepet öğesi bulunamadı! Aranan: size="${sizeValue}", Mevcut items:`,
        allItems,
      );
      throw new NotFoundException('Sepet öğesi bulunamadı');
    }

    return await this.prisma.cart_items.update({
      where: { id: cartItem.id },
      data: { quantity },
    });
  }

  async removeFromCart(
    userId: number,
    productId: number,
    selectedSize?: string,
  ) {
    const sizeValue = selectedSize || null;

    const cartItem = await this.prisma.cart_items.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
        selected_size: sizeValue,
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Sepet öğesi bulunamadı');
    }

    await this.prisma.cart_items.delete({
      where: { id: cartItem.id },
    });

    return { message: 'Ürün sepetten çıkarıldı' };
  }

  async clearCart(userId: number) {
    await this.prisma.cart_items.deleteMany({
      where: { user_id: userId },
    });
    return { message: 'Sepet temizlendi' };
  }
}
