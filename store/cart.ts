'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { CartItem } from '@/lib/types';

interface CartState {
  items: CartItem[];
  subtotal: number;
  count: number;
  loading: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  add: (productId: string, quantity?: number) => Promise<void>;
  update: (productId: string, quantity: number) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  reset: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  count: 0,
  loading: false,
  error: null,

  async fetch() {
    set({ loading: true, error: null });
    try {
      const res = await api<{ items: CartItem[]; subtotal: number; count: number }>('/api/cart');
      set({ items: res.items, subtotal: res.subtotal, count: res.count, loading: false });
    } catch (err) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  async add(productId, quantity = 1) {
    await api('/api/cart/items', { method: 'POST', body: { productId, quantity } });
    await get().fetch();
  },

  async update(productId, quantity) {
    await api(`/api/cart/items/${productId}`, { method: 'PUT', body: { quantity } });
    await get().fetch();
  },

  async remove(productId) {
    await api(`/api/cart/items/${productId}`, { method: 'DELETE' });
    await get().fetch();
  },

  async clear() {
    await api('/api/cart', { method: 'DELETE' });
    set({ items: [], subtotal: 0, count: 0 });
  },

  reset() {
    set({ items: [], subtotal: 0, count: 0, error: null });
  },
}));
