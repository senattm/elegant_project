import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentMethodDto } from './dto';

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: number, dto: CreatePaymentMethodDto) {
    this.validateExpiryDate(dto.expiryDate);

    const cardLast4 = dto.cardNumber.slice(-4);
    const provider = dto.provider || 'CREDIT_CARD';

    const paymentMethod = await this.prisma.payment_methods.create({
      data: {
        user_id: userId,
        card_holder: dto.cardHolderName,
        card_last4: cardLast4,
        provider,
      },
    });

    return {
      message: 'Kart eklendi',
      paymentMethod,
    };
  }

  async findAll(userId: number) {
    return await this.prisma.payment_methods.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        card_holder: true,
        card_last4: true,
        provider: true,
        created_at: true,
      },
    });
  }

  async findOne(userId: number, paymentMethodId: number) {
    const paymentMethod = await this.prisma.payment_methods.findFirst({
      where: {
        id: paymentMethodId,
        user_id: userId,
      },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Kart bulunamadı');
    }

    return paymentMethod;
  }

  async remove(userId: number, paymentMethodId: number) {
    const existingPaymentMethod = await this.prisma.payment_methods.findUnique({
      where: { id: paymentMethodId },
      select: { user_id: true },
    });

    if (!existingPaymentMethod) {
      throw new NotFoundException('Kart bulunamadı');
    }

    if (existingPaymentMethod.user_id !== userId) {
      throw new ForbiddenException('Bu karta erişim yetkiniz yok');
    }

    await this.prisma.payment_methods.delete({
      where: { id: paymentMethodId },
    });

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
