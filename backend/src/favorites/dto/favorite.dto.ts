import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FavoriteDto {
  @ApiProperty({ example: 1, description: 'Ürün ID' })
  @IsNumber()
  productId: number;
}
