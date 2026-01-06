import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateQuantityDto {
  @ApiProperty({ example: 2, description: 'Yeni miktar', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 'M', description: 'Seçili beden', required: false })
  @IsString()
  @IsOptional()
  selectedSize?: string;
}
