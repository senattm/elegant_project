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

  private async validateStock(productId: number, variantId: number | null, requiredQuantity: number) {
    if (variantId) {
      const variant = await this.prisma.product_variants.findUnique({
        where: { id: variantId },
        select: { stock: true, product_id: true },
      });

      if (!variant) {
        throw new NotFoundException('Varyant bulunamadı');
      }

      if (variant.product_id !== productId) {
        throw new BadRequestException('Varyant bu ürüne ait değil');
      }

      if (requiredQuantity > variant.stock) {
        throw new BadRequestException(
          `Stok yetersiz. Mevcut stok: ${variant.stock}`,
        );
      }
    } else {
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
        product_variants: true,
      },
      orderBy: { id: 'desc' },
    });

    return cartItems.map((item) => {
      const variant = item.product_variants;
      const price = variant?.price ? Number(variant.price) : (item.products?.price ? Number(item.products.price) : 0);
      const stock = variant?.stock ?? item.products?.stock ?? 0;
      const size = variant?.size ?? item.selected_size;

      return {
        id: item.id,
        quantity: item.quantity,
        selected_size: size,
        variant_id: variant?.id || null,
        product_id: item.products?.id,
        name: item.products?.name,
        description: item.products?.description,
        price: price,
        stock: stock,
        category: item.products?.categories?.name || null,
        images: item.products?.product_images.map((img) => img.image_url) || [],
      };
    });
  }

  async addToCart(
    userId: number,
    productId: number,
    quantity: number = 1,
    variantId?: number,
    selectedSize?: string,
  ) {
    let finalVariantId: number | null = variantId || null;

    if (!finalVariantId && selectedSize) {
      const variant = await this.prisma.product_variants.findFirst({
        where: {
          product_id: productId,
          size: selectedSize,
        },
      });
      if (variant) {
        finalVariantId = variant.id;
      }
    }

    const existingItem = await this.prisma.cart_items.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
        variant_id: finalVariantId,
      },
    });

    const totalQuantity = existingItem
      ? existingItem.quantity! + quantity
      : quantity;

    await this.validateStock(productId, finalVariantId, totalQuantity);

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
        variant_id: finalVariantId,
        quantity,
        selected_size: selectedSize || null,
      },
    });
  }

  async updateQuantity(
    userId: number,
    productId: number,
    quantity: number,
    variantId?: number,
    selectedSize?: string,
  ) {
    this.logger.log(
      `updateQuantity called - userId: ${userId}, productId: ${productId}, quantity: ${quantity}, variantId: ${variantId}, selectedSize: "${selectedSize}"`,
    );

    if (quantity <= 0) {
      return this.removeFromCart(userId, productId, variantId, selectedSize);
    }

    let finalVariantId: number | null = variantId || null;

    if (!finalVariantId && selectedSize) {
      const variant = await this.prisma.product_variants.findFirst({
        where: {
          product_id: productId,
          size: selectedSize,
        },
      });
      if (variant) {
        finalVariantId = variant.id;
      }
    }

    await this.validateStock(productId, finalVariantId, quantity);

    const cartItem = await this.prisma.cart_items.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
        variant_id: finalVariantId,
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
        `Sepet öğesi bulunamadı! Aranan: variantId="${finalVariantId}", Mevcut items:`,
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
    variantId?: number,
    selectedSize?: string,
  ) {
    let finalVariantId: number | null = variantId || null;

    if (!finalVariantId && selectedSize) {
      const variant = await this.prisma.product_variants.findFirst({
        where: {
          product_id: productId,
          size: selectedSize,
        },
      });
      if (variant) {
        finalVariantId = variant.id;
      }
    }

    const cartItem = await this.prisma.cart_items.findFirst({
      where: {
        user_id: userId,
        product_id: productId,
        variant_id: finalVariantId,
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
