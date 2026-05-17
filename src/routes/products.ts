import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { upload, uploadToCloudinary } from "../middleware/upload";
import { sendSuccess } from "../utils/response";
import { ValidationError } from "../utils/errors";
import {
  createProduct,
  getProductsByUser,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductImages
} from "../services/productService";

const router = Router();

// Bütün ürün işlemleri yetkilendirme gerektirir
router.use(protect);

// Zod Şemaları
const productSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Ürün adı zorunludur"),
    category: z.string().min(1, "Kategori zorunludur"),
    brand: z.string().min(1, "Marka zorunludur"),
    features: z.record(z.string(), z.string()).optional(),
    advantages: z.string().optional(),
    images: z.array(z.string()).max(5, "Maksimum 5 fotoğraf yüklenebilir").optional(),
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    brand: z.string().min(1).optional(),
    features: z.record(z.string(), z.string()).optional(),
    advantages: z.string().optional(),
    images: z.array(z.string()).max(5).optional(),
  }),
});

// Endpoint'ler
router.post(
  "/",
  validate(productSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const product = await createProduct(userId, req.body);
      sendSuccess(res, product, 201);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await getProductsByUser(userId, page, limit);
    sendSuccess(res, result.products, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const productId = req.params.id as string;
    
    const product = await getProductById(userId, productId);
    sendSuccess(res, product);
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  validate(updateProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const productId = req.params.id as string;

      const product = await updateProduct(userId, productId, req.body);
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }
);

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const productId = req.params.id as string;

    await deleteProduct(userId, productId);
    sendSuccess(res, { message: "Ürün başarıyla silindi" });
  } catch (error) {
    next(error);
  }
});

// Ürüne fotoğraf yükleme
router.post(
  "/:id/images",
  upload.array("images", 5),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const productId = req.params.id as string;

      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        throw new ValidationError("Lütfen en az bir fotoğraf yükleyin");
      }

      const files = req.files as Express.Multer.File[];
      const uploadPromises = files.map((file) => 
        uploadToCloudinary(file.buffer, `inceayar/products/${productId}`)
      );

      const uploadResults = await Promise.all(uploadPromises);
      const imageUrls = uploadResults.map((result) => result.url);

      const product = await updateProductImages(userId, productId, imageUrls);
      
      sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
