import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodRawShape } from "zod";
import { ValidationError } from "../utils/errors";

/**
 * Zod şeması ile request doğrulama middleware factory'si.
 * body, params ve query ayrı ayrı veya birlikte doğrulanabilir.
 *
 * @example
 * const createProductSchema = z.object({
 *   body: z.object({
 *     name: z.string().min(1),
 *     category: z.string().min(1),
 *   }),
 * });
 *
 * router.post("/products", validate(createProductSchema), controller);
 */
export const validate = (schema: ZodObject<ZodRawShape>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      // Zod hata mesajlarını düzleştir
      const details: Record<string, string[]> = {};
      for (const [key, messages] of Object.entries(fieldErrors)) {
        if (messages) {
          details[key] = messages as string[];
        }
      }

      // Kullanıcıya anlamlı bir mesaj oluştur
      const allMessages: string[] = [];
      for (const [, messages] of Object.entries(details)) {
        if (messages && messages.length > 0) {
          allMessages.push(...messages);
        }
      }
      const userMessage = allMessages.length > 0 ? allMessages.join('. ') : "Geçersiz veri";

      throw new ValidationError(userMessage, details);
    }

    // Doğrulanmış verileri request'e geri yaz
    const data = result.data as Record<string, unknown>;
    if (data["body"]) req.body = data["body"];

    next();
  };
};
