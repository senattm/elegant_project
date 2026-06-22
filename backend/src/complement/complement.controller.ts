import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ComplementService } from './complement.service';

@ApiTags('complement')
@ApiBearerAuth('JWT-auth')
@Controller('complement')
@UseGuards(JwtAuthGuard)
export class ComplementController {
  constructor(private readonly complementService: ComplementService) {}

  @Get()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  getComplement(
    @Query('product_ids') productIds: string,
    @Query('k', new DefaultValuePipe(8), ParseIntPipe) k: number,
    @Query('category', new DefaultValuePipe('')) category: string,
  ) {
    if (!productIds?.trim()) {
      throw new BadRequestException({ detail: 'En az bir product_id gerekli' });
    }
    return this.complementService.getComplement(productIds, k, category);
  }
}
