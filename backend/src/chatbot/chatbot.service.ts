import { Injectable, Logger } from '@nestjs/common';
import { VertexAI } from '@google-cloud/vertexai';
import { existsSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

export interface ProductSuggestion {
  id: number;
  name: string;
  price: number;
  image: string | null;
}

export interface ChatbotResponse {
  message: string;
  action: 'redirect' | 'products' | 'none';
  path?: string;
  products?: ProductSuggestion[];
}

const COLOR_KEYWORDS: Record<string, string> = {
  beyaz: 'white',
  siyah: 'black',
  kirmizi: 'red',
  mavi: 'blue',
  lacivert: 'navy',
  yesil: 'green',
  sari: 'yellow',
  pembe: 'pink',
  mor: 'purple',
  gri: 'gray',
  bej: 'beige',
  kahverengi: 'brown',
  turuncu: 'orange',
  krem: 'cream',
  altin: 'gold',
  gumus: 'silver',
};

const STYLE_KEYWORDS: Record<string, string> = {
  ofis: 'Office',
  gunluk: 'Casual',
  rahat: 'Casual',
  spor: 'Sport',
  parti: 'Party',
  gece: 'Party',
  klasik: 'Formal',
  resmi: 'Formal',
  sik: 'Chic',
};

const PRODUCT_INTENT_VERBS = [
  'istiyorum',
  'ariyorum',
  'ihtiyacim',
  'lazim',
  'bakiyorum',
  'oner',
  'var mi',
  'bulabilir miyim',
];

const STORE_CATEGORIES: Record<string, string[]> = {
  Elbise: ['elbise', 'dress'],
  Ayakkabı: ['ayakkabi', 'ayakkabı', 'shoe', 'shoes', 'bot', 'sandalet', 'topuklu'],
  Gömlek: ['gomlek', 'gömlek', 'bluz', 'shirt', 'blouse'],
  Top: ['tisort', 'tişört', 'crop top', 'top'],
  'Kazak ve Hırka': ['kazak', 'hirka', 'hırka', 'sweater', 'cardigan', 'triko', 'suveter'],
  Pantolon: ['pantolon', 'trouser', 'pants'],
  Jean: ['jean', 'kot', 'denim'],
  Etek: ['etek', 'skirt'],
  'Kaban ve Ceket': ['kaban', 'ceket', 'mont', 'jacket', 'coat'],
  Çanta: ['canta', 'çanta', 'bag'],
  Aksesuar: ['aksesuar', 'taki', 'takı', 'jewelry', 'kolye', 'yuzuk', 'yüzük', 'bilezik'],
  Gözlük: ['gozluk', 'gözlük', 'sunglasses'],
};

const NAV_RULES: { keywords: string[]; path: string; reply: string }[] = [
  { keywords: ['profil', 'hesabim', 'hesabım'], path: '/profile', reply: 'Profilinize yönlendiriyorum.' },
  { keywords: ['siparis', 'sipariş', 'siparislerim'], path: '/orders', reply: 'Siparişlerinize yönlendiriyorum.' },
  { keywords: ['sepet'], path: '/cart', reply: 'Sepetinize yönlendiriyorum.' },
  { keywords: ['favori'], path: '/favorites', reply: 'Favorilerinize yönlendiriyorum.' },
  { keywords: ['dolab', 'gardirob', 'kombin'], path: '/wardrobe', reply: 'Dolabınıza yönlendiriyorum.' },
  { keywords: ['magaza', 'mağaza', 'alisveris', 'alışveriş', 'koleksiyon'], path: '/store', reply: 'Mağazaya yönlendiriyorum.' },
  { keywords: ['anasayfa', 'ana sayfa', 'home'], path: '/', reply: 'Ana sayfaya yönlendiriyorum.' },
  { keywords: ['adres'], path: '/profile', reply: 'Adres bilgileriniz profil sayfasında.' },
  { keywords: ['odeme', 'ödeme', 'kart'], path: '/profile', reply: 'Ödeme yöntemleriniz profil sayfasında.' },
];

const ALLOWED_PATH_PREFIXES = [
  '/',
  '/profile',
  '/orders',
  '/cart',
  '/favorites',
  '/wardrobe',
  '/store',
];

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private vertexAI: VertexAI | null = null;
  private vertexEnabled = false;

  constructor(private readonly prisma: PrismaService) {
    this.initVertex();
  }

  private initVertex(): void {
    try {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (credentialsPath && !credentialsPath.startsWith('/') && !/^[A-Za-z]:/.test(credentialsPath)) {
        const resolved = join(process.cwd(), credentialsPath.replace(/^\.\//, ''));
        if (existsSync(resolved)) {
          process.env.GOOGLE_APPLICATION_CREDENTIALS = resolved;
        }
      }

      const project = process.env.GOOGLE_CLOUD_PROJECT;
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

      if (!project || project === 'your-project-id') {
        this.logger.warn('GOOGLE_CLOUD_PROJECT ayarli degil; Vertex AI kapali.');
        return;
      }

      if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        this.logger.warn('GOOGLE_APPLICATION_CREDENTIALS ayarli degil; Vertex AI kapali.');
        return;
      }

      this.vertexAI = new VertexAI({ project, location });
      this.vertexEnabled = true;
      this.logger.log(`Vertex AI hazir (project=${project}, location=${location})`);
    } catch (error) {
      this.logger.error('Vertex AI baslatilamadi.', error);
      this.vertexAI = null;
      this.vertexEnabled = false;
    }
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u0131/g, 'i');
  }

  private answerFaq(message: string): string | null {
    const n = this.normalizeText(message);

    if (n.includes('kargo') || n.includes('teslimat') || n.includes('gonderim') || n.includes('gönderim')) {
      return 'Kargo süremiz 1-3 iş günüdür. Siparişiniz kargoya verildiğinde bilgilendirilirsiniz.';
    }
    if (n.includes('iade') || n.includes('degisim') || n.includes('değişim') || n.includes('geri gonder')) {
      return 'Etiketi sökülmemiş ürünlerde 30 gün içinde iade veya değişim yapabilirsiniz.';
    }
    if (
      n.includes('iletisim') ||
      n.includes('iletişim') ||
      n.includes('destek') ||
      n.includes('mail') ||
      n.includes('e-posta')
    ) {
      return 'Bize destek@elegant.com adresinden ulaşabilirsiniz.';
    }
    if (n.includes('odeme') || n.includes('ödeme') || n.includes('taksit')) {
      return 'Ödeme işlemleri güvenli altyapı üzerinden yapılır. Kayıtlı kartlarınızı profil sayfasından yönetebilirsiniz.';
    }

    return null;
  }

  private detectStoreCategory(message: string): string | null {
    const n = this.normalizeText(message);
    for (const [category, aliases] of Object.entries(STORE_CATEGORIES)) {
      if (aliases.some((alias) => n.includes(this.normalizeText(alias)))) {
        return category;
      }
    }
    return null;
  }

  private detectProductQuery(message: string): { category: string; color?: string; style?: string } | null {
    const n = this.normalizeText(message);
    const category = this.detectStoreCategory(message);
    if (!category) return null;

    const color = Object.entries(COLOR_KEYWORDS).find(([tr]) => n.includes(this.normalizeText(tr)))?.[1];
    const style = Object.entries(STYLE_KEYWORDS).find(([tr]) => n.includes(this.normalizeText(tr)))?.[1];
    const hasIntentVerb = PRODUCT_INTENT_VERBS.some((verb) => n.includes(this.normalizeText(verb)));

    if (!hasIntentVerb && !color && !style) return null;

    return { category, color, style };
  }

  private async searchElegantProducts(query: {
    category: string;
    color?: string;
    style?: string;
  }): Promise<ProductSuggestion[]> {
    const products = await this.prisma.products.findMany({
      where: {
        source: null,
        categories: { name: query.category },
      },
      include: {
        product_images: {
          select: { image_url: true, is_main: true },
          orderBy: [{ is_main: 'desc' }, { image_url: 'asc' }],
        },
      },
      take: 60,
    });

    let filtered = products;
    if (query.color) {
      filtered = filtered.filter((p) => JSON.stringify(p.colors ?? []).toLowerCase().includes(query.color!.toLowerCase()));
    }
    if (query.style) {
      filtered = filtered.filter((p) => JSON.stringify(p.tags ?? []).toLowerCase().includes(query.style!.toLowerCase()));
    }
    if (filtered.length === 0) {
      filtered = products;
    }

    return filtered.slice(0, 4).map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price ? Number(p.price) : 0,
      image: p.product_images[0]?.image_url ?? null,
    }));
  }

  private async answerWithProductSearch(message: string): Promise<ChatbotResponse | null> {
    const query = this.detectProductQuery(message);
    if (!query) return null;

    const products = await this.searchElegantProducts(query);
    if (products.length === 0) {
      return {
        message: `${query.category} kategorisinde aradığınız kriterlere uygun ürün bulamadım.`,
        action: 'none',
      };
    }

    return {
      message: `${query.category} kategorisinde size şunları önerebilirim:`,
      action: 'products',
      products,
    };
  }

  private detectRedirect(message: string): { path: string; reply: string } | null {
    const n = this.normalizeText(message);

    if (
      n.includes('hepsini goster') ||
      n.includes('hepsini göster') ||
      n.includes('tumunu goster') ||
      n.includes('tümünü göster')
    ) {
      const category = this.detectStoreCategory(message);
      if (category) {
        return {
          path: `/store?category=${encodeURIComponent(category)}`,
          reply: `${category} kategorisine yönlendiriyorum.`,
        };
      }
    }

    const category = this.detectStoreCategory(message);
    if (category && (n.includes('goster') || n.includes('göster') || n.includes('git') || n.includes('ac') || n.includes('aç'))) {
      return {
        path: `/store?category=${encodeURIComponent(category)}`,
        reply: `${category} kategorisine yönlendiriyorum.`,
      };
    }

    for (const rule of NAV_RULES) {
      if (rule.keywords.some((kw) => n.includes(this.normalizeText(kw)))) {
        return { path: rule.path, reply: rule.reply };
      }
    }

    return null;
  }

  private answerWithRules(message: string): ChatbotResponse {
    const faq = this.answerFaq(message);
    if (faq) {
      return { message: faq, action: 'none' };
    }

    const redirect = this.detectRedirect(message);
    if (redirect) {
      return {
        message: redirect.reply,
        action: 'redirect',
        path: redirect.path,
      };
    }

    return {
      message:
        'Size ürün önerebilir, site içinde yönlendirebilir, kargo/iade/iletişim gibi konularda yardımcı olabilirim. Örneğin: "beyaz ofis elbisesi istiyorum", "sepetim", "kargo kaç gün".',
      action: 'none',
    };
  }

  private sanitizePath(path?: string): string | undefined {
    if (!path || typeof path !== 'string') return undefined;
    const trimmed = path.trim();
    const allowed = ALLOWED_PATH_PREFIXES.some(
      (prefix) => trimmed === prefix || trimmed.startsWith(`${prefix}?`) || trimmed.startsWith(`${prefix}/`),
    );
    return allowed ? trimmed : undefined;
  }

  async processMessage(message: string): Promise<ChatbotResponse> {
    const productResponse = await this.answerWithProductSearch(message);
    if (productResponse) {
      return productResponse;
    }

    if (this.vertexEnabled && this.vertexAI) {
      return this.processWithLlm(message);
    }

    return this.answerWithRules(message);
  }

  private async processWithLlm(message: string): Promise<ChatbotResponse> {
    if (!this.vertexAI) {
      return this.answerWithRules(message);
    }

    try {
      this.logger.debug(`Vertex AI istegi: "${message.slice(0, 80)}"`);

      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });

      const categoryList = Object.keys(STORE_CATEGORIES).join(', ');

      const prompt = `
        Sen Elegant moda sitesinin asistanısın. Sadece site yönlendirmesi ve SSS cevaplarsın. Ürün önerme veya arama yapma. JSON dön.

        SSS:
        - Kargo: 1-3 iş günü
        - İade: 30 gün, etiketli ürünler
        - İletişim: destek@elegant.com

        Yönlendirme yolları:
        - Profil: /profile
        - Siparişler: /orders
        - Sepet: /cart
        - Favoriler: /favorites
        - Dolabım: /wardrobe
        - Mağaza: /store
        - Kategori: /store?category=KATEGORI_ADI (${categoryList})

        Kurallar:
        - Ürün arama/öneri yapma.
        - Sayfa yönlendirmesi gerekiyorsa action "redirect" ve path ver.
        - SSS sorusuysa action "none", message ile cevap ver.
        - Türkçe, kısa ve nazik yanıt ver.

        JSON:
        { "message": "...", "action": "redirect" | "none", "path": "/yol" }

        Mesaj: "${message}"
      `;

      const response = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      let content = response.response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) throw new Error('Boş yanıt');

      if (content.startsWith('```json')) {
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      } else if (content.startsWith('```')) {
        content = content.replace(/```/g, '').trim();
      }

      const parsed = JSON.parse(content) as ChatbotResponse;
      const safePath = this.sanitizePath(parsed.path);

      if (parsed.action === 'redirect' && safePath) {
        this.logger.debug(`Vertex AI yonlendirme: ${safePath}`);
        return {
          message: parsed.message || 'Sizi ilgili sayfaya yönlendiriyorum.',
          action: 'redirect',
          path: safePath,
        };
      }

      this.logger.debug('Vertex AI metin yaniti');
      return {
        message: parsed.message || 'Size nasıl yardımcı olabilirim?',
        action: 'none',
      };
    } catch (error) {
      this.logger.error('Vertex AI hatasi, kural tabanli yedek kullaniliyor:', error);
      return this.answerWithRules(message);
    }
  }
}
