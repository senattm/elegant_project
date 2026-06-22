import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateQuantityDto {
  @ApiProperty({ example: 2, description: 'Yeni miktar', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity: number;

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
