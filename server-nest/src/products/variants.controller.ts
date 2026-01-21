import { Controller, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateVariantDto, UpdateVariantDto } from './dto';

@ApiTags('products')
@Controller('products/variants')
export class VariantsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni varyant oluştur' })
  @ApiResponse({ status: 201, description: 'Varyant başarıyla oluşturuldu' })
  @ApiResponse({ status: 404, description: 'Ürün bulunamadı' })
  @ApiResponse({ status: 400, description: 'Bu beden zaten mevcut' })
  createVariant(@Body() dto: CreateVariantDto) {
    return this.productsService.createVariant(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Varyant güncelle' })
  @ApiParam({ name: 'id', type: 'number', description: 'Varyant ID' })
  @ApiResponse({ status: 200, description: 'Varyant başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Varyant bulunamadı' })
  @ApiResponse({ status: 400, description: 'Bu beden zaten mevcut' })
  updateVariant(@Param('id') id: string, @Body() dto: UpdateVariantDto) {
    return this.productsService.updateVariant(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Varyant sil' })
  @ApiParam({ name: 'id', type: 'number', description: 'Varyant ID' })
  @ApiResponse({ status: 200, description: 'Varyant başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Varyant bulunamadı' })
  deleteVariant(@Param('id') id: string) {
    return this.productsService.deleteVariant(+id);
  }
}

