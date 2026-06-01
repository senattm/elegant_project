import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Get()
  @ApiOperation({ summary: 'Tüm ürünleri listele' })
  @ApiResponse({ status: 200, description: 'Ürünler başarıyla listelendi' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID ile ürün getir' })
  @ApiParam({ name: 'id', type: 'number', description: 'Ürün ID' })
  @ApiResponse({ status: 200, description: 'Ürün bulundu' })
  @ApiResponse({ status: 404, description: 'Ürün bulunamadı' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  @Get(':id/variants')
  @ApiOperation({ summary: 'Ürüne ait tüm varyantları getir' })
  @ApiParam({ name: 'id', type: 'number', description: 'Ürün ID' })
  @ApiResponse({ status: 200, description: 'Varyantlar başarıyla getirildi' })
  @ApiResponse({ status: 404, description: 'Ürün bulunamadı' })
  getVariantsByProduct(@Param('id') id: string) {
    return this.productsService.getVariantsByProduct(+id);
  }
  @Get(':id/recommendations')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ürün için AI destekli öneriler/kombinler getir' })
  @ApiParam({ name: 'id', type: 'number', description: 'Ürün ID' })
  @ApiResponse({ status: 200, description: 'Öneriler başarıyla getirildi' })
  getRecommendations(
    @Param('id') id: string,
    @Query('engine') engine: 'python' | 'nest' | 'auto' | undefined,
    @Request() req,
  ) {
    return this.productsService.getRecommendations(+id, 3, req.user?.id, engine ?? 'python');
  }
}
