import {
  Controller,
  Get,
  Post,
  Patch,
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
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('addresses')
@ApiBearerAuth('JWT-auth')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni adres oluştur' })
  @ApiResponse({ status: 201, description: 'Adres başarıyla oluşturuldu' })
  @ApiResponse({ status: 400, description: 'Geçersiz veri' })
  create(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(req.user.id, createAddressDto);
  }

  @Get()
  @ApiOperation({ summary: 'Kullanıcının adreslerini listele' })
  @ApiResponse({ status: 200, description: 'Adresler başarıyla listelendi' })
  findAll(@Request() req) {
    return this.addressesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ID ile adres getir' })
  @ApiParam({ name: 'id', type: 'number', description: 'Adres ID' })
  @ApiResponse({ status: 200, description: 'Adres bulundu' })
  @ApiResponse({ status: 404, description: 'Adres bulunamadı' })
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.addressesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Adres güncelle' })
  @ApiParam({ name: 'id', type: 'number', description: 'Adres ID' })
  @ApiResponse({ status: 200, description: 'Adres başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Adres bulunamadı' })
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(req.user.id, id, updateAddressDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Adres sil' })
  @ApiParam({ name: 'id', type: 'number', description: 'Adres ID' })
  @ApiResponse({ status: 200, description: 'Adres başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Adres bulunamadı' })
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.addressesService.remove(req.user.id, id);
  }
}
