import { Router, Request, Response, NextFunction } from "express";
import EventEmitter from "events";
import { protect } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";
import { NotFoundError } from "../utils/errors";
import Analysis from "../models/Analysis";
import Product from "../models/Product";
import { app } from "../ai/graph";

const router = Router();
router.use(protect);

// Global event emitter for SSE
const analysisEmitter = new EventEmitter();

/**
 * 1. Analizi Başlat
 * POST /api/analyses/start/:productId
 */
router.post("/start/:productId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const productId = req.params.productId as string;

    // Ürünü bul
    const product = await Product.findOne({ _id: productId, userId });
    if (!product) {
      throw new NotFoundError("Ürün");
    }

    // Sahte Rakip Yorumları (Şimdilik mock data. İleride Trendyol/Hepsiburada API'den çekilecek)
    const mockCompetitorReviews = [
      { rating: 2, comment: "Kumaşı çok terletiyor, dikişleri hemen koptu." },
      { rating: 3, comment: "Rengi resimdeki gibi canlı değil ama idare eder." },
      { rating: 1, comment: "Paketleme berbattı, ürün yırtık geldi." }
    ];

    // Yeni analiz kaydı oluştur
    const analysis = await Analysis.create({
      userId,
      productId,
      competitorReviews: mockCompetitorReviews,
      status: "processing",
      currentAgent: "researcher"
    });

    // Arka planda Langgraph sürecini başlat (async)
    // Beklemeden asenkron çalışır
    runLanggraphProcess(analysis._id.toString(), product, mockCompetitorReviews).catch(err => {
      console.error("Langgraph Error:", err);
    });

    // Client'a ID dön
    sendSuccess(res, { analysisId: analysis._id.toString() }, 202);
  } catch (error) {
    next(error);
  }
});

/**
 * Arka planda Langgraph akışını çalıştırır ve veritabanını günceller.
 */
async function runLanggraphProcess(analysisId: string, product: any, competitorReviews: any[]) {
  try {
    const initialState = {
      product: product.toObject(),
      competitorReviews,
      analysisId,
      currentAgent: "researcher"
    };

    // Langgraph'i stream modunda çalıştır
    const stream = await app.stream(initialState);

    for await (const chunk of stream) {
      // Chunk, ajanların döndüğü state objesini içerir (ör: { researcher: { ... } })
      const agentName = Object.keys(chunk)[0];
      if (!agentName) continue;
      const stateUpdate = (chunk as any)[agentName];

      // Veritabanını güncelle
      await Analysis.findByIdAndUpdate(analysisId, {
        $set: {
          currentAgent: stateUpdate.currentAgent || agentName,
          researchFindings: stateUpdate.researchFindings,
          draftDescription: stateUpdate.draftDescription,
          seoKeywords: stateUpdate.seoKeywords,
          riskReport: stateUpdate.riskReport,
          finalDescription: stateUpdate.finalDescription,
          revisionNotes: stateUpdate.revisionNotes,
        }
      });

      // SSE dinleyicilerine haber ver
      analysisEmitter.emit(`update_${analysisId}`, {
        agent: agentName,
        state: stateUpdate
      });
    }

    // Süreç bittiğinde tamamlandı olarak işaretle
    await Analysis.findByIdAndUpdate(analysisId, { status: "completed" });
    analysisEmitter.emit(`update_${analysisId}`, { status: "completed" });

  } catch (error: any) {
    console.error(`Analysis ${analysisId} failed:`, error);
    await Analysis.findByIdAndUpdate(analysisId, { status: "failed", error: error.message });
    analysisEmitter.emit(`update_${analysisId}`, { status: "failed", error: error.message });
  }
}

/**
 * 2. SSE ile Gerçek Zamanlı Takip
 * GET /api/analyses/:id/stream
 */
router.get("/:id/stream", async (req: Request, res: Response) => {
  const { id } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Veritabanından kontrol et
  const analysis = await Analysis.findById(id);
  if (!analysis) {
    res.write(`data: ${JSON.stringify({ error: "Analiz bulunamadı" })}\n\n`);
    res.end();
    return;
  }

  // Eğer zaten bitmişse direkt bitiş bilgisini gönder
  if (analysis.status === "completed" || analysis.status === "failed") {
    res.write(`data: ${JSON.stringify({ status: analysis.status })}\n\n`);
    res.end();
    return;
  }

  // Olay dinleyicisi
  const onUpdate = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (data.status === "completed" || data.status === "failed") {
      res.end();
      analysisEmitter.off(`update_${id}`, onUpdate);
    }
  };

  analysisEmitter.on(`update_${id}`, onUpdate);

  // Client bağlantıyı koparırsa dinleyiciyi temizle
  req.on("close", () => {
    analysisEmitter.off(`update_${id}`, onUpdate);
  });
});

/**
 * 3. Tamamlanan Analizi Getir
 * GET /api/analyses/:id
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!analysis) {
      throw new NotFoundError("Analiz");
    }
    sendSuccess(res, analysis);
  } catch (error) {
    next(error);
  }
});

export default router;
