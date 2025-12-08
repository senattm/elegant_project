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

  async createOrder(userId: number, items: OrderItemDto[], addressId?: number) {
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
        'SELECT first_order_discount_used FROM users WHERE id = $1',
        [userId],
      );

      if (userResult.rows.length === 0) {
        throw new NotFoundException('Kullanıcı bulunamadı');
      }

      const hasUsedDiscount = userResult.rows[0].first_order_discount_used;
      const discountAmount = !hasUsedDiscount ? totalAmount * 0.1 : 0;
      const finalAmount = totalAmount - discountAmount;

      const orderNumber = `ORD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

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
      const orderItemsToReturn: OrderItemDto[] = [];

      for (const item of items) {
        const productStockResult = await client.query(
          'SELECT stock FROM products WHERE id = $1 FOR UPDATE',
          [item.productId],
        );

        if (productStockResult.rows.length === 0) {
          throw new NotFoundException(`Ürün ID ${item.productId} bulunamadı.`);
        }

        if (productStockResult.rows[0].stock < item.quantity) {
          throw new BadRequestException(
            `Ürün ID ${item.productId} için yeterli stok yok.`,
          );
        }

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

      if (!hasUsedDiscount) {
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
      console.error('Sipariş oluşturma hatası:', error);
      if (error instanceof Error) {
        if (
          error.message.includes('relation') &&
          error.message.includes('does not exist')
        ) {
          throw new BadRequestException(
            "Orders tabloları bulunamadı. Lütfen database'de order_items tablosunu oluşturun.",
          );
        }
        throw new BadRequestException(
          `Sipariş oluşturulamadı: ${error.message}`,
        );
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserOrders(userId: number) {
    const result = await this.db.query(
      `
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
          )
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      GROUP BY o.id, o.order_number, o.total_amount, o.discount_amount, o.final_amount, o.status, o.created_at
      ORDER BY o.created_at DESC
    `,
      [userId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
      totalAmount: parseFloat(row.total_amount),
      discountAmount: parseFloat(row.discount_amount),
      finalAmount: parseFloat(row.final_amount),
      status: row.status,
      createdAt: row.created_at,
      items: row.items.filter((item) => item.productId !== null),
    }));
  }

  async getOrderById(orderId: number, userId: number) {
    const result = await this.db.query(
      `
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
          )
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1 AND o.user_id = $2
      GROUP BY o.id, o.order_number, o.total_amount, o.discount_amount, o.final_amount, o.status, o.created_at
    `,
      [orderId, userId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      orderNumber: row.order_number,
      totalAmount: parseFloat(row.total_amount),
      discountAmount: parseFloat(row.discount_amount),
      finalAmount: parseFloat(row.final_amount),
      status: row.status,
      createdAt: row.created_at,
      items: row.items.filter((item) => item.productId !== null),
    };
  }
}
