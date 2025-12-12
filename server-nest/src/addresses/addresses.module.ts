import { Module } from '@nestjs/common';
import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
