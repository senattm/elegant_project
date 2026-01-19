import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  ChangePasswordDto,
} from './dto';
import * as bcrypt from 'bcrypt';

export interface UserEntity {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  created_at?: Date;
}

export interface JwtPayload {
  sub: number;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private signToken(user: Pick<UserEntity, 'id'>): string {
    const payload: JwtPayload = {
      sub: user.id,
    };
    return this.jwtService.sign(payload);
  }

  private toUserResponse(user: UserEntity) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }

  private async findUserByEmail(email: string): Promise<UserEntity | null> {
    const normalizedEmail = this.normalizeEmail(email);

    const user = await this.prisma.users.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
      },
    });

    return user as UserEntity | null;
  }

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    const name = dto.name.trim();
    const { password } = dto;

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    try {
      const user = await this.prisma.users.create({
        data: {
          name,
          email,
          password_hash: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          created_at: true,
        },
      });

      const token = this.signToken(user);

      return {
        message: 'Kayıt başarılı',
        user: this.toUserResponse(user as UserEntity),
        token,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Bu email zaten kayıtlı');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.findUserByEmail(dto.email);

    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    const token = this.signToken(user);

    return {
      message: 'Giriş başarılı',
      user: this.toUserResponse(user),
      token,
    };
  }

  async validateUser(id: number) {
    const user = await this.prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return user as UserEntity | null;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const name = dto.name.trim();

    const user = await this.prisma.users.update({
      where: { id: userId },
      data: { name },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return {
      message: 'Profil güncellendi',
      user: this.toUserResponse(user as UserEntity),
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        password_hash: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Mevcut şifre hatalı');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);

    await this.prisma.users.update({
      where: { id: userId },
      data: { password_hash: hashedPassword },
    });

    return {
      message: 'Şifre değiştirildi',
    };
  }
}
