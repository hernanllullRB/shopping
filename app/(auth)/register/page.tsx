'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { PublicUser } from '@/lib/types';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    terms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);
    setBusy(true);
    try {
      const res = await api<{ token: string; user: PublicUser }>('/api/auth/register', {
        method: 'POST',
        body: form,
      });
      login(res.token, res.user);
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details) setErrors(err.details);
        if (err.field) setErrors((prev) => ({ ...prev, [err.field!]: err.message }));
        setSubmitError(err.message);
      } else {
        setSubmitError('Error al registrarse');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-brand-600 via-indigo-500 to-pink-500"
      data-testid="register-bg"
    >
      <div className="card w-full max-w-md shadow-2xl" data-testid="register-page">
        <h1 className="text-2xl font-bold mb-1">Crear cuenta</h1>
        <p className="text-sm text-slate-500 mb-6">Únete a Shopping QA</p>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
          <div>
            <label className="label" htmlFor="r-username">Usuario</label>
            <input
              id="r-username"
              className="input"
              value={form.username}
              onChange={(e) => setField('username', e.target.value)}
              data-testid="username-input"
            />
            {errors.username && <p className="field-error" data-testid="register-error-username">{errors.username}</p>}
          </div>
          <div>
            <label className="label" htmlFor="r-email">Email</label>
            <input
              id="r-email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              data-testid="email-input"
            />
            {errors.email && <p className="field-error" data-testid="register-error-email">{errors.email}</p>}
          </div>
          <div>
            <label className="label" htmlFor="r-name">Nombre completo</label>
            <input
              id="r-name"
              className="input"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              data-testid="name-input"
            />
            {errors.name && <p className="field-error" data-testid="register-error-name">{errors.name}</p>}
          </div>
          <div>
            <label className="label" htmlFor="r-password">Contraseña</label>
            <input
              id="r-password"
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              data-testid="password-input"
            />
            {errors.password && <p className="field-error" data-testid="register-error-password">{errors.password}</p>}
          </div>
          <div>
            <label className="label" htmlFor="r-confirm">Confirmar contraseña</label>
            <input
              id="r-confirm"
              type="password"
              className="input"
              value={form.confirmPassword}
              onChange={(e) => setField('confirmPassword', e.target.value)}
              data-testid="confirm-password-input"
            />
            {errors.confirmPassword && (
              <p className="field-error" data-testid="register-error-confirmPassword">{errors.confirmPassword}</p>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(e) => setField('terms', e.target.checked)}
              data-testid="terms-checkbox"
            />
            Acepto los términos y condiciones
          </label>
          {errors.terms && <p className="field-error" data-testid="register-error-terms">{errors.terms}</p>}
          {submitError && <p className="field-error" data-testid="register-error">{submitError}</p>}
          <button type="submit" disabled={busy} className="btn-primary w-full" data-testid="register-button">
            {busy ? 'Registrando…' : 'Crear cuenta'}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-4 text-center">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-brand-600 hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
