import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../utils/errors";
import { sendError } from "../utils/response";
import { env } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Global Express hata yakalama middleware'i.
 * Tüm route'lardan fırlatılan hataları yakalar ve standart formatta döner.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Zaten gönderilmiş yanıt varsa atla
  if (res.headersSent) {
    return;
  }

  // Bilinen AppError alt sınıfları
  if (err instanceof AppError) {
    const details =
      err instanceof ValidationError ? err.details : undefined;

    sendError(res, err.statusCode, err.code, err.message, details);

    // Sadece 500+ hataları logla
    if (err.statusCode >= 500) {
      logger.error(`[${err.code}] ${err.message}`, err.stack);
    }
    return;
  }

  // Mongoose validation hatası
  if (err.name === "ValidationError") {
    sendError(res, 422, "VALIDATION_ERROR", "Veri doğrulama hatası");
    return;
  }

  // Mongoose cast hatası (geçersiz ObjectId vb.)
  if (err.name === "CastError") {
    sendError(res, 400, "INVALID_ID", "Geçersiz ID formatı");
    return;
  }

  // JWT hataları
  if (err.name === "JsonWebTokenError") {
    sendError(res, 401, "AUTH_INVALID", "Geçersiz token");
    return;
  }
  if (err.name === "TokenExpiredError") {
    sendError(res, 401, "AUTH_EXPIRED", "Token süresi dolmuş");
    return;
  }

  // Bilinmeyen hatalar
  logger.error("Beklenmeyen hata:", err);

  const message =
    env.NODE_ENV === "production"
      ? "Sunucu hatası"
      : err.message || "Sunucu hatası";

  sendError(res, 500, "SERVER_ERROR", message);
};
