import request from 'supertest';
import mongoose from 'mongoose';
import app from '../index';
import Product from '../models/Product';

describe('Product Endpoints', () => {
  const testUser = {
    name: 'Product Tester',
    email: 'prod@example.com',
    password: 'password123',
    company: 'Test Company',
  };

  let token = '';

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.data.accessToken;
  });

  describe('POST /api/products', () => {
    it('should create a new product successfully', async () => {
      const productData = {
        name: 'Xiaomi Mi Band 8',
        category: 'Aksesuar',
        brand: 'Xiaomi',
        url: 'https://www.trendyol.com/xiaomi/mi-band-8-p-12345',
        features: { Ekran: 'AMOLED', Batarya: '14 Gün' },
      };

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(productData.name);
      expect(res.body.data.brand).toBe(productData.brand);

      // Verify DB contains product
      const dbProduct = await Product.findById(res.body.data._id);
      expect(dbProduct).toBeTruthy();
    });

    it('should fail to create product without required fields', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Only Name' });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      await Product.create({
        userId: new mongoose.Types.ObjectId(),
        name: 'Test Prod 1',
        category: 'Tech',
        brand: 'Apple',
      });
    });

    it('should get all products belonging to the logged in user', async () => {
      // Create one product associated with our user
      const userRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      const userId = userRes.body.data.user.id;

      await Product.create({
        userId,
        name: 'User Product',
        category: 'Tech',
        brand: 'Xiaomi',
      });

      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('User Product');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should retrieve a product by ID', async () => {
      const userRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      const userId = userRes.body.data.user.id;

      const product = await Product.create({
        userId,
        name: 'Get Me',
        category: 'Gizmo',
        brand: 'Sony',
      });

      const res = await request(app)
        .get(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Get Me');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update a product successfully', async () => {
      const userRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      const userId = userRes.body.data.user.id;

      const product = await Product.create({
        userId,
        name: 'Old Name',
        category: 'Gizmo',
        brand: 'Sony',
      });

      const res = await request(app)
        .put(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'New Name',
          category: 'Gizmo',
          brand: 'Sony',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Name');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete a product successfully', async () => {
      const userRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      const userId = userRes.body.data.user.id;

      const product = await Product.create({
        userId,
        name: 'Delete Me',
        category: 'Gizmo',
        brand: 'Sony',
      });

      const res = await request(app)
        .delete(`/api/products/${product._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const dbProduct = await Product.findById(product._id);
      expect(dbProduct).toBeNull();
    });
  });
});
