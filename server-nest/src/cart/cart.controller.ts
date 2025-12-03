import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Request() req) {
    return this.cartService.getCartItems(req.user.id);
  }

  @Post()
  addToCart(
    @Request() req,
    @Body() body: { productId: number; quantity?: number },
  ) {
    return this.cartService.addToCart(
      req.user.id,
      body.productId,
      body.quantity || 1,
    );
  }

  @Put(':productId')
  updateQuantity(
    @Request() req,
    @Param('productId') productId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateQuantity(
      req.user.id,
      +productId,
      body.quantity,
    );
  }

  @Delete(':productId')
  removeFromCart(@Request() req, @Param('productId') productId: string) {
    return this.cartService.removeFromCart(req.user.id, +productId);
  }

  @Delete()
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}


