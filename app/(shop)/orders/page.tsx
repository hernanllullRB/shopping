'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types';

const STATUS_LABELS: Record<Order['status'], string> = {
  paid: 'Pagada',
  shipped: 'Enviada',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
};

const STATUS_COLORS: Record<Order['status'], string> = {
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-amber-100 text-amber-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ orders: Order[] }>('/api/orders').then((res) => {
      setOrders(res.orders);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="card">Cargando…</div>;

  if (orders.length === 0) {
    return (
      <div className="card text-center py-12" data-testid="orders-empty">
        <p className="text-slate-500 mb-4">No tienes órdenes todavía.</p>
        <Link href="/" className="btn-primary">Comprar ahora</Link>
      </div>
    );
  }

  return (
    <div data-testid="orders-page">
      <h1 className="text-2xl font-bold mb-4">Mis órdenes</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b">
            <tr>
              <th className="py-2">Orden</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b last:border-0" data-testid={`order-row-${o.id}`}>
                <td className="py-2 font-mono text-xs">{o.id}</td>
                <td>{new Date(o.createdAt).toLocaleString()}</td>
                <td>${o.total}</td>
                <td>
                  <span className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[o.status]}`} data-testid={`order-status-${o.id}`}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td>
                  <Link href={`/orders/${o.id}`} className="text-brand-600 hover:underline text-sm">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
