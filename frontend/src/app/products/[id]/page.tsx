'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { productApi, analysisApi, Product, Analysis } from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Package, Target, ArrowLeft, Pencil, Trash2, Upload,
  CheckCircle, Loader, XCircle, Plus, ArrowRight, Save, X
} from 'lucide-react';

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    completed: { label: 'Tamamlandı', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    processing: { label: 'İşleniyor', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: <Loader className="w-3.5 h-3.5 animate-spin" /> },
    failed: { label: 'Başarısız', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: <XCircle className="w-3.5 h-3.5" /> },
  };
  const s = map[status] ?? map.processing;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${s.color}`}>
      {s.icon}{s.label}
    </span>
  );
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [product, setProduct] = useState<Product | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', brand: '', category: '', advantages: '', url: '' });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          productApi.getById(id),
          analysisApi.getAll(1, 50, undefined, undefined, id),
        ]);
        const p: Product = pRes.data?.data;
        setProduct(p);
        setEditForm({ name: p.name, brand: p.brand, category: p.category, advantages: p.advantages || '', url: p.url || '' });
        setEditing(searchParams.get('edit') === '1');

        // Filter analyses for this product safely
        const allAnalyses: Analysis[] = aRes.data?.data?.analyses ?? [];
        setAnalyses(allAnalyses.filter((analysis) => {
          if (!analysis.productId) return false;
          const productId = typeof analysis.productId === 'string' ? analysis.productId : (analysis.productId as any)._id;
          return productId === id;
        }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, searchParams]);

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);
    try {
      const res = await productApi.update(id, editForm);
      setProduct(res.data?.data);
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    setDeleting(true);
    try {
      await productApi.delete(id);
      router.push('/products');
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingImage(true);
    try {
      const res = await productApi.uploadImages(id, e.target.files);
      setProduct(res.data?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async (imageUrlToRemove: string) => {
    if (!product) return;
    if (!confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) return;
    
    try {
      const updatedImages = product.images.filter(img => img !== imageUrlToRemove);
      const res = await productApi.update(id, { images: updatedImages });
      setProduct(res.data?.data);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader className="w-8 h-8 text-brand-500 animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="text-center py-16 text-slate-400">Ürün bulunamadı.</div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/products')} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white tracking-tight truncate">{product.name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{product.brand} · {product.category}</p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
                <Save className="w-4 h-4 mr-1.5" /> Kaydet
              </Button>
              <Button variant="glass" size="sm" onClick={() => setEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="glass" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="w-4 h-4 mr-1.5" /> Düzenle
              </Button>
              <Link href={`/analyses/new?productId=${id}`}>
                <Button variant="primary" size="sm">
                  <Target className="w-4 h-4 mr-1.5" /> Analiz Başlat
                </Button>
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Ürünü Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden aspect-square relative group">
            {product.images?.[0] ? (
              <>
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => handleRemoveImage(product.images[0])}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-16 h-16 text-slate-600" />
              </div>
            )}
            {!product.images?.[0] && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                {uploadingImage ? (
                  <Loader className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <div className="text-center text-white">
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <span className="text-sm font-medium">Fotoğraf Yükle</span>
                  </div>
                )}
              </label>
            )}
          </div>

          {/* Thumbnail grid */}
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden border border-white/10 relative group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => handleRemoveImage(img)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center justify-center gap-2 p-3 glass-dark border border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white hover:border-brand-500/50 transition-all cursor-pointer text-sm">
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <Upload className="w-4 h-4" />
            {uploadingImage ? 'Yükleniyor...' : 'Fotoğraf Ekle'}
          </label>
        </div>

        {/* Right: Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <div className="glass-dark rounded-2xl border border-white/5 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Ürün Bilgileri</h2>
            {editing ? (
              <div className="space-y-3">
                <Input placeholder="Ürün Adı" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                <Input placeholder="Ürün Linki (Trendyol, vb.)" value={editForm.url} onChange={e => setEditForm(p => ({ ...p, url: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Marka" value={editForm.brand} onChange={e => setEditForm(p => ({ ...p, brand: e.target.value }))} />
                  <Input placeholder="Kategori" value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))} />
                </div>
                <textarea
                  placeholder="Avantajlar..."
                  value={editForm.advantages}
                  onChange={e => setEditForm(p => ({ ...p, advantages: e.target.value }))}
                  rows={4}
                  className="w-full bg-dark-surface/50 border border-dark-border text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-500 resize-none"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Marka</p>
                    <p className="text-white font-medium">{product.brand}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Kategori</p>
                    <p className="text-white font-medium">{product.category}</p>
                  </div>
                </div>
                {product.url && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Ürün Linki</p>
                    <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-brand-400 text-sm hover:underline break-all">
                      {product.url}
                    </a>
                  </div>
                )}
                {product.advantages && (
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Avantajlar</p>
                    <p className="text-slate-300 text-sm leading-relaxed">{product.advantages}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Features */}
          {product.features && Object.keys(product.features).length > 0 && (
            <div className="glass-dark rounded-2xl border border-white/5 p-6 space-y-3">
              <h2 className="text-base font-semibold text-white">Özellikler</h2>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(product.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-sm">
                    <span className="text-slate-400">{key}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analyses */}
          <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Bu Ürüne Ait Analizler</h2>
              <Link href={`/analyses/new?productId=${id}`} className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Yeni
              </Link>
            </div>
            {analyses.length === 0 ? (
              <div className="p-8 text-center">
                <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Bu ürün için henüz analiz yok.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {analyses.map(a => (
                  <Link key={a._id} href={`/analyses/${a._id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">
                        Analiz #{a._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={a.status} />
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
