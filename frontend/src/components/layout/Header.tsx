'use client';
import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';

export const Header = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 w-full glass-dark border-b-0 border-white/5 py-3 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 w-1/3">
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
        <button className="relative p-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border border-slate-900"></span>
        </button>
        
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
