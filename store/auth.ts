'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';
import type { PublicUser } from '@/lib/types';

interface AuthState {
  user: PublicUser | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  hydrate: () => Promise<void>;
  login: (token: string, user: PublicUser) => void;
  logout: () => Promise<void>;
  setUser: (user: PublicUser) => void;
}

const TOKEN_KEY = 'token';

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,

  async hydrate() {
    if (get().initialized) return;
    set({ loading: true });
    const token = typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ loading: false, initialized: true });
      return;
    }
    try {
      const res = await api<{ user: PublicUser }>('/api/auth/me', { token });
      set({ user: res.user, token, loading: false, initialized: true });
    } catch {
      window.localStorage.removeItem(TOKEN_KEY);
      clearCookie(TOKEN_KEY);
      set({ user: null, token: null, loading: false, initialized: true });
    }
  },

  login(token, user) {
    window.localStorage.setItem(TOKEN_KEY, token);
    setCookie(TOKEN_KEY, token, 1);
    set({ user, token, initialized: true });
  },

  async logout() {
    const token = get().token;
    if (token) {
      try {
        await api('/api/auth/logout', { method: 'POST', token });
      } catch {
        // ignore
      }
    }
    window.localStorage.removeItem(TOKEN_KEY);
    clearCookie(TOKEN_KEY);
    set({ user: null, token: null });
  },

  setUser(user) {
    set({ user });
  },
}));
