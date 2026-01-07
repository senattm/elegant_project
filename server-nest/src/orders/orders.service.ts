import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PoolClient } from 'pg';
import { OrderItemDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private db: DatabaseService) {}

  private readonly orderQuery = `
    SELECT 
      o.id,
      o.order_number,
      o.total_amount,
      o.discount_amount,
      o.final_amount,
      o.status,
      o.created_at,
      ARRAY_AGG(
        json_build_object(
          'id', oi.id,
          'productId', oi.product_id,
          'quantity', oi.quantity,
          'selectedSize', oi.selected_size,
          'price', oi.price,
          'productName', p.name,
          'productImages', (
            SELECT ARRAY_AGG(pi.image_url)
            FROM product_images pi
            WHERE pi.product_id = p.id
          )
        ) ORDER BY oi.id
      ) AS items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
  `;

  private mapOrderRow(row: any) {
    return {
      id: row.id,
      orderNumber: row.order_number,
      totalAmount: parseFloat(row.total_amount),
      discountAmount: parseFloat(row.discount_amount),
      finalAmount: parseFloat(row.final_amount),
      status: row.status,
      createdAt: row.created_at,
      items: row.items.filter((item: any) => item.productId !== null),
    };
  }

  async createOrder(
    userId: number,
    items: OrderItemDto[],
    cardHolderName: string,
    cardLast4: string,
    addressId?: number,
  ) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Sipariş için en az bir ürün gerekli');
    }

    const client: PoolClient = await this.db.getPool().connect();
    try {
      await client.query('BEGIN');

      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );

      const userResult = await client.query(
        `SELECT 
          u.first_order_discount_used,
          (SELECT COUNT(*) FROM orders WHERE user_id = $1) as order_count
        FROM users u 
        WHERE u.id = $1`,
        [userId],
      );

      if (userResult.rows.length === 0) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      const hasUsedDiscount = userResult.rows[0].first_order_discount_used;
      const orderCount = parseInt(userResult.rows[0].order_count, 10);

      // İlk sipariş indirimi: flag kullanılmamış VE sipariş sayısı 0
      const isFirstOrder = !hasUsedDiscount && orderCount === 0;
      const discountAmount = isFirstOrder ? totalAmount * 0.1 : 0;
      const finalAmount = totalAmount - discountAmount;

      const orderNumber = `ORD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      const orderResult = await client.query(
        `INSERT INTO orders (user_id, address_id, order_number, total_amount, discount_amount, final_amount, status) 
          VALUES ($1, $2, $3, $4, $5, $6, 'PREPARING') 
          RETURNING id, order_number, total_amount, discount_amount, final_amount, status, created_at`,
        [
          userId,
          addressId || null,
          orderNumber,
          totalAmount,
          discountAmount,
          finalAmount,
        ],
      );

      const order = orderResult.rows[0];

      const productIds = items.map((item) => item.productId);
      const productsResult = await client.query(
        'SELECT id, stock FROM products WHERE id = ANY($1) FOR UPDATE',
        [productIds],
      );

      const stockMap = new Map<number, number>(
        productsResult.rows.map((row) => [row.id, Number(row.stock)]),
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

        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price, total, selected_size) 
            VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            order.id,
            item.productId,
            item.quantity,
            item.price,
            itemTotal,
            item.selectedSize || null,
          ],
        );

        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.quantity, item.productId],
        );

        orderItemsToReturn.push({
          productId: item.productId,
          quantity: item.quantity,
          selectedSize: item.selectedSize,
          price: item.price,
        });
      }

      if (isFirstOrder) {
        await client.query(
          'UPDATE users SET first_order_discount_used = true WHERE id = $1',
          [userId],
        );
      }

      await client.query('COMMIT');

      return {
        id: order.id,
        orderNumber: order.order_number,
        totalAmount: parseFloat(order.total_amount),
        discountAmount: parseFloat(order.discount_amount),
        finalAmount: parseFloat(order.final_amount),
        status: order.status,
        createdAt: order.created_at,
        items: orderItemsToReturn,
      };
    } catch (error) {
      await client.query('ROLLBACK');

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new BadRequestException('Sipariş oluşturulamadı');
    } finally {
      client.release();
    }
  }

  async getUserOrders(userId: number) {
    const result = await this.db.query(
      `${this.orderQuery}
       WHERE o.user_id = $1
       GROUP BY o.id, o.order_number, o.total_amount, o.discount_amount, o.final_amount, o.status, o.created_at
       ORDER BY o.created_at DESC`,
      [userId],
    );

    return result.rows.map(this.mapOrderRow);
  }

  async getOrderById(orderId: number, userId: number) {
    const result = await this.db.query(
      `${this.orderQuery}
       WHERE o.id = $1 AND o.user_id = $2
       GROUP BY o.id, o.order_number, o.total_amount, o.discount_amount, o.final_amount, o.status, o.created_at`,
      [orderId, userId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapOrderRow(result.rows[0]);
  }

  async checkFirstOrder(userId: number) {
    const result = await this.db.query(
      `SELECT 
        u.first_order_discount_used,
        (SELECT COUNT(*) FROM orders WHERE user_id = $1) as order_count
      FROM users u 
      WHERE u.id = $1`,
      [userId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const hasUsedDiscount = result.rows[0].first_order_discount_used;
    const orderCount = parseInt(result.rows[0].order_count, 10);

    // İlk sipariş: hem flag kullanılmamış hem de sipariş sayısı 0
    const isFirstOrder = !hasUsedDiscount && orderCount === 0;

    return {
      isFirstOrder,
      discountPercentage: isFirstOrder ? 10 : 0,
    };
  }
}
