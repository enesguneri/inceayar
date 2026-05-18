'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { productApi, analysisApi } from '@/lib/services';
import { Package, Settings, LogOut, User, Mail, Building2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [productCount, setProductCount] = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);

  useEffect(() => {
    Promise.all([productApi.getAll(1, 1), analysisApi.getAll(1, 1)])
      .then(([pRes, aRes]) => {
        setProductCount(pRes.data?.meta?.total ?? 0);
        setAnalysisCount(aRes.data?.data?.pagination?.total ?? 0);
      })
      .catch(console.error);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Ayarlar</h1>
        <p className="text-slate-400 mt-1">Hesap bilgilerinizi ve uygulama tercihlerinizi yönetin.</p>
      </div>

      {/* Profile Card */}
      <div className="glass-dark rounded-2xl border border-white/5 p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-brand-500/20 flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.name}</h2>
            <p className="text-slate-400 text-sm">{user?.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="p-4 bg-white/5 rounded-xl text-center">
            <div className="text-2xl font-bold text-white">{productCount}</div>
            <div className="text-xs text-slate-400 mt-1">Ürün</div>
          </div>
          <div className="p-4 bg-white/5 rounded-xl text-center">
            <div className="text-2xl font-bold text-white">{analysisCount}</div>
            <div className="text-xs text-slate-400 mt-1">Analiz</div>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="glass-dark rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">Hesap Bilgileri</h2>
        </div>
        <div className="divide-y divide-white/5">
          {[
            { icon: User, label: 'Ad Soyad', value: user?.name },
            { icon: Mail, label: 'E-posta', value: user?.email },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-4 p-4">
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="text-sm text-white mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Info */}
      <div className="glass-dark rounded-2xl border border-brand-500/20 overflow-hidden bg-gradient-to-br from-brand-900/20 to-indigo-900/20">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Mevcut Plan</span>
              <h3 className="text-xl font-bold text-white mt-1">Ücretsiz Plan</h3>
              <p className="text-sm text-slate-400 mt-1">Aylık 5 analiz · 3 ürün · Temel özellikler</p>
            </div>
            <span className="px-3 py-1 bg-brand-600/20 border border-brand-500/30 text-brand-300 rounded-full text-xs font-medium">Aktif</span>
          </div>
          <Button variant="primary" size="sm" className="mt-4">
            PRO'ya Yükselt — Sınırsız Analiz
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-dark rounded-2xl border border-red-500/20 p-6">
        <h2 className="text-base font-semibold text-white mb-1">Tehlikeli Bölge</h2>
        <p className="text-slate-400 text-sm mb-4">Bu işlemler geri alınamaz.</p>
        <Button variant="danger" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
}
