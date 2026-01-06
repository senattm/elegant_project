import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
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

  @ApiProperty({ example: 'M', description: 'Seçili beden', required: false })
  @IsString()
  @IsOptional()
  selectedSize?: string;
}
