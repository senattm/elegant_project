import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ProductsService {
  constructor(private db: DatabaseService) {}

  async findAll() {
    const result = await this.db.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.category_id,
        c.name AS category,
        ARRAY_AGG(DISTINCT pi.image_url ORDER BY pi.image_url) AS images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      GROUP BY p.id, p.name, p.description, p.price, p.stock, p.category_id, c.name
      ORDER BY p.id
    `);

    return result.rows;
  }

  async findOne(id: number) {
    const result = await this.db.query(
      `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.category_id,
        c.name AS category,
        ARRAY_AGG(DISTINCT pi.image_url ORDER BY pi.image_url) AS images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.description, p.price, p.stock, p.category_id, c.name
    `,
      [id],
    );

    return result.rows[0];
  }
}
