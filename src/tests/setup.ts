import mongoose from 'mongoose';
import { env } from '../config/env';

beforeAll(async () => {
  // Disconnect any existing connection just in case
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(env.MONGODB_URI);
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.db?.dropDatabase();
    } catch (e) {
      console.warn("Could not drop test database:", e);
    }
    await mongoose.disconnect();
  }
});

beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});
