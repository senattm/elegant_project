import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAddressDto {
  @ApiProperty({ example: 'Ev', description: 'Adres başlığı', required: false, maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @ApiProperty({ example: 'Ahmet Yılmaz', description: 'Ad soyad', minLength: 3, maxLength: 150 })
  @IsString()
  @IsNotEmpty({ message: 'Ad soyad gerekli' })
  @MinLength(3, { message: 'Ad soyad en az 3 karakter olmalı' })
  @MaxLength(150)
  fullName: string;

  @ApiProperty({ example: '5551234567', description: 'Telefon numarası', minLength: 10, maxLength: 30 })
  @IsString()
  @IsNotEmpty({ message: 'Telefon gerekli' })
  @MinLength(10, { message: 'Telefon en az 10 karakter olmalı' })
  @Matches(/^[0-9]+$/, { message: 'Telefon sadece rakamlardan oluşmalı' })
  @MaxLength(30)
  phone: string;

  @ApiProperty({ example: 'Atatürk Cad. No:123 Daire:4', description: 'Adres satırı', minLength: 10 })
  @IsString()
  @IsNotEmpty({ message: 'Adres gerekli' })
  @MinLength(10, { message: 'Adres en az 10 karakter olmalı' })
  addressLine: string;

  @ApiProperty({ example: 'İstanbul', description: 'Şehir', minLength: 2, maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'Şehir gerekli' })
  @MinLength(2, { message: 'Şehir en az 2 karakter olmalı' })
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'Kadıköy', description: 'İlçe', minLength: 2, maxLength: 100 })
  @IsString()
  @IsNotEmpty({ message: 'İlçe gerekli' })
  @MinLength(2, { message: 'İlçe en az 2 karakter olmalı' })
  @MaxLength(100)
  district: string;
}
