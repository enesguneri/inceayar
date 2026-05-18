'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { productApi } from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Package, Plus, Trash2, ArrowLeft, Info, Clock } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: '',
    brand: '',
    advantages: '',
    url: '',
  });
  const [features, setFeatures] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' }
  ]);

  const [activeTab, setActiveTab] = useState<'manual' | 'link'>('manual');
  const [linkUrl, setLinkUrl] = useState('');
  const [fetchingDetails, setFetchingDetails] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFeatureChange = (idx: number, field: 'key' | 'value', val: string) => {
    setFeatures(prev => prev.map((f, i) => i === idx ? { ...f, [field]: val } : f));
  };

  const addFeature = () => setFeatures(prev => [...prev, { key: '', value: '' }]);
  const removeFeature = (idx: number) => setFeatures(prev => prev.filter((_, i) => i !== idx));

  const handleFetchDetails = async () => {
    if (!linkUrl) return;
    setFetchingDetails(true);
    setError('');
    try {
      // Axios default import can be used, or use api from lib
      const api = (await import('@/lib/api')).default;
      const res = await api.post('/products/scrape-details', { url: linkUrl });
      const data = res.data?.data;
      if (data) {
        setForm(prev => ({
          ...prev,
          name: data.name || prev.name,
          brand: data.brand || prev.brand,
          category: data.category || prev.category,
          advantages: data.advantages || prev.advantages,
          url: linkUrl, // Save the URL in form state to send to backend!
        }));
        
        // Populate features if any exist
        if (data.features && Object.keys(data.features).length > 0) {
           const newFeatures = Object.entries(data.features).map(([key, value]) => ({ key, value: String(value) }));
           setFeatures(newFeatures);
        }
        // Switch to manual tab to let user review the fetched data
        setActiveTab('manual');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ürün bilgileri çekilirken hata oluştu.');
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const featureMap = features
        .filter(f => f.key && f.value)
        .reduce<Record<string, string>>((acc, f) => ({ ...acc, [f.key]: f.value }), {});

      const res = await productApi.create({
        ...form,
        features: featureMap,
        images: [],
      });

      const productId = res.data?.data?._id;
      router.push(productId ? `/products/${productId}` : '/products');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ürün oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Yeni Ürün Ekle</h1>
          <p className="text-slate-400 text-sm mt-0.5">Ürün bilgilerini girerek AI analiz sürecini başlatabilirsiniz.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-900/50 rounded-xl border border-white/5">
        <button
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'manual' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('manual')}
        >
          Manuel Ekle (Önerilen)
        </button>
        <button
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'link' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-slate-400 hover:text-white'}`}
          onClick={() => setActiveTab('link')}
        >
          Link ile Hızlı Ekle
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {activeTab === 'link' && (
        <div className="glass-dark rounded-2xl border border-brand-500/30 p-6 space-y-4 bg-brand-500/5">
          <h2 className="text-base font-semibold text-white">Trendyol Linki ile Ürün Ekle</h2>
          <p className="text-xs text-slate-400">
            Kendi ürününüzün Trendyol linkini girerseniz, ürün bilgilerini otomatik çekeriz.
            Daha da önemlisi, AI analizi sırasında <strong>sizin müşterilerinizin yaptığı olumlu yorumları</strong> da analiz edip rakibe karşı avantaj olarak kullanabiliriz!
          </p>
          <div className="flex gap-2">
            <Input 
              placeholder="https://www.trendyol.com/marka/urun-adi-p-123456" 
              value={linkUrl} 
              onChange={(e) => setLinkUrl(e.target.value)} 
              className="flex-1"
            />
            <Button variant="primary" onClick={handleFetchDetails} isLoading={fetchingDetails}>
              Bilgileri Getir
            </Button>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300">
              <strong>Hepsiburada</strong> ve diğer platformlar yakında desteklenecek.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`space-y-5 ${activeTab === 'link' ? 'opacity-50 pointer-events-none' : ''}`}>
        
        <div className="glass-dark rounded-2xl border border-white/5 p-6 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-400" /> Temel Bilgiler
          </h2>
          <Input name="name" placeholder="Ürün Adı *" value={form.name} onChange={handleChange} required />
          <div className="grid grid-cols-2 gap-4">
            <Input name="brand" placeholder="Marka *" value={form.brand} onChange={handleChange} required />
            <Input name="category" placeholder="Kategori *" value={form.category} onChange={handleChange} required />
          </div>
        </div>

        <div className="glass-dark rounded-2xl border border-white/5 p-6 space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-400" /> Avantajlar (AI için önemli)
          </h2>
          <p className="text-xs text-slate-400 -mt-1">AI bu bilgiyi kullanarak rakip eksikliklerine karşı sizin üstünlüklerinizi öne çıkaracak.</p>
          <textarea
            name="advantages"
            placeholder="Ürününüzün rakiplerine göre avantajlarını yazın..."
            value={form.advantages}
            onChange={handleChange}
            rows={4}
            className="w-full bg-dark-surface/50 border border-dark-border text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-500 resize-none"
          />
        </div>

        <div className="glass-dark rounded-2xl border border-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Özellikler</h2>
            <button type="button" onClick={addFeature} className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              <Plus className="w-4 h-4" /> Ekle
            </button>
          </div>
          {features.map((f, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input placeholder="Özellik (örn: Renk)" value={f.key} onChange={e => handleFeatureChange(idx, 'key', e.target.value)} />
              <Input placeholder="Değer (örn: Mavi)" value={f.value} onChange={e => handleFeatureChange(idx, 'value', e.target.value)} />
              {features.length > 1 && (
                <button type="button" onClick={() => removeFeature(idx)} className="p-2.5 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="primary" size="lg" isLoading={loading} className="flex-1">
            Ürünü Kaydet
          </Button>
          <Button type="button" variant="glass" size="lg" onClick={() => router.back()}>
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
}
