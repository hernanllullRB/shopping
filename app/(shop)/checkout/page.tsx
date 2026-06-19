'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { CouponInput } from '@/components/CouponInput';
import { PaymentForm, PaymentFormErrors, PaymentData } from '@/components/PaymentForm';
import { useCartStore } from '@/store/cart';
import type { Order } from '@/lib/types';

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const fetchCart = useCartStore((s) => s.fetch);
  const router = useRouter();

  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [errors, setErrors] = useState<PaymentFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  async function handleSubmit(data: PaymentData) {
    setErrors({});
    setSubmitError(null);
    setBusy(true);
    try {
      const res = await api<{ order: Order }>('/api/checkout', {
        method: 'POST',
        body: {
          paymentMethod: 'credit_card',
          cardHolder: data.cardHolder,
          cardNumber: data.cardNumber,
          expiry: data.expiry,
          cvv: data.cvv,
          couponCode: coupon?.code,
        },
      });
      router.push(`/confirmation?orderId=${res.order.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.details) setErrors(err.details as PaymentFormErrors);
        setSubmitError(err.message);
      } else {
        setSubmitError('Error en el pago');
      }
    } finally {
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="card text-center py-12" data-testid="checkout-empty">
        <p className="text-slate-500 mb-4">No hay items para pagar.</p>
        <button onClick={() => router.push('/')} className="btn-primary">Ir a productos</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6" data-testid="checkout-page">
      <div className="card">
        <h1 className="text-2xl font-bold mb-4">Pago</h1>
        {submitError && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 mb-4 flex items-center justify-between" data-testid="payment-error">
            <span>{submitError}</span>
            <button onClick={() => setSubmitError(null)} className="btn-secondary text-sm" data-testid="retry-button">
              Reintentar
            </button>
          </div>
        )}
        <PaymentForm errors={errors} disabled={busy} onSubmit={handleSubmit} submitLabel={`Pagar $${total}`} />
      </div>

      <aside className="card h-fit">
        <h2 className="font-semibold mb-3">Resumen</h2>
        <ul className="text-sm space-y-2 mb-4" data-testid="checkout-summary-items">
          {items.map((it) => (
            <li key={it.productId} className="flex justify-between">
              <span>{it.product.name} × {it.quantity}</span>
              <span>${Math.round(it.product.price * it.quantity * 100) / 100}</span>
            </li>
          ))}
        </ul>
        <div className="border-t pt-3 space-y-1 text-sm mb-4">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span data-testid="checkout-subtotal">${subtotal}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Descuento</span>
              <span data-testid="cart-discount">-${discount}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>Total</span>
            <span data-testid="cart-total">${total}</span>
          </div>
        </div>
        <CouponInput
          subtotal={subtotal}
          onApply={(code, d) => setCoupon({ code, discount: d })}
          onClear={() => setCoupon(null)}
          appliedCode={coupon?.code}
          discount={coupon?.discount}
        />
      </aside>
    </div>
  );
}
