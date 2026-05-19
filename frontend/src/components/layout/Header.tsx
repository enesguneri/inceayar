'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Bell, Search, LogOut, CheckCircle, Menu } from 'lucide-react';
import { Button } from '../ui/Button';
import { analysisApi, Analysis } from '@/lib/services';
import Link from 'next/link';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, logout } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [completedAnalyses, setCompletedAnalyses] = useState<Analysis[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user) return;
      try {
        const res = await analysisApi.getAll(1, 10);
        const analyses = res.data?.data?.analyses || [];
        setCompletedAnalyses(analyses.filter(a => a.status === 'completed'));
      } catch (e) {
        console.error('Failed to fetch analyses for notifications', e);
      }
    };
    
    fetchAnalyses();
    const interval = setInterval(fetchAnalyses, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full glass-dark border-b-0 border-white/5 py-3 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 w-1/3">
        {/* Mobilde Menüyü Açan Hamburger Butonu */}
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 md:hidden transition-colors"
          title="Menüyü Aç"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Analiz ara..." 
            className="w-full bg-dark-bg/50 border border-dark-border text-sm text-white rounded-full pl-9 pr-4 py-2 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
          >
            <Bell className="w-5 h-5" />
            {completedAnalyses.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border border-slate-900"></span>
            )}
          </button>
          
          {showNotifications && (
            <div className="fixed inset-x-4 top-[70px] md:absolute md:inset-x-auto md:right-0 md:top-auto md:mt-2 md:w-80 glass-dark border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/5">
                <h3 className="text-sm font-semibold text-white">Bildirimler</h3>
                <span className="text-xs text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full">
                  {completedAnalyses.length} Yeni
                </span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {completedAnalyses.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-400">
                    Yeni bildiriminiz yok.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {completedAnalyses.map(analysis => (
                      <Link 
                        key={analysis._id} 
                        href={`/analyses/${analysis._id}`}
                        onClick={() => setShowNotifications(false)}
                        className="flex items-start gap-3 p-3 hover:bg-white/5 transition-colors group"
                      >
                        <div className="p-1.5 rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">
                            Analiz Tamamlandı
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            #{analysis._id.slice(-6).toUpperCase()} numaralı analiz işlemini bitirdi.
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="h-6 w-px bg-dark-border mx-2"></div>
        
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-white">{user.name}</span>
              <span className="text-xs text-slate-400">{user.email}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-brand-500/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 transition-colors" title="Çıkış Yap">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
             <Button variant="glass" size="sm">Giriş Yap</Button>
          </div>
        )}
      </div>
    </header>
  );
};
