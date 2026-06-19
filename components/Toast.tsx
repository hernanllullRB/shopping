'use client';

import { create } from 'zustand';
import { useEffect } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastState {
  toasts: Toast[];
  push: (msg: string, type?: Toast['type']) => void;
  remove: (id: number) => void;
}

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push(message, type = 'info') {
    const id = Date.now() + Math.random();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3000);
  },
  remove(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

export function toast(message: string, type: Toast['type'] = 'info') {
  useToastStore.getState().push(message, type);
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  useEffect(() => {}, []);
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" data-testid="toaster">
      {toasts.map((t) => (
        <div
          key={t.id}
          data-testid={`toast-${t.type}`}
          className={`px-4 py-2 rounded-md shadow text-white ${
            t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-slate-700'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
