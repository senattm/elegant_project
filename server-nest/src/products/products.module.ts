import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { VariantsController } from './variants.controller';
import { ProductsService } from './products.service';
import { OutfitsModule } from '../outfits/outfits.module';

@Module({
  imports: [OutfitsModule],
  controllers: [ProductsController, VariantsController],
  providers: [ProductsService],
})
export class ProductsModule {}
