# ELEGĀNT — Bitirme Projesi AI Modülü Dokümantasyonu

## Proje Özeti

**ELEGĀNT**, lüks moda e-ticaret platformuna entegre edilmiş hibrit bir yapay zeka sistemidir. Sistem üç ana bileşenden oluşur:

1. **Kural + Embedding Kombin Öneri Motoru** — Gardırop özelliği
2. **Kullanıcı Geri Bildirimi** — Kombin beğeni/beğenmeme döngüsü
3. **RAG Destekli LLM Chatbot** — Gemini 2.5 Flash + katalog bağlamı

---

## Mimari

```
┌─────────────────────────────────────────────────────────────┐
│  React Frontend (Gardırop, Chatbot)                         │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼──────────────────────────────────┐
│  NestJS Backend                                              │
│  ├── OutfitRecommender (kural + embedding)                   │
│  ├── OutfitsService (kaydet + feedback)                      │
│  └── ChatbotService (Vertex AI + RAG)                        │
└──────────────┬─────────────────────────────┬────────────────┘
               │ PostgreSQL                    │ Opsiyonel
               ▼                               ▼
        outfits, outfit_items          python-engine :8001
```

---

## ML / AI Metodolojisi

### 1. Kombin Öneri Algoritması

**Girdi:** Seed ürün (kullanıcının gardırobundaki parça)

**Adımlar:**
1. Ürün grubu tespiti (tag + isim analizi)
2. Eksik roller belirlenir (upper, lower, shoes, bag, outerwear, accessory)
3. Ground truth co-occurrence hafızası kontrol edilir (10 el yapımı referans kombin)
4. Renk uyumluluk filtresi (`COLOR_MATCH_MAP`)
5. Sezon ve stil filtresi (party, sport, formal, casual...)
6. Aday skorlama:
   - `score = cosine_sim(seed, candidate) + style_bonus + color_score`
7. Her rol için top-1 + top-N alternatif seçilir
8. **Cohesion score** hesaplanır (0–100)

**Cohesion Score Formülü:**
```
cohesion = 0.35 × embedding_similarity
         + 0.35 × color_harmony
         + 0.20 × style_consistency
         + 0.10 × ground_truth_match_bonus
```

### 2. Chatbot RAG

- Kullanıcı mesajından anahtar kelime çıkarımı
- PostgreSQL ürün kataloğunda keyword eşleştirme
- En alakalı 6 ürün prompt'a enjekte edilir
- Gemini 2.5 Flash JSON formatında yanıt üretir

### 3. Değerlendirme (Evaluation)

- **Ground truth set:** 10 referans kombin (`GROUND_TRUTH_OUTFITS`)
- **Hit rate:** Beklenen parçaların kaçının önerildiği
- **Cohesion:** Önerilen kombinin iç tutarlılığı
- **Python script:** `python-engine/evaluate.py` (offline değerlendirme)

---

## API Endpoints

| Endpoint | Açıklama |
|----------|----------|
| `GET /api/products/:id/recommendations` | AI kombin önerisi (alternatifler + skor + outfitId) |
| `GET /api/outfits/my` | Kullanıcının kaydedilmiş kombinleri |
| `POST /api/outfits/:id/feedback` | Beğen/beğenme geri bildirimi |
| `POST /api/chatbot/message` | RAG destekli chatbot |

---

## Veritabanı (AI Tabloları)

### outfits
- `user_id`, `seed_product_id`, `cohesion_score`, `source`
- `feedback` (1 = beğeni, -1 = beğenmeme)
- Her öneri otomatik kaydedilir

### outfit_items
- `outfit_id`, `product_id`, `role`, `sort_order`

---

## Çalıştırma

```bash
# 1. PostgreSQL + migration
cd server-nest
npx prisma migrate deploy
npm run start:dev

# 2. Frontend
cd client
npm run dev

# 3. Opsiyonel Python motor (neural embedding)
cd python-engine
pip install -r requirements.txt
uvicorn main:app --port 8001

# 4. Offline pipeline
python evaluate.py             # Değerlendirme raporu
```

---

## Bitirme Projesi Sunumu İçin Öneriler

### Tez bölümleri
1. **Giriş** — Moda e-ticaretinde kişiselleştirme problemi
2. **Literatür** — Content-based vs collaborative filtering, outfit recommendation
3. **Yöntem** — Hibrit mimari, skorlama formülü, RAG
4. **Uygulama** — Sistem mimarisi, ekran görüntüleri
5. **Değerlendirme** — Hit rate, cohesion, kullanıcı memnuniyeti
6. **Sonuç** — Gelecek çalışmalar (FashionCLIP, fine-tuning)

### Demo akışı
1. Gardırop → parça seç → KOMBİNLE
2. Uyum skoru + alternatif parçalar göster
3. Beğeni geri bildirimi ver
4. Chatbot'a "siyah elbise var mı?" sor

### Metrikler (sunumda kullanılabilir)
- Katalog boyutu
- Ground truth hit rate
- Ortalama cohesion score
- Kullanıcı memnuniyet oranı

---

## Gelecek Geliştirmeler

- FashionCLIP ile görsel embedding
- Kullanıcı feedback verisiyle ranking modeli eğitimi
- A/B test (TS motor vs Python motor)
- Gerçek zamanlı embedding yenileme webhook'u
