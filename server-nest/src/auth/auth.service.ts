import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { RegisterDto, LoginDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const { name, email, password } = dto;

    const emailCheck = await this.db.query(
      'SELECT id FROM users WHERE email = $1',
      [email],
    );

    if (emailCheck.rows.length > 0) {
      throw new BadRequestException('Bu email zaten kayıtlı');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await this.db.query(
      `INSERT INTO users (name, email, password_hash) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, email, created_at`,
      [name, email, hashedPassword],
    );

    const user = result.rows[0];
    const token = this.jwtService.sign({ id: user.id, email: user.email });

    return {
      message: 'Kayıt başarılı',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const result = await this.db.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email],
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    const user = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email veya şifre hatalı');
    }

    const token = this.jwtService.sign({ id: user.id, email: user.email });

    return {
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        name: user.name || email.split('@')[0],
        email: user.email,
      },
      token,
    };
  }

  async validateUser(id: number) {
    const result = await this.db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [id],
    );

    return result.rows[0] || null;
  }
}
