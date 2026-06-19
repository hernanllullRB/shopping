'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { AdminBackLink } from '@/components/AdminBackLink';
import { toast } from '@/components/Toast';
import { useAuthStore } from '@/store/auth';
import type { Order, OrderStatus } from '@/lib/types';

const STATUSES: OrderStatus[] = ['paid', 'shipped', 'delivered', 'cancelled'];
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="card">Cargando…</div>}>
      <AdminOrdersInner />
    </Suspense>
  );
}

function AdminOrdersInner() {
  const user = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const router = useRouter();
  const sp = useSearchParams();
  const filterStatus = sp.get('status') ?? '';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initialized && (!user || user.role !== 'admin')) router.replace('/');
  }, [initialized, user, router]);

  function load() {
    setLoading(true);
    const q = filterStatus ? `?status=${filterStatus}` : '';
    api<{ orders: Order[] }>(`/api/admin/orders${q}`).then((res) => {
      setOrders(res.orders);
      setLoading(false);
    });
  }

  useEffect(load, [filterStatus]);

  async function setStatus(id: string, status: OrderStatus) {
    try {
      await api(`/api/admin/orders/${id}`, { method: 'PUT', body: { status } });
      toast('Status actualizado', 'success');
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error', 'error');
    }
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div data-testid="admin-orders-page">
      <AdminBackLink />
      <h1 className="text-2xl font-bold mb-4">Órdenes</h1>
      <div className="card mb-3">
        <label className="text-sm mr-2">Filtrar por status:</label>
        <select
          className="input w-auto inline-block"
          value={filterStatus}
          onChange={(e) => {
            const next = e.target.value;
            router.push(next ? `/admin/orders?status=${next}` : '/admin/orders');
          }}
          data-testid="admin-orders-filter"
        >
          <option value="">Todos</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="card">Cargando…</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500 border-b">
              <tr>
                <th className="py-2">Orden</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Status</th>
                <th>Cambiar</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const nexts = NEXT_STATUSES[o.status];
                return (
                  <tr key={o.id} className="border-b last:border-0" data-testid={`admin-order-row-${o.id}`}>
                    <td className="font-mono text-xs">{o.id}</td>
                    <td>{o.username}</td>
                    <td>{new Date(o.createdAt).toLocaleString()}</td>
                    <td>${o.total}</td>
                    <td data-testid={`admin-order-status-${o.id}`}>{o.status}</td>
                    <td className="flex gap-2 py-2">
                      {nexts.length === 0 ? (
                        <span className="text-xs text-slate-400">terminal</span>
                      ) : (
                        nexts.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(o.id, s)}
                            className="btn-secondary text-xs"
                            data-testid={`admin-order-set-${s}-${o.id}`}
                          >
                            → {s}
                          </button>
                        ))
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
