import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  getFavorites(@Request() req) {
    return this.favoritesService.getFavorites(req.user.id);
  }

  @Post()
  addToFavorites(@Request() req, @Body() body: { productId: number }) {
    return this.favoritesService.addToFavorites(req.user.id, body.productId);
  }

  @Post('toggle')
  toggleFavorite(@Request() req, @Body() body: { productId: number }) {
    return this.favoritesService.toggleFavorite(req.user.id, body.productId);
  }

  @Delete(':productId')
  removeFromFavorites(@Request() req, @Param('productId') productId: string) {
    return this.favoritesService.removeFromFavorites(req.user.id, +productId);
  }

  @Delete()
  clearFavorites(@Request() req) {
    return this.favoritesService.clearFavorites(req.user.id);
  }
}


