import { Injectable, Logger } from '@nestjs/common';
import { VertexAI } from '@google-cloud/vertexai';

export interface ChatbotResponse {
  message: string;
  action: 'redirect' | 'none';
  path?: string;
}

const STORE_CATEGORIES: Record<string, string[]> = {
  Elbise: ['elbise', 'dress'],
  Ayakkabı: ['ayakkabi', 'ayakkabı', 'shoe', 'shoes', 'bot'],
  'Üst Giyim': ['ust giyim', 'üst giyim', 'gomlek', 'gömlek', 'bluz', 'top', 'kazak'],
  'Alt Giyim': ['alt giyim', 'pantolon', 'etek', 'jean'],
  'Dış Giyim': ['dis giyim', 'dış giyim', 'kaban', 'ceket', 'mont', 'jacket'],
  Çanta: ['canta', 'çanta', 'bag'],
  'Takı & Aksesuar': ['taki', 'takı', 'aksesuar', 'jewelry'],
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

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private vertexAI: VertexAI | null = null;

  constructor() {
    try {
      const project = process.env.GOOGLE_CLOUD_PROJECT || 'your-project-id';
      const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
      this.vertexAI = new VertexAI({ project, location });
    } catch (error) {
      this.logger.error('Failed to initialize Vertex AI.', error);
    }
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
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

  async processMessage(message: string): Promise<ChatbotResponse> {
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

    if (this.vertexAI) {
      return this.processWithLlm(message);
    }

    return {
      message:
        'Size site içinde yönlendirme ve kargo, iade, iletişim gibi konularda yardımcı olabilirim. Örneğin: "sepetim", "kargo kaç gün", "elbise kategorisi".',
      action: 'none',
    };
  }

  private async processWithLlm(message: string): Promise<ChatbotResponse> {
    if (!this.vertexAI) {
      return {
        message: 'Asistan şu anda kullanılamıyor.',
        action: 'none',
      };
    }

    try {
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
        - Ürün arama/öneri yapma, action asla "recommend" olmasın.
        - Sayfa yönlendirmesi gerekiyorsa action "redirect" ve path ver.
        - SSS sorusuysa action "none", message ile cevap ver.

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

      if (parsed.action === 'redirect' && parsed.path) {
        return parsed;
      }

      return {
        message: parsed.message || 'Size nasıl yardımcı olabilirim?',
        action: 'none',
      };
    } catch (error) {
      this.logger.error('Vertex AI generation error:', error);
      const faq = this.answerFaq(message);
      if (faq) return { message: faq, action: 'none' };

      const redirect = this.detectRedirect(message);
      if (redirect) {
        return { message: redirect.reply, action: 'redirect', path: redirect.path };
      }

      return {
        message: 'Üzgünüm, şu an isteğinizi işleyemiyorum. Kargo, iade veya site sayfaları hakkında sorabilirsiniz.',
        action: 'none',
      };
    }
  }
}
