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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddToCartDto, UpdateQuantityDto } from './dto';

@ApiTags('cart')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Sepet içeriğini getir' })
  @ApiResponse({ status: 200, description: 'Sepet içeriği başarıyla getirildi' })
  getCart(@Request() req) {
    return this.cartService.getCartItems(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Sepete ürün ekle' })
  @ApiResponse({ status: 201, description: 'Ürün sepete eklendi' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  addToCart(@Request() req, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(
      req.user.id,
      dto.productId,
      dto.quantity || 1,
      dto.variantId,
      dto.selectedSize,
    );
  }

  @Put(':productId')
  @ApiOperation({ summary: 'Sepetteki ürün miktarını güncelle' })
  @ApiParam({ name: 'productId', type: 'number', description: 'Ürün ID' })
  @ApiResponse({ status: 200, description: 'Miktar güncellendi' })
  @ApiResponse({ status: 404, description: 'Ürün sepette bulunamadı' })
  updateQuantity(
    @Request() req,
    @Param('productId') productId: string,
    @Body() dto: UpdateQuantityDto,
  ) {
    return this.cartService.updateQuantity(
      req.user.id,
      +productId,
      dto.quantity,
      dto.variantId,
      dto.selectedSize,
    );
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Sepetten ürün çıkar' })
  @ApiParam({ name: 'productId', type: 'number', description: 'Ürün ID' })
  @ApiQuery({ name: 'variantId', required: false, description: 'Varyant ID', type: Number })
  @ApiQuery({ name: 'selectedSize', required: false, description: 'Seçili beden' })
  @ApiResponse({ status: 200, description: 'Ürün sepetten çıkarıldı' })
  removeFromCart(
    @Request() req,
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string,
    @Query('selectedSize') selectedSize?: string,
  ) {
    return this.cartService.removeFromCart(
      req.user.id,
      +productId,
      variantId ? +variantId : undefined,
      selectedSize,
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Sepeti temizle' })
  @ApiResponse({ status: 200, description: 'Sepet temizlendi' })
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
