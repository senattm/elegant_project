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
      // gemini-2.5-flash kullanıyoruz.
      const generativeModel = this.vertexAI.preview.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
        Sen Elegant adlı lüks giyim ve ayakkabı mağazasının asistanısın.
        Kullanıcının mesajını analiz et ve JSON formatında yanıt dön.
        
        Kullanıcı siparişlerini soruyorsa "/orders" sayfasına yönlendir.
        Kullanıcı ayakkabı, elbise vb. bir ürün kategorisi görmek istiyorsa "/store" sayfasına yönlendir veya ilgili kategori filtresini ekle (örn: ayakkabı için "/store?category=ayakkabi").
        Kullanıcı sepetine gitmek istiyorsa "/cart", favorilerine gitmek istiyorsa "/favorites", gardırobuna gitmek istiyorsa "/wardrobe" sayfasına yönlendir.
        Genel bir soruysa kibarca yanıtla ve "action": "none" yap.

        Dönüş formatı (sadece JSON ve markdown kullanmadan, direkt JSON objesi):
        {
          "message": "Kullanıcıya gösterilecek Türkçe yanıt mesajı",
          "action": "redirect" | "none",
          "path": "/yonlendirilecek/yol" // action redirect ise
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
