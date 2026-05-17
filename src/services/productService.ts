import Product, { IProduct } from "../models/Product";
import { NotFoundError, ForbiddenError } from "../utils/errors";

export const createProduct = async (userId: string, data: Partial<IProduct>): Promise<IProduct> => {
  const product = await Product.create({
    ...data,
    userId,
  });

  return product;
};

export const getProductsByUser = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments({ userId }),
  ]);

  return { products, total, page, limit };
};

export const getProductById = async (userId: string, productId: string): Promise<IProduct> => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new NotFoundError("Ürün");
  }

  // Sadece ürünün sahibi erişebilir
  if (product.userId.toString() !== userId) {
    throw new ForbiddenError("Bu ürüne erişim izniniz yok");
  }

  return product;
};

export const updateProduct = async (
  userId: string,
  productId: string,
  data: Partial<IProduct>
): Promise<IProduct> => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new NotFoundError("Ürün");
  }

  if (product.userId.toString() !== userId) {
    throw new ForbiddenError("Bu ürünü güncelleme izniniz yok");
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { $set: data },
    { new: true, runValidators: true }
  );

  return updatedProduct!;
};

export const deleteProduct = async (userId: string, productId: string): Promise<void> => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new NotFoundError("Ürün");
  }

  if (product.userId.toString() !== userId) {
    throw new ForbiddenError("Bu ürünü silme izniniz yok");
  }

  await Product.findByIdAndDelete(productId);
};

export const updateProductImages = async (
  userId: string,
  productId: string,
  newImages: string[]
): Promise<IProduct> => {
  const product = await Product.findById(productId);

  if (!product) {
    throw new NotFoundError("Ürün");
  }

  if (product.userId.toString() !== userId) {
    throw new ForbiddenError("Bu ürünü güncelleme izniniz yok");
  }

  // Maksimum 5 fotoğraf kontrolü
  const totalImages = (product.images?.length || 0) + newImages.length;
  if (totalImages > 5) {
      throw new Error(`Maksimum 5 fotoğraf yüklenebilir. Şu anda ${product.images?.length || 0} fotoğrafınız var.`);
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    { $push: { images: { $each: newImages } } },
    { new: true, runValidators: true }
  );

  return updatedProduct!;
};
