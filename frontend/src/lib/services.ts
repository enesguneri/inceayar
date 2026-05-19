import api from '@/lib/api';

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  brand: string;
  features: Record<string, string>;
  advantages: string;
  images: string[];
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetails {
  name: string;
  brand: string;
  category: string;
  features: Record<string, string>;
  advantages: string;
  images: string[];
}

export interface CompetitorReview {
  rating?: number;
  comment: string;
  source?: string;
}

export interface Analysis {
  _id: string;
  productId: string | { _id: string };
  status: 'processing' | 'completed' | 'failed';
  currentAgent: string;
  researchFindings?: {
    chronicIssues?: Array<{ title: string; description: string; severity: 'low' | 'medium' | 'high' }>;
    topComplaints?: string[];
    marketingAdvantages?: string[];
  };
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

export interface AnalysisList {
  analyses: Analysis[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const productApi = {
  getAll: (page = 1, limit = 20) =>
    api.get<ApiResponse<Product[]>>('/products', { params: { page, limit } }),

  getById: (id: string) =>
    api.get<ApiResponse<Product>>(`/products/${id}`),

  create: (data: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) =>
    api.post<ApiResponse<Product>>('/products', data),

  update: (id: string, data: Partial<Product>) =>
    api.put<ApiResponse<Product>>(`/products/${id}`, data),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/products/${id}`),

  scrapeDetails: (url: string) =>
    api.post<ApiResponse<ProductDetails>>('/products/scrape-details', { url }),

  uploadImages: (id: string, files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('images', file));
    return api.post<ApiResponse<Product>>(`/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const analysisApi = {
  getAll: (page = 1, limit = 10, search?: string, status?: string, productId?: string) =>
    api.get<ApiResponse<AnalysisList>>('/analyses', { params: { page, limit, search, status, productId } }),

  getById: (id: string) =>
    api.get<ApiResponse<Analysis>>(`/analyses/${id}`),

  startWithUrl: (productId: string, url: string) =>
    api.post<ApiResponse<{ analysisId: string; reviewCount: number }>>('/analyses/scrape', { productId, url }),

  startManual: (productId: string, competitorReviews: CompetitorReview[]) =>
    api.post<ApiResponse<{ analysisId: string }>>(`/analyses/start/${productId}`, { competitorReviews }),

  delete: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/analyses/${id}`),
};
