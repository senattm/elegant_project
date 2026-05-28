import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OutfitRecommender } from './outfit-recommender';
import { OutfitCatalogItem, prepareCatalogItem } from './outfit-engine.utils';

@Injectable()
export class OutfitService implements OnModuleInit {
  private readonly logger = new Logger(OutfitService.name);
  private recommender: OutfitRecommender | null = null;
  private catalogSize = 0;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.reloadCatalog();
  }

  async reloadCatalog(): Promise<void> {
    try {
      const rows = await this.prisma.products.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          brand: true,
          colors: true,
          season: true,
          tags: true,
        },
      });

      const catalog: OutfitCatalogItem[] = rows.map((row) =>
        prepareCatalogItem({
          id: row.id,
          name: row.name,
          description: row.description,
          brand: row.brand,
          colors: row.colors,
          season: row.season,
          tags: row.tags,
        }),
      );

      this.recommender = new OutfitRecommender(catalog);
      this.catalogSize = catalog.length;
      this.logger.log(`Kombin motoru hazır — ${this.catalogSize} ürün yüklendi.`);
    } catch (err) {
      this.logger.error('Kombin motoru yüklenemedi', err);
      this.recommender = null;
      this.catalogSize = 0;
    }
  }

  isReady(): boolean {
    return this.recommender !== null && this.catalogSize > 0;
  }

  /**
   * Tam kombin planı: upper, lower, shoes, bag, outerwear, accessory...
   * Ana parça (seed) hariç roller döner.
   */
  generateOutfitRoles(seedProductId: number): Record<string, number> | null {
    if (!this.recommender) return null;

    const plan = this.recommender.generateOutfit(seedProductId);
    if (!plan) return null;

    const roles: Record<string, number> = {};
    for (const [role, item] of Object.entries(plan)) {
      if (role === 'seed') continue;
      roles[role] = item.id;
    }
    return Object.keys(roles).length ? roles : null;
  }

  getCatalogSize(): number {
    return this.catalogSize;
  }
}
