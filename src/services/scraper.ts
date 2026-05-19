import * as cheerio from 'cheerio';
import { AppError } from '../utils/errors';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Stealth eklentisini Puppeteer'a ekleyelim
puppeteer.use(StealthPlugin());

/**
 * Yönlendirilmiş (Redirect) kısa URL'leri çözümler (Örn: ty.gl)
 */
export const resolveRedirectUrl = async (url: string): Promise<string> => {
  if (url.includes('ty.gl') || !url.includes('trendyol.com') && !url.includes('hepsiburada.com')) {
    try {
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      return response.url || url;
    } catch (err) {
      console.warn(`[Scraper] URL yönlendirme çözme başarısız oldu (HEAD denendi):`, err);
      try {
        const response = await fetch(url, {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        return response.url || url;
      } catch (error) {
        console.error(`[Scraper] URL yönlendirme çözme tamamen başarısız oldu:`, error);
      }
    }
  }
  return url;
};

/**
 * URL'den ürün ID'sini çıkarır
 */
export const extractProductId = (url: string, platform: 'trendyol' | 'hepsiburada'): string => {
  try {
    if (platform === 'trendyol') {
      const match = url.match(/-p-(\d+)/);
      if (match && match[1]) return match[1];
    } else if (platform === 'hepsiburada') {
      const match = url.match(/-p[m]?-([A-Za-z0-9]+)/);
      if (match && match[1]) return match[1];
    }
    throw new Error("ID bulunamadı");
  } catch (error) {
    throw new AppError("Geçersiz ürün linki", 400, "INVALID_URL");
  }
};

/**
 * Kazıma başarısız olduğunda çağrılan fonksiyon (Şimdilik devre dışı bırakıldı)
 */
const fallbackAction = async (url: string, platform: 'trendyol' | 'hepsiburada'): Promise<any[]> => {
  console.log(`[Scraper] [FALLBACK] ${platform.toUpperCase()} kazıma başarısız oldu. Yapay zeka yorum üretimi kullanıcı isteğiyle geçici olarak durduruldu.`);
  throw new AppError(`${platform} üzerinden yorumlar çekilemedi. Lütfen geçerli bir ürün linki girdiğinizden emin olun veya daha sonra tekrar deneyin.`, 404, "SCRAPING_FAILED");
};

/**
 * Puppeteer ile genel kazıma yardımcı fonksiyonu
 */
const scrapeWithPuppeteer = async (url: string, platform: 'trendyol' | 'hepsiburada'): Promise<string[]> => {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security'
        ]
    });

    const reviews: string[] = [];

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Request interception ile ağır görsel, font ve medyaları engelle
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const type = req.resourceType();
            if (['image', 'font', 'media'].includes(type)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        console.log(`[Scraper] Sayfaya gidiliyor: ${url}`);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Daha fazla yorum yüklemek için sayfayı 10 kez aşağı kaydırıyoruz
        for (let i = 0; i < 10; i++) {
            await page.evaluate(() => {
                const pageWindow = globalThis as unknown as { scrollBy: (x: number, y: number) => void };
                pageWindow.scrollBy(0, 1500);
            });
            await new Promise(r => setTimeout(r, 1000));
        }

        let reviewNodes: any[] = [];

        if (platform === 'trendyol') {
            // Trendyol yorum seçicileri
            reviewNodes = await page.$$('p, span, .pr-rnr-com, .rnr-com-w');
        } else {
            // Hepsiburada yorum seçicileri
            reviewNodes = await page.$$('.review-text, .hermes-ReviewCard-module-bTjE9, [itemprop="reviewBody"]');
        }

        for (const node of reviewNodes) {
            const text = await node.evaluate((el: any) => el.textContent?.trim());
            if (text && text.length > 20 && text.length < 1000) {
                const lowerText = text.toLowerCase();
                // Menü, footer, ve UI yazılarını filtrele
                const isUI = lowerText.includes("tüm yorumlar") || 
                             lowerText.includes("sırala") || 
                             lowerText.includes("değerlendir") ||
                             lowerText.includes("telif") ||
                             lowerText.includes("çerez") ||
                             lowerText.includes("hukuka") ||
                             lowerText.includes("kullanım koşulları") ||
                             lowerText.includes("farklı ürüne ait olan") ||
                             lowerText.includes("sağlık beyanı");
                
                if (!isUI) {
                     reviews.push(text);
                }
            }
        }
        
    } catch (e) {
        console.error(`[Scraper] Puppeteer kazıma hatası (${platform}):`, e);
    } finally {
        await browser.close();
    }

    // Benzersiz (unique) yorumları dön, filtrele
    return Array.from(new Set(reviews));
};

/**
 * Trendyol için Puppeteer üzerinden kazıma işlemi
 */
export const scrapeTrendyol = async (url: string): Promise<{
    rating: number;
    comment: string;
    source: 'trendyol';
}[]> => {
    const productId = extractProductId(url, 'trendyol');
    console.log(`[Scraper] Trendyol Puppeteer kazıma işlemi başlıyor (Product ID: ${productId})...`);

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Request interception ile ağır görsel, font ve medyaları engelle
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const type = req.resourceType();
            if (['image', 'font', 'media'].includes(type)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Trendyol Yorumlar sayfasına git
        const reviewsUrl = url.includes('/yorumlar') ? url : `${url.split('?')[0]}/yorumlar`;
        console.log(`[Scraper] Sayfaya gidiliyor: ${reviewsUrl}`);
        
        const response = await page.goto(reviewsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        if (response?.status() === 404) {
             console.log("[Scraper] /yorumlar sayfası 404 verdi. Ana sayfadan denenecek...");
             await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        }

        // Daha fazla yorum yüklemek için sayfayı aşağı kaydır
        for (let i = 0; i < 15; i++) {
            await page.evaluate(() => {
                const pageWindow = globalThis as unknown as { scrollBy: (x: number, y: number) => void };
                pageWindow.scrollBy(0, 1500);
            });
            await new Promise(r => setTimeout(r, 1000));
        }

        const rawReviews = await page.evaluate(`(() => {
            const reviews = [];
            
            // Yorum bloklarını seç (.review-comment kapsayıcısı vb.)
            const reviewElements = Array.from(document.querySelectorAll('.review-comment, .comment-comment, .rnr-com-w'));
            
            for (const el of reviewElements) {
                // Metin için en derindeki p veya span'i hedef al, yoksa direkt kendisini kullan
                const textEl = el.querySelector('p') || el.querySelector('span') || el;
                let text = (textEl.textContent || "").trim();
                
                // Yıldız değerlendirmesini bul (.star-w .full genişliğinden oranla)
                let rating = 5; // Default 5 yıldız
                // Yorum bloğunun üst elemanında yıldız arayalım
                const parentReview = el.closest('.review') || el.parentElement;
                const starEl = parentReview ? parentReview.querySelector('.star-w .full') : null;
                if (starEl) {
                    const widthStyle = starEl.style.maxWidth || starEl.style.width;
                    if (widthStyle) {
                        const percent = parseInt(widthStyle.replace('%', ''), 10);
                        if (!isNaN(percent)) {
                            rating = Math.round(percent / 20); // 100% -> 5, 80% -> 4 vs.
                        }
                    }
                }

                if (text && text.length > 20 && text.length < 1000) {
                     const lowerText = text.toLowerCase();
                     const isUI = lowerText.includes("tüm yorumlar") || 
                                  lowerText.includes("sırala") || 
                                  lowerText.includes("farklı ürüne ait olan");
                     if (!isUI) {
                         // "Devamını Oku" metnini temizle
                         text = text.replace(/Devamını\\s*Oku/gi, '').trim();
                         reviews.push({ comment: text, rating: rating });
                     }
                }
            }
            return reviews;
        })()`) as { comment: string; rating: number }[];

        await browser.close();

        if (rawReviews.length === 0) {
             console.log("[Scraper] Trendyol Puppeteer yorum bulamadı.");
             return await fallbackAction(url, 'trendyol');
        }

        // Remove duplicates
        const uniqueComments = new Set<string>();
        const uniqueReviews = [];
        for (const r of rawReviews) {
            if (!uniqueComments.has(r.comment)) {
                uniqueComments.add(r.comment);
                uniqueReviews.push({
                    rating: r.rating || 5, // Rating çıkarılamazsa 5 varsayalım
                    comment: r.comment,
                    source: 'trendyol' as const
                });
            }
        }

        console.log(`[Scraper] Trendyol üzerinden ${uniqueReviews.length} eşsiz yorum başarıyla çekildi.`);
        return uniqueReviews.slice(0, 50);

    } catch (error: any) {
        await browser.close().catch(() => {});
        console.error("[Scraper] Trendyol Kazıma Hatası:", error);
        return await fallbackAction(url, 'trendyol');
    }
};

/**
 * Hepsiburada için Puppeteer üzerinden kazıma işlemi
 */
export const scrapeHepsiburada = async (url: string): Promise<{
  rating: number;
  comment: string;
  source: 'hepsiburada';
}[]> => {
  const productId = extractProductId(url, 'hepsiburada');
  console.log(`[Scraper] Hepsiburada Puppeteer kazıma işlemi başlıyor (Product ID: ${productId})...`);

  try {
      const rawReviews = await scrapeWithPuppeteer(url, 'hepsiburada');

      if (rawReviews.length === 0) {
        console.warn("[Scraper] ⚠️ Hepsiburada yorumları çekilemedi. HB güçlü anti-bot koruması kullanmaktadır. Analiz yorumsuz devam edecek.");
        // HB anti-bot koruması nedeniyle yorum çekilemezse boş döndür (hata fırlatma)
        return [];
      }

      const formattedReviews = rawReviews.slice(0, 50).map(text => ({
        rating: 5,
        comment: text,
        source: 'hepsiburada' as const
      }));

      console.log(`[Scraper] Hepsiburada üzerinden ${formattedReviews.length} yorum başarıyla çekildi.`);
      return formattedReviews;

  } catch (error) {
     console.error("[Scraper] Hepsiburada Kazıma Hatası:", error);
     console.warn("[Scraper] ⚠️ HB yorumları alınamadı, analiz yorumsuz devam edecek.");
     return []; // Hata fırlatma yerine boş dizi dön
  }
};

export const scrapeReviews = async (url: string) => {
  const resolvedUrl = await resolveRedirectUrl(url);
  if (resolvedUrl.includes("trendyol.com")) {
    return await scrapeTrendyol(resolvedUrl);
  } else if (resolvedUrl.includes("hepsiburada.com")) {
    return await scrapeHepsiburada(resolvedUrl);
  } else {
    throw new AppError("Desteklenmeyen platform. Lütfen Trendyol veya Hepsiburada linki girin.", 400, "INVALID_PLATFORM");
  }
};

/**
 * URL'den ürün detaylarını (isim, marka, özellikler vb.) çeker
 */
export const scrapeProductDetails = async (url: string): Promise<{
    name: string;
    brand: string;
    category: string;
    features: Record<string, string>;
    advantages: string;
    images: string[];
}> => {
    const resolvedUrl = await resolveRedirectUrl(url);
    const isHepsiburada = resolvedUrl.includes('hepsiburada.com');
    const isTrendyol = resolvedUrl.includes('trendyol.com');

    // --- Hepsiburada: URL-based parsing (HB agresif anti-bot kullandığı için) ---
    if (isHepsiburada) {
        console.log(`[Scraper] HB ürün detayları URL'den parse ediliyor: ${resolvedUrl}`);
        return parseHepsiburadaUrl(resolvedUrl);
    }

    // --- Trendyol & Diğer siteler: Puppeteer ile kazıma ---
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Request interception ile ağır görsel, font ve medyaları engelle
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const type = req.resourceType();
            if (['image', 'font', 'media'].includes(type)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
        });
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
        
        console.log(`[Scraper] Ürün detayları için gidiliyor: ${resolvedUrl}`);
        await page.goto(resolvedUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const details = await page.evaluate(() => {
            type PageElement = {
                textContent: string | null;
                getAttribute: (name: string) => string | null;
                querySelector: (selector: string) => PageElement | null;
            };
            type PageDocument = {
                querySelector: (selector: string) => PageElement | null;
                querySelectorAll: (selector: string) => Iterable<PageElement>;
            };

            const pageWindow = globalThis as unknown as {
                __envoy__SHARED_PROPS?: { product?: any };
            };
            const pageDocument = (globalThis as unknown as { document: PageDocument }).document;
            const normalizeImageUrl = (value: unknown): string => {
                if (typeof value !== 'string' || !value) return '';
                if (value.startsWith('//')) return `https:${value}`;
                if (value.startsWith('http://') || value.startsWith('https://')) return value;
                return '';
            };
            // Trendyol için özel JSON State nesnesi kontrolü
            if (pageWindow.__envoy__SHARED_PROPS?.product) {
                const p = pageWindow.__envoy__SHARED_PROPS.product;
                const category = p.category?.hierarchy || p.category?.name || '';
                
                const features: Record<string, string> = {};
                if (p.attributes && Array.isArray(p.attributes)) {
                    p.attributes.forEach((attr: any) => {
                        if (attr.key?.name && attr.value?.name) {
                            features[attr.key.name] = attr.value.name;
                        }
                    });
                }
                
                let advantages = '';
                const descEl = pageDocument.querySelector('.detail-desc-list, .product-desc, .item-desc');
                if (descEl) {
                    advantages = descEl.textContent?.replace(/\s+/g, ' ').trim() || '';
                }

                const images = Array.isArray(p.images)
                    ? Array.from(new Set(
                        p.images
                            .map((image: any) => normalizeImageUrl(image?.url || image?.secureUrl || image))
                            .filter((imageUrl: string) => Boolean(imageUrl))
                      )).slice(0, 5)
                    : [];

                return {
                    name: p.name || 'Ürün Adı Bulunamadı',
                    brand: p.brand?.name || 'Marka',
                    category: category || 'Kategori',
                    features,
                    advantages: advantages.slice(0, 1000),
                    images
                };
            }

            // Diğer siteler için genel DOM scraping
            const nameEl = pageDocument.querySelector('h1') || pageDocument.querySelector('.product-name');
            const name = nameEl ? nameEl.textContent?.trim() : '';

            const brandEl = pageDocument.querySelector('.product-brand') || pageDocument.querySelector('h1 a');
            const brand = brandEl ? brandEl.textContent?.trim() : '';

            const breadcrumbs = Array.from(pageDocument.querySelectorAll('.breadcrumb-item, .product-detail-breadcrumb a, a[href*="/tum--urunler"]'));
            const category = breadcrumbs.at(-1)?.textContent?.trim() || '';

            let advantages = '';
            const descEl = pageDocument.querySelector('.product-desc, .detail-desc-list, #productDescription');
            if (descEl) {
                advantages = descEl.textContent?.replace(/\s+/g, ' ').trim() || '';
            }

            const imageCandidates = [
                pageDocument.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
                ...Array.from(pageDocument.querySelectorAll('img')).map((img) => img.getAttribute('src') || ''),
            ];
            const images = Array.from(new Set(
                imageCandidates
                    .map(normalizeImageUrl)
                    .filter((imageUrl): imageUrl is string => Boolean(imageUrl) && !imageUrl.includes('logo') && !imageUrl.includes('sprite'))
            )).slice(0, 5);

            const features: Record<string, string> = {};
            Array.from(pageDocument.querySelectorAll('ul.detail-attr-container li, table.data-list tr')).forEach(row => {
               const key = row.querySelector('th, span:first-child')?.textContent?.trim();
               const val = row.querySelector('td, span:last-child, b')?.textContent?.trim();
               if (key && val) {
                 features[key] = val;
               }
            });

            return {
                name: name || 'Ürün Adı Bulunamadı',
                brand: brand || 'Marka',
                category: category || 'Kategori',
                features,
                advantages: advantages.slice(0, 1000),
                images
            };
        }) as {
            name: string;
            brand: string;
            category: string;
            features: Record<string, string>;
            advantages: string;
            images: string[];
        };

        return details;
    } catch (e) {
        console.error(`[Scraper] Detay çekme hatası:`, e);
        throw new AppError("Ürün detayları çekilemedi", 500, "SCRAPE_DETAILS_FAILED");
    } finally {
        await browser.close();
    }
};

/**
 * Hepsiburada URL slug'ından ürün bilgilerini parse eder.
 * HB güçlü anti-bot koruması kullandığı için Puppeteer ile kazıma güvenilir değildir.
 * URL yapısı: /marka-urun-adi-ozellikler-p-SKU
 */
function parseHepsiburadaUrl(url: string): {
    name: string;
    brand: string;
    category: string;
    features: Record<string, string>;
    advantages: string;
    images: string[];
} {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname; // e.g. /philips-lumea-ipl-9900-serisi-bri950-02-tuy-alma-cihazi-p-HBV000007RZZC
        
        // SKU'yu çıkart (HB hem -p- hem -pm- kullanır)
        const skuMatch = pathname.match(/-p[m]?-([A-Za-z0-9]+)$/);
        const sku = skuMatch ? skuMatch[1] : '';
        
        // Slug'ı al (URL'nin başındaki / ve sondaki -p-SKU veya -pm-SKU'yu çıkart)
        let slug = pathname.replace(/^\//, '').replace(/-p[m]?-[A-Za-z0-9]+$/, '');
        
        // Slug'ı parçalara ayır
        const parts = slug.split('-');
        
        // İlk kelime genellikle marka
        // Bilinen markalar listesi (yaygın olanlar)
        const knownBrands = [
            'apple', 'samsung', 'xiaomi', 'huawei', 'lg', 'sony', 'philips', 'bosch',
            'siemens', 'arcelik', 'beko', 'vestel', 'asus', 'lenovo', 'hp', 'dell',
            'dyson', 'karcher', 'tefal', 'moulinex', 'braun', 'oral-b', 'loreal',
            'nike', 'adidas', 'puma', 'converse', 'skechers', 'casio', 'jbl',
            'anker', 'baseus', 'oppo', 'realme', 'oneplus', 'nothing', 'google',
            'microsoft', 'acer', 'msi', 'razer', 'corsair', 'logitech', 'steelseries',
            'marshall', 'sennheiser', 'bose', 'harman-kardon', 'panasonic', 'toshiba',
            'grundig', 'altus', 'fakir', 'sinbo', 'rowenta', 'electrolux', 'aeg'
        ];
        
        let brand = '';
        let nameStartIndex = 0;
        
        // İlk 1-2 kelimeyi marka olarak kontrol et
        if (parts.length > 0) {
            const firstPart = parts[0] ?? '';
            const secondPart = parts[1] ?? '';
            const firstWord = firstPart.toLowerCase();
            const firstTwo = secondPart ? `${firstPart}-${secondPart}`.toLowerCase() : '';
            
            if (knownBrands.includes(firstTwo)) {
                brand = `${capitalize(firstPart)} ${capitalize(secondPart)}`;
                nameStartIndex = 2;
            } else if (knownBrands.includes(firstWord)) {
                brand = capitalize(firstPart);
                nameStartIndex = 1;
            } else {
                // Bilinmeyen marka, yine ilk kelimeyi marka olarak al
                brand = capitalize(firstPart);
                nameStartIndex = 1;
            }
        }
        
        // Ürün adını oluştur (tüm kalan parçalar)
        const nameParts = parts.slice(nameStartIndex).map(p => capitalize(p));
        const name = `${brand} ${nameParts.join(' ')}`.trim();
        
        console.log(`[Scraper] HB URL parse sonucu - İsim: "${name}", Marka: "${brand}"`);
        
        return {
            name,
            brand,
            category: '', // URL'den kategori çıkarılamaz, kullanıcı manuel girecek
            features: {},
            advantages: '', // URL'den açıklama çıkarılamaz, kullanıcı manuel girecek
            images: []
        };
    } catch (e) {
        console.error(`[Scraper] HB URL parse hatası:`, e);
        return {
            name: 'Ürün Adı Bulunamadı',
            brand: '',
            category: '',
            features: {},
            advantages: '',
            images: []
        };
    }
}

function capitalize(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
