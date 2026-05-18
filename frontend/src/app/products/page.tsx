'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { productApi, Product } from '@/lib/services';
import { Button } from '@/components/ui/Button';
import { Package, Plus, Pencil, Trash2, ArrowRight, Search } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    productApi.getAll(1, 50)
      .then(r => setProducts(r.data?.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    setDeleting(id);
    try {
      await productApi.delete(id);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ürünlerim</h1>
          <p className="text-slate-400 mt-1">Tüm ürünlerinizi buradan yönetebilirsiniz.</p>
        </div>
        <Link href="/products/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Ürün
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Ürün, marka veya kategori ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-dark-surface/50 border border-dark-border text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all placeholder:text-slate-500"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-dark rounded-2xl p-5 border border-white/5 animate-pulse">
              <div className="h-40 bg-slate-700/50 rounded-xl mb-4"></div>
              <div className="h-5 bg-slate-700/50 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-700/50 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-dark rounded-2xl border border-white/5 p-16 text-center">
          <Package className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {search ? 'Ürün bulunamadı' : 'Henüz ürün yok'}
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {search ? 'Farklı bir arama terimi deneyin.' : 'Rakip analizi yapabilmek için önce ürününüzü ekleyin.'}
          </p>
          {!search && (
            <Link href="/products/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                İlk Ürünü Ekle
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(product => (
            <div key={product._id} className="glass-dark rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden group">
              {/* Image */}
              <div className="h-44 bg-gradient-to-br from-slate-800 to-slate-700 relative overflow-hidden">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-14 h-14 text-slate-600" />
                  </div>
                )}
                {/* Actions overlay */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Link href={`/products/${product._id}/edit`} className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-lg text-slate-300 hover:text-white transition-colors">
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(product._id)}
                    disabled={deleting === product._id}
                    className="p-2 bg-slate-900/80 backdrop-blur-sm rounded-lg text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-white truncate">{product.name}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{product.brand} · <span className="text-slate-500">{product.category}</span></p>
                
                {product.advantages && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{product.advantages}</p>
                )}

                <div className="mt-4 flex items-center gap-2">
                  <Link href={`/analyses/new?productId=${product._id}`} className="flex-1">
                    <Button variant="primary" size="sm" className="w-full">
                      <Target className="w-3.5 h-3.5 mr-1.5" />
                      Analiz Başlat
                    </Button>
                  </Link>
                  <Link href={`/products/${product._id}`}>
                    <Button variant="glass" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
