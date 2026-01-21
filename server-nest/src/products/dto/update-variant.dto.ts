import { IsNumber, IsOptional, IsString, Min, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVariantDto {
  @ApiProperty({ example: 'M', description: 'Beden', required: false })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiProperty({ example: 299.99, description: 'Fiyat', required: false })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiProperty({ example: 10, description: 'Stok', minimum: 0, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiProperty({ example: 'PROD-001-M', description: 'SKU', required: false })
  @IsString()
  @IsOptional()
  sku?: string;
}

