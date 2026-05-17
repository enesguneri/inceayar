import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { generalLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import { sendSuccess } from "./utils/response";
import { sendError } from "./utils/response";
import { logger } from "./utils/logger";

/**
 * İnceAyar Backend — Ana giriş noktası.
 */

const app = express();

// ─── Güvenlik Middleware'leri ───
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

// ─── Body Parsing ───
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ───
app.use("/api", generalLimiter);

// ─── Health Check (Render cold start çözümü için) ───
app.get("/api/health", (_req, res) => {
  sendSuccess(res, {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
// import analysisRoutes from "./routes/analyses"; // Şimdilik kapalı

// ─── API Route'ları ───
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
// app.use("/api/analyses", analysisRoutes);

// ─── 404 Handler ───
app.use("/api/{*path}", (_req, res) => {
  sendError(res, 404, "NOT_FOUND", "İstenen endpoint bulunamadı");
});

// ─── Global Error Handler ───
app.use(errorHandler);

// ─── Sunucu Başlatma ───
const startServer = async (): Promise<void> => {
  try {
    // 1. Veritabanı bağlantısı
    await connectDatabase();

    // 2. Sunucuyu başlat
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 İnceAyar Backend çalışıyor: http://localhost:${env.PORT}`);
      logger.info(`📍 Ortam: ${env.NODE_ENV}`);
    });

    // 3. Graceful Shutdown
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`\n${signal} sinyali alındı. Sunucu kapatılıyor...`);

      server.close(async () => {
        await disconnectDatabase();
        logger.info("Sunucu başarıyla kapatıldı");
        process.exit(0);
      });

      // 10 saniye içinde kapanmazsa zorla kapat
      setTimeout(() => {
        logger.error("Sunucu zamanında kapatılamadı, zorla kapatılıyor");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    logger.error("Sunucu başlatılamadı:", error);
    process.exit(1);
  }
};

startServer();

export default app;
