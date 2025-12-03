import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.pool = new Pool({
      host: this.configService.get('DATABASE_HOST'),
      port: this.configService.get('DATABASE_PORT'),
      database: this.configService.get('DATABASE_NAME'),
      user: this.configService.get('DATABASE_USER'),
      password: this.configService.get('DATABASE_PASSWORD'),
    });

    try {
      await this.pool.connect();
      console.log('PostgreSQL bağlı');
    } catch (err) {
      console.error('PostgreSQL bağlantı hatası:', err);
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  getPool(): Pool {
    return this.pool;
  }
}
