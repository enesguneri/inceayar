import rateLimit from "express-rate-limit";

/**
 * Genel API rate limiter.
 * Tüm endpoint'ler için dakikada 100 istek.
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Çok fazla istek gönderdiniz, lütfen 1 dakika bekleyin",
    },
  },
});

/**
 * Auth endpoint'leri için rate limiter.
 * Brute-force koruması: dakikada 20 istek.
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Çok fazla giriş denemesi, lütfen 1 dakika bekleyin",
    },
  },
});

/**
 * Analiz endpoint'leri için rate limiter.
 * AI çağrıları maliyetli olduğu için dakikada 10 istek.
 */
export const analysisLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Analiz istek limiti aşıldı, lütfen 1 dakika bekleyin",
    },
  },
});
