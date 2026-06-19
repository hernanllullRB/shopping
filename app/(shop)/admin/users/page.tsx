'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AdminBackLink } from '@/components/AdminBackLink';
import { useAuthStore } from '@/store/auth';
import type { PublicUser } from '@/lib/types';

export default function AdminUsersPage() {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const router = useRouter();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialized && (!user || user.role !== 'admin')) router.replace('/');
  }, [initialized, user, router]);

  useEffect(() => {
    api<{ users: PublicUser[] }>('/api/admin/users').then((res) => {
      setUsers(res.users);
      setLoading(false);
    });
  }, []);

  if (!user || user.role !== 'admin') return null;

  return (
    <div data-testid="admin-users-page">
      <AdminBackLink />
      <h1 className="text-2xl font-bold mb-4">Usuarios</h1>
      {loading ? (
        <div className="card">Cargando…</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b">
              <tr>
                <th className="py-2">ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0" data-testid={`admin-user-row-${u.id}`}>
                  <td className="font-mono text-xs">{u.id.slice(0, 8)}…</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.name}</td>
                  <td>
                    <span className={`text-xs px-2 py-0.5 rounded ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
