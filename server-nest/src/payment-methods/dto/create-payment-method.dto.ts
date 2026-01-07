import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentMethodDto {
  @ApiProperty({
    example: '1234567890123456',
    description: 'Kart numarası (16 haneli)',
  })
  @IsString({ message: 'Kart numarası gerekli' })
  @IsNotEmpty({ message: 'Kart numarası gerekli' })
  @Matches(/^[0-9]{16}$/, {
    message: 'Geçerli bir kart numarası girin (16 haneli)',
  })
  cardNumber: string;

  @ApiProperty({
    example: 'Ahmet Yılmaz',
    description: 'Kart sahibi adı',
    minLength: 2,
    maxLength: 150,
  })
  @IsString({ message: 'Kart sahibi adı gerekli' })
  @IsNotEmpty({ message: 'Kart sahibi adı gerekli' })
  @MinLength(2, { message: 'Kart sahibi adı en az 2 karakter olmalı' })
  @MaxLength(150)
  cardHolderName: string;

  @ApiProperty({
    example: '12/25',
    description: 'Son kullanma tarihi (MM/YY formatında)',
  })
  @IsString({ message: 'Son kullanma tarihi gerekli' })
  @IsNotEmpty({ message: 'Son kullanma tarihi gerekli' })
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, {
    message: 'Geçerli bir tarih girin (MM/YY)',
  })
  expiryDate: string;

  @ApiProperty({
    example: 'CREDIT_CARD',
    description: 'Ödeme sağlayıcısı',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  provider?: string;
}

