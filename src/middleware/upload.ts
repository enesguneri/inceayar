import multer from "multer";
import { Request } from "express";
import { cloudinary } from "../config/cloudinary";
import { ValidationError } from "../utils/errors";

/**
 * İzin verilen MIME tipleri.
 */
const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Maksimum dosya boyutu (5MB).
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Multer dosya filtresi.
 * Sadece JPEG, PNG, WebP dosyalarına izin verir.
 */
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ValidationError("Desteklenmeyen dosya formatı. İzin verilen: JPEG, PNG, WebP")
    );
  }
};

/**
 * Multer middleware — memory storage (Cloudinary'ye yüklemek için buffer'da tutar).
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Maksimum 5 fotoğraf
  },
});

/**
 * Tek bir dosya buffer'ını Cloudinary'ye yükler.
 *
 * @param fileBuffer - Dosya buffer'ı
 * @param folder - Cloudinary klasörü (örn: "inceayar/products")
 * @returns Cloudinary URL ve public_id
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { quality: "auto", fetch_format: "auto" }, // Otomatik optimizasyon
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary yükleme hatası"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(fileBuffer);
  });
};

/**
 * Cloudinary'den dosya siler.
 *
 * @param publicId - Silinecek dosyanın public_id'si
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};
