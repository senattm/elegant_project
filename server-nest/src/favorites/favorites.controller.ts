import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FavoriteDto } from './dto';

@ApiTags('favorites')
@ApiBearerAuth('JWT-auth')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Favori ürünleri listele' })
  @ApiResponse({ status: 200, description: 'Favori ürünler başarıyla listelendi' })
  getFavorites(@Request() req) {
    return this.favoritesService.getFavorites(req.user.id);
  }

  @Post('toggle')
  @ApiOperation({ summary: 'Favorilere ekle/çıkar' })
  @ApiResponse({ status: 200, description: 'Favori durumu güncellendi' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  toggleFavorite(@Request() req, @Body() dto: FavoriteDto) {
    return this.favoritesService.toggleFavorite(req.user.id, dto.productId);
  }
}
