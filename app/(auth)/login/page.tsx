'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import type { PublicUser } from '@/lib/types';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="card">Cargando…</div>}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const sp = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const fetchCart = useCartStore((s) => s.fetch);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api<{ token: string; user: PublicUser }>('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      });
      login(res.token, res.user);
      await fetchCart();
      const next = sp.get('next') || '/';
      router.push(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error de login');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-brand-600 via-indigo-500 to-pink-500"
      data-testid="login-bg"
    >
      <div className="card w-full max-w-sm shadow-2xl backdrop-blur-sm" data-testid="login-page">
        <h1 className="text-2xl font-bold mb-1">Iniciar sesión</h1>
        <p className="text-sm text-slate-500 mb-6">Bienvenido a Shopping QA</p>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
          <div>
            <label className="label" htmlFor="username">Usuario</label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              data-testid="username-input"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="password-input"
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="field-error" data-testid="login-error">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full" data-testid="login-button">
            {busy ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4 text-center">
          ¿No tienes cuenta?{' '}
          <Link href="/register" className="text-brand-600 hover:underline" data-testid="link-register">
            Regístrate
          </Link>
        </p>
        <div className="mt-6 text-xs text-slate-400 border-t pt-3">
          <p className="font-semibold">Cuentas de prueba:</p>
          <p>admin / admin123</p>
          <p>user1 / pass123</p>
          <p>user2 / pass456</p>
        </div>
      </div>
    </div>
  );
}
