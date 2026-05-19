import mongoose from 'mongoose';

// 1. Define Mocks at the very top before importing the app or routes
jest.mock('../services/scraper', () => ({
  scrapeReviews: jest.fn().mockResolvedValue([
    { author: 'Ali Veli', comment: 'Çok güzel bir ürün.', rating: 5, date: '2026-05-19' },
    { author: 'Ayşe Fatma', comment: 'Kırık geldi beğenmedim.', rating: 1, date: '2026-05-18' }
  ]),
  scrapeTrendyol: jest.fn().mockResolvedValue([])
}));

jest.mock('../ai/graph', () => ({
  app: {
    stream: jest.fn()
  }
}));

// Import models and mocked app
import Product from '../models/Product';
import Analysis from '../models/Analysis';
import { app as mockApp } from '../ai/graph';

// We will import app dynamically to ensure mocks are applied first
let app: any;

describe('Analysis Endpoints', () => {
  const testUser = {
    name: 'Analysis Tester',
    email: 'analysis_test@example.com',
    password: 'password123',
    company: 'Test Company',
  };

  let token = '';
  let productId = '';

  beforeAll(async () => {
    // Import app dynamically
    const mainApp = await import('../index');
    app = mainApp.default;
  });

  beforeEach(async () => {
    // Re-establish mock implementation since resetMocks is true
    (mockApp.stream as jest.Mock).mockImplementation(() => {
      return {
        [Symbol.asyncIterator]: async function* () {
          yield { researcher: { researchFindings: { pros: ['hızlı'], cons: ['pahalı'] }, currentAgent: 'writer' } };
          yield { writer: { draftDescription: 'Taslak açıklama', generatedAdvantages: 'Geniş ekran seçeneği', currentAgent: 'auditor' } };
          yield { auditor: { riskReport: { score: 95 }, currentAgent: 'editor' } };
          yield { editor: { finalDescription: 'Final AI Açıklaması', currentAgent: 'editor' } };
        }
      };
    });

    // Register user
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.data.accessToken;

    // Create a product
    const prodRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Xiaomi Redmi Note 13',
        category: 'Telefon',
        brand: 'Xiaomi',
      });
    productId = prodRes.body.data._id;
  });

  // Helper import supertest here or top level
  const request = require('supertest');

  describe('POST /api/analyses/scrape', () => {
    it('should start analysis and scrape product link successfully', async () => {
      const res = await request(app)
        .post('/api/analyses/scrape')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
          url: 'https://www.trendyol.com/xiaomi/redmi-note-13-p-99999',
        });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('analysisId');
      expect(res.body.data.reviewCount).toBe(2);

      // Poll database status until completed or failed
      let analysis = null;
      for (let i = 0; i < 30; i++) {
        analysis = await Analysis.findById(res.body.data.analysisId);
        if (analysis && (analysis.status === 'completed' || analysis.status === 'failed')) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      expect(analysis).toBeTruthy();
      expect(analysis!.status).toBe('completed');
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/analyses/scrape')
        .set('Authorization', `Bearer ${token}`)
        .send({
          productId,
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/analyses', () => {
    it('should retrieve list of user analyses', async () => {
      // Get user ID
      const userRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      const userId = userRes.body.data.user.id;

      // Create an analysis record directly with valid ObjectIds
      await Analysis.create({
        userId: new mongoose.Types.ObjectId(),
        productId: new mongoose.Types.ObjectId(),
        competitorReviews: [],
        status: 'completed',
      });

      // Create one belonging to current user
      await Analysis.create({
        userId,
        productId,
        competitorReviews: [],
        status: 'completed',
      });

      const res = await request(app)
        .get('/api/analyses')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.analyses.length).toBe(1);
    });
  });

  describe('POST /api/analyses/:id/competitors & GET /api/analyses/:id/competitors', () => {
    it('should save and get competitor reviews', async () => {
      const userRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      const userId = userRes.body.data.user.id;

      const analysis = await Analysis.create({
        userId,
        productId,
        competitorReviews: [],
        status: 'completed', // completed so we can modify it
      });

      // Must have min 3 reviews, comment length min 5
      const reviews = [
        { comment: 'Harika bir telefon', rating: 4 },
        { comment: 'Çok beğendim tavsiye ederim', rating: 5 },
        { comment: 'Hiç beğenmedim kırık geldi', rating: 1 }
      ];

      // Add reviews
      const addRes = await request(app)
        .post(`/api/analyses/${analysis._id}/competitors`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reviews });

      expect(addRes.status).toBe(200);
      expect(addRes.body.data.reviewCount).toBe(3);

      // Get reviews
      const getRes = await request(app)
        .get(`/api/analyses/${analysis._id}/competitors`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.reviews.length).toBe(3);
      expect(getRes.body.data.reviews[0].comment).toBe('Harika bir telefon');
    });
  });
});
