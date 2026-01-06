import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentDto } from '../../payment/dto';

export class OrderItemDto {
  @ApiProperty({ example: 1, description: 'Ürün ID' })
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 2, description: 'Miktar', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 'M', description: 'Seçili beden', required: false })
  @IsString()
  @IsOptional()
  selectedSize?: string;

  @ApiProperty({ example: 299.99, description: 'Ürün fiyatı', minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto], description: 'Sipariş öğeleri' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ type: PaymentDto, description: 'Ödeme bilgileri' })
  @ValidateNested()
  @Type(() => PaymentDto)
  payment: PaymentDto;

  @ApiProperty({ example: 1, description: 'Adres ID', required: false })
  @IsNumber()
  @IsOptional()
  addressId?: number;
}
