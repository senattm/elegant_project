import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    try {
      return await this.ordersService.createOrder(
        req.user.id,
        dto.items,
        dto.addressId,
      );
    } catch (error) {
      console.error('OrdersController createOrder hatası:', error);
      throw error;
    }
  }

  @Get()
  async getUserOrders(@Request() req) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get(':id')
  async getOrderById(@Request() req, @Param('id') id: string) {
    return this.ordersService.getOrderById(+id, req.user.id);
  }
}
