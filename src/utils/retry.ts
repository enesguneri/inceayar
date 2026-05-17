/**
 * AI ajan çağrıları için retry (yeniden deneme) mekanizması.
 * Gemini API'den 429 (Rate Limit) veya geçici hata alındığında,
 * exponential backoff ile otomatik olarak yeniden dener.
 */

import { logger } from "./logger";

interface RetryOptions {
  /** Maksimum deneme sayısı (varsayılan: 3) */
  maxRetries?: number;
  /** İlk bekleme süresi — ms cinsinden (varsayılan: 2000) */
  initialDelayMs?: number;
  /** Her denemede bekleme çarpanı (varsayılan: 2 = exponential) */
  backoffFactor?: number;
}

/**
 * Verilen asenkron fonksiyonu, başarısız olursa belirtilen sayıda yeniden dener.
 * Her denemede bekleme süresi katlanarak artar (exponential backoff).
 *
 * @example
 * const result = await withRetry(() => structuredLlm.invoke(prompt), {
 *   maxRetries: 3,
 *   initialDelayMs: 2000,
 * });
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, initialDelayMs = 2000, backoffFactor = 2 } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || String(error);

      // Son denemeyse direkt fırlat
      if (attempt === maxRetries) {
        logger.error(`[Retry] ${maxRetries} deneme de başarısız oldu: ${errorMessage}`);
        throw error;
      }

      // Bekleme süresini hesapla
      const delay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);

      // 429 hatası ise Google'ın önerdiği bekleme süresini yakala
      const retryAfterMatch = errorMessage.match(/retry in (\d+\.?\d*)/i);
      const actualDelay = retryAfterMatch
        ? Math.ceil(parseFloat(retryAfterMatch[1]) * 1000)
        : delay;

      logger.warn(
        `[Retry] Deneme ${attempt}/${maxRetries} başarısız. ${actualDelay}ms sonra tekrar denenecek... Hata: ${errorMessage.slice(0, 120)}`
      );

      await new Promise((resolve) => setTimeout(resolve, actualDelay));
    }
  }

  // Bu satıra teorik olarak ulaşılmamalı ama TypeScript güvenliği için
  throw lastError || new Error("Retry mekanizması beklenmeyen şekilde sonlandı.");
}
