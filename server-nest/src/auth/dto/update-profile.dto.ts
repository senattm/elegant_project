import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Ahmet Yılmaz', description: 'Kullanıcı adı', minLength: 2, maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  name: string;
}
