'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, List, Settings, Sliders, Package, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Ana Sayfa', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Yeni Analiz', href: '/analyses/new', icon: Target },
    { name: 'Analizlerim', href: '/analyses', icon: List },
    { name: 'Ürünlerim', href: '/products', icon: Package },
    { name: 'Ayarlar', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobil arka plan karartması (Backdrop) */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Menü Paneli */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 md:relative md:z-0
        w-64 flex-shrink-0 glass-dark border-r border-white/5 flex flex-col h-full
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-2 group" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              İnce<span className="premium-gradient-text">Ayar</span>
            </span>
          </Link>

          {/* Mobilde Kapatma Butonu */}
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 md:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Menü</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
              const Icon = item.icon;
              
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-brand-600/10 text-brand-400 font-medium' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand-500' : 'text-slate-500'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-white/5">
          <div className="bg-gradient-to-br from-brand-900/40 to-indigo-900/40 border border-brand-500/20 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white mb-1">PRO Plan</h4>
            <p className="text-xs text-slate-400 mb-3">Sınırsız AI analizi için yükseltin.</p>
            <button className="w-full text-xs bg-brand-600 hover:bg-brand-500 text-white font-medium py-2 rounded-lg transition-colors" disabled>
              Yakında
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
