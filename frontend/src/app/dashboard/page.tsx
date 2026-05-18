'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { productApi, analysisApi, Product, Analysis } from '@/lib/services';
import { 
  Target, Package, TrendingUp, Clock, Plus, ArrowRight, 
  CheckCircle, Loader, XCircle, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

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

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pRes, aRes] = await Promise.all([
          productApi.getAll(1, 5),
          analysisApi.getAll(1, 5),
        ]);
        setProducts(pRes.data?.data ?? []);
        setAnalyses(aRes.data?.data?.analyses ?? []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const stats = [
    { label: 'Toplam Ürün', value: products.length, icon: Package, color: 'from-blue-500 to-cyan-500' },
    { label: 'Toplam Analiz', value: analyses.length, icon: Target, color: 'from-indigo-500 to-purple-500' },
    { label: 'Tamamlanan', value: analyses.filter(a => a.status === 'completed').length, icon: TrendingUp, color: 'from-emerald-500 to-green-500' },
    { label: 'İşlenenler', value: analyses.filter(a => a.status === 'processing').length, icon: Clock, color: 'from-yellow-500 to-orange-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Merhaba, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-400 mt-1">İşte AI analiz platformunuza genel bakış.</p>
        </div>
        <Link href="/analyses/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Analiz
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-dark rounded-2xl p-5 flex items-center gap-4 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5 group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{loading ? '—' : s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Analyses */}
        <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Son Analizler</h2>
            <Link href="/analyses" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
            ) : analyses.length === 0 ? (
              <div className="p-8 text-center">
                <Target className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Henüz analiz yok.</p>
                <Link href="/analyses/new" className="text-brand-400 text-sm hover:underline mt-1 inline-block">İlk analizini başlat →</Link>
              </div>
            ) : (
              analyses.slice(0, 5).map(a => (
                <Link key={a._id} href={`/analyses/${a._id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                      <Cpu className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">Analiz #{a._id.slice(-6).toUpperCase()}</p>
                      <p className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Products */}
        <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Ürünlerim</h2>
            <Link href="/products" className="text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              Tümünü Gör <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
            ) : products.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Henüz ürün eklenmemiş.</p>
                <Link href="/products/new" className="text-brand-400 text-sm hover:underline mt-1 inline-block">İlk ürününü ekle →</Link>
              </div>
            ) : (
              products.slice(0, 5).map(p => (
                <Link key={p._id} href={`/products/${p._id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">{p.name}</p>
                      <p className="text-xs text-slate-500">{p.brand} · {p.category}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
