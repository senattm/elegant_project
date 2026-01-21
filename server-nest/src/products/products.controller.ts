import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
}
