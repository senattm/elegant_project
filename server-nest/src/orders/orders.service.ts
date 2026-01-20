import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderItemDto } from './dto';

import { PaymentService } from '../payment/payment.service';
import { PaymentDto } from '../payment/dto/payment.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private paymentService: PaymentService,
  ) { }

  async createOrder(
    userId: number,
    items: OrderItemDto[],
    payment: PaymentDto,
    addressId?: number,
  ) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Sipariş için en az bir ürün gerekli');
    }

    if (!addressId) {
      throw new BadRequestException('Teslimat adresi seçimi zorunludur');
    }


    const paymentResult = await this.paymentService.processPayment(payment);
    if (!paymentResult.success) {
      throw new BadRequestException('Ödeme işlemi başarısız oldu');
    }

    try {

      return await this.prisma.$transaction(async (tx) => {
        const totalAmountCents = items.reduce(
          (sum, item) => sum + Math.round(item.price * 100) * item.quantity,
          0,
        );
        const totalAmount = totalAmountCents / 100;

        const user = await tx.users.findUnique({
          where: { id: userId },
          select: {
            first_order_discount_used: true,
            orders: {
              select: { id: true },
            },
          },
        });

        if (!user) {
          throw new NotFoundException('Kullanıcı bulunamadı');
        }

        const hasUsedDiscount = user.first_order_discount_used;
        const orderCount = user.orders.length;

        const isFirstOrder = !hasUsedDiscount && orderCount === 0;
        const discountAmountCents = isFirstOrder ? Math.round(totalAmountCents * 0.1) : 0;
        const discountAmount = discountAmountCents / 100;
        const finalAmount = (totalAmountCents - discountAmountCents) / 100;

        const orderNumber = `ORD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        const order = await tx.orders.create({
          data: {
            user_id: userId,
            address_id: addressId!,
            order_number: orderNumber,
            total_amount: totalAmount,
            discount_amount: discountAmount,
            final_amount: finalAmount,
            status: 'PREPARING',
          },
        });

        const productIds = items.map((item) => item.productId);
        const products = await tx.products.findMany({
          where: { id: { in: productIds } },
          select: { id: true, stock: true },
        });

        const stockMap = new Map<number, number>(
          products.map((p) => [p.id, p.stock]),
        );

        const quantityByProduct = new Map<number, number>();
        for (const item of items) {
          const prev = quantityByProduct.get(item.productId) ?? 0;
          quantityByProduct.set(item.productId, prev + item.quantity);
        }

        for (const [productId, totalQty] of quantityByProduct.entries()) {
          const stock = stockMap.get(productId);

          if (stock === undefined) {
            throw new NotFoundException(`Ürün ID ${productId} bulunamadı.`);
          }

          if (stock < totalQty) {
            throw new BadRequestException(
              `Ürün ID ${productId} için yeterli stok yok.`,
            );
          }
        }

        const orderItemsToReturn: OrderItemDto[] = [];

        for (const item of items) {
          const itemTotal = item.price * item.quantity;

          await tx.order_items.create({
            data: {
              order_id: order.id,
              product_id: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: itemTotal,
              selected_size: item.selectedSize || null,
            },
          });

          await tx.products.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });

          orderItemsToReturn.push({
            productId: item.productId,
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            price: item.price,
          });
        }

        if (isFirstOrder) {
          await tx.users.update({
            where: { id: userId },
            data: { first_order_discount_used: true },
          });
        }

        return {
          id: order.id,
          orderNumber: order.order_number,
          totalAmount: parseFloat(order.total_amount.toString()),
          discountAmount: parseFloat(order.discount_amount?.toString() || '0'),
          finalAmount: parseFloat(order.final_amount.toString()),
          status: order.status,
          createdAt: order.created_at,
          items: orderItemsToReturn,
        };
      });
    } catch (error) {
      console.error('Sipariş oluşturulurken hata:', error);
      throw error;
    }
  }

  async getUserOrders(userId: number) {
    const orders = await this.prisma.orders.findMany({
      where: { user_id: userId },
      include: {
        order_items: {
          include: {
            products: {
              include: {
                product_images: {
                  select: { image_url: true },
                },
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      totalAmount: parseFloat(order.total_amount.toString()),
      discountAmount: parseFloat(order.discount_amount?.toString() || '0'),
      finalAmount: parseFloat(order.final_amount.toString()),
      status: order.status,
      createdAt: order.created_at,
      items: order.order_items
        .filter((item) => item.product_id !== null)
        .map((item) => ({
          id: item.id,
          productId: item.product_id,
          quantity: item.quantity,
          selectedSize: item.selected_size,
          price: parseFloat(item.price.toString()),
          productName: item.products?.name,
          productImages:
            item.products?.product_images.map((img) => img.image_url) || [],
        })),
    }));
  }

  async getOrderById(orderId: number, userId: number) {
    const order = await this.prisma.orders.findFirst({
      where: {
        id: orderId,
        user_id: userId,
      },
      include: {
        order_items: {
          include: {
            products: {
              include: {
                product_images: {
                  select: { image_url: true },
                },
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!order) {
      return null;
    }

    return {
      id: order.id,
      orderNumber: order.order_number,
      totalAmount: parseFloat(order.total_amount.toString()),
      discountAmount: parseFloat(order.discount_amount?.toString() || '0'),
      finalAmount: parseFloat(order.final_amount.toString()),
      status: order.status,
      createdAt: order.created_at,
      items: order.order_items
        .filter((item) => item.product_id !== null)
        .map((item) => ({
          id: item.id,
          productId: item.product_id,
          quantity: item.quantity,
          selectedSize: item.selected_size,
          price: parseFloat(item.price.toString()),
          productName: item.products?.name,
          productImages:
            item.products?.product_images.map((img) => img.image_url) || [],
        })),
    };
  }

  async checkFirstOrder(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        first_order_discount_used: true,
        orders: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const hasUsedDiscount = user.first_order_discount_used;
    const orderCount = user.orders.length;

    const isFirstOrder = !hasUsedDiscount && orderCount === 0;

    return {
      isFirstOrder,
      discountPercentage: isFirstOrder ? 10 : 0,
    };
  }
}
