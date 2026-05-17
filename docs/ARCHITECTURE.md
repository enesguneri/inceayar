# 🏗️ İnceAyar — Teknik Mimari Dökümanı

> **Versiyon:** 1.0.0 | **Tarih:** 2026-05-17

---

## 1. Sistem Genel Görünüm

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (Next.js + Tailwind)               │
│                   localhost:3000                         │
└────────────────────────┬────────────────────────────────┘
                         │ REST API + SSE
┌────────────────────────▼────────────────────────────────┐
│            Backend (Express.js + TypeScript)              │
│                   localhost:5000                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │           Langgraph Orkestrasyon Motoru             │  │
│  │                                                    │  │
│  │  ┌────────────┐    ┌────────────┐                  │  │
│  │  │ Araştırmacı │───▶│  Yazılımcı  │                 │  │
│  │  │    Ajan     │    │    Ajan    │                  │  │
│  │  └────────────┘    └─────┬──────┘                  │  │
│  │                          │                         │  │
│  │  ┌────────────┐    ┌─────▼──────┐                  │  │
│  │  │  Düzeltmen  │◀───│Risk Denetçi│                  │  │
│  │  │    Ajan     │    │    Ajan    │                  │  │
│  │  └────────────┘    └────────────┘                  │  │
│  └────────────────────────────────────────────────────┘  │
│                         │                                │
│  ┌──────────────────────▼─────────────────────────────┐  │
│  │        Gemini API + Langchain.js (RAG)              │  │
│  └─────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   MongoDB Atlas                          │
│      users │ products │ analyses │ reports               │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Teknoloji Yığını

### Frontend
| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| Next.js | 15.x | React framework (App Router) |
| Tailwind CSS | 4.x | Utility-first CSS |
| TypeScript | 5.x | Tip güvenliği |
| Zustand | 5.x | Global state yönetimi |
| Axios | 1.x | HTTP istemcisi |

### Backend
| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| Node.js | 20+ | Runtime |
| Express.js | 5.x | Web framework |
| TypeScript | 6.x | Tip güvenliği |
| Mongoose | 8.x | MongoDB ODM |
| jsonwebtoken | 9.x | JWT yönetimi |
| bcryptjs | 3.x | Şifre hash'leme |
| multer | 2.x | Dosya yükleme |
| zod | 3.x | Input validation |

### AI / ML
| Teknoloji | Versiyon | Amaç |
|-----------|----------|------|
| @langchain/google-genai | 2.x | Gemini API entegrasyonu |
| @langchain/langgraph | 1.x | Ajan orkestrasyon |
| @langchain/core | 1.x | Langchain çekirdek |

---

## 3. Veritabanı Şemaları

### User (`src/models/User.ts`)
| Alan | Tip | Açıklama |
|------|-----|----------|
| `name` | String | Kullanıcı adı |
| `email` | String (unique) | E-posta |
| `password` | String | bcrypt hash |
| `timestamps` | Date | createdAt / updatedAt |

### Product (`src/models/Product.ts`)
| Alan | Tip | Açıklama |
|------|-----|----------|
| `userId` | ObjectId (ref: User) | Sahibi |
| `name` | String | Ürün adı |
| `category` | String | Kategori |
| `brand` | String | Marka |
| `advantages` | String | Satıcının belirttiği avantajlar |
| `features` | Mixed (key-value) | Özellikler (Beden, Renk vb.) |
| `images` | String[] | Cloudinary URL'leri (max 5) |
| `timestamps` | Date | createdAt / updatedAt |

### Analysis (`src/models/Analysis.ts`)
| Alan | Tip | Açıklama |
|------|-----|----------|
| `userId` | ObjectId (ref: User) | Analizi başlatan |
| `productId` | ObjectId (ref: Product) | Analiz edilen ürün |
| `competitorReviews` | Mixed[] | Rakip yorumları |
| `status` | Enum | processing / completed / failed |
| `currentAgent` | String | Hangi ajan çalışıyor |
| `researchFindings` | Mixed | Araştırmacı çıktısı |
| `draftDescription` | String | Yazar çıktısı |
| `seoKeywords` | String[] | SEO anahtar kelimeleri |
| `riskReport` | Mixed | Risk skoru ve detaylar |
| `finalDescription` | String | Düzeltmen çıktısı |
| `revisionNotes` | String[] | Düzeltme notları |
| `error` | String | Hata mesajı (varsa) |
| `timestamps` | Date | createdAt / updatedAt |

---

## 4. Langgraph Ajan Akışı

```
          ┌─────────┐
          │  START   │
          └────┬────┘
               │
        ┌──────▼──────┐
        │ Araştırmacı  │  Rakip yorumlarını analiz et
        │    Ajan      │  Kronik sorunları tespit et
        └──────┬──────┘
               │ findings
        ┌──────▼──────┐
        │  Yazılımcı   │  Bulgulara dayalı SEO uyumlu
        │    Ajan      │  satış metni oluştur
        └──────┬──────┘
               │ draft_text
        ┌──────▼──────┐
        │ Risk Denetçi │  Metni fotoğraflarla karşılaştır
        │    Ajan      │  Multimodal Vision analizi
        └──────┬──────┘
               │ risk_report
               │
        ┌──────▼──────┐    risk > threshold?
        │  Düzeltmen   │◄──── Evet: Metni düzelt
        │    Ajan      │────► Hayır: Onayla
        └──────┬──────┘
               │
          ┌────▼────┐
          │   END    │
          └─────────┘
```

### Ajan Sorumlulukları

| Ajan | Girdi | Çıktı | Model |
|------|-------|-------|-------|
| **Araştırmacı** | Rakip yorumları | Kronik sorun listesi, pazarlama avantajları | Gemini 3.1 Flash Lite |
| **Yazılımcı** | Sorun listesi + ürün özellikleri | SEO uyumlu satış metni taslağı | Gemini 3.1 Flash Lite |
| **Risk Denetçi** | Metin taslağı + ürün fotoğrafları | Risk raporu (0-100 skor) | Gemini 3.1 Flash Lite (Multimodal) |
| **Düzeltmen** | Metin + risk raporu | Optimize edilmiş nihai metin | Gemini 3.1 Flash Lite |

---

## 5. API Tasarım İlkeleri

- RESTful standartları
- Tutarlı hata yanıt formatı: `{ success: false, error: { code, message } }`
- Başarı yanıt formatı: `{ success: true, data: {...} }`
- Pagination: `?page=1&limit=20`
- Rate limiting: 100 req/dakika (auth), 10 req/dakika (analiz)
- SSE ile gerçek zamanlı durum bildirimi (analiz süreci)

---

## 6. Güvenlik Katmanları

1. **Kimlik Doğrulama**: JWT (access + refresh token)
2. **Yetkilendirme**: Route-level middleware
3. **Input Doğrulama**: Zod schema validation
4. **Dosya Güvenliği**: MIME type kontrolü, boyut sınırı
5. **Rate Limiting**: express-rate-limit
6. **CORS**: Whitelist tabanlı origin kontrolü
7. **Helmet.js**: HTTP güvenlik başlıkları

---

## 7. Klasör Yapısı

```
inceayar/
├── frontend/                    # Next.js 15 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/          # Login, Register sayfaları
│   │   │   ├── (dashboard)/     # Ana panel sayfaları
│   │   │   │   ├── analyses/    # Analiz listeleme & detay
│   │   │   │   ├── products/    # Ürün yönetimi
│   │   │   │   └── new-analysis/# Yeni analiz başlatma
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/              # Button, Input, Card vb.
│   │   │   ├── forms/           # Form bileşenleri
│   │   │   ├── analysis/        # Analiz süreç bileşenleri
│   │   │   └── layout/          # Header, Sidebar, Footer
│   │   ├── hooks/               # useAuth, useAnalysis vb.
│   │   ├── lib/                 # API client, utils
│   │   ├── services/            # API servis fonksiyonları
│   │   ├── store/               # Zustand store'ları
│   │   └── types/               # TypeScript tipleri
│   ├── public/
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   └── package.json
│
├── src/                         # Backend (Express)
│   ├── ai/
│   │   ├── agents/
│   │   │   ├── researcher.ts    # Araştırmacı ajan
│   │   │   ├── writer.ts        # Yazılımcı ajan
│   │   │   ├── auditor.ts       # Risk denetçi ajan (Multimodal)
│   │   │   └── editor.ts        # Düzeltmen ajan
│   │   ├── state.ts             # Langgraph state tanımı
│   │   └── graph.ts             # Langgraph ana akış grafiği
│   ├── config/
│   │   ├── database.ts          # MongoDB bağlantısı
│   │   ├── gemini.ts            # Gemini 3.1 Flash Lite yapılandırma
│   │   ├── cloudinary.ts        # Cloudinary CDN yapılandırma
│   │   └── env.ts               # Ortam değişkenleri
│   ├── middleware/
│   │   ├── auth.ts              # JWT doğrulama
│   │   ├── validate.ts          # Zod validation
│   │   ├── upload.ts            # Multer dosya yükleme
│   │   └── rateLimiter.ts       # Rate limiting
│   ├── models/
│   │   ├── User.ts              # User Mongoose modeli
│   │   ├── Product.ts           # Product Mongoose modeli
│   │   └── Analysis.ts          # Analysis Mongoose modeli
│   ├── routes/
│   │   ├── auth.ts              # /api/auth/*
│   │   ├── products.ts          # /api/products/*
│   │   └── analyses.ts          # /api/analyses/*
│   ├── services/
│   │   ├── authService.ts       # Auth iş mantığı
│   │   ├── productService.ts    # Product iş mantığı
│   │   └── analysisService.ts   # Analysis iş mantığı
│   ├── utils/
│   │   ├── errors.ts            # Custom error sınıfları
│   │   ├── response.ts          # Standart yanıt yardımcıları
│   │   └── logger.ts            # Loglama
│   └── index.ts                 # Express app giriş noktası
│
├── docs/                        # Dokümantasyon
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 8. Deployment Mimarisi

```
                    ┌────────────────┐
                    │   Kullanıcı    │
                    └───────┬────────┘
                            │
              ┌─────────────┼─────────────┐
              │                           │
    ┌─────────▼─────────┐     ┌───────────▼──────────┐
    │   Vercel (Free)    │     │   Render (Free)       │
    │   Frontend         │────▶│   Backend             │
    │   Next.js          │     │   Express.js          │
    │   inceayar.vercel  │     │   inceayar.onrender   │
    └────────────────────┘     └──────┬──────┬─────────┘
                                     │      │
                          ┌──────────▼┐  ┌──▼───────────┐
                          │ MongoDB   │  │ Cloudinary    │
                          │ Atlas     │  │ (Free)        │
                          │ (Free)    │  │ Görsel CDN    │
                          │ 512MB     │  │ 25GB          │
                          └───────────┘  └──────────────┘
```

### Platform Detayları

| Platform | Katman | Ücretsiz Limit | URL Formatı |
|----------|--------|----------------|-------------|
| **Vercel** | Frontend | Sınırsız deploy, 100GB bw/ay | `inceayar.vercel.app` |
| **Render** | Backend | 750 saat/ay, auto-sleep | `inceayar.onrender.com` |
| **MongoDB Atlas** | Veritabanı | 512MB, M0 Shared | Atlas connection string |
| **Cloudinary** | Görsel CDN | 25GB storage, 25GB bw/ay | `res.cloudinary.com/...` |

### Render Cold Start Çözümü

Render ücretsiz planda 15dk inaktivite sonrası uyku moduna geçer. Çözüm:
- **cron-job.org** ile her 14 dakikada backend'e health check (`GET /api/health`)
- Bu sayede backend her zaman aktif kalır
