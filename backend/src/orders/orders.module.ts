import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AuthModule } from '../auth/auth.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [AuthModule, PaymentModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
