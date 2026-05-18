import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Token'ı ekle
api.interceptors.request.use(
  (config) => {
    // Client side'da localStorage'dan token'ı al
    if (typeof window !== 'undefined') {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          // 'token' key'i Zustand store'daki ad (useAuthStore'da token olarak kaydedildi)
          const token = state?.token;
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (e) {
          console.error('Token parse error', e);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: 401 (Unauthorized) hatalarını yakala
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Zustand store'u import etmeden dolaylı yoldan temizle veya logout tetikle
        localStorage.removeItem('auth-storage');
        // İsterseniz window.location.href = '/login' yapabilirsiniz
      }
    }
    return Promise.reject(error);
  }
);

export default api;
