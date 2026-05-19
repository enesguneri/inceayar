import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalysis extends Document {
    userId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    competitorReviews: any[];
    status: 'processing' | 'completed' | 'failed';
    currentAgent: string;
    researchFindings?: any;
    draftDescription?: string;
    seoKeywords?: string[];
    riskReport?: any;
    finalDescription?: string;
    revisionNotes?: string[];
    error?: string;
}

const AnalysisSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    competitorReviews: [{ type: Schema.Types.Mixed, required: true }],
    status: { type: String, enum: ['processing', 'completed', 'failed'], default: 'processing' },
    currentAgent: { type: String, default: 'researcher' },

    // AI Ajan Çıktıları
    researchFindings: { type: Schema.Types.Mixed },
    draftDescription: { type: String },
    seoKeywords: [{ type: String }],
    riskReport: { type: Schema.Types.Mixed },
    finalDescription: { type: String },
    revisionNotes: [{ type: String }],

    error: { type: String }
}, { timestamps: true });

export default mongoose.model<IAnalysis>('Analysis', AnalysisSchema);