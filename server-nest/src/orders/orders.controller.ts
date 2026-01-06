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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto';
import { PaymentService } from '../payment/payment.service';

@ApiTags('orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private paymentService: PaymentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Yeni sipariş oluştur' })
  @ApiResponse({ status: 201, description: 'Sipariş başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri veya ödeme hatası' })
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
  @ApiOperation({ summary: 'Kullanıcının siparişlerini listele' })
  @ApiResponse({ status: 200, description: 'Siparişler başarıyla listelendi' })
  async getUserOrders(@Request() req) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get('check/first-order')
  @ApiOperation({ summary: 'İlk sipariş kontrolü' })
  @ApiResponse({ status: 200, description: 'İlk sipariş durumu' })
  async checkFirstOrder(@Request() req) {
    return this.ordersService.checkFirstOrder(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID ile sipariş getir' })
  @ApiParam({ name: 'id', type: 'number', description: 'Sipariş ID' })
  @ApiResponse({ status: 200, description: 'Sipariş bulundu' })
  @ApiResponse({ status: 404, description: 'Sipariş bulunamadı' })
  async getOrderById(@Request() req, @Param('id') id: string) {
    return this.ordersService.getOrderById(+id, req.user.id);
  }
}
