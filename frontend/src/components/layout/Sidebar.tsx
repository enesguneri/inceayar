'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Target, List, Settings, Cpu } from 'lucide-react';

export const Sidebar = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Yeni Analiz', href: '/analyses/new', icon: Target },
    { name: 'Analizlerim', href: '/analyses', icon: List },
    { name: 'Ürünlerim', href: '/products', icon: Cpu },
    { name: 'Ayarlar', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 flex-shrink-0 glass-dark border-r border-white/5 flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            İnce<span className="premium-gradient-text">Ayar</span>
          </span>
        </Link>
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
          <button className="w-full text-xs bg-brand-600 hover:bg-brand-500 text-white font-medium py-2 rounded-lg transition-colors">
            Yükselt
          </button>
        </div>
      </div>
    </aside>
  );
};
