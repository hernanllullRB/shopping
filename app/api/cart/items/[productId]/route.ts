import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCart, getProduct } from '@/lib/store';
import { fieldErrorsFromZod, updateCartItemSchema } from '@/lib/validators';

export async function PUT(request: NextRequest, { params }: { params: { productId: string } }) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const parsed = updateCartItemSchema.safeParse(body);
  if (!parsed.success) {
    const { firstMessage, details } = fieldErrorsFromZod(parsed.error);
    return NextResponse.json({ error: firstMessage, details }, { status: 400 });
  }

  const cart = getCart(auth.payload.username);
  const item = cart.find((it) => it.productId === params.productId);
  if (!item) {
    return NextResponse.json({ error: 'Item no encontrado', code: 'NOT_FOUND' }, { status: 404 });
  }
  const product = getProduct(params.productId);
  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado', code: 'NOT_FOUND' }, { status: 404 });
  }
  if (parsed.data.quantity > product.stock) {
    return NextResponse.json(
      { error: 'Stock insuficiente', code: 'STOCK_INSUFFICIENT', field: 'quantity' },
      { status: 422 },
    );
  }
  item.quantity = parsed.data.quantity;
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { productId: string } }) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const cart = getCart(auth.payload.username);
  const idx = cart.findIndex((it) => it.productId === params.productId);
  if (idx === -1) {
    return NextResponse.json({ error: 'Item no encontrado', code: 'NOT_FOUND' }, { status: 404 });
  }
  cart.splice(idx, 1);
  return NextResponse.json({ ok: true });
}
