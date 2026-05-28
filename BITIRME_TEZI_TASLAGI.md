# ELEGANT: YAPAY ZEKA DESTEKLİ MODA E-TİCARET PLATFORMU

## BİTİRME TEZİ TASLAĞI

**Öğrenci:** [Ad Soyad]  
**Danışman:** [Danışman Adı]  
**Bölüm / Program:** [Bölüm]  
**Tarih:** Mayıs 2026

---

> **Not:** Bu belge yaklaşık 20 sayfalık Word formatına aktarılmak üzere hazırlanmıştır. Sayfa sayısı; yazı tipi (Times New Roman 12), satır aralığı (1,5), kenar boşlukları ve eklenen şekiller/tablolara göre değişebilir. Word’e aktarırken her bölümü ayrı sayfadan başlatmanız önerilir.

---

## ÖZET

Bu çalışmada, lüks giyim ve ayakkabı segmentine yönelik **Elegant** adlı tam yığın (full-stack) bir e-ticaret platformu geliştirilmiştir. Sistem; **React 19** ve **Vite** ile oluşturulmuş istemci uygulaması, **NestJS 11** tabanlı REST API katmanı, **PostgreSQL** veritabanı ve **Prisma ORM** ile veri yönetimi, **Python FastAPI** mikroservisi ile yapay zeka destekli ürün/kombin önerileri ve **Google Vertex AI (Gemini)** ile entegre müşteri destek sohbet botundan oluşmaktadır.

Platform; kullanıcı kaydı ve JWT kimlik doğrulama, sepet ve sipariş yönetimi, favoriler, adres ve ödeme yöntemi saklama, ürün varyantları (beden/stok), AI destekli kombin önerisi ve doğal dil ile sayfa yönlendirmesi gibi modern e-ticaret işlevlerini bir arada sunar. Tez kapsamında kullanılan teknolojiler teorik olarak açıklanmış; proje kaynak kodundan örnekler verilmiştir.

**Anahtar Kelimeler:** E-ticaret, NestJS, React, Prisma, PostgreSQL, FastAPI, scikit-learn, yapay zeka, ürün öneri sistemi, JWT

---

## İÇİNDEKİLER

1. Giriş  
2. Literatür ve Teknoloji Seçimi  
3. Sistem Mimarisi  
4. Veritabanı Tasarımı (PostgreSQL & Prisma)  
5. Backend Teknolojileri (NestJS)  
6. Frontend Teknolojileri (React & Vite)  
7. Yapay Zeka ve Öneri Motoru (Python FastAPI)  
8. Chatbot ve Vertex AI Entegrasyonu  
9. Güvenlik ve Kimlik Doğrulama  
10. Test, Dağıtım ve Sonuç  
Kaynakça  
Ekler

---

# BÖLÜM 1 — GİRİŞ

## 1.1 Problem Tanımı

Günümüzde moda e-ticaret siteleri yalnızca ürün listeleme işlevini değil; kişiselleştirilmiş öneriler, stil uyumu ve anlık müşteri desteği sunmayı da gerektirmektedir. Geleneksel “aynı kategoriden rastgele ürün” yaklaşımı, kullanıcı deneyimini yetersiz kılmakta; renk uyumu, mevsim ve stil (casual, office, party vb.) gibi bağlamsal faktörler göz ardı edilmektedir.

## 1.2 Projenin Amacı

**Elegant** projesinin amacı:

- Modern web teknolojileri ile ölçeklenebilir bir e-ticaret altyapısı kurmak,
- Ürün embedding vektörleri ile semantik benzerlik tabanlı kombin önerisi sunmak,
- Büyük dil modeli (LLM) tabanlı sohbet botu ile SSS ve sayfa yönlendirmesi sağlamak,
- Üç katmanlı mimari (client – API – AI engine) ile bakımı kolay bir sistem oluşturmaktır.

## 1.3 Kapsam

| Katman | Klasör | Teknoloji |
|--------|--------|-----------|
| İstemci | `client/` | React 19, Vite 7, Mantine UI, Jotai |
| API | `server-nest/` | NestJS 11, Prisma, PostgreSQL |
| AI Motoru | `python-engine/` | FastAPI, pandas, scikit-learn |

## 1.4 Tez Yapısı

Tezin devamında önce mimari genel bakış, ardından her teknoloji yığını ayrıntılı olarak ele alınacak; her bölümde projeden gerçek kod örnekleri sunulacaktır.

---

# BÖLÜM 2 — LİTERATÜR VE TEKNOLOJİ SEÇİMİ

## 2.1 Monolitik ve Mikroservis Yaklaşımı

Elegant, tek bir NestJS uygulaması üzerinden iş mantığını yürütürken; hesaplama yoğun öneri işlemini **ayrı bir Python mikroservisine** devretmiştir. Bu hibrit yaklaşım:

- Node.js ekosisteminin hızlı REST geliştirmesinden,
- Python’un veri bilimi kütüphanelerinden (NumPy, scikit-learn) yararlanmayı sağlar.

## 2.2 TypeScript’in Rolü

Hem frontend hem backend **TypeScript** ile yazılmıştır. Statik tip kontrolü; DTO doğrulama, API sözleşmeleri ve IDE desteği açısından hata oranını düşürür.

## 2.3 ORM Seçimi: Prisma

**Prisma**, şema tanımını `schema.prisma` dosyasında merkezileştirir; migration ve tip güvenli sorgular üretir. PostgreSQL ile doğal uyumu Elegant projesinde tercih edilmesinin temel nedenidir.

---

# BÖLÜM 3 — SİSTEM MİMARİSİ

## 3.1 Genel Mimari Diyagramı

```
┌─────────────────┐     HTTP/REST      ┌──────────────────┐
│  React Client   │ ◄────────────────► │  NestJS API      │
│  (Vite :5173)   │   Bearer JWT       │  (Port :5000)    │
└─────────────────┘                    └────────┬─────────┘
                                                │
                    ┌───────────────────────────┼───────────────────────────┐
                    │                           │                           │
                    ▼                           ▼                           ▼
            ┌───────────────┐          ┌───────────────┐          ┌─────────────────┐
            │  PostgreSQL   │          │ Vertex AI     │          │ Python Engine   │
            │  (Prisma)     │          │ (Gemini)      │          │ FastAPI :8001   │
            └───────────────┘          └───────────────┘          └─────────────────┘
```

## 3.2 İstek Akışı Örneği: Ürün Önerisi

1. Kullanıcı ürün detay sayfasını açar (`/product/:id`).
2. React, `GET /api/products/:id/recommendations` çağrısı yapar.
3. NestJS önce `http://127.0.0.1:8001/recommend` adresine istek atar.
4. Python motoru embedding + kural tabanlı skor ile ürün ID listesi döner.
5. NestJS bu ID’lerle Prisma’dan ürün detaylarını çeker ve `heroOutfit` yapısında frontend’e iletir.
6. Python servisi kapalıysa aynı kategoriden fallback öneri uygulanır.

## 3.3 Modüler Backend Yapısı

NestJS `AppModule` içinde işlevsel modüller ayrılmıştır:

- `AuthModule` — Kayıt, giriş, JWT
- `ProductsModule` — Ürün ve varyant CRUD
- `CartModule` — Sepet işlemleri
- `OrdersModule` — Sipariş ve ödeme
- `ChatbotModule` — Vertex AI sohbet
- `FavoritesModule`, `AddressesModule`, `PaymentMethodsModule`

---

# BÖLÜM 4 — VERİTABANI TASARIMI

## 4.1 PostgreSQL

**PostgreSQL**, ACID uyumlu ilişkisel veritabanı olarak sipariş, stok ve kullanıcı verilerinin tutarlılığını garanti eder. `Decimal` tipi fiyat alanlarında kayan nokta hatalarını önler.

## 4.2 Prisma Şema Örneği

Ürün ve varyant ilişkisi şemada şöyle tanımlanmıştır:

```prisma
model products {
  id               Int                @id @default(autoincrement())
  name             String             @db.VarChar(255)
  description      String?
  price            Decimal            @db.Decimal(10, 2)
  stock            Int                @default(0)
  category_id      Int?
  colors           Json?              @default("[]")
  gender           String?            @db.VarChar(10)
  season           Json?              @default("[]")
  product_variants product_variants[]
  categories       categories?        @relation(fields: [category_id], references: [id])
}

model product_variants {
  id         Int      @id @default(autoincrement())
  product_id Int
  size       String?  @db.VarChar(10)
  price      Decimal? @db.Decimal(10, 2)
  stock      Int      @default(0)
  sku        String?  @unique @db.VarChar(100)
  products   products @relation(fields: [product_id], references: [id], onDelete: Cascade)
  @@unique([product_id, size])
}
```

## 4.3 İlişkisel Model Özeti

| Tablo | Açıklama |
|-------|----------|
| `users` | Kullanıcı hesabı, bcrypt ile hash’lenmiş şifre |
| `cart_items` | Kullanıcı sepeti, varyant ve beden desteği |
| `orders` / `order_items` | Sipariş başlığı ve kalemleri |
| `outfits` / `outfit_items` | AI veya manuel kombin kayıtları |
| `favorites` | Kullanıcı–ürün çoktan çoğa (unique constraint) |

## 4.4 JSON Alanların Kullanımı

`products` tablosundaki `colors`, `season`, `tags` ve `style_attrs` alanları **Json** tipindedir. Bu sayede esnek ürün meta verisi SQL migration gerektirmeden genişletilebilir; Python öneri motoru bu alanları işlerken `ast.literal_eval` ile parse eder.

---

# BÖLÜM 5 — BACKEND: NESTJS

## 5.1 NestJS Nedir?

**NestJS**, Node.js üzerinde çalışan, Angular’dan esinlenmiş modüler bir framework’tür. Dependency Injection (DI), decorator tabanlı controller’lar ve pipe/guard/interceptor mimarisi sunar.

## 5.2 Uygulama Bootstrap

`main.ts` dosyasında CORS, global validation pipe, statik dosya servisi ve Swagger dokümantasyonu yapılandırılmıştır:

```typescript
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(process.env.PORT || 5000);
}
```

**ValidationPipe:** `class-validator` ile işaretlenmiş DTO alanlarını otomatik doğrular; tanımsız alanları `whitelist: true` ile eler.

## 5.3 DTO ve Doğrulama Örneği

```typescript
export class CreateVariantDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  productId: number;

  @IsString()
  @IsOptional()
  size?: string;

  @IsInt()
  @Min(0)
  stock: number;
}
```

## 5.4 Prisma Servisi

`PrismaService`, uygulama genelinde tek bir veritabanı bağlantısı sağlar. Servisler constructor injection ile `PrismaService` alır:

```typescript
@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.products.findMany({
      include: this.productInclude,
      orderBy: { id: 'asc' },
    });
  }
}
```

## 5.5 Sepet ve Stok Kontrolü

`CartService`, varyantlı ürünlerde stok doğrulaması yapar:

```typescript
private async validateStock(productId: number, variantId: number | null, requiredQuantity: number) {
  if (variantId) {
    const variant = await this.prisma.product_variants.findUnique({
      where: { id: variantId },
      select: { stock: true, product_id: true },
    });
    if (requiredQuantity > variant.stock) {
      throw new BadRequestException(`Stok yetersiz. Mevcut stok: ${variant.stock}`);
    }
  }
}
```

## 5.6 Sipariş İşlemleri ve Transaction

Sipariş oluşturma, ödeme simülasyonu ve veritabanı yazımları **Prisma `$transaction`** ile atomik yapılır; ilk siparişe %10 indirim gibi iş kuralları bu blok içinde uygulanır.

## 5.7 Python Mikroservis Entegrasyonu

```typescript
async getRecommendations(productId: number, limit: number = 3) {
  try {
    const response = await fetch(
      `http://127.0.0.1:8001/recommend?product_id=${productId}&limit=10`
    );
    if (response.ok) {
      const data = await response.json();
      const recIds = data.recommendations;
      // Prisma ile ürünleri çek, heroOutfit yapısına dönüştür
    }
  } catch (err) {
    // Aynı kategoriden fallback öneri
  }
}
```

Bu desen **graceful degradation** sağlar: AI servisi çökse bile kullanıcı öneri görür.

## 5.8 Swagger API Dokümantasyonu

`@nestjs/swagger` ile `/api/docs` adresinde interaktif API dokümantasyonu sunulur. Bearer JWT şeması tanımlanarak korumalı endpoint’ler test edilebilir.

---

# BÖLÜM 6 — FRONTEND: REACT & VITE

## 6.1 React 19 ve Vite 7

**React**, bileşen tabanlı UI kütüphanesidir. **Vite**, ES modülleri ve HMR (Hot Module Replacement) ile geliştirme sunucusunu hızlandırır. `import.meta.env.VITE_API_URL` ile ortam değişkenleri okunur.

## 6.2 Rota Yapısı

```tsx
<Routes>
  <Route path="/auth" element={<Auth />} />
  <Route element={<Layout />}>
    <Route path="/" element={<Home />} />
  </Route>
  <Route element={<Layout alwaysWhite />}>
    <Route path="/store" element={<Store />} />
    <Route path="/product/:id" element={<ProductDetail />} />
    <Route path="/cart" element={<Cart />} />
    <Route path="/checkout" element={<Checkout />} />
    <Route path="/wardrobe" element={<Wardrobe />} />
  </Route>
</Routes>
```

**React Router v7** ile nested layout’lar kullanılmış; navbar/footer tekrarı önlenmiştir.

## 6.3 Mantine UI

**Mantine**, erişilebilir form, bildirim ve carousel bileşenleri sağlar. `@mantine/core`, `@mantine/form`, `@mantine/notifications` paketleri projede aktiftir.

## 6.4 Durum Yönetimi: Jotai

**Jotai**, atom tabanlı hafif state yönetimidir. Sepet örneği:

```typescript
export const useCart = () => {
  const [cart, setCart] = useAtom(cartAtom);
  const [token] = useAtom(tokenAtom);

  const fetchCart = async () => {
    if (!token) return;
    const response = await cartApi.get();
    setCart(response.data.map(/* ... */));
  };

  const addToCart = async (product, quantity, variantId, size) => {
    await cartApi.add({ productId: product.id, quantity, variantId, selectedSize: size });
    await fetchCart();
  };
};
```

Redux’a kıyasla daha az boilerplate; küçük-orta ölçekli projeler için uygundur.

## 6.5 HTTP İstemcisi: Axios

Merkezi `api` instance’ı JWT interceptor ile yapılandırılmıştır:

```typescript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = JSON.parse(localStorage.getItem("token") || "null");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

## 6.6 Form Doğrulama: Zod

**Zod** şemaları ile checkout ve auth formlarında istemci tarafı doğrulama yapılır; sunucu DTO’ları ile uyumlu hata mesajları üretilir.

## 6.7 Animasyon: Framer Motion

Chatbot açılış/kapanış ve sayfa geçişlerinde `framer-motion` kullanılmıştır; `AnimatePresence` ile DOM’dan çıkan bileşenler animasyonlu kaldırılır.

## 6.8 Gardırop (Wardrobe) Özelliği

`MyWardrobe` bileşeni, kullanıcının geçmiş siparişlerinden parça seçerek kombin oluşturma deneyimi sunar; `useOrders` hook’u ile API’den veri çeker.

---

# BÖLÜM 7 — YAPAY ZEKA ÖNERİ MOTORU

## 7.1 FastAPI Mikroservisi

**FastAPI**, async destekli, otomatik OpenAPI üreten Python web framework’üdür. Servis `8001` portunda çalışır.

Bağımlılıklar (`requirements.txt`):

```
fastapi
uvicorn
pandas
numpy
```

*(Projede scikit-learn sanal ortamda kuruludur.)*

## 7.2 Veri Hazırlığı

Başlangıçta CSV ve NumPy embedding dosyası yüklenir:

```python
@app.on_event("startup")
def load_data():
    global df, embeddings, recommender
    df = pd.read_csv('data/processed_products.csv')
    df['colors_clean'] = df['colors_clean'].apply(safe_eval)
    embeddings = np.load('data/product_embeddings.npy')
    recommender = UltimateColorAndStyleStrictRecommender(df, embeddings, GROUND_TRUTH_OUTFITS)
```

**product_embeddings.npy:** Her ürün için önceden hesaplanmış çok boyutlu vektör; semantik benzerlik için temel oluşturur.

## 7.3 Kosinüs Benzerliği

```python
from sklearn.metrics.pairwise import cosine_similarity

def _get_similarity(self, seed_idx, candidate_indices):
    seed_emb = self.embeddings[seed_idx].reshape(1, -1)
    cand_embs = self.embeddings[candidate_indices]
    return cosine_similarity(seed_emb, cand_embs)[0]
```

Kosinüs benzerliği, iki vektör arasındaki açıyı ölçer; moda embedding’lerinde yön benzerliği için yaygın bir metriktir.

## 7.4 Kural Tabanlı Stil ve Renk Uyumu

Sistem yalnızca ML’e değil; **renk uyumluluk sözlüğü** ve **ground truth kombin listesine** dayanır:

```python
COLOR_MATCH_MAP = {
    'black': ['black', 'white', 'grey', 'navy', 'gold', ...],
    'navy': ['navy', 'white', 'beige', 'cream'],
    # ...
}
```

`GROUND_TRUTH_OUTFITS` listesi, stilist tarafından oluşturulmuş gerçek kombinleri içerir; co-occurrence (birlikte görülme) skoruna katkı sağlar.

## 7.5 Kombin Oluşturma Algoritması

`generate_outfit(seed_id)` fonksiyonu:

1. Tohum ürünün grubunu (elbise, pantolon, ayakkabı vb.) belirler.
2. Eksik rolleri doldurur: üst, alt, ayakkabı, çanta, dış giyim, aksesuar.
3. Mevsim ve stil etiketlerine göre adayları filtreler.
4. Renk uyumluluğu ve embedding skorunu birleştirir (`final_score`).
5. Parti/sport/formal gibi bağlamsal etiketlere bonus puan verir.

## 7.6 REST Endpoint

```python
@app.get("/recommend")
def recommend(product_id: int, limit: int = 4):
    outfit = recommender.generate_outfit(product_id)
    recommendations = [int(item['id']) for role, item in outfit.items() if role != 'seed']
    return {"product_id": product_id, "recommendations": recommendations[:limit]}
```

## 7.7 Hibrit Öneri Yaklaşımının Değerlendirmesi

| Yöntem | Avantaj | Dezavantaj |
|--------|---------|------------|
| Saf collaborative filtering | Kullanıcı davranışına dayalı | Soğuk başlangıç |
| Saf içerik tabanlı | Yeni ürünlerde çalışır | Çeşitlilik düşük |
| **Elegant hibrit** | Renk + stil + embedding + ground truth | Bakım maliyeti, iki runtime |

---

# BÖLÜM 8 — CHATBOT VE VERTEX AI

## 8.1 Google Vertex AI (Gemini)

**Vertex AI**, Google Cloud üzerinde üretken modellere erişim sağlar. Projede `gemini-2.5-flash` modeli JSON formatında yapılandırılmış yanıt üretir.

## 8.2 Chatbot Servisi

```typescript
const generativeModel = this.vertexAI.preview.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: { responseMimeType: 'application/json' },
});

const prompt = `
  Sen Elegant adlı lüks giyim mağazasının müşteri temsilcisisin.
  Yanıtı şu JSON formatında dön: { "message", "action", "path" }
  ...
`;
const response = await generativeModel.generateContent(request);
return JSON.parse(content);
```

## 8.3 Yönlendirme Aksiyonları

Model; kullanıcı niyetine göre `action: "redirect"` ve `path: "/store?category=Ayakkabı"` gibi değerler döndürür. Frontend `react-router-dom` `navigate(path)` ile yönlendirir.

## 8.4 Frontend Chatbot Bileşeni

```typescript
const response = await chatbotApi.sendMessage(userMessage.text);
const { message, action, path } = response.data;
if (action === "redirect" && path) {
  navigate(path);
}
```

## 8.5 Hata Toleransı

Vertex AI yapılandırılmamışsa kullanıcıya bilgilendirici mesaj döner; uygulama çökmez.

---

# BÖLÜM 9 — GÜVENLİK

## 9.1 JWT Kimlik Doğrulama

Kayıt/giriş sonrası sunucu JWT üretir:

```typescript
private signToken(user: Pick<UserEntity, 'id'>): string {
  return this.jwtService.sign({ sub: user.id });
}
```

**Passport JWT Strategy** her korumalı istekte token’ı doğrular:

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }
  async validate(payload: JwtPayload) {
    return this.authService.validateUser(payload.sub);
  }
}
```

## 9.2 Şifre Hashleme

**bcrypt** ile `SALT_ROUNDS = 10` kullanılarak şifreler düz metin saklanmaz:

```typescript
const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
const isValid = await bcrypt.compare(dto.password, user.password_hash);
```

## 9.3 Ödeme Bilgisi

Kart numarası veritabanında yalnızca son 4 hane (`card_last4`) saklanır; tam PAN tutulmaz (PCI-DSS uyumlu tasarım hedefi).

## 9.4 CORS ve Ortam Değişkenleri

`JWT_SECRET`, `DATABASE_URL`, `GOOGLE_CLOUD_PROJECT` gibi hassas değerler `.env` dosyasında tutulur; kaynak kontrolüne eklenmez.

---

# BÖLÜM 10 — TEST, DAĞITIM VE SONUÇ

## 10.1 Test Altyapısı

NestJS tarafında **Jest** ve **supertest** yapılandırılmıştır (`npm run test`, `npm run test:e2e`). Frontend’de ESLint ile statik analiz yapılır.

## 10.2 Çalıştırma Komutları

| Bileşen | Komut |
|---------|--------|
| Veritabanı | `npx prisma migrate dev` |
| API | `npm run start:dev` (server-nest) |
| Client | `npm run dev` (client) |
| AI Engine | `uvicorn main:app --port 8001` |

## 10.3 Elde Edilen Sonuçlar

- Tam işlevli e-ticaret akışı (kayıt → sepet → ödeme → sipariş takibi)
- AI destekli kombin önerisi ve chatbot yönlendirmesi
- Modüler, genişletilebilir kod tabanı

## 10.4 Gelecek Çalışmalar

- Docker Compose ile tek komutla tüm servislerin ayağa kaldırılması
- Öneri modelinin online öğrenme ile güncellenmesi
- Gerçek ödeme gateway entegrasyonu (iyzico, Stripe)
- Mobil uygulama (React Native)

## 10.5 Sonuç

Elegant projesi; modern web geliştirme pratikleri ile yapay zeka bileşenlerini bir araya getiren kapsamlı bir bitirme çalışması örneğidir. NestJS + Prisma + PostgreSQL üçlüsü güvenilir iş mantığı; React + Mantine hızlı ve estetik kullanıcı arayüzü; Python + scikit-learn ise domain’e özgü öneri kalitesi sağlamaktadır.

---

# KAYNAKÇA (ÖRNEK)

1. NestJS Documentation. https://docs.nestjs.com  
2. React Documentation. https://react.dev  
3. Prisma Documentation. https://www.prisma.io/docs  
4. FastAPI Documentation. https://fastapi.tiangolo.com  
5. Pedregosa, F., et al. (2011). Scikit-learn: Machine Learning in Python. *JMLR*.  
6. Google Cloud Vertex AI Documentation. https://cloud.google.com/vertex-ai/docs  
7. Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures* (REST).  
8. OWASP. Authentication Cheat Sheet. https://cheatsheetseries.owasp.org  

---

# EK A — TEKNOLOJİ SÜRÜMLERİ

| Teknoloji | Sürüm (package.json) |
|-----------|----------------------|
| React | 19.2.0 |
| Vite | 7.2.4 |
| NestJS | 11.x |
| TypeScript | 5.7+ / 5.9 |
| Prisma | 5.10.0 |
| PostgreSQL | 14+ (önerilen) |
| Mantine | 8.3.x |
| Jotai | 2.15.1 |
| Axios | 1.13.2 |
| bcrypt | 6.0.0 |
| scikit-learn | 1.8.0 (venv) |

---

# EK B — API ENDPOINT ÖZETİ

| Metot | Endpoint | Açıklama |
|-------|----------|----------|
| POST | `/api/auth/register` | Kayıt |
| POST | `/api/auth/login` | Giriş |
| GET | `/api/products` | Ürün listesi |
| GET | `/api/products/:id/recommendations` | AI öneri |
| GET/POST | `/api/cart` | Sepet |
| POST | `/api/orders` | Sipariş oluştur |
| POST | `/api/chatbot/message` | Chatbot |
| GET | `/api/docs` | Swagger UI |

---

# EK C — `.env` ÖRNEK ŞABLONU

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/elegant"
JWT_SECRET="güçlü-rastgele-anahtar"
PORT=5000
GOOGLE_CLOUD_PROJECT="proje-id"
GOOGLE_CLOUD_LOCATION="us-central1"
VITE_API_URL="http://localhost:5000/api"
```

---

**Belge sonu.** Word’e aktarırken: Kapak, onay sayfası, özet ve içindekiler için üniversite şablonunuzu ekleyin. Kod bloklarını 9–10 punto Courier ile formatlayabilirsiniz.
