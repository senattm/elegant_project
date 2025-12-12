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
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(req.user.id, createAddressDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.addressesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.addressesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(req.user.id, id, updateAddressDto);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.addressesService.remove(req.user.id, id);
  }
}
