import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentService, PaymentResult } from './payment.service';
import { PaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('payment')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('process')
  @ApiOperation({ summary: 'Ödeme işlemini gerçekleştir' })
  @ApiResponse({ status: 200, description: 'Ödeme işlemi başarılı' })
  @ApiResponse({ status: 400, description: 'Ödeme işlemi başarısız' })
  async processPayment(@Body() paymentDto: PaymentDto): Promise<PaymentResult> {
    return this.paymentService.processPayment(paymentDto);
  }
}
