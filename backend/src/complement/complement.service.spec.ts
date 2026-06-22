import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { ComplementService } from './complement.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ComplementService', () => {
  let service: ComplementService;
  let prisma: { products: { findMany: jest.Mock } };

  const originalFetch = global.fetch;

  beforeEach(async () => {
    prisma = {
      products: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplementService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://127.0.0.1:8001') },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ComplementService);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('enriches python response with product metadata', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [{ id: 10 }, { id: 20 }],
        seed_ids: [1],
        engine: 'elegant_cir',
      }),
    });

    prisma.products.findMany.mockResolvedValue([
      {
        id: 10,
        name: 'Blazer',
        categories: { name: 'Dis Giyim' },
        product_images: [{ image_url: '10-0.jpg', is_main: true }],
      },
      {
        id: 20,
        name: 'Pantolon',
        categories: { name: 'Alt Giyim' },
        product_images: [{ image_url: '20-0.jpg', is_main: false }],
      },
    ]);

    const result = await service.getComplement('1', 8, '');

    expect(result.items).toEqual([
      { id: 10, name: 'Blazer', category: 'Dis Giyim', image_url: '10-0.jpg' },
      { id: 20, name: 'Pantolon', category: 'Alt Giyim', image_url: '20-0.jpg' },
    ]);
    expect(result.seed_ids).toEqual([1]);
  });

  it('throws HttpException when python engine fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ detail: 'Model yukleniyor' }),
    });

    await expect(service.getComplement('1', 8, '')).rejects.toThrow(HttpException);
  });

  it('reports unreachable python engine on health check', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

    const health = await service.getEngineHealth();

    expect(health.reachable).toBe(false);
    expect(health.status).toBe('unreachable');
  });
});
