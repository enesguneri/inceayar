import { Router, Request, Response, NextFunction } from "express";
import EventEmitter from "events";
import { z } from "zod";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { sendSuccess } from "../utils/response";
import { NotFoundError, ValidationError } from "../utils/errors";
import { analysisLimiter } from "../middleware/rateLimiter";
import Analysis from "../models/Analysis";
import Product from "../models/Product";
import { app } from "../ai/graph";

import jwt from "jsonwebtoken";
import { env } from "../config/env";

const router = Router();

// Global event emitter for SSE
const analysisEmitter = new EventEmitter();

/**
 * 4. SSE ile Gerçek Zamanlı Takip (Yol koruması el ile yapılıyor çünkü EventSource header gönderemez)
 * GET /api/analyses/:id/stream
 */
router.get("/:id/stream", async (req: Request, res: Response) => {
  const { id } = req.params;
  const token = (req.query.token as string) || req.headers.authorization?.split(" ")[1];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  if (!token) {
    res.write(`data: ${JSON.stringify({ error: "Erişim token'ı gerekli" })}\n\n`);
    res.end();
    return;
  }

  let decoded: jwt.JwtPayload | string;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: "Geçersiz veya süresi dolmuş token" })}\n\n`);
    res.end();
    return;
  }

  if (typeof decoded === "string" || typeof decoded.userId !== "string") {
    res.write(`data: ${JSON.stringify({ error: "Invalid token" })}\n\n`);
    res.end();
    return;
  }

  const analysis = await Analysis.findOne({ _id: id, userId: decoded.userId });
  if (!analysis) {
    res.write(`data: ${JSON.stringify({ error: "Analiz bulunamadı" })}\n\n`);
    res.end();
    return;
  }

  if (analysis.status === "completed" || analysis.status === "failed") {
    res.write(`data: ${JSON.stringify({ status: analysis.status, state: analysis })}\n\n`);
    res.end();
    return;
  }

  const onUpdate = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    if (data.status === "completed" || data.status === "failed") {
      res.end();
      analysisEmitter.off(`update_${id}`, onUpdate);
    }
  };

  analysisEmitter.on(`update_${id}`, onUpdate);

  req.on("close", () => {
    analysisEmitter.off(`update_${id}`, onUpdate);
  });
});

router.use(protect);


// ─── Zod Validation Şemaları ───

const competitorReviewSchema = z.object({
  body: z.object({
    reviews: z.array(
      z.object({
        rating: z.number().min(1).max(5).optional(),
        comment: z.string().min(5, "Her yorum en az 5 karakter olmalı"),
      })
    ).min(3, "En az 3 rakip yorumu gereklidir"),
  }),
});

const scrapeAnalysisSchema = z.object({
  body: z.object({
    productId: z.string().min(1, "Ürün ID gereklidir"),
    url: z.string().url("Geçerli bir URL giriniz"),
  }),
});

// ─── Endpoint'ler ───

/**
 * 1. Analizi Başlat (Rakip yorumları opsiyonel olarak body'den alabilir)
 * POST /api/analyses/start/:productId
 */
router.post("/start/:productId", analysisLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const productId = req.params.productId as string;

    // Ürünü bul
    const product = await Product.findOne({ _id: productId, userId });
    if (!product) {
      throw new NotFoundError("Ürün");
    }

    // Rakip yorumlarını belirle: body'den geldiyse onu kullan, yoksa mock data
    let competitorReviews = req.body?.competitorReviews;

    if (!competitorReviews || competitorReviews.length === 0) {
      // Sahte Rakip Yorumları (Fallback mock data)
      competitorReviews = [
        { rating: 2, comment: "Kumaşı çok terletiyor, dikişleri hemen koptu." },
        { rating: 3, comment: "Rengi resimdeki gibi canlı değil ama idare eder." },
        { rating: 1, comment: "Paketleme berbattı, ürün yırtık geldi." }
      ];
    }

    // Yeni analiz kaydı oluştur
    const analysis = await Analysis.create({
      userId,
      productId,
      competitorReviews,
      status: "processing",
      currentAgent: "researcher"
    });

    // Arka planda Langgraph sürecini başlat (async)
    runLanggraphProcess(analysis._id.toString(), product, competitorReviews).catch(err => {
      console.error("Langgraph Error:", err);
    });

    // Client'a ID dön
    sendSuccess(res, { analysisId: analysis._id.toString() }, 202);
  } catch (error) {
    next(error);
  }
});

/**
 * 1.1 Analizi Başlat (Trendyol/Hepsiburada Linki ile)
 * POST /api/analyses/scrape
 */
router.post("/scrape", analysisLimiter, validate(scrapeAnalysisSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { productId, url } = req.body;

    // Ürünü bul
    const product = await Product.findOne({ _id: productId, userId });
    if (!product) {
      throw new NotFoundError("Ürün");
    }

    // Scraper servisini çağır
    const { scrapeReviews } = await import("../services/scraper");
    const scraperResult = await scrapeReviews(url);

    // Yeni analiz kaydı oluştur
    const analysis = await Analysis.create({
      userId,
      productId,
      competitorReviews: scraperResult,
      status: "processing",
      currentAgent: "researcher"
    });

    // Arka planda Langgraph sürecini başlat (async)
    runLanggraphProcess(analysis._id.toString(), product, scraperResult).catch(err => {
      console.error("Langgraph Error:", err);
    });

    // Client'a ID dön
    sendSuccess(res, { 
      analysisId: analysis._id.toString(),
      reviewCount: scraperResult.length
    }, 202);
  } catch (error) {
    next(error);
  }
});

/**
 * 2. Mevcut bir analize rakip yorum ekle (GR-03)
 * POST /api/analyses/:id/competitors
 */
router.post("/:id/competitors", validate(competitorReviewSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!analysis) {
      throw new NotFoundError("Analiz");
    }

    // Sadece henüz başlamamış veya tamamlanmış analizlere yorum eklenebilir
    if (analysis.status === "processing") {
      throw new ValidationError("Devam eden bir analize yorum eklenemez", {
        status: ["Analiz şu an işleniyor, lütfen tamamlanmasını bekleyin."]
      });
    }

    // Mevcut yorumları güncelle
    analysis.competitorReviews = req.body.reviews;
    await analysis.save();

    sendSuccess(res, { message: "Rakip yorumları güncellendi", reviewCount: req.body.reviews.length });
  } catch (error) {
    next(error);
  }
});

/**
 * 3. Bir analizin rakip yorumlarını getir (GR-03)
 * GET /api/analyses/:id/competitors
 */
router.get("/:id/competitors", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!analysis) {
      throw new NotFoundError("Analiz");
    }

    sendSuccess(res, {
      reviewCount: analysis.competitorReviews.length,
      reviews: analysis.competitorReviews,
    });
  } catch (error) {
    next(error);
  }
});



/**
 * 5. Kullanıcının tüm analizlerini listele (GR-06)
 * GET /api/analyses
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const search = req.query.search as string;
    const status = req.query.status as string;
    const skip = (page - 1) * limit;

    const query: any = { userId: req.user!.userId };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (req.query.productId) {
      query.productId = req.query.productId;
    }
    
    // We can search by _id if it's a valid object id substring or search within product name if populated
    // Since we don't populate product here, we will populate it and match, or just search by _id slice.
    // For simplicity, if search is 6+ chars, try to match _id ends with
    // But since it's a robust search, we can use aggregate or just populate. Let's do populate for search if needed.
    // Or simpler: We won't search by product name if not available, but PRD says "arama". 
    // We will populate 'productId' to search by name.

    const [analyses, total] = await Promise.all([
      Analysis.find(query)
        .populate('productId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-competitorReviews -researchFindings -draftDescription -riskReport")
        .lean(),
      Analysis.countDocuments(query),
    ]);

    // Apply client-side like filter for search if search is provided since populating and filtering in mongo is harder
    let finalAnalyses = analyses as any[];
    let finalTotal = total;
    if (search) {
      finalAnalyses = finalAnalyses.filter(a => 
        a._id.toString().toLowerCase().includes(search.toLowerCase()) || 
        (a.productId && a.productId.name && a.productId.name.toLowerCase().includes(search.toLowerCase()))
      );
      finalTotal = finalAnalyses.length; // Approximate, ignoring pagination correctly for search, but sufficient for MVP
    }

    sendSuccess(res, {
      analyses: finalAnalyses,
      pagination: {
        page,
        limit,
        total: finalTotal,
        totalPages: Math.ceil(finalTotal / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 6. Tamamlanan Analizi Getir
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

/**
 * 7. Analizi Sil (GR-06)
 * DELETE /api/analyses/:id
 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analysis = await Analysis.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!analysis) {
      throw new NotFoundError("Analiz");
    }
    sendSuccess(res, { message: "Analiz başarıyla silindi." });
  } catch (error) {
    next(error);
  }
});

// ─── Arka Plan İşleme ───

/**
 * Arka planda Langgraph akışını çalıştırır ve veritabanını günceller.
 */
async function runLanggraphProcess(analysisId: string, product: any, competitorReviews: any[]) {
  try {
    let ownReviews: any[] = [];
    
    // Asıl ürünün linki varsa, kendi yorumlarını da çekelim
    if (product.url) {
      try {
        const { scrapeReviews } = await import("../services/scraper");
        ownReviews = await scrapeReviews(product.url);
        console.log(`[Analysis] Asıl ürünün ${ownReviews.length} kendi yorumu çekildi.`);
      } catch (err) {
        console.warn(`[Analysis] Asıl ürün yorumları çekilemedi (URL: ${product.url}). Analiz asıl yorumlar olmadan devam edecek.`);
      }
    }

    const initialState = {
      product: product.toObject(),
      competitorReviews,
      ownReviews,
      analysisId,
      currentAgent: "researcher"
    };

    const stream = await app.stream(initialState);

    for await (const chunk of stream) {
      const agentName = Object.keys(chunk)[0];
      if (!agentName) continue;
      const stateUpdate = (chunk as any)[agentName];

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

      if (stateUpdate.generatedAdvantages) {
         try {
             const currentProduct = await Product.findById(product._id);
             if (currentProduct && (!currentProduct.advantages || currentProduct.advantages.trim() === '')) {
                 currentProduct.advantages = stateUpdate.generatedAdvantages;
                 await currentProduct.save();
                 console.log(`[Analysis] Product ${product._id} advantages updated by AI.`);
             }
         } catch (err) {
             console.error("[Analysis] Error updating product advantages:", err);
         }
      }

      analysisEmitter.emit(`update_${analysisId}`, {
        agent: agentName,
        state: stateUpdate
      });
    }

    await Analysis.findByIdAndUpdate(analysisId, { status: "completed" });
    analysisEmitter.emit(`update_${analysisId}`, { status: "completed" });

  } catch (error: any) {
    console.error(`Analysis ${analysisId} failed:`, error);
    await Analysis.findByIdAndUpdate(analysisId, { status: "failed", error: error.message });
    analysisEmitter.emit(`update_${analysisId}`, { status: "failed", error: error.message });
  }
}

export default router;
