import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'E-posta adresi' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
  @IsNotEmpty({ message: 'E-posta adresi gerekli' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Şifre', minLength: 6 })
  @IsString({ message: 'Şifre metin olmalı' })
  @IsNotEmpty({ message: 'Şifre gerekli' })
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalı' })
  password: string;
}
