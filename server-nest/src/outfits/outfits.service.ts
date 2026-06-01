import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SaveOutfitInput {
  userId?: number;
  seedProductId: number;
  roleEntries: Array<{ role: string; productId: number; sortOrder?: number }>;
  cohesionScore: number;
  source: string;
  occasion?: string;
  style?: string;
}

@Injectable()
export class OutfitsService {
  constructor(private readonly prisma: PrismaService) {}

  async saveRecommendation(input: SaveOutfitInput) {
    const outfit = await this.prisma.outfits.create({
      data: {
        user_id: input.userId ?? null,
        seed_product_id: input.seedProductId,
        cohesion_score: input.cohesionScore,
        source: input.source,
        occasion: input.occasion ?? null,
        style: input.style ?? null,
        is_ai: true,
        title: `AI Kombin — Ürün #${input.seedProductId}`,
        outfit_items: {
          create: input.roleEntries.map((entry, idx) => ({
            product_id: entry.productId,
            role: entry.role,
            sort_order: entry.sortOrder ?? idx,
          })),
        },
      },
      include: {
        outfit_items: {
          include: { products: { select: { id: true, name: true } } },
        },
      },
    });

    return outfit;
  }

  async submitFeedback(userId: number, outfitId: number, feedback: 1 | -1) {
    const outfit = await this.prisma.outfits.findFirst({
      where: { id: outfitId, user_id: userId },
    });
    if (!outfit) throw new NotFoundException('Kombin bulunamadı');

    return this.prisma.outfits.update({
      where: { id: outfitId },
      data: { feedback, feedback_at: new Date() },
    });
  }

  async getUserOutfits(userId: number) {
    return this.prisma.outfits.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: {
        outfit_items: {
          orderBy: { sort_order: 'asc' },
          include: {
            products: {
              include: {
                product_images: {
                  where: { is_main: true },
                  take: 1,
                },
              },
            },
          },
        },
        seed_product: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async getFeedbackStats() {
    const [total, liked, disliked] = await Promise.all([
      this.prisma.outfits.count({ where: { feedback: { not: null } } }),
      this.prisma.outfits.count({ where: { feedback: 1 } }),
      this.prisma.outfits.count({ where: { feedback: -1 } }),
    ]);

    const satisfactionRate = total ? Math.round((liked / total) * 100) : 0;

    return { totalFeedback: total, liked, disliked, satisfactionRate };
  }
}
