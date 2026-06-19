'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

export function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const fetchCart = useCartStore((s) => s.fetch);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (token) fetchCart();
  }, [token, fetchCart]);

  return null;
}
