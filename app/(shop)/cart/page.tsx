'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { CartItemRow } from '@/components/CartItemRow';
import { useCartStore } from '@/store/cart';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const fetchCart = useCartStore((s) => s.fetch);
  const loading = useCartStore((s) => s.loading);
  const router = useRouter();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (loading && items.length === 0) {
    return <div className="card">Cargando carrito…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="card text-center py-12" data-testid="cart-empty">
        <p className="text-slate-500 mb-4">Tu carrito está vacío.</p>
        <Link href="/" className="btn-primary">
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="cart-page">
      <h1 className="text-2xl font-bold mb-4">Tu carrito</h1>
      <div className="space-y-3 mb-6">
        {items.map((it) => (
          <CartItemRow key={it.productId} item={it} />
        ))}
      </div>
      <div className="card flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Subtotal</div>
          <div className="text-2xl font-bold" data-testid="cart-subtotal">
            ${subtotal}
          </div>
        </div>
        <button
          onClick={() => router.push('/checkout')}
          className="btn-primary"
          data-testid="checkout-button"
        >
          Ir a pagar
        </button>
      </div>
    </div>
  );
}
