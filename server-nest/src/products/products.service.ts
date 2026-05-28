import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OutfitService } from '../outfit/outfit.service';
import { CreateVariantDto, UpdateVariantDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private outfitService: OutfitService,
  ) {}

  private productInclude = {
    categories: {
      select: {
        name: true,
        id: true,
        parent_id: true,
      },
    },
    product_images: {
      select: {
        image_url: true,
        is_main: true,
      },
      orderBy: [
        { is_main: 'desc' as const },
        { image_url: 'asc' as const },
      ],
    },
    product_variants: {
      orderBy: {
        size: 'asc' as const,
      },
    },
  };

  private mapProductResponse(product: any) {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price ? Number(product.price) : 0,
      stock: product.stock,
      category_id: product.category_id,
      parent_category_id: product.categories?.parent_id || null,
      category: product.categories?.name || null,
      images: product.product_images.map((img) => img.image_url),
      variants: product.product_variants?.map((variant: any) => ({
        id: variant.id,
        size: variant.size,
        price: variant.price ? Number(variant.price) : (product.price ? Number(product.price) : 0),
        stock: variant.stock,
        sku: variant.sku,
      })) || [],
    };
  }

  async findAll() {
    const products = await this.prisma.products.findMany({
      include: this.productInclude,
      orderBy: {
        id: 'asc',
      },
    });

    return products.map((product) => this.mapProductResponse(product));
  }

  async findOne(id: number) {
    const product = await this.prisma.products.findUnique({
      where: { id },
      include: this.productInclude,
    });

    if (!product) {
      return null;
    }

    return this.mapProductResponse(product);
  }

  async createVariant(dto: CreateVariantDto) {
    const product = await this.prisma.products.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    if (dto.size) {
      const existingVariant = await this.prisma.product_variants.findFirst({
        where: {
          product_id: dto.productId,
          size: dto.size,
        },
      });

      if (existingVariant) {
        throw new BadRequestException('Bu ürün için bu beden zaten mevcut');
      }
    }

    const variant = await this.prisma.product_variants.create({
      data: {
        product_id: dto.productId,
        size: dto.size || null,
        price: dto.price ? dto.price : null,
        stock: dto.stock,
        sku: dto.sku || null,
      },
    });

    return {
      id: variant.id,
      productId: variant.product_id,
      size: variant.size,
      price: variant.price ? Number(variant.price) : null,
      stock: variant.stock,
      sku: variant.sku,
    };
  }

  async updateVariant(variantId: number, dto: UpdateVariantDto) {
    const variant = await this.prisma.product_variants.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException('Varyant bulunamadı');
    }

    if (dto.size && dto.size !== variant.size) {
      const existingVariant = await this.prisma.product_variants.findFirst({
        where: {
          product_id: variant.product_id,
          size: dto.size,
        },
      });

      if (existingVariant) {
        throw new BadRequestException('Bu ürün için bu beden zaten mevcut');
      }
    }

    const updatedVariant = await this.prisma.product_variants.update({
      where: { id: variantId },
      data: {
        size: dto.size !== undefined ? dto.size : variant.size,
        price: dto.price !== undefined ? dto.price : variant.price,
        stock: dto.stock !== undefined ? dto.stock : variant.stock,
        sku: dto.sku !== undefined ? dto.sku : variant.sku,
      },
    });

    return {
      id: updatedVariant.id,
      productId: updatedVariant.product_id,
      size: updatedVariant.size,
      price: updatedVariant.price ? Number(updatedVariant.price) : null,
      stock: updatedVariant.stock,
      sku: updatedVariant.sku,
    };
  }

  async deleteVariant(variantId: number) {
    const variant = await this.prisma.product_variants.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException('Varyant bulunamadı');
    }

    await this.prisma.product_variants.delete({
      where: { id: variantId },
    });

    return { message: 'Varyant başarıyla silindi' };
  }

  async getVariantsByProduct(productId: number) {
    const product = await this.prisma.products.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Ürün bulunamadı');
    }

    const variants = await this.prisma.product_variants.findMany({
      where: { product_id: productId },
      orderBy: { size: 'asc' },
    });

    return variants.map((variant) => ({
      id: variant.id,
      productId: variant.product_id,
      size: variant.size,
      price: variant.price ? Number(variant.price) : null,
      stock: variant.stock,
      sku: variant.sku,
    }));
  }



  private async buildHeroOutfitFromRoles(
    roleEntries: [string, number][],
  ): Promise<{ heroOutfit: Record<string, any>; alternatives: Record<string, any[]> } | null> {
    const idsToLoad = [...new Set(roleEntries.map(([, id]) => id))];
    if (!idsToLoad.length) return null;

    const products = await this.prisma.products.findMany({
      where: { id: { in: idsToLoad } },
      include: this.productInclude,
    });

    const byId = new Map(products.map((p) => [p.id, p]));
    const heroOutfit: Record<string, any> = {};
    const alternatives: Record<string, any[]> = {};

    for (const [role, id] of roleEntries) {
      const product = byId.get(id);
      if (!product) continue;
      heroOutfit[role] = this.mapProductResponse(product);
      alternatives[role] = [];
    }

    return Object.keys(heroOutfit).length > 0 ? { heroOutfit, alternatives } : null;
  }

  async getRecommendations(productId: number, _limit: number = 3) {
    try {
      // 1. Yerleşik kombin motoru (Colab algoritması — Nest içinde, Python gerekmez)
      const outfitRoles = this.outfitService.generateOutfitRoles(productId);
      if (outfitRoles) {
        const roleEntries = Object.entries(outfitRoles) as [string, number][];
        const built = await this.buildHeroOutfitFromRoles(roleEntries);
        if (built) {
          return {
            ...built,
            cohesionScore: 92,
            source: 'outfit-engine',
          };
        }
      }

      // 2. İsteğe bağlı: harici Python servisi (8001) açıksa onu dene
      try {
        const response = await fetch(
          `http://127.0.0.1:8001/recommend?product_id=${productId}`,
          { signal: AbortSignal.timeout(3000) },
        );
        if (response.ok) {
          const data = await response.json();
          const pyRoles = data.outfit_roles as Record<string, number> | undefined;
          if (pyRoles) {
            const roleEntries = Object.entries(pyRoles).filter(
              ([role]) => role !== 'seed',
            ) as [string, number][];
            const built = await this.buildHeroOutfitFromRoles(roleEntries);
            if (built) {
              return { ...built, cohesionScore: 92, source: 'python-engine' };
            }
          }
        }
      } catch {
        /* Python kapalıysa sorun değil */
      }

      // 3. Son çare: aynı kategoriden benzer ürünler (eski davranış)
      const product = await this.prisma.products.findUnique({ where: { id: productId } });
      if (product) {
        const fallback = await this.prisma.products.findMany({
          where: { category_id: product.category_id, id: { not: productId } },
          take: 4,
          include: this.productInclude,
        });
        const mapped = fallback.map(p => this.mapProductResponse(p));
        
        const heroOutfit: Record<string, any> = {};
        const alternatives: Record<string, any[]> = {};
        
        for (const p of mapped) {
          const role = p.category || 'Öneri';
          if (!heroOutfit[role]) {
            heroOutfit[role] = p;
            alternatives[role] = [];
          } else {
            alternatives[role].push(p);
          }
        }
        
        return {
          heroOutfit,
          alternatives,
          cohesionScore: 50,
          source: 'category-fallback',
        };
      }
    } catch { /* ignore */ }

    return { heroOutfit: {}, alternatives: {}, cohesionScore: 0, source: 'none' };
  }
}
