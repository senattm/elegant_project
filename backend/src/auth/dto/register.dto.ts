import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoginDto } from './login.dto';

export class RegisterDto extends LoginDto {
  @ApiProperty({ example: 'Ahmet Yılmaz', description: 'Kullanıcı adı', minLength: 2 })
  @IsString({ message: 'İsim metin olmalı' })
  @IsNotEmpty({ message: 'İsim gerekli' })
  @MinLength(2, { message: 'İsim en az 2 karakter olmalı' })
  name: string;
}
