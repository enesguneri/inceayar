# 📋 İnceAyar — Ürün Gereksinim Dökümanı (PRD)

> **Versiyon:** 1.1.0 | **Tarih:** 2026-05-19 | **Durum:** Aktif

---

## 1. Vizyon

İnceAyar, bağımsız web paneli olarak çalışabildiği gibi; N11, Univera gibi platformların satıcı panellerine entegre edilebilir bir API servisi olarak tasarlanmıştır.

---

## 2. Hedef Kitle

| Segment | Açıklama |
|---------|----------|
| Bireysel Satıcılar | Trendyol, Hepsiburada, N11, Amazon TR satıcıları |
| KOBİ'ler | Kendi e-ticaret operasyonlarını yürüten işletmeler |
| E-ticaret Ajansları | Birden fazla satıcıya hizmet veren ajanslar |
| Platform Entegratörleri | Altyapı sağlayıcıları |

---

## 3. İşlevsel Gereksinimler

### GR-01: Kimlik Doğrulama (P0)

- Kullanıcı e-posta ve şifre ile kayıt olabilmeli
- JWT token üretilmeli, refresh token desteği
- Şifreler bcrypt ile hash'lenmeli

```
POST /api/auth/register | POST /api/auth/login | POST /api/auth/refresh | GET /api/auth/me
```

### GR-02: Ürün Veri Girişi (P0)

- Ürün adı, kategori, marka, özellikler girilebilmeli
- **[YENİ] URL ile Hızlı Ürün Ekleme:** Trendyol linki yapıştırılarak ürün özellikleri ve detayları otomatik form alanlarına çekilebilmeli
- **Not:** Hepsiburada ve diğer platform desteği yakında eklenecektir
- 1-5 arası fotoğraf yüklenebilmeli (JPEG, PNG, WebP, max 5MB)
- Yüklenen fotoğrafların ön izlemesi gösterilebilmeli

```
POST /api/products | GET /api/products | GET /api/products/:id
PUT /api/products/:id | DELETE /api/products/:id | POST /api/products/:id/images
POST /api/products/scrape-details (Linkten ürün verisi çekme)
```

### GR-03: Rakip Hedefleme (P0)

- Rakip yorumları CSV/JSON olarak veya manuel girilebilmeli
- Minimum 5 yorum zorunlu
- Rakip ürün URL'si eklenebilmeli (Trendyol desteklenmektedir, Hepsiburada yakında)
- **[YENİ]** Asıl ürünün (kullanıcının kendi ürünü) Trendyol linkinden kendi müşteri yorumları çekilerek zıtlaştırma analizine sokulabilmeli

```
POST /api/analyses/:id/competitors | GET /api/analyses/:id/competitors
```

### GR-04: Gerçek Zamanlı Süreç Takibi (P1)

- SSE ile gerçek zamanlı durum güncellemesi
- Her ajan durumu ayrı gösterilmeli (Araştırmacı → Yazılımcı → Risk Denetçi → Düzeltmen)
- İlerleme çubuğu ve hata mesajları

```
POST /api/analyses | GET /api/analyses/:id/stream
```

### GR-05: Çıktı Raporlama (P0)

**Çıktı 1 — Nihai Ürün Açıklaması:** SEO uyumlu, kopyalanabilir, markdown formatında metin.

**Çıktı 2 — İade Risk Raporu:** Fotoğraf-metin uyumsuzluk puanı (0-100), risk maddeleri ve öneriler.

```
GET /api/analyses/:id/result | GET /api/analyses/:id/report
```

### GR-06: Geçmiş İzleme (P1)

- Analizler tarih sırasına göre listeleme, pagination, arama ve filtreleme

```
GET /api/analyses | GET /api/analyses/:id | DELETE /api/analyses/:id
```

---

## 4. İşlevsel Olmayan Gereksinimler

| Alan | Hedef |
|------|-------|
| API yanıt süresi | < 200ms |
| Analiz süreci | < 90 saniye |
| FCP | < 1.5 saniye |
| Eşzamanlı kullanıcı | 100+ |
| Güvenlik | JWT, rate limiting, CORS, XSS koruması |

---

## 5. Önceliklendirme

| Gereksinim | Öncelik | Sprint |
|------------|---------|--------|
| GR-01 Kimlik Doğrulama | P0 | Sprint 1 |
| GR-02 Ürün Veri Girişi | P0 | Sprint 1 |
| GR-03 Rakip Hedefleme | P0 | Sprint 2 |
| GR-04 Gerçek Zamanlı İzleme | P1 | Sprint 3 |
| GR-05 Çıktı Raporlama | P0 | Sprint 3 |
| GR-06 Geçmiş İzleme | P1 | Sprint 4 |
