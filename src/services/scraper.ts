import * as cheerio from 'cheerio';
import { AppError } from '../utils/errors';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Stealth eklentisini Puppeteer'a ekleyelim
puppeteer.use(StealthPlugin());

/**
 * URL'den ürün ID'sini çıkarır
 */
export const extractProductId = (url: string, platform: 'trendyol' | 'hepsiburada'): string => {
  try {
    if (platform === 'trendyol') {
      const match = url.match(/-p-(\d+)/);
      if (match && match[1]) return match[1];
    } else if (platform === 'hepsiburada') {
      const match = url.match(/-p-([A-Za-z0-9]+)/);
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
        
        console.log(`[Scraper] Sayfaya gidiliyor: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
        
        // Daha fazla yorum yüklemek için sayfayı 10 kez aşağı kaydırıyoruz
        for (let i = 0; i < 10; i++) {
            await page.evaluate(() => {
                window.scrollBy(0, 1500);
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

    try {
        // Sadece orijinal URL'yi kullan, çünkü /yorumlar 404'e düşebiliyor
        const reviewsUrl = url;

        const rawReviews = await scrapeWithPuppeteer(reviewsUrl, 'trendyol');

        if (rawReviews.length === 0) {
             console.log("[Scraper] Trendyol Puppeteer yorum bulamadı.");
             return await fallbackAction(url, 'trendyol');
        }

        const formattedReviews = rawReviews.slice(0, 50).map(text => ({
             rating: 5, // Rating'i tam parse etmek zor olabilir, varsayılan 5 veriyoruz
             comment: text,
             source: 'trendyol' as const
        }));

        console.log(`[Scraper] Trendyol üzerinden ${formattedReviews.length} yorum başarıyla çekildi.`);
        return formattedReviews;

    } catch (error: any) {
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
      // Sadece orijinal URL'yi kullan
      const reviewsUrl = url;

      const rawReviews = await scrapeWithPuppeteer(reviewsUrl, 'hepsiburada');

      if (rawReviews.length === 0) {
        console.log("[Scraper] Hepsiburada Puppeteer yorum bulamadı.");
        return await fallbackAction(url, 'hepsiburada');
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
     return await fallbackAction(url, 'hepsiburada');
  }
};

/**
 * Genel kazıma (scraper) wrapper fonksiyonu
 */
export const scrapeReviews = async (url: string) => {
  if (url.includes("trendyol.com")) {
    return await scrapeTrendyol(url);
  } else if (url.includes("hepsiburada.com")) {
    return await scrapeHepsiburada(url);
  } else {
    throw new AppError("Desteklenmeyen platform. Lütfen Trendyol veya Hepsiburada linki girin.", 400, "INVALID_PLATFORM");
  }
};
