import { Injectable, Logger } from '@nestjs/common';
import { VertexAI } from '@google-cloud/vertexai';
import { PrismaService } from '../prisma/prisma.service';

export interface ChatProductRecommendation {
  id: number;
  name: string;
  price: number;
  image: string | null;
  category: string | null;
  style?: string | null;
  season?: string | null;
}

export interface ChatbotResponse {
  message: string;
  action: 'redirect' | 'none' | 'recommend';
  path?: string;
  recommendations?: ChatProductRecommendation[];
}

const COLOR_ALIASES: Record<string, string[]> = {
  siyah: ['siyah', 'black'],
  beyaz: ['beyaz', 'white'],
  kirmizi: ['kırmızı', 'kirmizi', 'red'],
  mavi: ['mavi', 'blue', 'navy', 'dark blue'],
  yesil: ['yeşil', 'yesil', 'green'],
  gri: ['gri', 'grey', 'gray'],
  bej: ['bej', 'beige', 'cream'],
  pembe: ['pembe', 'pink'],
  kahve: ['kahve', 'kahverengi', 'brown'],
  altin: ['altın', 'altin', 'gold'],
};

const CATEGORY_ALIASES: Record<string, string[]> = {
  Elbise: ['elbise', 'dress', 'elbiseler'],
  Ayakkabı: ['ayakkabı', 'ayakkabi', 'shoe', 'shoes', 'bot', 'topuklu'],
  Gömlek: ['gömlek', 'gomlek', 'shirt', 'bluz'],
  Pantolon: ['pantolon', 'pants', 'trouser', 'jean', 'denim'],
  Etek: ['etek', 'skirt'],
  Top: ['top', 'blouse'],
  'Kaban ve Ceket': ['kaban', 'ceket', 'mont', 'jacket', 'coat', 'trenç', 'trench'],
  'Kazak ve Hırka': ['kazak', 'hırka', 'hirka', 'sweater', 'cardigan'],
};

/** Ürün tags alanındaki stil değerleri */
const STYLE_ALIASES: Record<string, string[]> = {
  party: ['parti', 'party', 'gece', 'davet', 'kokteyl', 'eglence', 'eğlence'],
  office: ['ofis', 'office', 'kurumsal', 'business', 'calisma', 'çalışma'],
  casual: ['casual', 'gunluk', 'günlük', 'rahat', 'sokak'],
  formal: ['formal', 'resmi', 'gala', 'tören', 'toren', 'smokin'],
  chic: ['chic', 'sik', 'şık', 'zarif', 'elegant'],
  sport: ['sport', 'spor', 'aktif', 'fitness'],
  school: ['school', 'okul', 'kampus', 'kampüs', 'universite', 'üniversite'],
};

const SEASON_ALIASES: Record<string, string[]> = {
  summer: ['yaz', 'yazlik', 'yazlık', 'summer'],
  winter: ['kis', 'kış', 'kislik', 'kışlık', 'winter', 'soguk', 'soğuk'],
  autumn: ['sonbahar', 'autumn', 'fall', 'guz', 'güz'],
  spring: ['ilkbahar', 'spring', 'bahar'],
};

const STYLE_LABELS: Record<string, string> = {
  party: 'parti',
  office: 'ofis',
  casual: 'günlük',
  formal: 'resmi',
  chic: 'şık',
  sport: 'spor',
  school: 'okul',
};

const SEASON_LABELS: Record<string, string> = {
  summer: 'yaz',
  winter: 'kış',
  autumn: 'sonbahar',
  spring: 'ilkbahar',
};

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private vertexAI: VertexAI | null = null;

  constructor(private readonly prisma: PrismaService) {
    try {
      const project = process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id';
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

      this.vertexAI = new VertexAI({
        project,
        location,
      });
    } catch (error) {
      this.logger.error('Failed to initialize Vertex AI. Please check your credentials.', error);
    }
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /** Kisa alias'larin kelime icinde yanlis eslesmesini onler (or. "is" -> elbise). */
  private messageContainsAlias(message: string, alias: string): boolean {
    const normalized = this.normalizeText(message);
    const term = this.normalizeText(alias);
    if (term.length <= 3) {
      return normalized.split(/\W+/).some((word) => word === term);
    }
    return normalized.includes(term);
  }

  private parseColors(message: string): string[] {
    const found: string[] = [];
    for (const aliases of Object.values(COLOR_ALIASES)) {
      if (aliases.some((a) => this.messageContainsAlias(message, a))) {
        found.push(...aliases);
      }
    }
    return [...new Set(found)];
  }

  private parseCategories(message: string): string[] {
    const found: string[] = [];
    for (const [category, aliases] of Object.entries(CATEGORY_ALIASES)) {
      if (aliases.some((a) => this.messageContainsAlias(message, a))) {
        found.push(category);
      }
    }
    return found;
  }

  private parseStyles(message: string): string[] {
    const found: string[] = [];
    for (const [style, aliases] of Object.entries(STYLE_ALIASES)) {
      if (aliases.some((a) => this.messageContainsAlias(message, a))) {
        found.push(style);
      }
    }
    return found;
  }

  private parseSeasons(message: string): string[] {
    const found: string[] = [];
    for (const [season, aliases] of Object.entries(SEASON_ALIASES)) {
      if (aliases.some((a) => this.messageContainsAlias(message, a))) {
        found.push(season);
      }
    }
    return found;
  }

  private productMatchesRequestedCategory(
    categoryName: string,
    nameStr: string,
    tagStr: string,
    requestedCategories: string[],
  ): boolean {
    if (requestedCategories.length === 0) return true;

    const nameNorm = this.normalizeText(nameStr);

    for (const cat of requestedCategories) {
      if (this.categoryMatches(categoryName, cat)) return true;

      const aliases = CATEGORY_ALIASES[cat] ?? [];
      if (aliases.some((a) => nameNorm.includes(this.normalizeText(a)))) {
        const catNorm = this.normalizeText(categoryName);
        const conflicts: Record<string, string[]> = {
          Elbise: ['etek', 'pantolon', 'ayakkabi', 'canta', 'aksesuar'],
          Etek: ['pantolon', 'elbise', 'ayakkabi'],
          Pantolon: ['etek', 'elbise', 'ayakkabi'],
        };
        const blocked = conflicts[cat] ?? [];
        if (!blocked.some((b) => catNorm.includes(b))) return true;
      }

      if (cat === 'Elbise' && (tagStr.includes('dress') || tagStr.includes('"elbise"'))) {
        if (!this.categoryMatches(categoryName, 'Etek') && !this.categoryMatches(categoryName, 'Pantolon')) {
          return true;
        }
      }
    }

    return false;
  }

  private categoryMatches(categoryName: string, targetCategory: string): boolean {
    const cat = this.normalizeText(categoryName);
    const target = this.normalizeText(targetCategory);
    const stem = target.replace(/(ler|lar)$/, '');
    return cat.includes(stem) || cat.includes(target) || target.includes(cat);
  }

  private extractProductStyle(tags: unknown): string | null {
    const tagStr = JSON.stringify(tags ?? []).toLowerCase();
    for (const style of Object.keys(STYLE_ALIASES)) {
      if (tagStr.includes(`"${style}"`) || tagStr.includes(style)) return style;
    }
    return null;
  }

  private extractProductSeason(season: unknown): string | null {
    const seasonStr = JSON.stringify(season ?? []).toLowerCase();
    for (const s of Object.keys(SEASON_ALIASES)) {
      if (seasonStr.includes(s)) return s;
    }
    return null;
  }

  private isBrowseAllIntent(message: string): boolean {
    const n = this.normalizeText(message);
    return (
      n.includes('hepsini') ||
      n.includes('tumunu') ||
      n.includes('tümünü') ||
      n.includes('kategoriyi ac') ||
      n.includes('kategoriyi aç') ||
      n.includes('magazaya git') ||
      n.includes('mağazaya git')
    );
  }

  private isNavigationIntent(message: string): boolean {
    const n = this.normalizeText(message);
    return (
      n.includes('/profile') ||
      n.includes('profil') ||
      n.includes('siparis') ||
      n.includes('sepet') ||
      n.includes('favori') ||
      n.includes('gardirob') ||
      n.includes('adres') ||
      n.includes('sifre')
    );
  }

  private isProductSearchIntent(message: string): boolean {
    const colors = this.parseColors(message);
    const categories = this.parseCategories(message);
    const styles = this.parseStyles(message);
    const seasons = this.parseSeasons(message);
    const n = this.normalizeText(message);
    const productWords = [
      'urun', 'ürün', 'model', 'parca', 'parça', 'kiyafet', 'kıyafet', 'giyim',
      'istiyorum', 'ariyorum', 'arıyorum', 'oner', 'öner', 'goster', 'göster', 'var mi', 'var mı',
    ];
    return (
      colors.length > 0 ||
      categories.length > 0 ||
      styles.length > 0 ||
      seasons.length > 0 ||
      productWords.some((w) => n.includes(w))
    );
  }

  async searchProducts(message: string, limit = 4): Promise<ChatProductRecommendation[]> {
    const colors = this.parseColors(message);
    const categories = this.parseCategories(message);
    const styles = this.parseStyles(message);
    const seasons = this.parseSeasons(message);
    const keywords = this.normalizeText(message)
      .split(/\W+/)
      .filter((w) => w.length > 2);

    const products = await this.prisma.products.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        brand: true,
        colors: true,
        season: true,
        tags: true,
        categories: { select: { name: true } },
        product_images: {
          where: { is_main: true },
          take: 1,
          select: { image_url: true },
        },
      },
    });

    const scored = products
      .filter((p) => {
        const categoryName = p.categories?.name ?? '';
        const tagStr = JSON.stringify(p.tags ?? []).toLowerCase();
        return this.productMatchesRequestedCategory(categoryName, p.name, tagStr, categories);
      })
      .map((p) => {
        const colorStr = JSON.stringify(p.colors ?? []).toLowerCase();
        const seasonStr = JSON.stringify(p.season ?? []).toLowerCase();
        const tagStr = JSON.stringify(p.tags ?? []).toLowerCase();
        const nameStr = p.name.toLowerCase();
        const categoryName = p.categories?.name ?? '';

        let score = 0;

        for (const c of colors) {
          if (colorStr.includes(c) || nameStr.includes(c) || tagStr.includes(c)) score += 3;
        }

        for (const cat of categories) {
          if (this.categoryMatches(categoryName, cat)) score += 4;
          else if (nameStr.includes(this.normalizeText(cat))) score += 2;
        }

        for (const style of styles) {
          if (tagStr.includes(style)) score += 4;
          for (const alias of STYLE_ALIASES[style] ?? []) {
            if (nameStr.includes(alias) || tagStr.includes(alias)) score += 1;
          }
        }

        for (const season of seasons) {
          if (seasonStr.includes(season)) score += 4;
          for (const alias of SEASON_ALIASES[season] ?? []) {
            if (nameStr.includes(alias) || tagStr.includes(alias)) score += 1;
          }
        }

        for (const kw of keywords) {
          if (nameStr.includes(kw)) score += 1;
          if (tagStr.includes(kw)) score += 0.5;
          if (seasonStr.includes(kw)) score += 0.5;
          if (categoryName.toLowerCase().includes(kw)) score += 1;
        }

        return { product: p, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(({ product: p }) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      image: p.product_images[0]?.image_url ?? null,
      category: p.categories?.name ?? null,
      style: this.extractProductStyle(p.tags),
      season: this.extractProductSeason(p.season),
    }));
  }

  private buildRecommendMessage(message: string): string {
    const parts: string[] = [];

    for (const s of this.parseSeasons(message)) {
      parts.push(SEASON_LABELS[s] ?? s);
    }
    for (const c of this.parseColors(message)) {
      if (c === 'black' || c === 'siyah') parts.push('siyah');
      else if (c === 'white' || c === 'beyaz') parts.push('beyaz');
      else parts.push(c);
      break;
    }
    for (const st of this.parseStyles(message)) {
      parts.push(STYLE_LABELS[st] ?? st);
    }
    for (const cat of this.parseCategories(message)) {
      parts.push(cat.toLowerCase());
      break;
    }

    return parts.length ? `Size ${parts.join(' ')} önerilerimiz:` : 'Size önerilerimiz:';
  }

  async processMessage(message: string): Promise<ChatbotResponse> {
    if (this.isNavigationIntent(message) || this.isBrowseAllIntent(message)) {
      return this.processWithLlm(message);
    }

    if (this.isProductSearchIntent(message)) {
      const recommendations = await this.searchProducts(message);
      if (recommendations.length) {
        return {
          message: this.buildRecommendMessage(message),
          action: 'recommend',
          recommendations,
        };
      }
    }

    return this.processWithLlm(message);
  }

  private async processWithLlm(message: string): Promise<ChatbotResponse> {
    if (!this.vertexAI) {
      const recommendations = await this.searchProducts(message);
      if (recommendations.length) {
        return {
          message: this.buildRecommendMessage(message),
          action: 'recommend',
          recommendations,
        };
      }
      return {
        message: 'Sistem şu anda asistan hizmeti veremiyor (Vertex AI yapılandırılmamış).',
        action: 'none',
      };
    }

    try {
      const recommendations = await this.searchProducts(message);
      const productContext =
        recommendations.length > 0
          ? `İLGİLİ ÜRÜNLER:\n${recommendations.map((p) => `- ID:${p.id} | ${p.name} | ${p.category} | ${p.price} TL`).join('\n')}`
          : '';

      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
        Sen Elegant adlı lüks giyim mağazasının müşteri temsilcisisin. JSON dön.

        SSS:
        - Kargo: 1-3 iş günü
        - İade: 30 gün, etiketli
        - İletişim: destek@elegant.com

        ${productContext}

        KURALLAR:
        - Kullanıcı belirli ürün/renk/stil/sezon arıyorsa action "none" yap, kategori sayfasına YÖNLENDİRME.
        - Stil/occasion: party/parti, office/ofis, casual/günlük, formal/resmi, chic/şık, sport/spor, school/okul
        - Sezon: summer/yaz, winter/kış, autumn/sonbahar, spring/ilkbahar
        - Örnek: "parti elbisesi", "ofis giyimi", "yazlık şık elbise"
        - Sadece sayfa gezinmesi istenirse action "redirect" kullan.
        - Kategoriler: Elbise, Kaban ve Ceket, Ayakkabı, Gömlek, Kazak ve Hırka, Pantolon, Etek, Top
        - Profil: /profile, Sipariş: /orders, Sepet: /cart, Favori: /favorites, Gardırop: /wardrobe
        - "Tüm elbiseleri göster" gibi genel isteklerde /store?category=Elbise kullan.

        JSON formatı:
        {
          "message": "Türkçe yanıt",
          "action": "redirect" | "none",
          "path": "/yol"
        }

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

      if (
        this.isProductSearchIntent(message) &&
        recommendations.length &&
        parsed.action === 'redirect' &&
        parsed.path?.includes('/store')
      ) {
        return {
          message: this.buildRecommendMessage(message),
          action: 'recommend',
          recommendations,
        };
      }

      return parsed;
    } catch (error) {
      this.logger.error('Vertex AI generation error:', error);
      const recommendations = await this.searchProducts(message);
      if (recommendations.length) {
        return {
          message: this.buildRecommendMessage(message),
          action: 'recommend',
          recommendations,
        };
      }
      return {
        message: 'Üzgünüm, şu an isteğinizi işleyemiyorum.',
        action: 'none',
      };
    }
  }
}
