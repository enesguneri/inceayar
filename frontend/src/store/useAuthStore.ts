import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);

import { useState, useEffect } from 'react';

export const useAuthHydration = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Zustand zaten hydrate olduysa true yap
    setHydrated(useAuthStore.persist.hasHydrated());
    
    // Henüz olmadıysa, bittiğinde true yap
    const unsubFinish = useAuthStore.persist.onFinishHydration(() => setHydrated(true));
    
    return () => {
      unsubFinish();
    };
  }, []);

  return hydrated;
};
