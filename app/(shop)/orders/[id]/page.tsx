'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { toast } from '@/components/Toast';
import type { Order } from '@/lib/types';

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    api<{ order: Order }>(`/api/orders/${params.id}`)
      .then((res) => setOrder(res.order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }

  useEffect(load, [params.id]);

  async function handleCancel() {
    setBusy(true);
    try {
      const res = await api<{ order: Order }>(`/api/orders/${params.id}/cancel`, { method: 'POST' });
      setOrder(res.order);
      toast('Orden cancelada', 'success');
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Error', 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="card">Cargando…</div>;
  if (!order) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-500 mb-4">Orden no encontrada.</p>
        <Link href="/orders" className="btn-primary">Volver</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto" data-testid="order-detail-page">
      <Link href="/orders" className="text-sm text-brand-600 hover:underline">← Mis órdenes</Link>
      <div className="card mt-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold" data-testid="order-detail-id">Orden {order.id}</h1>
            <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-slate-100" data-testid="order-detail-status">
            {order.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-500">Titular</div>
            <div>{order.cardHolder}</div>
          </div>
          <div>
            <div className="text-slate-500">Tarjeta</div>
            <div>**** **** **** {order.lastFour}</div>
          </div>
          {order.couponCode && (
            <div>
              <div className="text-slate-500">Cupón aplicado</div>
              <div>{order.couponCode}</div>
            </div>
          )}
        </div>

        <h2 className="font-semibold mt-6 mb-2">Items</h2>
        <ul className="text-sm space-y-2 mb-4">
          {order.items.map((it) => (
            <li key={it.productId} className="flex justify-between" data-testid={`order-item-${it.productId}`}>
              <span>{it.product.name} × {it.quantity}</span>
              <span>${Math.round(it.product.price * it.quantity * 100) / 100}</span>
            </li>
          ))}
        </ul>
        <div className="border-t pt-2 text-sm space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>${order.subtotal}</span></div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-700"><span>Descuento</span><span>-${order.discount}</span></div>
          )}
          <div className="flex justify-between font-bold pt-2 border-t"><span>Total</span><span>${order.total}</span></div>
        </div>

        {order.status === 'paid' && (
          <button onClick={handleCancel} disabled={busy} className="btn-danger mt-6 w-full" data-testid="cancel-order-button">
            {busy ? 'Cancelando…' : 'Cancelar orden'}
          </button>
        )}
      </div>
    </div>
  );
}
