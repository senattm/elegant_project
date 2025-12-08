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
    @Body()
    body: { productId: number; quantity?: number; selectedSize?: string },
  ) {
    return this.cartService.addToCart(
      req.user.id,
      body.productId,
      body.quantity || 1,
      body.selectedSize,
    );
  }

  @Put(':productId')
  updateQuantityWithoutSize(
    @Request() req,
    @Param('productId') productId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateQuantity(
      req.user.id,
      +productId,
      body.quantity,
      undefined,
    );
  }

  @Put(':productId/:selectedSize')
  updateQuantityWithSize(
    @Request() req,
    @Param('productId') productId: string,
    @Param('selectedSize') selectedSize: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateQuantity(
      req.user.id,
      +productId,
      body.quantity,
      selectedSize,
    );
  }

  @Delete(':productId')
  removeFromCartWithoutSize(
    @Request() req,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeFromCart(req.user.id, +productId, undefined);
  }

  @Delete(':productId/:selectedSize')
  removeFromCartWithSize(
    @Request() req,
    @Param('productId') productId: string,
    @Param('selectedSize') selectedSize: string,
  ) {
    return this.cartService.removeFromCart(req.user.id, +productId, selectedSize);
  }

  @Delete()
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
