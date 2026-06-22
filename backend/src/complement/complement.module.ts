import { Module } from '@nestjs/common';
import { ComplementController } from './complement.controller';
import { ComplementService } from './complement.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ComplementController],
  providers: [ComplementService],
  exports: [ComplementService],
})
export class ComplementModule {}
