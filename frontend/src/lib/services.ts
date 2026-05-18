import api from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────
export interface Product {
  _id: string;
  name: string;
  category: string;
  brand: string;
  features: Record<string, string>;
  advantages: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Analysis {
  _id: string;
  productId: string;
  status: 'processing' | 'completed' | 'failed';
  currentAgent: string;
  researchFindings?: any;
  draftDescription?: string;
  seoKeywords?: string[];
  riskReport?: {
    overallScore: number;
    risks: { issue: string; impact: string }[];
  };
  finalDescription?: string;
  revisionNotes?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Product API ────────────────────────────────────────────────
export const productApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<any>('/products', { params: { page, limit } }),

  getById: (id: string) =>
    api.get<any>(`/products/${id}`),

  create: (data: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) =>
    api.post<any>('/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.put<any>(`/products/${id}`, data),

  delete: (id: string) =>
    api.delete<any>(`/products/${id}`),

  uploadImages: (id: string, files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('images', file));
    return api.post<any>(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// ── Analysis API ───────────────────────────────────────────────
export const analysisApi = {
  getAll: (page = 1, limit = 10) =>
    api.get<any>('/analyses', { params: { page, limit } }),

  getById: (id: string) =>
    api.get<any>(`/analyses/${id}`),

  startWithUrl: (productId: string, url: string) =>
    api.post<any>('/analyses/scrape', { productId, url }),

  startManual: (productId: string, competitorReviews: any[]) =>
    api.post<any>(`/analyses/start/${productId}`, { competitorReviews }),
};
