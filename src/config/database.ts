import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

/**
 * MongoDB Atlas bağlantısını kurar.
 * Bağlantı başarısız olursa uygulamayı sonlandırır.
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info("✅ MongoDB Atlas bağlantısı başarılı");
  } catch (error) {
    logger.error("❌ MongoDB bağlantı hatası:", error);
    if (env.NODE_ENV === "production") {
      process.exit(1);
    }
    logger.warn("⚠️  MongoDB olmadan devam ediliyor (development modu)");
    return;
  }

  mongoose.connection.on("error", (err) => {
    logger.error("MongoDB bağlantı hatası:", err);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB bağlantısı kesildi");
  });
};

/**
 * MongoDB bağlantısını kapatır (graceful shutdown için).
 */
export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.connection.close();
  logger.info("MongoDB bağlantısı kapatıldı");
};
