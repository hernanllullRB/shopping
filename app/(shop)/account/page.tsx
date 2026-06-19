'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useAuthStore } from '@/store/auth';
import type { PublicUser } from '@/lib/types';

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.name ?? '');
  const [nameBusy, setNameBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  if (!user) return <div className="card">Cargando…</div>;

  async function updateName() {
    setNameBusy(true);
    try {
      const res = await api<{ user: PublicUser }>('/api/account', { method: 'PUT', body: { name } });
      setUser(res.user);
      toast('Nombre actualizado', 'success');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error', 'error');
    } finally {
      setNameBusy(false);
    }
  }

  async function changePassword() {
    setPwErrors({});
    setPwBusy(true);
    try {
      await api('/api/account/password', {
        method: 'PUT',
        body: { currentPassword, newPassword, confirmPassword },
      });
      toast('Contraseña actualizada', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      if (err instanceof ApiError && err.details) setPwErrors(err.details);
      toast(err instanceof ApiError ? err.message : 'Error', 'error');
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto" data-testid="account-page">
      <h1 className="text-2xl font-bold mb-4">Mi cuenta</h1>

      <div className="card mb-4">
        <h2 className="font-semibold mb-3">Información</h2>
        <div className="text-sm space-y-1 mb-4">
          <div><span className="text-slate-500">Usuario:</span> {user.username}</div>
          <div><span className="text-slate-500">Email:</span> {user.email}</div>
          <div><span className="text-slate-500">Rol:</span> {user.role}</div>
        </div>
        <label className="label" htmlFor="name">Nombre</label>
        <input id="name" className="input mb-3" value={name} onChange={(e) => setName(e.target.value)} data-testid="name-input" />
        <button onClick={updateName} disabled={nameBusy} className="btn-primary" data-testid="update-name-button">
          {nameBusy ? 'Guardando…' : 'Actualizar nombre'}
        </button>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Cambiar contraseña</h2>
        <div className="space-y-3">
          <div>
            <label className="label">Contraseña actual</label>
            <input
              type="password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              data-testid="current-password-input"
            />
            {pwErrors.currentPassword && <p className="field-error">{pwErrors.currentPassword}</p>}
          </div>
          <div>
            <label className="label">Nueva contraseña</label>
            <input
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              data-testid="new-password-input"
            />
            {pwErrors.newPassword && <p className="field-error">{pwErrors.newPassword}</p>}
          </div>
          <div>
            <label className="label">Confirmar nueva contraseña</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              data-testid="confirm-new-password-input"
            />
            {pwErrors.confirmPassword && <p className="field-error">{pwErrors.confirmPassword}</p>}
          </div>
        </div>
        <button onClick={changePassword} disabled={pwBusy} className="btn-primary mt-4" data-testid="change-password-button">
          {pwBusy ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </div>
    </div>
  );
}
