import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

type ComplementItem = {
  id: number;
  name: string;
  category: string;
  image_url: string;
};

type ComplementResponse = {
  items: ComplementItem[];
  seed_ids: number[];
  engine: string;
};

type PythonComplementResponse = {
  items: Array<{ id: number }>;
  seed_ids: number[];
  engine: string;
};

type PythonHealthResponse = {
  status: string;
  products: number;
  engine: string;
  models_ready?: boolean;
  cir_ready?: boolean;
};

const COMPLEMENT_TIMEOUT_MS = 180_000;
const COMPLEMENT_RETRY_DELAY_MS = 2_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isLoadingDetail = (detail: string) =>
  detail.startsWith('__loading__')
  || detail.includes('indeksleniyor')
  || detail.includes('yukleniyor');

@Injectable()
export class ComplementService {
  private readonly pythonBaseUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.pythonBaseUrl =
      this.config.get<string>('PYTHON_ENGINE_URL') || 'http://127.0.0.1:8001';
  }

  async getEngineHealth(): Promise<{
    status: string;
    products: number;
    engine: string;
    reachable: boolean;
  }> {
    try {
      const response = await fetch(`${this.pythonBaseUrl}/health`, {
        signal: AbortSignal.timeout(5_000),
      });
      if (!response.ok) {
        return { status: 'error', products: 0, engine: 'elegant_cir', reachable: false };
      }
      const body = (await response.json()) as PythonHealthResponse;
      return { ...body, reachable: true };
    } catch {
      return { status: 'unreachable', products: 0, engine: 'elegant_cir', reachable: false };
    }
  }

  async getComplement(
    productIds: string,
    k: number,
    category: string,
  ): Promise<ComplementResponse> {
    const url = new URL('/complement', this.pythonBaseUrl);
    url.searchParams.set('product_ids', productIds);
    url.searchParams.set('k', String(k));
    if (category) {
      url.searchParams.set('category', category);
    }

    const deadline = Date.now() + COMPLEMENT_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const controller = new AbortController();
      const remaining = deadline - Date.now();
      const timeout = setTimeout(() => controller.abort(), remaining);

      try {
        const response = await fetch(url, { signal: controller.signal });
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          const detail =
            typeof body?.detail === 'string'
              ? body.detail
              : 'Kombin servisi hata dondurdu.';

          if (response.status === 503 && isLoadingDetail(detail) && Date.now() < deadline) {
            await sleep(COMPLEMENT_RETRY_DELAY_MS);
            continue;
          }

          throw new HttpException({ detail }, response.status);
        }

        const pythonResult = body as PythonComplementResponse;
        const enrichedItems = await this.enrichItems(pythonResult.items);

        return {
          items: enrichedItems,
          seed_ids: pythonResult.seed_ids,
          engine: pythonResult.engine,
        };
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        throw new HttpException(
          { detail: 'Kombin servisi su an kullanilamiyor.' },
          503,
        );
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new HttpException(
      { detail: '__loading__:Model yukleniyor, lutfen birkac saniye bekleyin.' },
      503,
    );
  }

  private pickPrimaryImage(images: { image_url: string; is_main: boolean | null }[]): string {
    if (!images.length) return '';
    const sorted = [...images].sort((a, b) => {
      const aMain = a.is_main ? 1 : 0;
      const bMain = b.is_main ? 1 : 0;
      if (aMain !== bMain) return bMain - aMain;
      return a.image_url.localeCompare(b.image_url);
    });
    return sorted[0].image_url;
  }

  private async enrichItems(items: Array<{ id: number }>): Promise<ComplementItem[]> {
    if (!items.length) return [];

    const ids = items.map((item) => item.id);
    const products = await this.prisma.products.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        categories: { select: { name: true } },
        product_images: {
          select: { image_url: true, is_main: true },
        },
      },
    });

    const byId = new Map(products.map((p) => [p.id, p]));

    return ids
      .map((id) => {
        const product = byId.get(id);
        if (!product) return null;
        return {
          id: product.id,
          name: product.name,
          category: product.categories?.name ?? '',
          image_url: this.pickPrimaryImage(product.product_images),
        };
      })
      .filter((item): item is ComplementItem => item !== null);
  }
}
