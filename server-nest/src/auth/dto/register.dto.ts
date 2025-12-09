import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { LoginDto } from './login.dto'; // LoginDto'yu import et

export class RegisterDto extends LoginDto {
  @IsString({ message: 'İsim metin olmalı' })
  @IsNotEmpty({ message: 'İsim gerekli' })
  @MinLength(2, { message: 'İsim en az 2 karakter olmalı' })
  name: string;
}
