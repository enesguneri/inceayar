import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthError } from "../utils/errors";
import User, { IUser } from "../models/User";

/**
 * JWT token payload tipi.
 */
export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * Express Request'e user bilgisi ekler.
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      dbUser?: IUser; // Opsiyonel olarak tam kullanıcı nesnesi
    }
  }
}

/**
 * JWT doğrulama middleware'i.
 * Authorization header'dan Bearer token'ı alır, doğrular ve req.user'a atar.
 */
export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthError("Erişim token'ı gerekli");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AuthError("Erişim token'ı gerekli");
    }

    // 2. Token'ı doğrula
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // 3. Veritabanından kullanıcıyı kontrol et
    const currentUser = await User.findById(decoded.userId).select("-password");
    if (!currentUser) {
      throw new AuthError("Bu token'a ait kullanıcı artık mevcut değil");
    }

    // 4. Request nesnesine ata
    req.user = decoded;
    req.dbUser = currentUser;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AuthError("Token süresi dolmuş"));
      return;
    }
    if (error instanceof AuthError) {
      next(error);
      return;
    }
    next(new AuthError("Geçersiz token"));
  }
};
