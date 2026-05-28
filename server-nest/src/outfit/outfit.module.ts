import { Global, Module } from '@nestjs/common';
import { OutfitService } from './outfit.service';

@Global()
@Module({
  providers: [OutfitService],
  exports: [OutfitService],
})
export class OutfitModule {}
