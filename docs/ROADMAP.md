# 🗺️ İnceAyar — Geliştirme Yol Haritası

> **Son Güncelleme:** 2026-05-19

---

## Sprint 1: Temel Altyapı

### Backend Temeli
- [x] Express.js sunucu kurulumu (`src/index.ts`)
- [x] MongoDB Atlas bağlantısı (`src/config/database.ts`)
- [x] Ortam değişkenleri yönetimi (`src/config/env.ts`)
- [x] Hata yönetimi middleware
- [x] Logger yapılandırması
- [x] Standart yanıt yardımcıları

### Kimlik Doğrulama (GR-01)
- [x] User modeli (Mongoose)
- [x] Register endpoint
- [x] Login endpoint
- [x] JWT middleware (access + refresh token)
- [x] Auth route'ları

### Ürün Yönetimi (GR-02)
- [x] Product modeli (Mongoose)
- [x] CRUD endpoint'leri
- [x] Multer ile fotoğraf yükleme
- [x] Input validation (Zod)

---

## Sprint 2: AI Altyapısı,

### Gemini API Entegrasyonu
- [x] Gemini client yapılandırması (`gemini-3.1-flash-lite`)
- [x] Langchain.js entegrasyonu
- [x] Prompt şablonları oluşturma (ajan içi inline)

### Langgraph Ajan Sistemi
- [x] State tanımı (`src/ai/state.ts`)
- [x] Araştırmacı ajan (`src/ai/agents/researcher.ts`)
- [x] Yazılımcı ajan (`src/ai/agents/writer.ts`)
- [x] Risk Denetçi ajan — Multimodal Vision (`src/ai/agents/auditor.ts`)
- [x] Düzeltmen ajan (`src/ai/agents/editor.ts`)
- [x] Ana akış grafiği (`src/ai/graph.ts`)
- [x] Rakip veri girişi — API endpoint (GR-03)

### Analiz Motoru
- [x] Analysis modeli (Mongoose)
- [x] Analiz başlatma endpoint
- [x] SSE gerçek zamanlı durum akışı (GR-04)
- [x] Sonuç raporlama endpoint'leri (GR-05)
- [x] Hata yönetimi ve retry mekanizması

### Platform Desteği (Scraper)
- [x] Trendyol yorum çekme (Puppeteer + Stealth)
- [x] Trendyol ürün detay çekme (`window.__envoy__SHARED_PROPS`)
- [x] Trendyol link ile ürün ekleme (Süper Mod)
- [ ] Hepsiburada yorum çekme (☕ Yakında — Anti-bot koruması araştırılıyor)
- [ ] Hepsiburada ürün detay çekme (☕ Yakında)
- [ ] Amazon TR desteği (📅 Planlanan)
- [ ] N11 desteği (📅 Planlanan)

---

## Sprint 3: Frontend Temeli
- [x] Next.js projesi oluşturma
- [x] Tailwind CSS yapılandırma
- [x] Layout sistemi (Header, Sidebar)
- [x] Login / Register sayfaları
- [x] Auth state yönetimi (Zustand + hydration düzeltmesi)

---

## Sprint 4: Frontend Tamamlama

### Dashboard Sayfaları
- [x] Ürün oluşturma / listeleme sayfası
- [x] Yeni analiz başlatma sayfası
- [x] Gerçek zamanlı analiz izleme UI
- [x] Sonuç görüntüleme sayfası
- [x] Geçmiş analizler listesi (GR-06)

### Son Düzeltmeler
- [x] Rate limiting / Error handling UI
- [x] CORS yapılandırması
- [x] Responsive tasarım
- [x] Error handling UI ve Toast bildirimleri
- [x] Loading state'leri

---

## Sprint 5: Test ve Lansman

- [ ] Uçtan uca test senaryoları
- [ ] Performans optimizasyonu
- [ ] Güvenlik denetimi
- [ ] Deployment yapılandırması
- [x] Production build ve test (Frontend & Backend local testler)
