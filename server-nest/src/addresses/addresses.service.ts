import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';

@Injectable()
export class AddressesService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: number, dto: CreateAddressDto) {
    const result = await this.db.query(
      `INSERT INTO addresses (user_id, title, full_name, phone, address_line, city, district)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, title, full_name, phone, address_line, city, district, created_at`,
      [
        userId,
        dto.title || null,
        dto.fullName,
        dto.phone,
        dto.addressLine,
        dto.city,
        dto.district,
      ],
    );

    return {
      message: 'Adres eklendi',
      address: result.rows[0],
    };
  }

  async findAll(userId: number) {
    const result = await this.db.query(
      `SELECT id, title, full_name, phone, address_line, city, district, created_at
       FROM addresses
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    return result.rows;
  }

  async findOne(userId: number, addressId: number) {
    const result = await this.db.query(
      `SELECT id, title, full_name, phone, address_line, city, district, created_at
       FROM addresses
       WHERE id = $1 AND user_id = $2`,
      [addressId, userId],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('Adres bulunamadı');
    }

    return result.rows[0];
  }

  async update(userId: number, addressId: number, dto: UpdateAddressDto) {
    const existingAddress = await this.db.query(
      'SELECT user_id FROM addresses WHERE id = $1',
      [addressId],
    );

    if (existingAddress.rowCount === 0) {
      throw new NotFoundException('Adres bulunamadı');
    }

    if (existingAddress.rows[0].user_id !== userId) {
      throw new ForbiddenException('Bu adrese erişim yetkiniz yok');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(dto.title || null);
    }
    if (dto.fullName !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(dto.fullName);
    }
    if (dto.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(dto.phone);
    }
    if (dto.addressLine !== undefined) {
      updates.push(`address_line = $${paramIndex++}`);
      values.push(dto.addressLine);
    }
    if (dto.city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      values.push(dto.city);
    }
    if (dto.district !== undefined) {
      updates.push(`district = $${paramIndex++}`);
      values.push(dto.district);
    }

    if (updates.length === 0) {
      throw new NotFoundException('Güncellenecek alan bulunamadı');
    }

    values.push(addressId);

    const result = await this.db.query(
      `UPDATE addresses
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, title, full_name, phone, address_line, city, district, created_at`,
      values,
    );

    return {
      message: 'Adres güncellendi',
      address: result.rows[0],
    };
  }

  async remove(userId: number, addressId: number) {
    const existingAddress = await this.db.query(
      'SELECT user_id FROM addresses WHERE id = $1',
      [addressId],
    );

    if (existingAddress.rowCount === 0) {
      throw new NotFoundException('Adres bulunamadı');
    }

    if (existingAddress.rows[0].user_id !== userId) {
      throw new ForbiddenException('Bu adrese erişim yetkiniz yok');
    }

    await this.db.query('DELETE FROM addresses WHERE id = $1', [addressId]);

    return {
      message: 'Adres silindi',
    };
  }
}
