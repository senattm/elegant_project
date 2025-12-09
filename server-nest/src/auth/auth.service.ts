import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { RegisterDto, LoginDto } from './dto';
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
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

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

    const result = await this.db.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [normalizedEmail],
    );

    return (result.rows[0] as UserEntity) || null;
  }

  async register(dto: RegisterDto) {
    const email = this.normalizeEmail(dto.email);
    const name = dto.name.trim();
    const { password } = dto;

    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    try {
      const result = await this.db.query(
        `INSERT INTO users (name, email, password_hash) 
         VALUES ($1, $2, $3) 
         RETURNING id, name, email, created_at`,
        [name, email, hashedPassword],
      );

      const user = result.rows[0] as UserEntity;
      const token = this.signToken(user);

      return {
        message: 'Kayıt başarılı',
        user: this.toUserResponse(user),
        token,
      };
    } catch (error: any) {
      if (error.code === '23505') {
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
    const result = await this.db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [id],
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return row as UserEntity;
  }
}
