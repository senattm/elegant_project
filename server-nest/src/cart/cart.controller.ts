import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddToCartDto, UpdateQuantityDto } from './dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Request() req) {
    return this.cartService.getCartItems(req.user.id);
  }

  @Post()
  addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(
      req.user.id,
      dto.productId,
      dto.quantity || 1,
      dto.selectedSize,
    );
  }

  @Put(':productId')
  updateQuantity(
    @Request() req,
    @Param('productId') productId: string,
    @Body() dto: UpdateQuantityDto,
  ) {
    return this.cartService.updateQuantity(
      req.user.id,
      +productId,
      dto.quantity,
      dto.selectedSize,
    );
  }

  @Delete(':productId')
  removeFromCart(
    @Request() req,
    @Param('productId') productId: string,
    @Query('selectedSize') selectedSize?: string,
  ) {
    return this.cartService.removeFromCart(
      req.user.id,
      +productId,
      selectedSize,
    );
  }

  @Delete()
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
