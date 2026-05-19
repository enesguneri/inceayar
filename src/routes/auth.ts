import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { registerUser, loginUser, refreshAccessToken } from "../services/authService";
import { sendSuccess } from "../utils/response";
import { validate } from "../middleware/validate";
import { protect } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

// Zod Şemaları
const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
    email: z.string().email("Geçerli bir email adresi giriniz"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
    company: z.string().min(2, "İşletme adı en az 2 karakter olmalıdır"),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Geçerli bir email adresi giriniz"),
    password: z.string().min(1, "Şifre zorunludur"),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token zorunludur"),
  }),
});

// Endpoint'ler
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await registerUser(req.body);
      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await loginUser(req.body);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/refresh",
  validate(refreshSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const result = await refreshAccessToken(refreshToken);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/me", protect, (req: Request, res: Response) => {
  // protect middleware'i req.dbUser'a kullanıcıyı ekledi
  const user = req.dbUser!;
  sendSuccess(res, {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      company: user.company,
    },
  });
});

export default router;
