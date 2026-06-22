import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentDto } from './dto/payment.dto';

export interface PaymentResult {
  success: boolean;
  message: string;
}

@Injectable()
export class PaymentService {
  async processPayment(payment: PaymentDto): Promise<PaymentResult> {
    this.validateExpiryDate(payment.expiryDate);

    console.log('Payment Processing:', {
      cardLast4: payment.cardNumber.slice(-4),
      cardHolder: payment.cardHolderName,
    });

    return {
      success: true,
      message: 'Ödeme başarıyla tamamlandı',
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
