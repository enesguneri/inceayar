import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    category: string;
    brand: string;
    features: Record<string, string>; // Dinamik özellikler için
    advantages: string;
    images: string[]; // Fotoğraf URL'leri (Maksimum 5)
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    features: { type: Schema.Types.Mixed },
    advantages: { type: String },
    images: {
        type: [String],
        validate: [(val: string[]) => val.length <= 5, 'Maksimum 5 fotoğraf yüklenebilir']
    }
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);