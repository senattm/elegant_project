import { IsNumber } from 'class-validator';

export class FavoriteDto {
  @IsNumber()
  productId: number;
}
