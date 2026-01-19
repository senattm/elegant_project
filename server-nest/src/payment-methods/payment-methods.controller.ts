import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('payment-methods')
@ApiBearerAuth('JWT-auth')
@Controller('payment-methods')
@UseGuards(JwtAuthGuard)
export class PaymentMethodsController {
  constructor(
    private readonly paymentMethodsService: PaymentMethodsService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Yeni kart ekle' })
  @ApiResponse({ status: 201, description: 'Kart başarıyla eklendi' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  create(@Request() req, @Body() createPaymentMethodDto: CreatePaymentMethodDto) {
    return this.paymentMethodsService.create(req.user.id, createPaymentMethodDto);
  }

  @Get()
  @ApiOperation({ summary: 'Kullanıcının kartlarını listele' })
  @ApiResponse({ status: 200, description: 'Kartlar başarıyla listelendi' })
  findAll(@Request() req) {
    return this.paymentMethodsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID ile kart getir' })
  @ApiParam({ name: 'id', type: 'number', description: 'Kart ID' })
  @ApiResponse({ status: 200, description: 'Kart bulundu' })
  @ApiResponse({ status: 404, description: 'Kart bulunamadı' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodsService.findOne(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Kart sil' })
  @ApiParam({ name: 'id', type: 'number', description: 'Kart ID' })
  @ApiResponse({ status: 200, description: 'Kart başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Kart bulunamadı' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.paymentMethodsService.remove(req.user.id, id);
  }
}

