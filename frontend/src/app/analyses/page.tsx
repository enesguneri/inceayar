'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { analysisApi, Analysis } from '@/lib/services';
import { Target, Loader, CheckCircle, XCircle, Plus, ArrowRight } from 'lucide-react';
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

export default function AnalysesListPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchAnalyses = async (p = 1) => {
    setLoading(true);
    try {
      const res = await analysisApi.getAll(p, 10);
      setAnalyses(res.data?.data?.analyses ?? []);
      setTotalPages(res.data?.data?.pagination?.totalPages ?? 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalyses(page); }, [page]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analizlerim</h1>
          <p className="text-slate-400 mt-1">Tüm AI analiz geçmişiniz.</p>
        </div>
        <Link href="/analyses/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Analiz
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-dark rounded-2xl p-5 border border-white/5 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-700/50 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700/50 rounded w-1/3"></div>
                <div className="h-3 bg-slate-700/50 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : analyses.length === 0 ? (
        <div className="glass-dark rounded-2xl border border-white/5 p-16 text-center">
          <Target className="w-14 h-14 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Henüz analiz yok</h3>
          <p className="text-slate-400 text-sm mb-6">Rakibinizin ürün linkini girerek ilk AI analizinizi başlatın.</p>
          <Link href="/analyses/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              İlk Analizi Başlat
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {analyses.map(a => (
            <Link key={a._id} href={`/analyses/${a._id}`} className="block glass-dark rounded-2xl border border-white/5 hover:border-white/15 transition-all duration-300 hover:-translate-y-0.5 group">
              <div className="flex items-center gap-4 p-5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  a.status === 'completed' ? 'bg-emerald-600/20' :
                  a.status === 'processing' ? 'bg-yellow-600/20' :
                  'bg-red-600/20'
                }`}>
                  {a.status === 'completed' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                   a.status === 'processing' ? <Loader className="w-5 h-5 text-yellow-400 animate-spin" /> :
                   <XCircle className="w-5 h-5 text-red-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-white group-hover:text-brand-300 transition-colors">
                      Analiz #{a._id.slice(-6).toUpperCase()}
                    </h3>
                    <StatusBadge status={a.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleString('tr-TR')}
                    {a.status === 'processing' && ` · ${a.currentAgent} ajanı çalışıyor`}
                    {a.status === 'completed' && a.finalDescription && ` · Açıklama hazır`}
                  </p>
                </div>

                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-brand-400 transition-colors flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="glass" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ← Önceki
          </Button>
          <span className="flex items-center px-4 text-sm text-slate-400">{page} / {totalPages}</span>
          <Button variant="glass" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Sonraki →
          </Button>
        </div>
      )}
    </div>
  );
}
