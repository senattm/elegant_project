import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi girin' })
  @IsNotEmpty({ message: 'E-posta adresi gerekli' })
  email: string;

  @IsString({ message: 'Şifre metin olmalı' })
  @IsNotEmpty({ message: 'Şifre gerekli' })
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalı' })
  password: string;
}
