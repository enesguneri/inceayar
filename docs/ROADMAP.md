# 🗺️ İnceAyar — Geliştirme Yol Haritası

> **Son Güncelleme:** 2026-05-17

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

## Sprint 2: AI Altyapısı

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
- [ ] Rakip veri girişi — gerçek scraping (GR-03)

### Analiz Motoru
- [x] Analysis modeli (Mongoose)
- [x] Analiz başlatma endpoint
- [x] SSE gerçek zamanlı durum akışı (GR-04)
- [x] Sonuç raporlama endpoint'leri (GR-05)
- [ ] Hata yönetimi ve retry mekanizması

---

## Sprint 3: Frontend Temeli
- [ ] Next.js projesi oluşturma
- [ ] Tailwind CSS yapılandırma
- [ ] Layout sistemi (Header, Sidebar)
- [ ] Login / Register sayfaları
- [ ] Auth state yönetimi

---

## Sprint 4: Frontend Tamamlama

### Dashboard Sayfaları
- [ ] Ürün oluşturma / listeleme sayfası
- [ ] Yeni analiz başlatma sayfası
- [ ] Gerçek zamanlı analiz izleme UI
- [ ] Sonuç görüntüleme sayfası
- [ ] Geçmiş analizler listesi (GR-06)

### Son Düzeltmeler
- [ ] Rate limiting
- [ ] CORS yapılandırması
- [ ] Responsive tasarım
- [ ] Error handling UI
- [ ] Loading state'leri

---

## Sprint 5: Test ve Lansman

- [ ] Uçtan uca test senaryoları
- [ ] Performans optimizasyonu
- [ ] Güvenlik denetimi
- [ ] Deployment yapılandırması
- [ ] Production build ve test
