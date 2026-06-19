import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { consumeCoupon, evaluateCoupon } from '@/lib/coupons';
import { clearCart, findUserByUsername, getCart, getProduct, getStore } from '@/lib/store';
import { checkoutSchema, fieldErrorsFromZod, isExpiryFuture } from '@/lib/validators';
import type { Order } from '@/lib/types';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const { firstMessage, details } = fieldErrorsFromZod(parsed.error);
    return NextResponse.json({ error: firstMessage, details }, { status: 400 });
  }
  const data = parsed.data;

  if (!isExpiryFuture(data.expiry)) {
    return NextResponse.json(
      { error: 'Tarjeta expirada', code: 'CARD_EXPIRED', field: 'expiry' },
      { status: 400 },
    );
  }

  const cart = getCart(auth.payload.username);
  if (cart.length === 0) {
    return NextResponse.json({ error: 'El carrito está vacío', code: 'CART_EMPTY' }, { status: 422 });
  }

  for (const item of cart) {
    const product = getProduct(item.productId);
    if (!product || !product.active) {
      return NextResponse.json(
        { error: `Producto no disponible: ${item.productId}`, code: 'PRODUCT_UNAVAILABLE' },
        { status: 422 },
      );
    }
    if (item.quantity > product.stock) {
      return NextResponse.json(
        { error: `Stock insuficiente para ${product.name}`, code: 'STOCK_INSUFFICIENT', field: item.productId },
        { status: 422 },
      );
    }
  }

  const subtotal = Math.round(cart.reduce((acc, it) => acc + it.product.price * it.quantity, 0) * 100) / 100;

  let discount = 0;
  let appliedCoupon: ReturnType<typeof evaluateCoupon>['coupon'];
  if (data.couponCode) {
    const evalRes = evaluateCoupon({
      code: data.couponCode,
      subtotal,
      username: auth.payload.username,
    });
    if (!evalRes.valid) {
      return NextResponse.json(
        { error: evalRes.error ?? 'Cupón inválido', code: evalRes.code ?? 'COUPON_INVALID', field: 'couponCode' },
        { status: 422 },
      );
    }
    discount = evalRes.discount;
    appliedCoupon = evalRes.coupon;
  }
  const total = Math.round((subtotal - discount) * 100) / 100;

  const lastFour = data.cardNumber.slice(-4);
  if (lastFour === '0000') {
    return NextResponse.json({ error: 'Pago rechazado', code: 'PAYMENT_DECLINED' }, { status: 402 });
  }

  for (const item of cart) {
    const product = getProduct(item.productId)!;
    product.stock -= item.quantity;
  }

  if (appliedCoupon) consumeCoupon(appliedCoupon, auth.payload.username);

  const user = findUserByUsername(auth.payload.username)!;
  const now = new Date().toISOString();
  const order: Order = {
    id: `ord-${randomUUID().slice(0, 8)}`,
    userId: user.id,
    username: user.username,
    items: cart.map((it) => ({ ...it, product: { ...it.product } })),
    subtotal,
    discount,
    total,
    status: 'paid',
    createdAt: now,
    updatedAt: now,
    paymentMethod: 'credit_card',
    cardHolder: data.cardHolder,
    lastFour,
    couponCode: appliedCoupon?.code,
  };
  getStore().orders.push(order);
  clearCart(auth.payload.username);

  return NextResponse.json({ order }, { status: 201 });
}
