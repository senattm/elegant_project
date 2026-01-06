import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Yeni kullanıcı kaydı' })
  @ApiResponse({ status: 201, description: 'Kullanıcı başarıyla kaydedildi' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Kullanıcı girişi' })
  @ApiResponse({ status: 200, description: 'Giriş başarılı' })
  @ApiResponse({ status: 401, description: 'Geçersiz kimlik bilgileri' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Profil bilgilerini güncelle' })
  @ApiResponse({ status: 200, description: 'Profil başarıyla güncellendi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Şifre değiştir' })
  @ApiResponse({ status: 200, description: 'Şifre başarıyla değiştirildi' })
  @ApiResponse({ status: 401, description: 'Yetkisiz erişim' })
  @ApiResponse({ status: 400, description: 'Geçersiz şifre' })
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
