# İnceAyar Canlıya Geçiş (Deployment) Kılavuzu

Bu kılavuz, İnceAyar uygulamasının backend (Node.js/Express/TypeScript + Puppeteer) ve frontend (Next.js) katmanlarının canlı ortama (production) nasıl taşınacağını adım adım açıklar.

---

## 1. Hazırlık & Gereksinimler

Canlıya geçiş öncesinde aşağıdaki platformlarda hesapların ve API anahtarlarının hazır olması gerekir:

1.  **MongoDB Atlas**: Canlı veritabanı için ücretsiz veya ücretli bir M0/M10 cluster.
2.  **Google AI Studio (Gemini API)**: AI ajanlarının çalışabilmesi için geçerli bir API anahtarı (`GEMINI_API_KEY`).
3.  **Cloudinary**: Ürün fotoğraflarının saklanması için bulut medya hesabı (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
4.  **Apify**: Hepsiburada/Trendyol için yedek kazıma altyapısı olarak kullanılan API token (`APIFY_API_TOKEN`).

---

## 2. Backend Dağıtımı (Render - Docker ile)

Puppeteer/Chrome bağımlılıkları nedeniyle backend katmanının **Docker** kullanılarak dağıtılması en kararlı ve sorunsuz yöntemdir. Render, Docker tabanlı Web Servislerini destekler.

### Adım 1: GitHub Deposunu Bağlama
1.  [Render Dashboard](https://dashboard.render.com/) sayfasına gidin.
2.  **New +** butonuna tıklayıp **Web Service** seçeneğini seçin.
3.  İnceAyar projesinin bulunduğu GitHub deposunu bağlayın.

### Adım 2: Web Servis Ayarları
*   **Name**: `inceayar-backend`
*   **Region**: Size/kullanıcılarınıza en yakın bölge (örn. `Frankfurt (EU)`)
*   **Branch**: `main` (veya canlıya çıkmak istediğiniz branch)
*   **Runtime**: `Docker` (Önemli: Puppeteer için Docker seçilmelidir)
*   **Plan**: `Free` veya `Starter` (Puppeteer bellek tükettiği için `Starter` önerilir)

### Adım 3: Ortam Değişkenleri (Environment Variables)
**Advanced** sekmesine gidin ve aşağıdaki ortam değişkenlerini (Environment Variables) ekleyin:

| Değişken Adı | Değer / Açıklama |
| :--- | :--- |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | `mongodb+srv://...` (MongoDB Atlas canlı bağlantı adresi) |
| `JWT_SECRET` | Güçlü ve benzersiz bir anahtar (en az 32 karakter) |
| `JWT_EXPIRES_IN` | `7d` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `GEMINI_API_KEY` | Google Gemini API Anahtarınız |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret |
| `FRONTEND_URL` | Frontend uygulamasının canlı URL'i (örn. `https://inceayar.vercel.app`) |
| `APIFY_API_TOKEN` | Apify API Token |

### Adım 4: Canlıya Alma
**Create Web Service** butonuna tıklayın. Render, depodaki `Dockerfile` dosyasını otomatik olarak algılayıp imajı oluşturmaya başlayacak ve servisi yayına alacaktır.

---

## 3. Frontend Dağıtımı (Vercel)

Next.js ile geliştirilen frontend katmanı Vercel üzerinde tek tıkla canlıya alınabilir.

### Adım 1: GitHub Deposunu Bağlama
1.  [Vercel Dashboard](https://vercel.com/dashboard) sayfasına gidin.
2.  **Add New...** > **Project** seçeneğine tıklayın.
3.  GitHub deposunu import edin.

### Adım 2: Proje Ayarları
*   **Framework Preset**: `Next.js`
*   **Root Directory**: `frontend` (Önemli: Deponun altındaki `frontend` klasörü seçilmelidir)

### Adım 3: Ortam Değişkenleri
Aşağıdaki ortam değişkenini ekleyin:

| Değişken Adı | Değer / Açıklama |
| :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Render üzerinde oluşturduğunuz backend URL'i (örn. `https://inceayar-backend.onrender.com`) |

### Adım 4: Dağıtım (Deploy)
**Deploy** butonuna tıklayın. Vercel, Next.js uygulamasını optimize ederek canlıya alacaktır.

---

## 4. Sorun Giderme & İpuçları

### Puppeteer Bellek Sorunları (Render Free Tier)
Render'ın ücretsiz planında 512MB RAM limiti vardır. Puppeteer çalışırken bu limit aşılırsa servis otomatik olarak yeniden başlatılabilir (OOM - Out of Memory).
*   **Çözüm**: Render üzerinde en az `Starter` (512MB+ RAM) planını tercih edin veya eşzamanlı kazıma isteklerini limitleyin.

### CORS Hataları
Frontend backend'e istek atarken konsolda CORS hatası alıyorsanız:
*   Backend ortam değişkenlerindeki `FRONTEND_URL` değerinin, Vercel'deki canlı frontend URL'i ile birebir eşleştiğinden (ve sonunda `/` olmadığından) emin olun.
