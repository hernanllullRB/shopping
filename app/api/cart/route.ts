import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { clearCart, getCart, getProduct } from '@/lib/store';

function hydrate(items: { productId: string; quantity: number }[]) {
  return items
    .map((it) => {
      const product = getProduct(it.productId);
      return product ? { productId: it.productId, quantity: it.quantity, product } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

function summarize(items: ReturnType<typeof hydrate>) {
  const subtotal = items.reduce((acc, it) => acc + it.product.price * it.quantity, 0);
  const count = items.reduce((acc, it) => acc + it.quantity, 0);
  return { items, subtotal: Math.round(subtotal * 100) / 100, count };
}

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const cart = getCart(auth.payload.username);
  return NextResponse.json(summarize(hydrate(cart)));
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  clearCart(auth.payload.username);
  return NextResponse.json({ ok: true, items: [], subtotal: 0, count: 0 });
}
