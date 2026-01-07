import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreatePaymentMethodDto } from './dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly db: DatabaseService) {}

  async create(userId: number, dto: CreatePaymentMethodDto) {
    this.validateExpiryDate(dto.expiryDate);

    const cardLast4 = dto.cardNumber.slice(-4);
    const provider = dto.provider || 'CREDIT_CARD';

    const result = await this.db.query(
      `INSERT INTO payment_methods (user_id, card_holder, card_last4, provider)
       VALUES ($1, $2, $3, $4)
       RETURNING id, card_holder, card_last4, provider, created_at`,
      [userId, dto.cardHolderName, cardLast4, provider],
    );

    return {
      message: 'Kart eklendi',
      paymentMethod: result.rows[0],
    };
  }

  async findAll(userId: number) {
    const result = await this.db.query(
      `SELECT id, card_holder, card_last4, provider, created_at
       FROM payment_methods
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    );

    return result.rows;
  }

  async findOne(userId: number, paymentMethodId: number) {
    const result = await this.db.query(
      `SELECT id, card_holder, card_last4, provider, created_at
       FROM payment_methods
       WHERE id = $1 AND user_id = $2`,
      [paymentMethodId, userId],
    );

    if (result.rowCount === 0) {
      throw new NotFoundException('Kart bulunamadı');
    }

    return result.rows[0];
  }

  async remove(userId: number, paymentMethodId: number) {
    const existingPaymentMethod = await this.db.query(
      'SELECT user_id FROM payment_methods WHERE id = $1',
      [paymentMethodId],
    );

    if (existingPaymentMethod.rowCount === 0) {
      throw new NotFoundException('Kart bulunamadı');
    }

    if (existingPaymentMethod.rows[0].user_id !== userId) {
      throw new ForbiddenException('Bu karta erişim yetkiniz yok');
    }

    await this.db.query('DELETE FROM payment_methods WHERE id = $1', [
      paymentMethodId,
    ]);

    return {
      message: 'Kart silindi',
    };
  }

  private validateExpiryDate(expiryDate: string): void {
    const [month, year] = expiryDate.split('/').map(Number);
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (!month || !year || month < 1 || month > 12) {
      throw new BadRequestException('Geçersiz son kullanma tarihi');
    }

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      throw new BadRequestException('Kartın son kullanma tarihi geçmiş');
    }
  }
}

