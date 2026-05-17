import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

/**
 * Cloudinary SDK yapılandırması.
 * Ürün fotoğraflarının yüklenmesi ve CDN üzerinden sunulması için kullanılır.
 */
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export { cloudinary };
