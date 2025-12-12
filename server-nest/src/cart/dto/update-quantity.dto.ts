import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateQuantityDto {
  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  selectedSize?: string;
}
