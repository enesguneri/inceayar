'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { productApi } from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Package, Plus, Trash2, ArrowLeft, Info } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    category: '',
    brand: '',
    advantages: '',
  });
  const [features, setFeatures] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' }
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFeatureChange = (idx: number, field: 'key' | 'value', val: string) => {
    setFeatures(prev => prev.map((f, i) => i === idx ? { ...f, [field]: val } : f));
  };

  const addFeature = () => setFeatures(prev => [...prev, { key: '', value: '' }]);
  const removeFeature = (idx: number) => setFeatures(prev => prev.filter((_, i) => i !== idx));

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

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

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
