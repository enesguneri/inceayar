'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { productApi, analysisApi, Product } from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Link as LinkIcon, Target, Package, ChevronDown } from 'lucide-react';

export default function NewAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get('productId');

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState(preselectedProductId || '');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    productApi.getAll(1, 50)
      .then(r => setProducts(r.data?.data ?? []))
      .catch(console.error)
      .finally(() => setLoadingProducts(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) { setError('Lütfen bir ürün seçin.'); return; }
    if (!competitorUrl) { setError('Lütfen rakip ürün linkini girin.'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await analysisApi.startWithUrl(selectedProduct, competitorUrl);
      const analysisId = res.data?.data?.analysisId;
      if (analysisId) {
        router.push(`/analyses/${analysisId}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Analiz başlatılırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const selectedProductData = products.find(p => p._id === selectedProduct);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Yeni Analiz Başlat</h1>
          <p className="text-slate-400 text-sm mt-0.5">Rakibinizin ürün linkini girin, AI sistemi yorumları analiz ederek size avantaj çıkarsın.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Product Selector */}
        <div className="glass-dark rounded-2xl border border-white/5 p-6 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-400" />
            1. Ürününüzü Seçin (Asıl Ürün)
          </h2>
          <p className="text-xs text-slate-400 -mt-1">AI bu ürünün avantajlarını rakibe karşı kullanacak.</p>

          {loadingProducts ? (
            <div className="h-12 bg-slate-700/30 animate-pulse rounded-xl"></div>
          ) : products.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm mb-3">Henüz ürün eklenmemiş.</p>
              <Button variant="glass" size="sm" onClick={() => router.push('/products/new')} type="button">
                <Package className="w-4 h-4 mr-2" /> Ürün Ekle
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <label key={p._id} className={`flex items-center gap-4 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${selectedProduct === p._id ? 'border-brand-500 bg-brand-500/10' : 'border-white/5 hover:border-white/20 hover:bg-white/5'}`}>
                  <input type="radio" name="product" value={p._id} checked={selectedProduct === p._id} onChange={() => setSelectedProduct(p._id)} className="hidden" />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${selectedProduct === p._id ? 'border-brand-500 bg-brand-500' : 'border-slate-600'}`}>
                    {selectedProduct === p._id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex-shrink-0 overflow-hidden">
                    {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" alt="" /> : <Package className="w-5 h-5 text-slate-500 m-2.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.brand} · {p.category}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Competitor URL */}
        <div className="glass-dark rounded-2xl border border-white/5 p-6 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-brand-400" />
            2. Rakip Ürün Linki (Trendyol / Hepsiburada)
          </h2>
          <p className="text-xs text-slate-400 -mt-1">AI bu listedeki müşteri yorumlarını analiz edecek ve sizin ürününüzün pazarlama metnini yazacak.</p>
          <Input
            type="url"
            placeholder="https://www.trendyol.com/urun-adi-p-123456/yorumlar"
            value={competitorUrl}
            onChange={e => setCompetitorUrl(e.target.value)}
            icon={<LinkIcon className="w-4 h-4" />}
            required
          />
          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <p className="text-xs text-blue-300">💡 <strong>İpucu:</strong> Daha iyi sonuçlar için doğrudan <code className="bg-white/10 rounded px-1">/yorumlar</code> sayfasına giden linki kullanın.</p>
          </div>
        </div>

        {/* Summary */}
        {selectedProductData && competitorUrl && (
          <div className="glass-dark rounded-2xl border border-brand-500/20 p-5">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-400" /> Analiz Özeti
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-slate-400 w-28">Asıl Ürününüz:</span>
                <span className="text-white font-medium">{selectedProductData.name}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-slate-400 w-28">Rakip Linki:</span>
                <span className="text-brand-300 truncate max-w-xs">{competitorUrl}</span>
              </div>
            </div>
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={loading}>
          <Target className="w-4 h-4 mr-2" />
          {loading ? 'Yorumlar Çekiliyor...' : 'Analizi Başlat'}
        </Button>
      </form>
    </div>
  );
}
