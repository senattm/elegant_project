import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  name: string;
}
