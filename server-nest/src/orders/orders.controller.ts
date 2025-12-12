import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto';
import { PaymentService } from '../payment/payment.service';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private paymentService: PaymentService,
  ) {}

  @Post()
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    const paymentResult = await this.paymentService.processPayment(dto.payment);

    if (!paymentResult.success) {
      throw new BadRequestException('Ödeme işlemi başarısız oldu');
    }

    return this.ordersService.createOrder(
      req.user.id,
      dto.items,
      dto.payment.cardHolderName,
      dto.payment.cardNumber.slice(-4),
      dto.addressId,
    );
  }

  @Get()
  async getUserOrders(@Request() req) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get('check/first-order')
  async checkFirstOrder(@Request() req) {
    return this.ordersService.checkFirstOrder(req.user.id);
  }

  @Get(':id')
  async getOrderById(@Request() req, @Param('id') id: string) {
    return this.ordersService.getOrderById(+id, req.user.id);
  }
}
