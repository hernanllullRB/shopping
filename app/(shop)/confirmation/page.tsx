'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import type { Order } from '@/lib/types';

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="card">Cargando…</div>}>
      <ConfirmationInner />
    </Suspense>
  );
}

function ConfirmationInner() {
  const sp = useSearchParams();
  const orderId = sp.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchCart = useCartStore((s) => s.fetch);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    api<{ order: Order }>(`/api/orders/${orderId}`)
      .then((res) => setOrder(res.order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
    fetchCart();
  }, [orderId, fetchCart]);

  if (loading) return <div className="card">Cargando…</div>;
  if (!order) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-500 mb-4">No se encontró la orden.</p>
        <Link href="/" className="btn-primary">Volver</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" data-testid="confirmation-page">
      <div className="card">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-bold">¡Pago exitoso!</h1>
          <p className="text-slate-500">Gracias por tu compra.</p>
        </div>
        <div className="border-t pt-4 space-y-2 text-sm">
          <div>
            <span className="font-semibold">Orden:</span>{' '}
            <span data-testid="order-id">{order.id}</span>
          </div>
          <div>
            <span className="font-semibold">Total:</span>{' '}
            <span data-testid="order-total">${order.total}</span>
          </div>
          <div>
            <span className="font-semibold">Pago:</span> tarjeta terminada en {order.lastFour}
          </div>
        </div>
        <h2 className="font-semibold mt-6 mb-2">Items</h2>
        <ul className="text-sm space-y-2 mb-6" data-testid="order-items">
          {order.items.map((it) => (
            <li key={it.productId} className="flex justify-between">
              <span>{it.product.name} × {it.quantity}</span>
              <span>${Math.round(it.product.price * it.quantity * 100) / 100}</span>
            </li>
          ))}
        </ul>
        <Link href="/" className="btn-primary w-full block text-center" data-testid="continue-shopping">
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
