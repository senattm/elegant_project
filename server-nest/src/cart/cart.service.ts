import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private db: DatabaseService) {}

  private async validateStock(productId: number, requiredQuantity: number) {
    const productCheck = await this.db.query(
      'SELECT stock FROM products WHERE id = $1',
      [productId],
    );

    if (productCheck.rows.length === 0) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    const currentStock = productCheck.rows[0].stock;

    if (requiredQuantity > currentStock) {
      throw new BadRequestException(
        `Stok yetersiz. Mevcut stok: ${currentStock}`,
      );
    }
  }

  async getCartItems(userId: number) {
    const result = await this.db.query(
      `
      SELECT 
        ci.id,
        ci.quantity,
        ci.selected_size,
        p.id as product_id,
        p.name,
        p.description,
        p.price,
        p.stock,
        c.name AS category,
        ARRAY_AGG(DISTINCT pi.image_url ORDER BY pi.image_url) AS images
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE ci.user_id = $1
      GROUP BY ci.id, ci.quantity, ci.selected_size, p.id, p.name, p.description, p.price, p.stock, c.name
      ORDER BY ci.id DESC
    `,
      [userId],
    );

    return result.rows;
  }

  async addToCart(
    userId: number,
    productId: number,
    quantity: number = 1,
    selectedSize?: string,
  ) {
    const sizeValue = selectedSize || null;

    const existingItem = await this.db.query(
      `SELECT id, quantity 
       FROM cart_items 
       WHERE user_id = $1 
         AND product_id = $2 
         AND COALESCE(selected_size, '') = COALESCE($3, '')`,
      [userId, productId, sizeValue],
    );

    const totalQuantity =
      existingItem.rows.length > 0
        ? existingItem.rows[0].quantity + quantity
        : quantity;

    await this.validateStock(productId, totalQuantity);

    if (existingItem.rows.length > 0) {
      const result = await this.db.query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2 RETURNING *',
        [totalQuantity, existingItem.rows[0].id],
      );
      return result.rows[0];
    }

    const result = await this.db.query(
      'INSERT INTO cart_items (user_id, product_id, quantity, selected_size) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, productId, quantity, sizeValue],
    );
    return result.rows[0];
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

    const result = await this.db.query(
      `UPDATE cart_items 
       SET quantity = $1 
       WHERE user_id = $2 
         AND product_id = $3 
         AND COALESCE(selected_size, '') = COALESCE($4, '')
       RETURNING *`,
      [quantity, userId, productId, sizeValue],
    );

    if (result.rows.length === 0) {
      const allItems = await this.db.query(
        'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2',
        [userId, productId],
      );
      this.logger.error(
        `Sepet öğesi bulunamadı! Aranan: size="${sizeValue}", Mevcut items:`,
        allItems.rows,
      );
      throw new NotFoundException('Sepet öğesi bulunamadı');
    }

    return result.rows[0];
  }

  async removeFromCart(
    userId: number,
    productId: number,
    selectedSize?: string,
  ) {
    const sizeValue = selectedSize || null;

    const result = await this.db.query(
      `DELETE FROM cart_items 
       WHERE user_id = $1 
         AND product_id = $2 
         AND COALESCE(selected_size, '') = COALESCE($3, '')
       RETURNING *`,
      [userId, productId, sizeValue],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Sepet öğesi bulunamadı');
    }

    return { message: 'Ürün sepetten çıkarıldı' };
  }

  async clearCart(userId: number) {
    await this.db.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    return { message: 'Sepet temizlendi' };
  }
}
