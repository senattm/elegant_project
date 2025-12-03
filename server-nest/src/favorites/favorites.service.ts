import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class FavoritesService {
  constructor(private db: DatabaseService) {}

  async getFavorites(userId: number) {
    const result = await this.db.query(
      `
      SELECT 
        f.id,
        p.id as product_id,
        p.name,
        p.description,
        p.price,
        p.stock,
        c.name AS category,
        ARRAY_AGG(DISTINCT pi.image_url ORDER BY pi.image_url) AS images
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE f.user_id = $1
      GROUP BY f.id, p.id, p.name, p.description, p.price, p.stock, c.name
      ORDER BY f.id DESC
    `,
      [userId],
    );

    return result.rows;
  }

  async addToFavorites(userId: number, productId: number) {
    const existingFavorite = await this.db.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2',
      [userId, productId],
    );

    if (existingFavorite.rows.length > 0) {
      return { message: 'Ürün zaten favorilerde', alreadyExists: true };
    }

    const result = await this.db.query(
      'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2) RETURNING *',
      [userId, productId],
    );

    return result.rows[0];
  }

  async removeFromFavorites(userId: number, productId: number) {
    const result = await this.db.query(
      'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [userId, productId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Favori bulunamadı');
    }

    return { message: 'Ürün favorilerden çıkarıldı' };
  }

  async toggleFavorite(userId: number, productId: number) {
    const existingFavorite = await this.db.query(
      'SELECT id FROM favorites WHERE user_id = $1 AND product_id = $2',
      [userId, productId],
    );

    if (existingFavorite.rows.length > 0) {
      await this.db.query(
        'DELETE FROM favorites WHERE user_id = $1 AND product_id = $2',
        [userId, productId],
      );
      return { message: 'Favorilerden çıkarıldı', isFavorite: false };
    }

    await this.db.query(
      'INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)',
      [userId, productId],
    );
    return { message: 'Favorilere eklendi', isFavorite: true };
  }

  async clearFavorites(userId: number) {
    await this.db.query('DELETE FROM favorites WHERE user_id = $1', [userId]);
    return { message: 'Tüm favoriler temizlendi' };
  }
}


