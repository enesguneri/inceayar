'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { analysisApi, Analysis } from '@/lib/services';
import { Button } from '@/components/ui/Button';
import {
  CheckCircle, Loader, XCircle, ArrowLeft, Copy, Check,
  Search, PenTool, ShieldAlert, Edit3, Target, TrendingUp, AlertTriangle, Trash2
} from 'lucide-react';

const AGENT_STEPS = [
  { key: 'researcher', label: 'Pazar Araştırmacısı', icon: Search, desc: 'Rakip yorumları analiz ediliyor...' },
  { key: 'writer', label: 'İçerik Yazarı', icon: PenTool, desc: 'Ürün açıklaması yazılıyor...' },
  { key: 'auditor', label: 'Risk Denetçisi', icon: ShieldAlert, desc: 'Fotoğraf ve metin uyumu kontrol ediliyor...' },
  { key: 'editor', label: 'Son Düzeltmen', icon: Edit3, desc: 'Metin iyileştiriliyor ve risklere karşı düzeltiliyor...' },
];

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchAnalysis = useCallback(async () => {
    try {
      const res = await analysisApi.getById(id);
      setAnalysis(res.data?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    Promise.resolve().then(fetchAnalysis);
    // SSE ile canlı takip
    if (typeof window !== 'undefined') {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const authStorage = localStorage.getItem('auth-storage');
      let token = '';
      if (authStorage) {
        try { token = JSON.parse(authStorage).state.token; } catch {}
      }

      const es = new EventSource(`${backendUrl}/api/analyses/${id}/stream?token=${encodeURIComponent(token)}`);
      es.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.status === 'completed' || data.status === 'failed') {
          fetchAnalysis();
          es.close();
        } else if (data.state) {
          setAnalysis(prev => prev ? { ...prev, ...data.state, currentAgent: data.agent } : prev);
        }
      };
      es.onerror = () => es.close();
      return () => es.close();
    }
  }, [id, fetchAnalysis]);

  const copyText = async () => {
    if (!analysis?.finalDescription) return;
    await navigator.clipboard.writeText(analysis.finalDescription);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteAnalysis = async () => {
    if (!confirm('Bu analizi silmek istediğinize emin misiniz?')) return;
    try {
      await analysisApi.delete(id);
      router.push('/analyses');
    } catch (e) {
      console.error("Failed to delete analysis", e);
      alert('Analiz silinirken hata oluştu.');
    }
  };

  const getAgentStatus = (agentKey: string) => {
    if (!analysis) return 'pending';
    const currentIdx = AGENT_STEPS.findIndex(s => s.key === analysis.currentAgent);
    const thisIdx = AGENT_STEPS.findIndex(s => s.key === agentKey);
    if (analysis.status === 'completed') return 'done';
    if (analysis.status === 'failed') return thisIdx <= currentIdx ? 'failed' : 'pending';
    if (thisIdx < currentIdx) return 'done';
    if (thisIdx === currentIdx) return 'active';
    return 'pending';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader className="w-8 h-8 text-brand-500 animate-spin" />
    </div>
  );

  if (!analysis) return (
    <div className="text-center py-16 text-slate-400">Analiz bulunamadı.</div>
  );

  const isCompleted = analysis.status === 'completed';
  const isFailed = analysis.status === 'failed';
  const topComplaints = analysis.researchFindings?.topComplaints ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/analyses')} className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">Analiz #{id.slice(-6).toUpperCase()}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{new Date(analysis.createdAt).toLocaleString('tr-TR')}</p>
        </div>
        {isCompleted && (
          <Button variant="primary" onClick={copyText}>
            {copied ? <><Check className="w-4 h-4 mr-2" />Kopyalandı!</> : <><Copy className="w-4 h-4 mr-2" />Metni Kopyala</>}
          </Button>
        )}
        <button
          onClick={deleteAnalysis}
          className="p-2 ml-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Analizi Sil"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Agent Pipeline */}
      <div className="glass-dark rounded-2xl border border-white/5 p-6">
        <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-400" /> AI Ajan Süreci
        </h2>
        <div className="space-y-3">
          {AGENT_STEPS.map((step) => {
            const status = getAgentStatus(step.key);
            const Icon = step.icon;
            return (
              <div key={step.key} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
                status === 'active' ? 'border-brand-500/50 bg-brand-500/5' :
                status === 'done' ? 'border-emerald-500/20 bg-emerald-500/5' :
                status === 'failed' ? 'border-red-500/20 bg-red-500/5' :
                'border-white/5 opacity-50'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  status === 'active' ? 'bg-brand-600' :
                  status === 'done' ? 'bg-emerald-600' :
                  status === 'failed' ? 'bg-red-600' :
                  'bg-slate-700'
                }`}>
                  {status === 'done' ? <CheckCircle className="w-5 h-5 text-white" /> :
                   status === 'active' ? <Loader className="w-5 h-5 text-white animate-spin" /> :
                   status === 'failed' ? <XCircle className="w-5 h-5 text-white" /> :
                   <Icon className="w-5 h-5 text-slate-400" />}
                </div>
                <div>
                  <p className={`text-sm font-medium ${status === 'pending' ? 'text-slate-500' : 'text-white'}`}>{step.label}</p>
                  <p className="text-xs text-slate-500">{status === 'active' ? step.desc : status === 'done' ? 'Tamamlandı ✓' : status === 'pending' ? 'Bekliyor...' : 'Başarısız'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Results */}
      {isCompleted && (
        <>
          {/* Final Description */}
          {analysis.finalDescription && (
            <div className="glass-dark rounded-2xl border border-emerald-500/20 p-6 space-y-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" /> Oluşturulan Ürün Açıklaması
              </h2>
              <div className="bg-slate-900/50 rounded-xl p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {analysis.finalDescription}
              </div>
            </div>
          )}

          {/* SEO Keywords */}
          {analysis.seoKeywords && analysis.seoKeywords.length > 0 && (
            <div className="glass-dark rounded-2xl border border-white/5 p-6 space-y-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-400" /> SEO Anahtar Kelimeleri
              </h2>
              <div className="flex flex-wrap gap-2">
                {analysis.seoKeywords.map((kw, i) => (
                  <span key={i} className="px-3 py-1.5 bg-brand-600/10 border border-brand-500/20 text-brand-300 rounded-full text-sm">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Risk Report */}
          {analysis.riskReport && (
            <div className={`glass-dark rounded-2xl border p-6 space-y-4 ${
              analysis.riskReport.overallScore >= 75 ? 'border-emerald-500/20' :
              analysis.riskReport.overallScore >= 50 ? 'border-yellow-500/20' :
              'border-red-500/20'
            }`}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-yellow-400" /> Risk Raporu
                </h2>
                <div className={`text-2xl font-bold ${
                  analysis.riskReport.overallScore >= 75 ? 'text-emerald-400' :
                  analysis.riskReport.overallScore >= 50 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>{analysis.riskReport.overallScore}/100</div>
              </div>
              {analysis.riskReport.risks?.length > 0 && (
                <div className="space-y-2">
                  {analysis.riskReport.risks.map((r, i) => (
                    <div key={i} className="p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                      <p className="text-sm font-medium text-yellow-200 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5" /> {r.issue}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{r.impact}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Research Findings */}
          {topComplaints.length > 0 && (
            <div className="glass-dark rounded-2xl border border-white/5 p-6 space-y-3">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-brand-400" /> Rakipteki En Önemli Şikayetler
              </h2>
              <ul className="space-y-2">
                {topComplaints.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-brand-600/20 text-brand-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {isFailed && (
        <div className="glass-dark rounded-2xl border border-red-500/20 p-6 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Analiz Başarısız</h3>
          <p className="text-slate-400 text-sm">{analysis.error || 'Bilinmeyen bir hata oluştu.'}</p>
          <Button variant="primary" className="mt-4" onClick={() => router.push('/analyses/new')}>
            Tekrar Dene
          </Button>
        </div>
      )}
    </div>
  );
}
