import { Injectable, Logger } from '@nestjs/common';
import { VertexAI } from '@google-cloud/vertexai';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private vertexAI: VertexAI | null = null;

  constructor() {
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

  async processMessage(message: string): Promise<{ message: string; action?: string; path?: string }> {
    if (!this.vertexAI) {
      return {
        message: 'Sistem şu anda asistan hizmeti veremiyor (Vertex AI yapılandırılmamış).',
        action: 'none',
      };
    }

    try {
      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
        Sen Elegant adlı lüks giyim ve ayakkabı mağazasının profesyonel, yardımsever ve kibar müşteri temsilcisisin.
        Kullanıcının mesajını analiz et ve kesinlikle AŞAĞIDAKİ JSON FORMATINDA yanıt dön. Başka hiçbir metin yazma.
        
        KULLANICI SORULARINA (SSS) VERİLECEK ÖRNEK CEVAPLAR:
        - Kargo / Teslimat: "Siparişleriniz genellikle 1-3 iş günü içerisinde özenle hazırlanıp kargoya teslim edilmektedir."
        - İade Şartları: "Satın aldığınız ürünleri, kullanılmamış ve etiketleri sökülmemiş olması şartıyla 30 gün içinde ücretsiz olarak iade edebilirsiniz."
        - İletişim: "Bize destek@elegant.com e-posta adresinden veya 0850 123 45 67 numaralı çağrı merkezimizden 7/24 ulaşabilirsiniz."

        SAYFA YÖNLENDİRME (ACTION: REDIRECT) KURALLARI:
        - Kullanıcı bir ürün veya kategori görmek istiyorsa onu "/store?category=KategoriAdı" sayfasına yönlendir.
        - ÇOK ÖNEMLİ: "KategoriAdı" parametresine SADECE şu tam değerlerden birini yazmalısın (Birebir eşleşmeli, tekil veya çoğul uydurma):
          "Elbise", "Kaban ve Ceket", "Ayakkabı", "Gömlek", "Kazak ve Hırka", "Pantolon", "Etek", "Top"
        - Örneğin "bana ayakkabıları aç" derse "/store?category=Ayakkabı" yolunu kullan. (Ayakkabılar DEĞİL)
        - "Etekleri göster" derse "/store?category=Etek"
        - Eğer kullanıcının sorduğu kategori (Örn: şort, mayo) listemizde yoksa, onu sadece "/store" adresine yönlendir ve "Şu an stoklarımızda bulunmuyor ancak diğer ürünlerimize göz atabilirsiniz." mesajı ver.
        - Tüm mağazayı görmek istiyorsa direkt "/store"
        - Adres eklemek, şifre değiştirmek, kredi kartı eklemek, profil güncellemek istiyorsa "/profile" sayfasına yönlendir.
        - Siparişlerini görmek istiyorsa "/orders"
        - Sepetine gitmek istiyorsa "/cart"
        - Favorilerine gitmek istiyorsa "/favorites"
        - Gardırobuna gitmek istiyorsa "/wardrobe"
        
        Eğer kullanıcı sadece selam veriyor, FAQ soruyor veya sohbet ediyorsa "action": "none" yap ve kibarca cevap ver.
        Yönlendirme (redirect) yapsan bile her zaman kullanıcıya "Sizi hemen ilgili sayfaya yönlendiriyorum." tarzı profesyonel bir "message" yaz.

        Dönüş formatı (SADECE JSON ve markdown tagleri olmadan, direkt JSON objesi olarak dön):
        {
          "message": "Kullanıcıya gösterilecek profesyonel Türkçe yanıt mesajı",
          "action": "redirect" | "none",
          "path": "/yonlendirilecek/yol"
        }

        Kullanıcı mesajı: "${message}"
      `;

      const request = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      };

      const response = await generativeModel.generateContent(request);
      let content = response.response.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!content) {
        throw new Error('Vertex AI boş bir yanıt döndürdü.');
      }

      if (content.startsWith('\`\`\`json')) {
        content = content.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
      } else if (content.startsWith('\`\`\`')) {
        content = content.replace(/\`\`\`/g, '').trim();
      }
      
      return JSON.parse(content);
    } catch (error) {
      this.logger.error('Vertex AI generation error:', error);
      return {
        message: 'Üzgünüm, şu an isteğinizi işleyemiyorum.',
        action: 'none',
      };
    }
  }
}
