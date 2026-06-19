import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCart, getProduct } from '@/lib/store';
import { addCartItemSchema, fieldErrorsFromZod } from '@/lib/validators';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const parsed = addCartItemSchema.safeParse(body);
  if (!parsed.success) {
    const { firstMessage, details } = fieldErrorsFromZod(parsed.error);
    return NextResponse.json({ error: firstMessage, details }, { status: 400 });
  }

  const product = getProduct(parsed.data.productId);
  if (!product || !product.active) {
    return NextResponse.json({ error: 'Producto no encontrado', code: 'NOT_FOUND' }, { status: 404 });
  }

  const cart = getCart(auth.payload.username);
  const existing = cart.find((it) => it.productId === parsed.data.productId);
  const newQty = (existing?.quantity ?? 0) + parsed.data.quantity;

  if (newQty > 10) {
    return NextResponse.json(
      { error: 'Máximo 10 unidades por producto', code: 'MAX_QUANTITY_EXCEEDED', field: 'quantity' },
      { status: 422 },
    );
  }
  if (newQty > product.stock) {
    return NextResponse.json(
      { error: 'Stock insuficiente', code: 'STOCK_INSUFFICIENT', field: 'quantity' },
      { status: 422 },
    );
  }

  if (existing) {
    existing.quantity = newQty;
  } else {
    cart.push({ productId: product.id, quantity: parsed.data.quantity, product });
  }
  return NextResponse.json({ ok: true });
}
