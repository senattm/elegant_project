import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: number, dto: CreateAddressDto) {
    const address = await this.prisma.addresses.create({
      data: {
        user_id: userId,
        title: dto.title || null,
        full_name: dto.fullName,
        phone: dto.phone,
        address_line: dto.addressLine,
        city: dto.city,
        district: dto.district,
      },
    });

    return {
      message: 'Adres eklendi',
      address,
    };
  }

  async findAll(userId: number) {
    return await this.prisma.addresses.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        full_name: true,
        phone: true,
        address_line: true,
        city: true,
        district: true,
        created_at: true,
      },
    });
  }

  async findOne(userId: number, addressId: number) {
    const address = await this.prisma.addresses.findFirst({
      where: {
        id: addressId,
        user_id: userId,
      },
      select: {
        id: true,
        title: true,
        full_name: true,
        phone: true,
        address_line: true,
        city: true,
        district: true,
        created_at: true,
      },
    });

    if (!address) {
      throw new NotFoundException('Adres bulunamadı');
    }

    return address;
  }

  async update(userId: number, addressId: number, dto: UpdateAddressDto) {
    const existingAddress = await this.prisma.addresses.findUnique({
      where: { id: addressId },
      select: { user_id: true },
    });

    if (!existingAddress) {
      throw new NotFoundException('Adres bulunamadı');
    }

    if (existingAddress.user_id !== userId) {
      throw new ForbiddenException('Bu adrese erişim yetkiniz yok');
    }

    const address = await this.prisma.addresses.update({
      where: { id: addressId },
      data: {
        title: dto.title !== undefined ? dto.title : undefined,
        full_name: dto.fullName,
        phone: dto.phone,
        address_line: dto.addressLine,
        city: dto.city,
        district: dto.district,
      },
    });

    return {
      message: 'Adres güncellendi',
      address,
    };
  }

  async remove(userId: number, addressId: number) {
    const existingAddress = await this.prisma.addresses.findUnique({
      where: { id: addressId },
      select: { user_id: true },
    });

    if (!existingAddress) {
      throw new NotFoundException('Adres bulunamadı');
    }

    if (existingAddress.user_id !== userId) {
      throw new ForbiddenException('Bu adrese erişim yetkiniz yok');
    }

    await this.prisma.addresses.delete({
      where: { id: addressId },
    });

    return {
      message: 'Adres silindi',
    };
  }
}
