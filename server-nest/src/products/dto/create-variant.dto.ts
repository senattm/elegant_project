import { IsNumber, IsOptional, IsString, Min, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({ example: 1, description: 'Ürün ID' })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 'M', description: 'Beden', required: false })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiProperty({ example: 299.99, description: 'Fiyat', required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 10, description: 'Stok', minimum: 0 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiProperty({ example: 'PROD-001-M', description: 'SKU', required: false })
  @IsString()
  @IsOptional()
  sku?: string;
}

