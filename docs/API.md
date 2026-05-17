# 📡 İnceAyar — API Dökümanı

> **Base URL:** `http://localhost:5000/api`  
> **Format:** JSON  
> **Auth:** Bearer Token (JWT)

---

## Genel Yanıt Formatı

### Başarılı Yanıt
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Hata Yanıtı
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email alanı zorunludur",
    "details": [...]
  }
}
```

---

## 1. Auth Endpoints

### `POST /auth/register`

Yeni kullanıcı kaydı oluşturur.

**Request Body:**
```json
{
  "name": "Ahmet Yılmaz",
  "email": "ahmet@example.com",
  "password": "güçlü_şifre_123",
  "company": "AY Ticaret" // opsiyonel
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Ahmet Yılmaz", "email": "ahmet@example.com" },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

---

### `POST /auth/login`

Kullanıcı girişi yapar.

**Request Body:**
```json
{
  "email": "ahmet@example.com",
  "password": "güçlü_şifre_123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Ahmet Yılmaz", "email": "ahmet@example.com" },
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

---

### `POST /auth/refresh`

Token yenileme.

**Request Body:**
```json
{ "refreshToken": "eyJhbGciOi..." }
```

---

### `GET /auth/me`

🔒 **Auth Required**

Oturumdaki kullanıcı bilgisini getirir.

---

## 2. Products Endpoints

Tüm product endpoint'leri 🔒 **Auth Required**

### `POST /products`

Yeni ürün oluşturur.

**Request Body (multipart/form-data):**
```
name: "Premium Pamuklu T-Shirt"
category: "Giyim"
brand: "AY Collection"
features: '{"color":"Beyaz","material":"%100 Pamuk","size":"M-L-XL"}'
advantages: "Organik pamuk, anti-bakteriyel, çekmez kumaş"
images: [File, File, ...]  (1-5 adet, max 5MB)
```

### `GET /products`
Kullanıcının ürünlerini listeler. `?page=1&limit=20`

### `GET /products/:id`
Tekil ürün detayı.

### `PUT /products/:id`
Ürün güncelleme.

### `DELETE /products/:id`
Ürün silme.

---

## 3. Analyses Endpoints

Tüm analysis endpoint'leri 🔒 **Auth Required**

### `POST /analyses`

Yeni analiz başlatır.

**Request Body:**
```json
{
  "productId": "product_object_id",
  "competitorReviews": [
    { "text": "Kumaş çok ince, hemen yırtıldı", "rating": 1 },
    { "text": "Renk soldu ilk yıkamada", "rating": 2 },
    { "text": "Beden tablosu yanlış, 2 beden büyük geldi", "rating": 1 },
    { "text": "Paketleme çok kötüydü, ürün buruşuk geldi", "rating": 2 },
    { "text": "Fotoğraftaki renkle alakası yok", "rating": 1 }
  ]
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "analysisId": "analysis_object_id",
    "status": "processing",
    "streamUrl": "/api/analyses/analysis_object_id/stream"
  }
}
```

### `GET /analyses/:id/stream`

SSE (Server-Sent Events) ile gerçek zamanlı durum akışı.

**Event Format:**
```
event: agent_update
data: {"agent":"researcher","status":"running","message":"Rakip yorumları analiz ediliyor...","progress":25}

event: agent_update
data: {"agent":"researcher","status":"completed","message":"5 kronik sorun tespit edildi","progress":25}

event: agent_update
data: {"agent":"writer","status":"running","message":"Satış metni oluşturuluyor...","progress":50}

event: analysis_complete
data: {"analysisId":"...","status":"completed"}
```

### `GET /analyses`
Kullanıcının analizlerini listeler. `?page=1&limit=20&status=completed`

### `GET /analyses/:id`
Tekil analiz detayı (sonuçlar dahil).

### `GET /analyses/:id/result`
Optimize edilmiş ürün açıklamasını getirir.

### `GET /analyses/:id/report`
İade risk raporunu getirir.

### `DELETE /analyses/:id`
Analizi siler.

---

## 4. Hata Kodları

| Kod | HTTP Status | Açıklama |
|-----|-------------|----------|
| AUTH_REQUIRED | 401 | Token gerekli |
| AUTH_INVALID | 401 | Geçersiz token |
| AUTH_EXPIRED | 401 | Süresi dolmuş token |
| FORBIDDEN | 403 | Yetkisiz erişim |
| NOT_FOUND | 404 | Kaynak bulunamadı |
| VALIDATION_ERROR | 422 | Geçersiz input |
| RATE_LIMITED | 429 | İstek limiti aşıldı |
| AI_ERROR | 500 | AI servisi hatası |
| SERVER_ERROR | 500 | Sunucu hatası |
