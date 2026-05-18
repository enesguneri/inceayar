'use client';
// Root "/" redirect to login or dashboard
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, useAuthHydration } from '@/store/useAuthStore';

export default function RootPage() {
  const { isAuthenticated } = useAuthStore();
  const hydrated = useAuthHydration();
  const router = useRouter();

  useEffect(() => {
    if (hydrated) {
      router.replace(isAuthenticated ? '/dashboard' : '/login');
    }
  }, [hydrated, isAuthenticated, router]);

  return null;
}
