import dotenv from "dotenv";
import { z } from "zod";

// .env dosyasını yükle
if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env.test", override: true });
} else {
  dotenv.config({ override: true });
}

/**
 * Ortam değişkenleri şeması.
 * Uygulama başlarken tüm gerekli değişkenler doğrulanır.
 */
const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // MongoDB
  MONGODB_URI: z.string().min(1, "MONGODB_URI zorunludur"),

  // Gemini API
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY zorunludur"),

  // JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET en az 32 karakter olmalıdır"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME zorunludur"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY zorunludur"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET zorunludur"),

  // Frontend URL (CORS)
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Ortam değişkeni doğrulama hatası:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
