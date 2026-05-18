# ⚙️ İnceAyar

> E-ticaret satıcıları için Gemini destekli, çoklu ajan tabanlı ürün metni optimizasyon ve iade riski analiz platformu.

---

## 📋 İçindekiler

- [Proje Özeti](#-proje-özeti)
- [Çözülen Problem](#-çözülen-problem)
- [Çözüm Stratejisi](#️-çözüm-stratejisi)
- [Teknik Mimari](#-teknik-mimari)
- [Kurulum](#-kurulum)
- [Ortam Değişkenleri](#-ortam-değişkenleri)
- [Kullanım](#-kullanım)
- [API Dokümantasyonu](#-api-dokümantasyonu)
- [Proje Yapısı](#-proje-yapısı)
- [Katkıda Bulunma](#-katkıda-bulunma)

---

## 🎯 Proje Özeti

**İnceAyar**, e-ticaret satıcıları için geliştirilmiş, gücünü **Gemini API** ve çoklu yapay zeka ajanlarından (**Langgraph**) alan uçtan uca bir **B2B SaaS** platformudur.

Sistem iki temel işlevi yerine getirir:

1. **Rakip analizi ile metin üretimi**: Rakip ürünlerin müşteri yorumlarını RAG (Retrieval-Augmented Generation) mantığıyla analiz ederek satıcıya rekabetçi bir ürün metni yazar.
2. **Görsel-metin uyum denetimi**: Satıcının yüklediği ürün fotoğraflarını görsel olarak inceleyip yazılan metinle karşılaştırarak, "olası iade risklerini" önceden tespit eder ve metne ince ayar çeker.

---

## 🔍 Çözülen Problem

E-ticaret ekosisteminde satıcıların en büyük iki problemi:

| Problem | Açıklama | Maliyet |
|---------|----------|---------|
| **Düşük Dönüşüm Oranı** | Ürün metinlerinin sıradan olması ve rakiplerin zafiyetlerini avantaja çevirememesi | Kaybedilen satışlar |
| **Yüksek İade Maliyetleri** | Metin ile fotoğraf/ürün arasındaki uyumsuzluktan kaynaklanan iadeler | Milyarlarca TL lojistik zararı |

---

## ⚔️ Çözüm Stratejisi: "Kılıç ve Kalkan"

### 🗡️ Hücum (Kılıç)
- Rakibin negatif yorumlarını toplayıp kronik sorunlarını bulur
- Bu sorunları çözdüğünü vurgulayan, agresif ve SEO uyumlu satış metni oluşturur

### 🛡️ Savunma (Kalkan)
- Oluşturulan metni, satıcının yüklediği fotoğraflarla **Multimodal Vision Analizi** ile karşılaştırır
- Beklentiyi çok yükselten ifadeleri tespit eder
- İade oranını düşürmek için satıcıyı uyararak metni optimize eder

---

## 🏗️ Teknik Mimari

```
┌──────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│                     Tailwind CSS + SaaS Panel                    │
└──────────────────────┬───────────────────────────────────────────┘
                       │ REST API / SSE
┌──────────────────────▼───────────────────────────────────────────┐
│                    Backend (Node.js + Express)                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Langgraph Orkestrasyon                     │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │ │
│  │  │Araştırmacı│ │ Yazılımcı│ │Risk Denet│ │Düzeltmen │       │ │
│  │  │  Ajanı   │ │  Ajanı   │ │  Ajanı   │ │  Ajanı   │       │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │ │
│  └───────┼─────────────┼───────────┼─────────────┼─────────────┘ │
│          │             │           │             │                │
│  ┌───────▼─────────────▼───────────▼─────────────▼─────────────┐ │
│  │              Gemini API (Multimodal)                         │ │
│  │           Langchain.js (RAG + Prompts)                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────────┐
│                      MongoDB Atlas                               │
│         Kullanıcılar • Analizler • Raporlar                      │
└──────────────────────────────────────────────────────────────────┘
```

### Teknoloji Yığını

| Katman | Teknoloji | Amaç |
|--------|-----------|------|
| **Frontend** | Next.js, Tailwind CSS | Modern SaaS paneli |
| **Backend** | Node.js, Express.js, TypeScript | API sunucusu ve iş mantığı |
| **Veritabanı** | MongoDB Atlas | Esnek JSON belge depolama |
| **AI Motor** | Gemini API (Multimodal) | Metin ve görsel işleme |
| **AI Araçları** | Langchain.js | Veri çekme, prompt şablonlama |
| **AI Orkestrasyon** | Langgraph | Stateful ajan yönetimi |
| **Scraper** | Puppeteer + Stealth Plugin | Ürün yorumu & detay kazıma |
| **Kimlik Doğrulama** | JWT | Güvenli oturum yönetimi |

### Desteklenen Platformlar

| Platform | Yorum Çekme | Ürün Detay Çekme | Durum |
|----------|-------------|-------------------|-------|
| **Trendyol** | ✅ Aktif | ✅ Aktif | Tam destek |
| **Hepsiburada** | ⏳ Yakında | ⏳ Yakında | Geliştirme aşamasında |
| **Amazon TR** | 📅 Planlanan | 📅 Planlanan | Yol haritasında |
| **N11** | 📅 Planlanan | 📅 Planlanan | Yol haritasında |

---

## 🚀 Kurulum

### Gereksinimler

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **MongoDB Atlas** hesabı
- **Google Gemini API** anahtarı

### Adımlar

```bash
# 1. Repoyu klonlayın
git clone https://github.com/enesguneri/inceayar.git
cd inceayar

# 2. Backend bağımlılıklarını kurun
npm install

# 3. Frontend bağımlılıklarını kurun (frontend klasörü oluşturulduktan sonra)
cd frontend
npm install
cd ..

# 4. Ortam değişkenlerini ayarlayın
cp .env.example .env
# .env dosyasını düzenleyin

# 5. Backend'i başlatın
npm run dev

# 6. Frontend'i başlatın (ayrı terminal)
cd frontend
npm run dev
```

---

## 🔐 Ortam Değişkenleri

Proje kök dizininde bir `.env` dosyası oluşturun:

```env
# Sunucu
PORT=5000
NODE_ENV=development

# Veritabanı
MONGODB_URI=mongodb+srv://<kullanici>:<sifre>@cluster.mongodb.net/inceayar

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

---

## 💡 Kullanım

1. **Kayıt / Giriş**: Sisteme JWT altyapısı ile kayıt olun
2. **Ürün Bilgisi Girin**: Kendi ürününüzün temel özelliklerini ve en az 1 fotoğrafını yükleyin
3. **Rakip Verisi Ekleyin**: Rakip ürünlerin negatif yorum veri setini sisteme besleyin
4. **Analiz Başlatın**: "Analiz Et" butonuna basın ve ajanların çalışmasını gerçek zamanlı izleyin
5. **Sonuçları Alın**: Optimize edilmiş ürün açıklaması + İade Risk Raporu'nu görüntüleyin

---

## 📡 API Dokümantasyonu

Detaylı API dokümantasyonu için [docs/API.md](docs/API.md) dosyasına bakın.

---

## 📁 Proje Yapısı

```
inceayar/
├── frontend/                 # Next.js frontend uygulaması
│   ├── src/
│   │   ├── app/              # App Router sayfaları
│   │   ├── components/       # React bileşenleri
│   │   ├── hooks/            # Custom React hook'ları
│   │   ├── lib/              # Yardımcı fonksiyonlar
│   │   ├── services/         # API servis katmanı
│   │   └── types/            # TypeScript tipleri
│   └── public/               # Statik dosyalar
├── src/                      # Backend kaynak kodu
│   ├── ai/                   # AI modülleri
│   │   ├── agents/           # Langgraph ajanları
│   │   ├── chains/           # Langchain zincirleri
│   │   ├── prompts/          # Prompt şablonları
│   │   └── graph.ts          # Langgraph ana akış
│   ├── routes/               # Express route'ları
│   ├── middleware/            # Express middleware'leri
│   ├── models/               # MongoDB modelleri
│   ├── services/             # İş mantığı servisleri
│   ├── utils/                # Yardımcı fonksiyonlar
│   ├── config/               # Yapılandırma dosyaları
│   └── index.ts              # Uygulama giriş noktası
├── docs/                     # Proje dokümantasyonu
├── .env                      # Ortam değişkenleri (git'e eklenmez)
├── .env.example              # Örnek ortam değişkenleri
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/ozellik-adi`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: yeni özellik'`)
4. Branch'e push edin (`git push origin feature/ozellik-adi`)
5. Pull Request açın

### Commit Mesajı Kuralları

```
feat:     Yeni özellik
fix:      Hata düzeltmesi
docs:     Dokümantasyon
refactor: Kod yeniden yapılandırma
test:     Test ekleme/düzeltme
chore:    Bakım işleri
```

---

