import { Response } from "express";

/**
 * Standart API yanıt yardımcıları.
 * Tüm endpoint'ler tutarlı JSON formatı döner.
 */

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Başarılı yanıt gönderir.
 *
 * @example
 * sendSuccess(res, { user: { id: "123", name: "Ali" } });
 * // → { success: true, data: { user: { ... } } }
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: SuccessResponse<T>["meta"]
): void => {
  const response: SuccessResponse<T> = { success: true, data };
  if (meta) {
    response.meta = meta;
  }
  res.status(statusCode).json(response);
};

/**
 * Hata yanıtı gönderir.
 *
 * @example
 * sendError(res, 404, "NOT_FOUND", "Ürün bulunamadı");
 */
export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): void => {
  const response: ErrorResponse = {
    success: false,
    error: { code, message },
  };
  if (details) {
    response.error.details = details;
  }
  res.status(statusCode).json(response);
};
