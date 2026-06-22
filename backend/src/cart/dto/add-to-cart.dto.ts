import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 1, description: 'Ürün ID' })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 1, description: 'Miktar', required: false, minimum: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number;

  @ApiProperty({ example: 1, description: 'Varyant ID', required: false })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  variantId?: number;

  @ApiProperty({ example: 'M', description: 'Seçili beden (deprecated - variantId kullanın)', required: false })
  @IsString()
  @IsOptional()
  selectedSize?: string;
}
