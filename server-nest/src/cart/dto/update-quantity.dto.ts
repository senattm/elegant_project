import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateQuantityDto {
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsString()
  @IsOptional()
  selectedSize?: string;
}
