/**
 * Uygulama genelinde kullanılan custom hata sınıfları.
 * Her hata türü, uygun HTTP status kodu ve hata kodu taşır.
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    // Prototype zincirini koru
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 401 — Kimlik doğrulama gerekli veya başarısız */
export class AuthError extends AppError {
  constructor(message = "Kimlik doğrulama gerekli") {
    super(message, 401, "AUTH_REQUIRED");
  }
}

/** 403 — Yetki yetersiz */
export class ForbiddenError extends AppError {
  constructor(message = "Bu işlem için yetkiniz yok") {
    super(message, 403, "FORBIDDEN");
  }
}

/** 404 — Kaynak bulunamadı */
export class NotFoundError extends AppError {
  constructor(resource = "Kaynak") {
    super(`${resource} bulunamadı`, 404, "NOT_FOUND");
  }
}

/** 422 — Geçersiz input */
export class ValidationError extends AppError {
  public readonly details: Record<string, string[]>;

  constructor(message = "Geçersiz veri", details: Record<string, string[]> = {}) {
    super(message, 422, "VALIDATION_ERROR");
    this.details = details;
  }
}

/** 429 — İstek limiti aşıldı */
export class RateLimitError extends AppError {
  constructor(message = "Çok fazla istek gönderdiniz, lütfen bekleyin") {
    super(message, 429, "RATE_LIMITED");
  }
}

/** 500 — AI servisi hatası */
export class AIError extends AppError {
  constructor(message = "Yapay zeka servisi hatası") {
    super(message, 500, "AI_ERROR");
  }
}
