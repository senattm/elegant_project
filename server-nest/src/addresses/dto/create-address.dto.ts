import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  title?: string;

  @IsString()
  @IsNotEmpty({ message: 'Ad soyad gerekli' })
  @MinLength(3, { message: 'Ad soyad en az 3 karakter olmalı' })
  @MaxLength(150)
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: 'Telefon gerekli' })
  @MinLength(10, { message: 'Telefon en az 10 karakter olmalı' })
  @Matches(/^[0-9]+$/, { message: 'Telefon sadece rakamlardan oluşmalı' })
  @MaxLength(30)
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Adres gerekli' })
  @MinLength(10, { message: 'Adres en az 10 karakter olmalı' })
  addressLine: string;

  @IsString()
  @IsNotEmpty({ message: 'Şehir gerekli' })
  @MinLength(2, { message: 'Şehir en az 2 karakter olmalı' })
  @MaxLength(100)
  city: string;

  @IsString()
  @IsNotEmpty({ message: 'İlçe gerekli' })
  @MinLength(2, { message: 'İlçe en az 2 karakter olmalı' })
  @MaxLength(100)
  district: string;
}
