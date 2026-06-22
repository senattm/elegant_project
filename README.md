# Elegant

Türkçe moda e-ticaret platformu: React frontend, NestJS backend ve Python ML engine (kombin önerileri).

## Mimari

```
frontend (Vite :5173)  →  backend (NestJS :5000/api)  →  PostgreSQL
                              ↓
                         python-engine (FastAPI :8001)
```

- **frontend** — React 19, Mantine, Jotai
- **backend** — NestJS, Prisma, JWT auth, Vertex AI chatbot
- **python-engine** — OutfitCLIP tabanlı tamamlayıcı ürün önerisi (CIR)

## Gereksinimler

- Node.js 20+
- Python 3.10+
- PostgreSQL
- (Opsiyonel) CUDA — GPU ile daha hızlı model inference

## Kurulum

```bash
# Tüm bağımlılıklar
npm run install:all

# Python sanal ortam
cd python-engine
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
pip install -r requirements.txt
```

### Ortam değişkenleri

**backend/.env**
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/elegant_db
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
PORT=5000
PYTHON_ENGINE_URL=http://127.0.0.1:8001
```

**frontend/.env**
```env
VITE_API_URL=http://localhost:5000/api
```

**python-engine** — `DATABASE_URL` ortam değişkeni backend ile aynı olmalı.

Model checkpoint'leri `python-engine/data/checkpoints/` dizinine konulmalı (gitignore'da).

### Veritabanı

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## Çalıştırma

Üç servisi birlikte başlatmak için (proje kökünden):

```bash
npm run dev
```

Ayrı ayrı:

```bash
npm run dev:backend    # http://localhost:5000/api
npm run dev:python     # http://localhost:8001
npm run dev:frontend   # http://localhost:5173
```

Swagger: http://localhost:5000/api/docs

## Docker

```bash
docker compose up --build
```

Servisler:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Python engine: http://localhost:8001
- PostgreSQL: localhost:5432

## API — Kombin

`GET /api/complement?product_ids=1,2&k=8` — JWT gerekli.

Backend Python engine'den ID listesi alır, ürün metadata'sını Prisma ile zenginleştirir.

Health check: `GET /api/health` — Python engine durumunu da raporlar.

## Proje yapısı

```
elegant/
├── frontend/          # React SPA
├── backend/           # NestJS API + Prisma
├── python-engine/     # FastAPI ML servisi
├── shared/            # Paylaşılan ML config
└── package.json       # Monorepo dev scriptleri
```
