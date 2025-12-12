import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PaymentService, PaymentResult } from './payment.service';
import { PaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('process')
  async processPayment(@Body() paymentDto: PaymentDto): Promise<PaymentResult> {
    return this.paymentService.processPayment(paymentDto);
  }

}
